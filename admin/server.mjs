#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const adminDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(adminDir, "..");
const contentDir = path.join(root, "src", "data", "guides-json");
const siteConfigPath = path.join(root, "src", "data", "site-config.json");
const publicDir = path.join(root, "public");
const host = "127.0.0.1";
const port = Number(process.env.M365_ADMIN_PORT || 15986);
const previewPort = Number(process.env.M365_PREVIEW_PORT || 15987);
const adminOrigin = `http://${host}:${port}`;
const previewOrigin = `http://${host}:${previewPort}`;
const publicSite = "https://help.incorp-int.com/";
const adminToken = crypto.randomBytes(24).toString("hex");
const pnpmBin = process.env.M365_PNPM_BIN || "pnpm";
const runtimePathKey =
  Object.keys(process.env).find((key) => key.toLowerCase() === "path") ||
  "PATH";
const runtimeEnv = {
  ...process.env,
  [runtimePathKey]: `${path.dirname(process.execPath)}${path.delimiter}${process.env[runtimePathKey] || ""}`,
};
const maxBodyBytes = 25 * 1024 * 1024;
let previewProcess;
const guideCategories = new Set([
  "账号与安全",
  "Office 应用",
  "Outlook 邮箱",
  "Teams",
  "OneDrive 与 SharePoint",
  "设备与工具",
]);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

function json(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function safeSlug(value) {
  return /^[a-z0-9][a-z0-9-]{0,80}$/.test(value) ? value : null;
}

function safeSectionId(value) {
  return /^[A-Za-z][A-Za-z0-9-]{0,80}$/.test(value) ? value : null;
}

function safeAssetName(value) {
  const base = path
    .basename(value || "screenshot")
    .replace(/\.[^.]+$/, "")
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
  return base || "screenshot";
}

function isMutationAllowed(req) {
  const origin = req.headers.origin;
  const token = req.headers["x-admin-token"];
  return (!origin || origin === adminOrigin) && token === adminToken;
}

async function readJsonBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBodyBytes) throw new Error("上传内容超过 25MB 限制。");
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function validateGuide(guide, expectedSlug) {
  if (!guide || guide.slug !== expectedSlug) throw new Error("指引标识不匹配。");
  const requiredStrings = [
    "title",
    "subtitle",
    "category",
    "description",
    "duration",
    "device",
    "completion",
  ];
  for (const key of requiredStrings) {
    if (
      typeof guide[key] !== "string" ||
      !guide[key].trim() ||
      guide[key].length > 10000
    ) {
      throw new Error(`字段 ${key} 无效。`);
    }
  }
  if (!guideCategories.has(guide.category)) {
    throw new Error("指引分类无效。");
  }
  if (!Array.isArray(guide.keywords) || !Array.isArray(guide.prepare)) {
    throw new Error("关键词或准备事项无效。");
  }
  if (!Array.isArray(guide.sections) || guide.sections.length > 100) {
    throw new Error("章节数据无效。");
  }
  const ids = new Set();
  for (const section of guide.sections) {
    if (!safeSectionId(section.id)) {
      throw new Error(`章节 ID 无效：${section.id}`);
    }
    if (ids.has(section.id)) {
      throw new Error(`章节 ID 重复：${section.id}`);
    }
    ids.add(section.id);
    if (!Array.isArray(section.blocks) || section.blocks.length > 200) {
      throw new Error(`章节 ${section.title} 的内容块无效。`);
    }
    for (const block of section.blocks) {
      if (!["step", "point", "details", "callout"].includes(block.type)) {
        throw new Error(`不支持的内容类型：${block.type}`);
      }
      if (Array.isArray(block.images)) {
        for (const image of block.images) {
          if (
            typeof image.src !== "string" ||
            !image.src.startsWith("/assets/sop/") ||
            image.src.includes("..")
          ) {
            throw new Error("图片路径不安全。");
          }
        }
      }
    }
  }
}

async function atomicWriteJson(filePath, value) {
  const tempPath = `${filePath}.${process.pid}.tmp`;
  await fsp.writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await fsp.rename(tempPath, filePath);
}

function run(command, args, options = {}) {
  const { trimOutput = true, ...spawnOptions } = options;
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: runtimeEnv,
      shell: process.platform === "win32" && command === pnpmBin,
      ...spawnOptions,
    });
    let output = "";
    child.stdout?.on("data", (chunk) => {
      output += chunk.toString();
      if (output.length > 200000) output = output.slice(-200000);
    });
    child.stderr?.on("data", (chunk) => {
      output += chunk.toString();
      if (output.length > 200000) output = output.slice(-200000);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      const result = trimOutput ? output.trim() : output;
      if (code === 0) resolve(result);
      else reject(new Error(result.trim() || `${command} 执行失败（${code}）。`));
    });
  });
}

async function gitStatus() {
  // 保留状态码前的空格；否则 trim() 会把未暂存修改的路径首字母截掉。
  // NUL 分隔格式不会因 Windows 换行、文件名空格或 Git 的引号转义而丢失路径字符。
  const raw = await run("git", ["status", "--porcelain=v1", "-z"], {
    trimOutput: false,
  });
  const entries = raw ? raw.split("\0").filter(Boolean) : [];
  const files = [];
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const status = entry.slice(0, 2);
    files.push({ status, path: entry.slice(3) });
    // porcelain -z 将重命名/复制的旧路径和新路径作为相邻两项返回。
    if (status.includes("R") || status.includes("C")) {
      const renamedPath = entries[index + 1];
      if (renamedPath) {
        files.push({ status, path: renamedPath });
        index += 1;
      }
    }
  }
  const allowed = files.every(
    (file) =>
      file.path.startsWith("src/data/guides-json/") ||
      file.path.startsWith("public/assets/sop/") ||
      file.path === "src/data/site-config.json",
  );
  return { files, allowed };
}

async function gitAheadCount() {
  const raw = await run("git", ["rev-list", "--count", "origin/main..HEAD"]);
  return Number.parseInt(raw, 10) || 0;
}

function validateCategoryOrder(categoryOrder) {
  if (
    !Array.isArray(categoryOrder) ||
    categoryOrder.length !== guideCategories.size ||
    new Set(categoryOrder).size !== guideCategories.size ||
    !categoryOrder.every((category) => guideCategories.has(category))
  ) {
    throw new Error("类目显示顺序无效。");
  }
}

function normalizeGuideOrder(guideOrder, guideSlugs) {
  const knownSlugs = new Set(guideSlugs);
  const configured = Array.isArray(guideOrder)
    ? guideOrder.filter(
        (slug, index) =>
          knownSlugs.has(slug) && guideOrder.indexOf(slug) === index,
      )
    : [];
  return [
    ...configured,
    ...guideSlugs.filter((slug) => !configured.includes(slug)),
  ];
}

function validateGuideOrder(guideOrder, guideSlugs) {
  const normalized = normalizeGuideOrder(guideOrder, guideSlugs);
  if (
    !Array.isArray(guideOrder) ||
    guideOrder.length !== guideSlugs.length ||
    normalized.length !== guideOrder.length ||
    normalized.some((slug, index) => slug !== guideOrder[index])
  ) {
    throw new Error("SOP 显示顺序无效。");
  }
}

async function serveFile(res, baseDir, relativePath, cache = false) {
  const decoded = decodeURIComponent(relativePath);
  const candidate = path.resolve(baseDir, `.${decoded.startsWith("/") ? decoded : `/${decoded}`}`);
  if (!candidate.startsWith(`${path.resolve(baseDir)}${path.sep}`)) {
    json(res, 403, { error: "路径不安全。" });
    return;
  }
  try {
    const stat = await fsp.stat(candidate);
    if (!stat.isFile()) throw new Error("not file");
    res.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(candidate).toLowerCase()] || "application/octet-stream",
      "Content-Length": stat.size,
      "Cache-Control": cache ? "public, max-age=3600" : "no-store",
      "Content-Security-Policy":
        `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self'; frame-src ${previewOrigin}; base-uri 'none'; form-action 'self'`,
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN",
    });
    fs.createReadStream(candidate).pipe(res);
  } catch {
    json(res, 404, { error: "文件不存在。" });
  }
}

function isValidImage(buffer, extension) {
  if (extension === "png") {
    return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }
  if (extension === "jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8;
  }
  if (extension === "webp") {
    return (
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  return false;
}

async function handleApi(req, res, url) {
  if (url.pathname === "/api/config" && req.method === "GET") {
    json(res, 200, {
      token: adminToken,
      previewOrigin,
      previewBase: previewOrigin,
      publicSite,
    });
    return;
  }

  if (url.pathname === "/api/guides" && req.method === "GET") {
    const files = (await fsp.readdir(contentDir))
      .filter((name) => name.endsWith(".json"))
      .sort();
    const guides = await Promise.all(
      files.map(async (name) => {
        const guide = JSON.parse(await fsp.readFile(path.join(contentDir, name), "utf8"));
        return {
          slug: guide.slug,
          title: guide.title,
          subtitle: guide.subtitle,
          category: guide.category,
        };
      }),
    );
    json(res, 200, { guides });
    return;
  }

  const guideMatch = url.pathname.match(/^\/api\/guides\/([a-z0-9-]+)$/);
  if (guideMatch && req.method === "GET") {
    const slug = safeSlug(guideMatch[1]);
    if (!slug) return json(res, 400, { error: "指引标识无效。" });
    try {
      const guide = JSON.parse(
        await fsp.readFile(path.join(contentDir, `${slug}.json`), "utf8"),
      );
      json(res, 200, guide);
    } catch {
      json(res, 404, { error: "没有找到这篇指引。" });
    }
    return;
  }

  if (url.pathname === "/api/status" && req.method === "GET") {
    try {
      json(res, 200, await gitStatus());
    } catch (error) {
      json(res, 500, { error: error.message });
    }
    return;
  }

  if (url.pathname === "/api/homepage" && req.method === "GET") {
    try {
      const config = JSON.parse(await fsp.readFile(siteConfigPath, "utf8"));
      validateCategoryOrder(config.categoryOrder);
      const files = (await fsp.readdir(contentDir))
        .filter((name) => name.endsWith(".json"))
        .sort();
      const guideSlugs = await Promise.all(
        files.map(async (name) => {
          const guide = JSON.parse(
            await fsp.readFile(path.join(contentDir, name), "utf8"),
          );
          return guide.slug;
        }),
      );
      json(res, 200, {
        ...config,
        guideOrder: normalizeGuideOrder(config.guideOrder, guideSlugs),
      });
    } catch (error) {
      json(res, 500, { error: error.message });
    }
    return;
  }

  if (!isMutationAllowed(req)) {
    json(res, 403, { error: "本地编辑令牌无效，请刷新后台。" });
    return;
  }

  if (url.pathname === "/api/homepage" && req.method === "PUT") {
    try {
      const {
        categoryOrder,
        guideOrder,
        guideCategories: categoryAssignments,
      } = await readJsonBody(req);
      validateCategoryOrder(categoryOrder);
      if (
        !categoryAssignments ||
        typeof categoryAssignments !== "object" ||
        Array.isArray(categoryAssignments)
      ) {
        throw new Error("SOP 归类数据无效。");
      }

      const files = (await fsp.readdir(contentDir))
        .filter((name) => name.endsWith(".json"))
        .sort();
      const guides = await Promise.all(
        files.map(async (name) => ({
          name,
          guide: JSON.parse(
            await fsp.readFile(path.join(contentDir, name), "utf8"),
          ),
        })),
      );
      const knownSlugs = new Set(guides.map(({ guide }) => guide.slug));
      const guideSlugs = guides.map(({ guide }) => guide.slug);
      validateGuideOrder(guideOrder, guideSlugs);
      if (
        Object.keys(categoryAssignments).some((slug) => !knownSlugs.has(slug))
      ) {
        throw new Error("归类数据中包含不存在的 SOP。");
      }

      const guideUpdates = [];
      for (const { name, guide } of guides) {
        const category = categoryAssignments[guide.slug];
        if (!guideCategories.has(category)) {
          throw new Error(`SOP“${guide.title}”的类目无效。`);
        }
        if (guide.category !== category) {
          guide.category = category;
          validateGuide(guide, guide.slug);
          guideUpdates.push({ name, guide });
        }
      }
      for (const { name, guide } of guideUpdates) {
        await atomicWriteJson(path.join(contentDir, name), guide);
      }
      await atomicWriteJson(siteConfigPath, { categoryOrder, guideOrder });
      json(res, 200, {
        ok: true,
        changedGuides: guideUpdates.length,
        categoryOrder,
        guideOrder,
      });
    } catch (error) {
      json(res, 400, { error: error.message });
    }
    return;
  }

  if (url.pathname === "/api/guides" && req.method === "POST") {
    try {
      const guide = await readJsonBody(req);
      const slug = safeSlug(guide?.slug);
      if (!slug) {
        throw new Error("网址标识只能使用小写英文字母、数字和连字符。");
      }
      validateGuide(guide, slug);
      const filePath = path.join(contentDir, `${slug}.json`);
      await fsp.writeFile(filePath, `${JSON.stringify(guide, null, 2)}\n`, {
        encoding: "utf8",
        flag: "wx",
      });
      json(res, 201, { ok: true, guide });
    } catch (error) {
      if (error.code === "EEXIST") {
        json(res, 409, { error: "这个网址标识已经存在，请换一个。" });
      } else {
        json(res, 400, { error: error.message });
      }
    }
    return;
  }

  if (guideMatch && req.method === "PUT") {
    const slug = safeSlug(guideMatch[1]);
    if (!slug) return json(res, 400, { error: "指引标识无效。" });
    try {
      const guide = await readJsonBody(req);
      validateGuide(guide, slug);
      await atomicWriteJson(path.join(contentDir, `${slug}.json`), guide);
      json(res, 200, { ok: true, savedAt: new Date().toISOString() });
    } catch (error) {
      json(res, 400, { error: error.message });
    }
    return;
  }

  if (guideMatch && req.method === "DELETE") {
    const slug = safeSlug(guideMatch[1]);
    if (!slug) return json(res, 400, { error: "指引标识无效。" });
    try {
      const guidePath = path.join(contentDir, `${slug}.json`);
      await fsp.access(guidePath);
      await fsp.unlink(guidePath);

      const assetDirectory = path.join(publicDir, "assets", "sop", slug);
      await fsp.rm(assetDirectory, { recursive: true, force: true });

      const config = JSON.parse(await fsp.readFile(siteConfigPath, "utf8"));
      config.guideOrder = Array.isArray(config.guideOrder)
        ? config.guideOrder.filter((item) => item !== slug)
        : [];
      await atomicWriteJson(siteConfigPath, config);
      json(res, 200, { ok: true, slug });
    } catch (error) {
      if (error.code === "ENOENT") {
        json(res, 404, { error: "没有找到这篇指引。" });
      } else {
        json(res, 400, { error: error.message });
      }
    }
    return;
  }

  if (url.pathname === "/api/upload" && req.method === "POST") {
    try {
      const { slug: rawSlug, filename, dataUrl } = await readJsonBody(req);
      const slug = safeSlug(rawSlug);
      if (!slug) throw new Error("图片所属指引无效。");
      const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl || "");
      if (!match) throw new Error("仅支持 PNG、JPEG 或 WebP 图片。");
      const extension = match[1];
      const buffer = Buffer.from(match[2], "base64");
      if (!buffer.length || buffer.length > 15 * 1024 * 1024) {
        throw new Error("图片为空或超过 15MB。");
      }
      if (!isValidImage(buffer, extension)) throw new Error("图片文件校验失败。");
      const directory = path.join(publicDir, "assets", "sop", slug);
      await fsp.mkdir(directory, { recursive: true });
      const finalName = `${Date.now()}-${crypto.randomBytes(3).toString("hex")}-${safeAssetName(filename)}.${extension === "jpeg" ? "jpg" : extension}`;
      await fsp.writeFile(path.join(directory, finalName), buffer);
      json(res, 200, {
        src: `/assets/sop/${slug}/${finalName}`,
      });
    } catch (error) {
      json(res, 400, { error: error.message });
    }
    return;
  }

  if (url.pathname === "/api/build" && req.method === "POST") {
    try {
      const output = await run(pnpmBin, ["build"]);
      json(res, 200, { ok: true, output });
    } catch (error) {
      json(res, 500, { error: error.message });
    }
    return;
  }

  if (url.pathname === "/api/publish" && req.method === "POST") {
    try {
      const { message = "Update help center content" } = await readJsonBody(req);
      const status = await gitStatus();
      if (!status.allowed) {
        throw new Error(
          `发现后台范围外的改动，已停止发布：${status.files
            .filter(
              (file) =>
                !file.path.startsWith("src/data/guides-json/") &&
                !file.path.startsWith("public/assets/sop/") &&
                file.path !== "src/data/site-config.json",
            )
            .map((file) => file.path)
            .join("、")}`,
        );
      }

      // 其他电脑可能刚刚推送了内容。先用 rebase + autostash 同步，
      // 保留本机正在编辑的 SOP、图片和首页排序，避免直接 push 被拒绝。
      await run("git", ["pull", "--rebase", "--autostash", "origin", "main"]);

      let buildOutput = "";
      const currentStatus = await gitStatus();
      if (!currentStatus.allowed) {
        throw new Error(
          `同步后发现后台范围外的改动，已停止发布：${currentStatus.files
            .filter(
              (file) =>
                !file.path.startsWith("src/data/guides-json/") &&
                !file.path.startsWith("public/assets/sop/") &&
                file.path !== "src/data/site-config.json",
            )
            .map((file) => file.path)
            .join("、")}`,
        );
      }

      if (currentStatus.files.length) {
        buildOutput = await run(pnpmBin, ["build"]);
        await run("git", [
          "add",
          "--",
          "src/data/guides-json",
          "src/data/site-config.json",
          "public/assets/sop",
        ]);
        await run("git", ["commit", "-m", String(message).slice(0, 120)]);
      }

      const aheadCount = await gitAheadCount();
      if (!aheadCount) {
        return json(res, 200, { ok: true, unchanged: true });
      }
      await run("git", ["push", "origin", "main"]);
      const commit = await run("git", ["rev-parse", "HEAD"]);
      json(res, 200, { ok: true, commit, buildOutput });
    } catch (error) {
      json(res, 500, { error: error.message });
    }
    return;
  }

  json(res, 404, { error: "接口不存在。" });
}

function startPreview() {
  previewProcess = spawn(
    pnpmBin,
    ["dev", "--host", host, "--port", String(previewPort)],
    {
      cwd: root,
      env: { ...runtimeEnv, BROWSER: "none" },
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
    },
  );
  previewProcess.stdout.on("data", (chunk) => {
    process.stdout.write(`[预览] ${chunk}`);
  });
  previewProcess.stderr.on("data", (chunk) => {
    process.stderr.write(`[预览] ${chunk}`);
  });
  previewProcess.on("exit", (code) => {
    if (code && code !== 0) console.error(`预览服务已停止（${code}）。`);
  });
}

function openAdminBrowser() {
  let command = "open";
  let args = [adminOrigin];
  if (process.platform === "win32") {
    command = process.env.ComSpec || "cmd.exe";
    args = ["/d", "/s", "/c", "start", "", adminOrigin];
  } else if (process.platform !== "darwin") {
    command = "xdg-open";
  }
  const opener = spawn(command, args, {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  opener.on("error", () => {});
  opener.unref();
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", adminOrigin);
  try {
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }
    if (url.pathname.startsWith("/assets/")) {
      await serveFile(res, publicDir, url.pathname, true);
      return;
    }
    const staticPath = url.pathname === "/" ? "/index.html" : url.pathname;
    await serveFile(res, adminDir, staticPath);
  } catch (error) {
    json(res, 500, { error: error.message || "本地后台发生错误。" });
  }
});

function shutdown() {
  previewProcess?.kill("SIGTERM");
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1000).unref();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`端口 ${port} 已被占用。后台可能已经打开，请先关闭旧窗口后重试。`);
  } else {
    console.error(`本地后台启动失败：${error.message}`);
  }
  process.exit(1);
});

server.listen(port, host, () => {
  startPreview();
  console.log(`\nM365 本地内容后台：${adminOrigin}`);
  console.log(`网站实时预览：${previewOrigin}/`);
  console.log("关闭此终端窗口即可停止后台。\n");
  if (process.env.M365_NO_OPEN !== "1") {
    openAdminBrowser();
  }
});
