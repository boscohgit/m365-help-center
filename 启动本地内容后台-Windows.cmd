@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
title M365 本地内容后台

cd /d "%~dp0"
set "PROJECT_DIR=%CD%"

where node.exe >nul 2>nul
if errorlevel 1 (
  echo.
  echo 没有找到 Node.js。
  echo 请先安装 Node.js LTS：https://nodejs.org/
  echo 安装时请保持“Add to PATH”选项开启。
  echo.
  pause
  exit /b 1
)

set "GIT_AVAILABLE=1"
where git.exe >nul 2>nul
if errorlevel 1 (
  set "GIT_AVAILABLE="
  echo.
  echo 提示：没有找到 Git。后台仍可编辑和预览，但无法从 GitHub 更新或发布。
  echo 请安装 Git for Windows：https://git-scm.com/download/win
)

if defined GIT_AVAILABLE if exist ".git" (
  set "HAS_LOCAL_CHANGES="
  for /f "delims=" %%G in ('git status --porcelain 2^>nul') do set "HAS_LOCAL_CHANGES=1"
  if defined HAS_LOCAL_CHANGES (
    echo.
    echo 检测到本地尚未发布的修改，为避免覆盖，已跳过 GitHub 更新。
  ) else (
    echo.
    echo 正在从 GitHub 获取最新版本...
    git pull --ff-only
    if errorlevel 1 (
      echo GitHub 更新失败，将继续使用当前本地版本。
    )
  )
)

set "PNPM_BIN="
where pnpm.cmd >nul 2>nul
if not errorlevel 1 set "PNPM_BIN=pnpm"

if not defined PNPM_BIN (
  where corepack.cmd >nul 2>nul
  if errorlevel 1 (
    echo.
    echo 没有找到 pnpm 或 Corepack。
    echo 请打开 PowerShell，运行：npm install -g pnpm
    echo 完成后重新双击本文件。
    echo.
    pause
    exit /b 1
  )
  call corepack.cmd pnpm --version >nul 2>nul
  if errorlevel 1 (
    echo.
    echo Corepack 无法启动 pnpm。
    echo 请打开 PowerShell，运行：npm install -g pnpm
    echo 完成后重新双击本文件。
    echo.
    pause
    exit /b 1
  )
  set "PNPM_BIN=admin\pnpm-corepack-windows.cmd"
)

if not exist "node_modules\astro\package.json" (
  echo.
  echo 首次运行，正在安装后台所需组件...
  call "%PNPM_BIN%" install --frozen-lockfile
  if errorlevel 1 (
    echo.
    echo 组件安装失败，请检查网络后重试。
    pause
    exit /b 1
  )
)

echo.
echo 正在启动 M365 本地内容后台...
set "M365_PNPM_BIN=%PNPM_BIN%"
node admin\server.mjs

echo.
echo 本地内容后台已经停止。
pause
