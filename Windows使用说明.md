# 在 Windows 上编辑 M365 帮助中心

这套内容后台不需要部署成公开后台。Windows 电脑从同一个 GitHub 仓库获取代码后，可以在本机启动、编辑、预览并发布。

## 第一次准备

在公司 Windows 电脑上安装：

1. [Git for Windows](https://git-scm.com/download/win)
2. [Node.js LTS](https://nodejs.org/)
3. GitHub Desktop（推荐，用于登录 GitHub 和管理仓库）

安装 Node.js 时请保持“Add to PATH”选项开启。

如果启动文件提示没有 pnpm，请打开 PowerShell，运行：

```powershell
npm install -g pnpm
```

## 获取项目

推荐在 GitHub Desktop 中克隆：

```text
https://github.com/boscohgit/m365-help-center.git
```

也可以在 PowerShell 中运行：

```powershell
git clone https://github.com/boscohgit/m365-help-center.git
```

## 启动后台

进入克隆后的项目文件夹，双击：

```text
启动本地内容后台-Windows.cmd
```

启动文件会：

1. 在没有本地修改时先执行 `git pull --ff-only`，获取 GitHub 最新版本。
2. 第一次运行时自动安装项目组件。
3. 打开 `http://127.0.0.1:15986`。

保持命令窗口开启。关闭窗口即可停止后台。

## 在两台电脑之间切换

每次开始编辑前，先确保已经从 GitHub 获取最新版本。Windows 启动文件会在本地干净时自动更新；Mac 上可在项目目录运行：

```bash
git pull --ff-only
```

编辑完成后：

1. 保存草稿并检查预览。
2. 点击后台顶部“发布到 GitHub”。
3. 等待发布成功提示。
4. 换到另一台电脑时，再执行 Pull。

不要在两台电脑上同时编辑同一篇 SOP，否则 Git 可能要求手动处理冲突。

## `.command` 和 `.cmd` 的区别

- Mac 使用 `启动本地内容后台.command`
- Windows 使用 `启动本地内容后台-Windows.cmd`

两者打开的是同一套后台，所有 SOP、截图和首页排序都保存在同一个 GitHub 仓库中。
