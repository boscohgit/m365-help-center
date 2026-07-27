const state = {
  config: null,
  guides: [],
  guide: null,
  dirty: false,
  busy: false,
  selectedSlug: null,
  dragData: null,
};

const categoryOptions = [
  "账号与安全",
  "Office 应用",
  "Outlook 邮箱",
  "Teams",
  "OneDrive 与 SharePoint",
  "设备与工具",
];

const blockLabels = {
  step: "步骤",
  point: "说明",
  details: "折叠问答",
  callout: "提示框",
};

const guideList = document.querySelector("#guide-list");
const guideSearch = document.querySelector("#guide-search");
const editor = document.querySelector("#editor");
const editorEmpty = document.querySelector("#editor-empty");
const saveState = document.querySelector("#save-state");
const saveButton = document.querySelector("#save-button");
const previewButton = document.querySelector("#preview-button");
const publishButton = document.querySelector("#publish-button");
const previewFrame = document.querySelector("#preview-frame");
const openPreview = document.querySelector("#open-preview");
const toastRegion = document.querySelector("#toast-region");
const newGuideButton = document.querySelector("#new-guide-button");
const newGuideDialog = document.querySelector("#new-guide-dialog");
const newGuideForm = document.querySelector("#new-guide-form");
const newGuideSubmit = document.querySelector("#new-guide-submit");
const homepageButton = document.querySelector("#homepage-button");
const homepageDialog = document.querySelector("#homepage-dialog");
const homepageCategories = document.querySelector("#homepage-categories");
const homepageState = document.querySelector("#homepage-state");
const homepageSave = document.querySelector("#homepage-save");
let homepageDraft = null;
let homepageDrag = null;

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function suggestedGuideSlug() {
  const now = new Date();
  const part = (value) => String(value).padStart(2, "0");
  return `sop-${now.getFullYear()}${part(now.getMonth() + 1)}${part(now.getDate())}-${part(now.getHours())}${part(now.getMinutes())}`;
}

function setByPath(object, path, value) {
  const parts = path.split(".");
  let cursor = object;
  for (const part of parts.slice(0, -1)) cursor = cursor[part];
  cursor[parts.at(-1)] = value;
}

function markDirty() {
  state.dirty = true;
  saveState.textContent = "有未保存修改";
  saveState.className = "state-pill dirty";
}

function markSaved(label = "草稿已保存") {
  state.dirty = false;
  saveState.textContent = label;
  saveState.className = "state-pill saved";
}

function toast(message, tone = "normal", duration = 4200) {
  const item = document.createElement("div");
  item.className = `toast ${tone === "error" ? "error" : ""}`;
  item.textContent = message;
  toastRegion.append(item);
  setTimeout(() => item.remove(), duration);
}

async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (state.config?.token && options.method && options.method !== "GET") {
    headers.set("X-Admin-Token", state.config.token);
  }
  const response = await fetch(path, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `请求失败（${response.status}）`);
  return payload;
}

function setBusy(busy, label = "") {
  state.busy = busy;
  saveButton.disabled = busy;
  previewButton.disabled = busy;
  publishButton.disabled = busy;
  if (busy && label) {
    saveState.textContent = label;
    saveState.className = "state-pill";
  }
}

function renderGuideList() {
  const query = guideSearch.value.trim().toLowerCase();
  const visible = state.guides.filter((guide) =>
    `${guide.title} ${guide.subtitle} ${guide.category} ${guide.slug}`
      .toLowerCase()
      .includes(query),
  );
  guideList.innerHTML = visible
    .map(
      (guide) => `
        <button class="guide-link ${guide.slug === state.selectedSlug ? "active" : ""}" data-slug="${guide.slug}">
          <strong>${escapeHtml(guide.title)}</strong>
          <small>${escapeHtml(guide.category)} · ${escapeHtml(guide.slug)}</small>
        </button>`,
    )
    .join("");
}

function field(label, path, value, options = {}) {
  const full = options.full ? "full" : "";
  const type = options.type || "input";
  if (type === "textarea") {
    return `<label class="field ${full}"><span>${label}</span><textarea data-path="${path}" rows="${options.rows || 3}">${escapeHtml(value)}</textarea></label>`;
  }
  if (type === "select") {
    return `<label class="field ${full}"><span>${label}</span><select data-path="${path}">${options.values
      .map(
        (item) =>
          `<option value="${escapeHtml(item)}" ${item === value ? "selected" : ""}>${escapeHtml(item)}</option>`,
      )
      .join("")}</select></label>`;
  }
  return `<label class="field ${full}"><span>${label}</span><input data-path="${path}" value="${escapeHtml(value)}" ${options.readonly ? "readonly" : ""} /></label>`;
}

function imageCardHtml(image, sectionIndex, blockIndex, imageIndex) {
  const base = `sections.${sectionIndex}.blocks.${blockIndex}.images.${imageIndex}`;
  return `
    <div class="image-card" data-kind="image" data-section="${sectionIndex}" data-block="${blockIndex}" data-image="${imageIndex}">
      <span class="drag-handle" draggable="true" data-kind="image" data-section="${sectionIndex}" data-block="${blockIndex}" data-image="${imageIndex}" title="拖动图片">⋮⋮</span>
      <img src="${escapeHtml(image.src)}" alt="" />
      <div class="image-fields">
        <input data-path="${base}.caption" value="${escapeHtml(image.caption || "")}" aria-label="图片说明" placeholder="图片说明" />
        <input data-path="${base}.alt" value="${escapeHtml(image.alt || "")}" aria-label="替代文字" placeholder="无障碍替代文字" />
      </div>
      <div class="image-actions">
        <button type="button" class="button secondary small" data-action="redact-image" data-section="${sectionIndex}" data-block="${blockIndex}" data-image="${imageIndex}">重新脱敏</button>
        <button type="button" class="button danger small" data-action="remove-image" data-section="${sectionIndex}" data-block="${blockIndex}" data-image="${imageIndex}">移除</button>
      </div>
    </div>`;
}

function imageZoneHtml(block, sectionIndex, blockIndex) {
  if (!Array.isArray(block.images)) return "";
  return `
    <div class="image-zone" data-section="${sectionIndex}" data-block="${blockIndex}">
      <div class="image-zone-head">
        <span>把图片拖到这里；图片也可以拖到其他步骤</span>
        <button type="button" class="button secondary small" data-action="choose-images" data-section="${sectionIndex}" data-block="${blockIndex}">添加图片</button>
        <input hidden type="file" accept="image/png,image/jpeg,image/webp" multiple data-upload-input data-section="${sectionIndex}" data-block="${blockIndex}" />
      </div>
      <div class="image-list">
        ${block.images.map((image, imageIndex) => imageCardHtml(image, sectionIndex, blockIndex, imageIndex)).join("")}
      </div>
    </div>`;
}

function blockHtml(block, sectionIndex, blockIndex) {
  const base = `sections.${sectionIndex}.blocks.${blockIndex}`;
  let fields = "";
  if (block.type === "step") {
    fields = `
      <div class="block-fields">
        ${field("编号", `${base}.number`, block.number || "")}
        ${field("步骤标题", `${base}.title`, block.title || "")}
        ${field("操作说明", `${base}.body`, block.body || "", { type: "textarea", full: true })}
        ${field("补充说明", `${base}.note`, block.note || "", { type: "textarea", full: true, rows: 2 })}
        ${field("警告文字", `${base}.warning`, block.warning || "", { type: "textarea", full: true, rows: 2 })}
      </div>`;
  } else if (block.type === "point") {
    fields = `<div class="block-fields">${field("说明文字", `${base}.text`, block.text || "", { type: "textarea", full: true })}</div>`;
  } else if (block.type === "details") {
    fields = `<div class="block-fields">
      ${field("问题标题", `${base}.title`, block.title || "", { full: true })}
      ${field("回答", `${base}.body`, block.body || "", { type: "textarea", full: true })}
    </div>`;
  } else {
    fields = `<div class="block-fields">
      ${field("样式", `${base}.tone`, block.tone || "info", { type: "select", values: ["info", "success", "warning"] })}
      ${field("提示标题", `${base}.title`, block.title || "")}
      ${field("提示内容", `${base}.body`, block.body || "", { type: "textarea", full: true })}
    </div>`;
  }
  return `
    <article class="block-card" data-kind="block" data-section="${sectionIndex}" data-block="${blockIndex}">
      <div class="block-head">
        <span class="drag-handle" draggable="true" data-kind="block" data-section="${sectionIndex}" data-block="${blockIndex}" title="拖动内容块">⋮⋮</span>
        <span class="block-type">${blockLabels[block.type]}</span>
        <span class="spacer"></span>
        <button type="button" class="button danger small" data-action="remove-block" data-section="${sectionIndex}" data-block="${blockIndex}">删除</button>
      </div>
      ${fields}
      ${imageZoneHtml(block, sectionIndex, blockIndex)}
    </article>`;
}

function sectionHtml(section, sectionIndex) {
  const base = `sections.${sectionIndex}`;
  return `
    <section class="section-card" data-kind="section" data-section="${sectionIndex}">
      <div class="section-head">
        <span class="drag-handle" draggable="true" data-kind="section" data-section="${sectionIndex}" title="拖动章节">⋮⋮</span>
        <div class="section-summary">
          <strong>${escapeHtml(section.title || "未命名章节")}</strong>
          <small>#${escapeHtml(section.id)}</small>
        </div>
        <button type="button" class="button danger small" data-action="remove-section" data-section="${sectionIndex}">删除章节</button>
      </div>
      <div class="section-body">
        <div class="field-grid section-fields">
          ${field("章节 ID", `${base}.id`, section.id || "")}
          ${field("小标题", `${base}.kicker`, section.kicker || "")}
          ${field("章节标题", `${base}.title`, section.title || "", { full: true })}
          ${field("章节介绍", `${base}.intro`, section.intro || "", { type: "textarea", full: true, rows: 2 })}
        </div>
        <div class="blocks">
          ${section.blocks.map((block, blockIndex) => blockHtml(block, sectionIndex, blockIndex)).join("")}
        </div>
        <div class="add-block-row">
          <button type="button" class="button secondary small" data-action="add-block" data-type="step" data-section="${sectionIndex}">+ 步骤</button>
          <button type="button" class="button secondary small" data-action="add-block" data-type="point" data-section="${sectionIndex}">+ 说明</button>
          <button type="button" class="button secondary small" data-action="add-block" data-type="details" data-section="${sectionIndex}">+ 折叠问答</button>
          <button type="button" class="button secondary small" data-action="add-block" data-type="callout" data-section="${sectionIndex}">+ 提示框</button>
        </div>
      </div>
    </section>`;
}

function renderEditor() {
  if (!state.guide) {
    editor.hidden = true;
    editorEmpty.hidden = false;
    return;
  }
  const guide = state.guide;
  editor.hidden = false;
  editorEmpty.hidden = true;
  editor.innerHTML = `
    <div class="editor-heading">
      <div><h1>${escapeHtml(guide.title)}</h1><p>拖动章节、步骤或图片调整前端显示顺序。</p></div>
    </div>
    <section class="panel">
      <h2>页面资料</h2>
      <div class="field-grid">
        ${field("标题", "title", guide.title)}
        ${field("副标题", "subtitle", guide.subtitle)}
        ${field("分类", "category", guide.category, { type: "select", values: categoryOptions })}
        ${field("设备", "device", guide.device)}
        ${field("预计时间", "duration", guide.duration)}
        ${field("网址标识", "slug", guide.slug, { readonly: true })}
        ${field("页面介绍", "description", guide.description, { type: "textarea", full: true })}
        ${field("完成标准", "completion", guide.completion, { type: "textarea", full: true })}
        ${field("搜索关键词（每行或逗号分隔）", "keywords", guide.keywords.join("\\n"), { type: "textarea", full: true })}
      </div>
    </section>
    <section class="panel">
      <h2>开始前准备</h2>
      <div class="prepare-list">
        ${guide.prepare
          .map(
            (item, index) => `
              <div class="prepare-row">
                <input data-path="prepare.${index}.label" value="${escapeHtml(item.label)}" aria-label="准备项名称" />
                <input data-path="prepare.${index}.text" value="${escapeHtml(item.text)}" aria-label="准备项说明" />
                <button type="button" class="button danger small" data-action="remove-prepare" data-index="${index}">删除</button>
              </div>`,
          )
          .join("")}
      </div>
      <button type="button" class="button secondary small" data-action="add-prepare">+ 增加准备项</button>
    </section>
    <div id="sections-list">
      ${guide.sections.map(sectionHtml).join("")}
    </div>
    <button type="button" class="button secondary add-section" data-action="add-section">+ 新增章节</button>`;
}

async function selectGuide(slug) {
  if (slug === state.selectedSlug) return;
  if (state.dirty && !confirm("当前修改尚未保存，确定切换指引吗？")) return;
  try {
    setBusy(true, "载入指引…");
    state.guide = await api(`/api/guides/${slug}`);
    state.selectedSlug = slug;
    state.dirty = false;
    renderGuideList();
    renderEditor();
    updatePreviewUrl();
    markSaved("内容已载入");
  } catch (error) {
    toast(error.message, "error");
  } finally {
    setBusy(false);
  }
}

function updatePreviewUrl(refresh = false) {
  if (!state.guide || !state.config) return;
  const url = `${state.config.previewBase}/guides/${state.guide.slug}/${refresh ? `?t=${Date.now()}` : ""}`;
  previewFrame.src = url;
  openPreview.href = url;
}

async function saveGuide({ quiet = false } = {}) {
  if (!state.guide) return false;
  try {
    setBusy(true, "正在保存…");
    await api(`/api/guides/${state.guide.slug}`, {
      method: "PUT",
      body: JSON.stringify(state.guide),
    });
    const listItem = state.guides.find((item) => item.slug === state.guide.slug);
    if (listItem) {
      listItem.title = state.guide.title;
      listItem.subtitle = state.guide.subtitle;
      listItem.category = state.guide.category;
    }
    renderGuideList();
    markSaved();
    if (!quiet) toast("草稿已保存到本地。");
    return true;
  } catch (error) {
    toast(error.message, "error", 6500);
    return false;
  } finally {
    setBusy(false);
  }
}

async function refreshPreview() {
  if (!(await saveGuide({ quiet: true }))) return;
  updatePreviewUrl(true);
  toast("预览已刷新。");
}

async function publishGuide() {
  if (!(await saveGuide({ quiet: true }))) return;
  const message = prompt(
    "填写本次修改说明：",
    `Update ${state.guide.title}`,
  );
  if (!message) return;
  if (!confirm("发布会构建网站、提交内容并推送到 GitHub。确定继续吗？")) return;
  try {
    setBusy(true, "正在构建并发布…");
    const result = await api("/api/publish", {
      method: "POST",
      body: JSON.stringify({ message }),
    });
    if (result.unchanged) {
      toast("没有需要发布的修改。");
      markSaved("没有新修改");
    } else {
      toast(`已推送 GitHub：${result.commit.slice(0, 8)}。Pages 稍后会自动更新。`, "normal", 8000);
      markSaved("已发布到 GitHub");
    }
  } catch (error) {
    toast(error.message, "error", 10000);
    markSaved("发布失败，请查看提示");
  } finally {
    setBusy(false);
  }
}

function renderHomepageOrganizer() {
  if (!homepageDraft) return;
  homepageCategories.innerHTML = homepageDraft.categoryOrder
    .map((category, categoryIndex) => {
      const items = state.guides.filter(
        (guide) => homepageDraft.guideCategories[guide.slug] === category,
      );
      return `
        <section class="homepage-category" data-home-category="${escapeHtml(category)}" data-category-index="${categoryIndex}">
          <div class="homepage-category-head">
            <span class="drag-handle" draggable="true" data-home-kind="category" data-category="${escapeHtml(category)}" title="拖动类目">⋮⋮</span>
            <strong>${escapeHtml(category)}</strong>
            <small>${items.length} 篇 SOP</small>
          </div>
          <div class="homepage-guide-list">
            ${items
              .map(
                (guide) => `
                  <button type="button" class="homepage-guide-item" draggable="true" data-home-kind="guide" data-slug="${escapeHtml(guide.slug)}" title="拖到其他类目">
                    ${escapeHtml(guide.title)}
                  </button>`,
              )
              .join("")}
          </div>
        </section>`;
    })
    .join("");
}

function markHomepageDirty() {
  if (!homepageDraft) return;
  homepageDraft.dirty = true;
  homepageState.textContent = "有未保存的首页调整";
  homepageState.className = "dirty";
}

async function openHomepageOrganizer() {
  if (state.dirty && !(await saveGuide({ quiet: true }))) return;
  try {
    setBusy(true, "载入首页分类…");
    const config = await api("/api/homepage");
    homepageDraft = {
      categoryOrder: [...config.categoryOrder],
      guideCategories: Object.fromEntries(
        state.guides.map((guide) => [guide.slug, guide.category]),
      ),
      dirty: false,
    };
    homepageState.textContent = "尚未修改";
    homepageState.className = "";
    renderHomepageOrganizer();
    homepageDialog.showModal();
  } catch (error) {
    toast(error.message, "error", 7000);
  } finally {
    setBusy(false);
  }
}

function closeHomepageOrganizer() {
  if (
    homepageDraft?.dirty &&
    !confirm("首页整理尚未保存，确定放弃这些调整吗？")
  ) {
    return;
  }
  homepageDraft = null;
  homepageDrag = null;
  homepageDialog.close();
}

async function saveHomepageOrganizer() {
  if (!homepageDraft) return;
  try {
    homepageSave.disabled = true;
    setBusy(true, "正在保存首页整理…");
    await api("/api/homepage", {
      method: "PUT",
      body: JSON.stringify({
        categoryOrder: homepageDraft.categoryOrder,
        guideCategories: homepageDraft.guideCategories,
      }),
    });
    for (const guide of state.guides) {
      guide.category = homepageDraft.guideCategories[guide.slug];
    }
    if (state.guide) {
      state.guide.category = homepageDraft.guideCategories[state.guide.slug];
    }
    renderGuideList();
    renderEditor();
    const homepageUrl = `${state.config.previewBase}/?t=${Date.now()}`;
    previewFrame.src = homepageUrl;
    openPreview.href = homepageUrl;
    homepageDraft.dirty = false;
    closeHomepageOrganizer();
    markSaved("首页整理已保存");
    toast("首页归类和类目顺序已保存，预览已切换到首页。", "normal", 6500);
  } catch (error) {
    toast(error.message, "error", 8000);
  } finally {
    homepageSave.disabled = false;
    setBusy(false);
  }
}

async function openNewGuideDialog() {
  if (state.dirty && !(await saveGuide({ quiet: true }))) return;
  newGuideForm.reset();
  newGuideForm.elements.slug.value = suggestedGuideSlug();
  newGuideDialog.showModal();
  newGuideForm.elements.title.focus();
}

function newGuideFromForm() {
  const form = new FormData(newGuideForm);
  const title = String(form.get("title") || "").trim();
  const slug = String(form.get("slug") || "").trim().toLowerCase();
  const subtitle =
    String(form.get("subtitle") || "").trim() || "Microsoft 365 操作指引";
  const description =
    String(form.get("description") || "").trim() ||
    `按照步骤完成“${title}”相关操作。`;

  return {
    slug,
    title,
    subtitle,
    category: String(form.get("category") || categoryOptions[0]),
    description,
    duration: "约 5–10 分钟",
    device: String(form.get("device") || "").trim() || "电脑或手机",
    keywords: [title],
    completion: "按照页面步骤完成操作，并确认结果正常。",
    prepare: [
      {
        label: "开始前",
        text: "准备好操作所需的公司账号、设备和稳定网络。",
      },
    ],
    sections: [
      {
        id: "steps",
        kicker: "操作指引",
        title: "操作步骤",
        intro: "",
        blocks: [
          {
            id: "step-1",
            type: "step",
            number: "1",
            title: "第一步",
            body: "在这里填写具体操作。",
            note: "",
            warning: "",
            images: [],
          },
        ],
      },
    ],
  };
}

async function createGuide(event) {
  event.preventDefault();
  if (!newGuideForm.reportValidity()) return;
  const guide = newGuideFromForm();
  try {
    newGuideSubmit.disabled = true;
    setBusy(true, "正在创建 SOP…");
    const result = await api("/api/guides", {
      method: "POST",
      body: JSON.stringify(guide),
    });
    state.guides.push({
      slug: guide.slug,
      title: guide.title,
      subtitle: guide.subtitle,
      category: guide.category,
    });
    state.guides.sort((a, b) => a.slug.localeCompare(b.slug));
    state.guide = result.guide;
    state.selectedSlug = guide.slug;
    state.dirty = false;
    guideSearch.value = "";
    newGuideDialog.close();
    renderGuideList();
    renderEditor();
    updatePreviewUrl(true);
    markSaved("新 SOP 已创建");
    toast("新 SOP 已创建。完善内容后可直接预览和发布。", "normal", 6500);
  } catch (error) {
    toast(error.message, "error", 7000);
  } finally {
    newGuideSubmit.disabled = false;
    setBusy(false);
  }
}

function makeBlock(type, section) {
  if (type === "step") {
    const stepCount = section.blocks.filter((block) => block.type === "step").length;
    return {
      id: uid("step"),
      type,
      number: String(stepCount + 1),
      title: "新步骤",
      body: "",
      note: "",
      warning: "",
      images: [],
    };
  }
  if (type === "point") {
    return { id: uid("point"), type, text: "新的说明", images: [] };
  }
  if (type === "details") {
    return { id: uid("detail"), type, title: "常见问题", body: "" };
  }
  return {
    id: uid("callout"),
    type: "callout",
    tone: "info",
    title: "提示",
    body: "",
  };
}

function structuralChange() {
  markDirty();
  renderEditor();
}

editor.addEventListener("input", (event) => {
  const target = event.target;
  const path = target.dataset.path;
  if (!path || !state.guide) return;
  if (path === "keywords") {
    state.guide.keywords = target.value
      .split(/[,\n，]/)
      .map((item) => item.trim())
      .filter(Boolean);
  } else {
    setByPath(state.guide, path, target.value);
  }
  markDirty();
});

editor.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button || !state.guide) return;
  const action = button.dataset.action;
  const sectionIndex = Number(button.dataset.section);
  const blockIndex = Number(button.dataset.block);
  const imageIndex = Number(button.dataset.image);

  if (action === "add-prepare") {
    state.guide.prepare.push({ label: "准备项", text: "" });
    structuralChange();
  } else if (action === "remove-prepare") {
    state.guide.prepare.splice(Number(button.dataset.index), 1);
    structuralChange();
  } else if (action === "add-section") {
    state.guide.sections.push({
      id: uid("section"),
      kicker: "操作指引",
      title: "新章节",
      intro: "",
      blocks: [],
    });
    structuralChange();
  } else if (action === "remove-section") {
    if (confirm("确定删除整个章节吗？其中的步骤和图片引用也会移除。")) {
      state.guide.sections.splice(sectionIndex, 1);
      structuralChange();
    }
  } else if (action === "add-block") {
    const section = state.guide.sections[sectionIndex];
    section.blocks.push(makeBlock(button.dataset.type, section));
    structuralChange();
  } else if (action === "remove-block") {
    if (confirm("确定删除这一项吗？")) {
      state.guide.sections[sectionIndex].blocks.splice(blockIndex, 1);
      structuralChange();
    }
  } else if (action === "remove-image") {
    state.guide.sections[sectionIndex].blocks[blockIndex].images.splice(imageIndex, 1);
    structuralChange();
  } else if (action === "choose-images") {
    editor
      .querySelector(
        `[data-upload-input][data-section="${sectionIndex}"][data-block="${blockIndex}"]`,
      )
      ?.click();
  } else if (action === "redact-image") {
    await redactExistingImage(sectionIndex, blockIndex, imageIndex);
  }
});

editor.addEventListener("change", async (event) => {
  const input = event.target.closest("[data-upload-input]");
  if (!input?.files?.length) return;
  await addFilesToBlock(
    [...input.files],
    Number(input.dataset.section),
    Number(input.dataset.block),
  );
  input.value = "";
});

guideList.addEventListener("click", (event) => {
  const item = event.target.closest("[data-slug]");
  if (item) selectGuide(item.dataset.slug);
});

guideSearch.addEventListener("input", renderGuideList);
saveButton.addEventListener("click", () => saveGuide());
previewButton.addEventListener("click", refreshPreview);
publishButton.addEventListener("click", publishGuide);
newGuideButton.addEventListener("click", openNewGuideDialog);
newGuideForm.addEventListener("submit", createGuide);
homepageButton.addEventListener("click", openHomepageOrganizer);
homepageSave.addEventListener("click", saveHomepageOrganizer);
document
  .querySelector("#homepage-close")
  .addEventListener("click", closeHomepageOrganizer);
document
  .querySelector("#homepage-cancel")
  .addEventListener("click", closeHomepageOrganizer);
homepageDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeHomepageOrganizer();
});
document
  .querySelector("#new-guide-close")
  .addEventListener("click", () => newGuideDialog.close());
document
  .querySelector("#new-guide-cancel")
  .addEventListener("click", () => newGuideDialog.close());

homepageCategories.addEventListener("dragstart", (event) => {
  const source = event.target.closest("[data-home-kind]");
  if (!source || !homepageDraft) return;
  homepageDrag =
    source.dataset.homeKind === "category"
      ? { kind: "category", category: source.dataset.category }
      : { kind: "guide", slug: source.dataset.slug };
  const visual =
    homepageDrag.kind === "category"
      ? source.closest(".homepage-category")
      : source;
  visual?.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", JSON.stringify(homepageDrag));
});

homepageCategories.addEventListener("dragover", (event) => {
  if (!homepageDrag) return;
  const target = event.target.closest(".homepage-category");
  if (!target) return;
  event.preventDefault();
  homepageCategories
    .querySelectorAll(".drop-active")
    .forEach((item) => item.classList.remove("drop-active"));
  target.classList.add("drop-active");
});

homepageCategories.addEventListener("drop", (event) => {
  event.preventDefault();
  const target = event.target.closest(".homepage-category");
  if (!target || !homepageDraft || !homepageDrag) return;
  const targetCategory = target.dataset.homeCategory;

  if (homepageDrag.kind === "guide") {
    if (homepageDraft.guideCategories[homepageDrag.slug] !== targetCategory) {
      homepageDraft.guideCategories[homepageDrag.slug] = targetCategory;
      markHomepageDirty();
      renderHomepageOrganizer();
    }
  } else if (homepageDrag.category !== targetCategory) {
    const fromIndex = homepageDraft.categoryOrder.indexOf(
      homepageDrag.category,
    );
    const targetIndex = homepageDraft.categoryOrder.indexOf(targetCategory);
    const targetRect = target.getBoundingClientRect();
    const insertAfter = event.clientY > targetRect.top + targetRect.height / 2;
    const [category] = homepageDraft.categoryOrder.splice(fromIndex, 1);
    let insertIndex = targetIndex + (insertAfter ? 1 : 0);
    if (fromIndex < insertIndex) insertIndex -= 1;
    homepageDraft.categoryOrder.splice(insertIndex, 0, category);
    markHomepageDirty();
    renderHomepageOrganizer();
  }
  homepageDrag = null;
});

homepageCategories.addEventListener("dragend", () => {
  homepageCategories
    .querySelectorAll(".dragging,.drop-active")
    .forEach((item) => item.classList.remove("dragging", "drop-active"));
  homepageDrag = null;
});

function moveArrayItem(array, from, to) {
  const [item] = array.splice(from, 1);
  const adjusted = from < to ? to - 1 : to;
  array.splice(Math.max(0, adjusted), 0, item);
}

editor.addEventListener("dragstart", (event) => {
  const handle = event.target.closest(".drag-handle[data-kind]");
  if (!handle) return;
  const data = {
    kind: handle.dataset.kind,
    section: Number(handle.dataset.section),
    block: Number(handle.dataset.block),
    image: Number(handle.dataset.image),
  };
  state.dragData = data;
  handle
    .closest(
      data.kind === "image"
        ? ".image-card"
        : data.kind === "block"
          ? ".block-card"
          : ".section-card",
    )
    ?.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("application/json", JSON.stringify(data));
});

editor.addEventListener("dragend", () => {
  editor.querySelectorAll(".dragging,.drop-active").forEach((item) => {
    item.classList.remove("dragging", "drop-active");
  });
  state.dragData = null;
});

editor.addEventListener("dragover", (event) => {
  const zone = event.target.closest(".image-zone,.block-card,.section-card");
  if (!zone) return;
  event.preventDefault();
  editor.querySelectorAll(".drop-active").forEach((item) => item.classList.remove("drop-active"));
  zone.classList.add("drop-active");
});

editor.addEventListener("drop", async (event) => {
  event.preventDefault();
  editor.querySelectorAll(".drop-active").forEach((item) => item.classList.remove("drop-active"));
  const imageZone = event.target.closest(".image-zone");
  if (event.dataTransfer.files?.length && imageZone) {
    await addFilesToBlock(
      [...event.dataTransfer.files],
      Number(imageZone.dataset.section),
      Number(imageZone.dataset.block),
    );
    return;
  }
  let data = state.dragData;
  try {
    data ||= JSON.parse(event.dataTransfer.getData("application/json"));
  } catch {
    return;
  }
  if (!data) return;

  if (data.kind === "section") {
    const target = event.target.closest(".section-card");
    if (!target) return;
    moveArrayItem(state.guide.sections, data.section, Number(target.dataset.section));
    structuralChange();
    return;
  }

  if (data.kind === "block") {
    const targetBlock = event.target.closest(".block-card");
    const targetSection = event.target.closest(".section-card");
    if (!targetSection) return;
    const sourceBlocks = state.guide.sections[data.section].blocks;
    const [item] = sourceBlocks.splice(data.block, 1);
    const destinationSectionIndex = Number(targetSection.dataset.section);
    const destinationBlocks = state.guide.sections[destinationSectionIndex].blocks;
    let destinationIndex = targetBlock
      ? Number(targetBlock.dataset.block)
      : destinationBlocks.length;
    if (data.section === destinationSectionIndex && data.block < destinationIndex) {
      destinationIndex -= 1;
    }
    destinationBlocks.splice(Math.max(0, destinationIndex), 0, item);
    structuralChange();
    return;
  }

  if (data.kind === "image") {
    const targetZone = event.target.closest(".image-zone");
    if (!targetZone) return;
    const sourceImages =
      state.guide.sections[data.section].blocks[data.block].images;
    const [item] = sourceImages.splice(data.image, 1);
    const destinationSection = Number(targetZone.dataset.section);
    const destinationBlock = Number(targetZone.dataset.block);
    const destinationImages =
      state.guide.sections[destinationSection].blocks[destinationBlock].images;
    const targetCard = event.target.closest(".image-card");
    let destinationIndex = targetCard
      ? Number(targetCard.dataset.image)
      : destinationImages.length;
    if (
      data.section === destinationSection &&
      data.block === destinationBlock &&
      data.image < destinationIndex
    ) {
      destinationIndex -= 1;
    }
    destinationImages.splice(Math.max(0, destinationIndex), 0, item);
    structuralChange();
  }
});

let redaction = null;
const redactDialog = document.querySelector("#redact-dialog");
const redactCanvas = document.querySelector("#redact-canvas");
const redactContext = redactCanvas.getContext("2d");
const redactCount = document.querySelector("#redact-count");
const redactSaveButton = document.querySelector("#redact-save");

function drawRedaction() {
  if (!redaction) return;
  redactContext.clearRect(0, 0, redactCanvas.width, redactCanvas.height);
  redactContext.drawImage(
    redaction.image,
    0,
    0,
    redactCanvas.width,
    redactCanvas.height,
  );
  redactContext.fillStyle = "#3f4752";
  for (const rect of [...redaction.rects, ...(redaction.current ? [redaction.current] : [])]) {
    const x = Math.min(rect.x1, rect.x2);
    const y = Math.min(rect.y1, rect.y2);
    const width = Math.abs(rect.x2 - rect.x1);
    const height = Math.abs(rect.y2 - rect.y1);
    redactContext.fillRect(x, y, width, height);
  }
  redactCount.textContent = redaction.rects.length
    ? `已添加 ${redaction.rects.length} 个不透明遮挡区域`
    : "尚未添加遮挡区域；确认无敏感信息也可直接添加";
}

function canvasPoint(event) {
  const rect = redactCanvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * redactCanvas.width,
    y: ((event.clientY - rect.top) / rect.height) * redactCanvas.height,
  };
}

redactCanvas.addEventListener("pointerdown", (event) => {
  if (!redaction) return;
  redactCanvas.setPointerCapture(event.pointerId);
  const point = canvasPoint(event);
  redaction.start = point;
  redaction.current = { x1: point.x, y1: point.y, x2: point.x, y2: point.y };
  drawRedaction();
});

redactCanvas.addEventListener("pointermove", (event) => {
  if (!redaction?.current) return;
  const point = canvasPoint(event);
  redaction.current.x2 = point.x;
  redaction.current.y2 = point.y;
  drawRedaction();
});

redactCanvas.addEventListener("pointerup", (event) => {
  if (!redaction?.current) return;
  const point = canvasPoint(event);
  redaction.current.x2 = point.x;
  redaction.current.y2 = point.y;
  if (
    Math.abs(redaction.current.x2 - redaction.current.x1) > 4 &&
    Math.abs(redaction.current.y2 - redaction.current.y1) > 4
  ) {
    redaction.rects.push(redaction.current);
  }
  redaction.current = null;
  redaction.start = null;
  drawRedaction();
});

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("无法读取图片。"));
    };
    image.src = url;
  });
}

async function openRedactor(file) {
  const image = await loadImage(file);
  const scale = Math.min(1, 2200 / Math.max(image.naturalWidth, image.naturalHeight));
  redactCanvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  redactCanvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  return new Promise((resolve) => {
    redaction = {
      image,
      filename: file.name,
      rects: [],
      current: null,
      resolve,
    };
    drawRedaction();
    redactDialog.showModal();
  });
}

function closeRedactor(result) {
  if (!redaction) return;
  const resolve = redaction.resolve;
  redaction = null;
  redactDialog.close();
  resolve(result);
}

document.querySelector("#redact-close").addEventListener("click", () => closeRedactor(null));
document.querySelector("#redact-undo").addEventListener("click", () => {
  redaction?.rects.pop();
  drawRedaction();
});
document.querySelector("#redact-clear").addEventListener("click", () => {
  if (redaction) redaction.rects = [];
  drawRedaction();
});
redactSaveButton.addEventListener("click", () => {
  if (!redaction) return;
  const filename = redaction.filename;
  redactSaveButton.disabled = true;
  drawRedaction();
  redactCanvas.toBlob(
    (blob) => {
      redactSaveButton.disabled = false;
      if (!redaction) return;
      closeRedactor(
        blob
          ? new File(
              [blob],
              `${filename.replace(/\.[^.]+$/, "")}.webp`,
              { type: "image/webp" },
            )
          : null,
      );
    },
    "image/webp",
    0.94,
  );
});
redactDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeRedactor(null);
});

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("读取图片失败。"));
    reader.readAsDataURL(file);
  });
}

function captionFromFilename(name) {
  return name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim() || "操作截图";
}

async function uploadProcessedFile(file) {
  const dataUrl = await fileToDataUrl(file);
  const result = await api("/api/upload", {
    method: "POST",
    body: JSON.stringify({
      slug: state.guide.slug,
      filename: file.name,
      dataUrl,
    }),
  });
  const caption = captionFromFilename(file.name);
  return { src: result.src, caption, alt: caption };
}

async function addFilesToBlock(files, sectionIndex, blockIndex) {
  const valid = files.filter((file) => /^image\/(png|jpeg|webp)$/.test(file.type));
  if (!valid.length) return toast("请选择 PNG、JPEG 或 WebP 图片。", "error");
  try {
    setBusy(true, "处理图片…");
    for (const file of valid) {
      const processed = await openRedactor(file);
      if (!processed) continue;
      const image = await uploadProcessedFile(processed);
      state.guide.sections[sectionIndex].blocks[blockIndex].images.push(image);
      markDirty();
    }
    renderEditor();
    toast("图片已加入步骤；请检查说明后保存草稿。");
  } catch (error) {
    toast(error.message, "error");
  } finally {
    setBusy(false);
  }
}

async function redactExistingImage(sectionIndex, blockIndex, imageIndex) {
  const image =
    state.guide.sections[sectionIndex].blocks[blockIndex].images[imageIndex];
  try {
    setBusy(true, "载入图片…");
    const response = await fetch(image.src);
    if (!response.ok) throw new Error("无法读取现有图片。");
    const blob = await response.blob();
    const filename = image.src.split("/").at(-1) || "screenshot.webp";
    const processed = await openRedactor(new File([blob], filename, { type: blob.type }));
    if (!processed) return;
    const replacement = await uploadProcessedFile(processed);
    replacement.caption = image.caption;
    replacement.alt = image.alt;
    state.guide.sections[sectionIndex].blocks[blockIndex].images[imageIndex] =
      replacement;
    structuralChange();
    toast("已生成新的脱敏图片；旧文件不会自动删除。");
  } catch (error) {
    toast(error.message, "error");
  } finally {
    setBusy(false);
  }
}

window.addEventListener("beforeunload", (event) => {
  if (!state.dirty) return;
  event.preventDefault();
  event.returnValue = "";
});

async function init() {
  try {
    state.config = await api("/api/config");
    const result = await api("/api/guides");
    state.guides = result.guides;
    renderGuideList();
    if (state.guides.length) await selectGuide(state.guides[0].slug);
  } catch (error) {
    saveState.textContent = "后台载入失败";
    toast(error.message, "error", 10000);
  }
}

init();
