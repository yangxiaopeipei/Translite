# Translite

<img src="assets/translite-icon.png" width="96" alt="Translite icon" />

轻巧的 Raycast 翻译扩展，支持 **DeepL** 和 **Google**，适用于 macOS 与 Windows。

- **翻译**：打开即输入，停止输入后自动出结果；语言选择、原文、译文都在同一页。
- **划词翻译**：在其他应用选中文字，按全局快捷键，结果以原文 / 译文上下对照呈现。
- 两个引擎可随时切换，当前服务失败时自动回退到另一个。

## 功能

| | |
| --- | --- |
| 翻译引擎 | DeepL 官方 API / Google 免 Key 接口，页面内一键切换，失败自动回退 |
| 语言 | 源语言自动检测；原文已是目标语言时自动换向，手动指定优先 |
| 结果操作 | 复制、粘贴、交换原文 / 译文、系统朗读 |
| 长文本 | 单次最多 5000 个 Unicode 字符，Google 长文本自动分段 |
| 请求 | 取消过时请求，划词每次重新读取选区，不残留上一次结果 |

## 安装

```sh
git clone https://github.com/yangxiaopeipei/Translite.git
cd Translite
npm ci
npx ray build      # 编译并写入 ~/.config/raycast/extensions/translite/
```

然后**重启 Raycast**，搜索 `Translite` 即可看到两个命令。

> `npm run dev` 依赖 Raycast 的开发通道，在部分环境（Windows 常见）连不上，会报 `Missing executable`。直接用 `ray build` 最稳；改动代码后重新执行一次即可。

## 配置

Raycast → 扩展偏好 → Translite：

| 偏好项 | 说明 |
| --- | --- |
| DeepL API Key | 仅使用 DeepL 时填写。免费版 Key 以 `:fx` 结尾，会自动走免费接口；只用 Google 时无需填写 |
| 主引擎 | DeepL（质量优先）/ Google（速度优先、免 Key） |
| 默认目标语言 / 源语言 | 源语言留空为自动检测 |
| 原文已是目标语言时译成 | 避免中译中；手动指定目标语言时以手动为准 |
| 朗读 | macOS 用 `say`，Windows 用 System.Speech，需系统已装语音包 |
| 划词兜底 | 部分应用不允许模拟复制，读不到选区时回退读剪贴板，结果页会提示来源 |

建议给 **翻译选中文本** 绑一个全局快捷键，选中即译。

## 使用

**翻译**：呼出 Raycast 输入 `翻译`，直接开始输入原文。

**翻译选中文本**：在其他应用中选中文字 → 按快捷键。读取失败时按偏好回退到剪贴板。

操作菜单支持切换引擎、复制、粘贴、朗读、交换原文 / 译文。

Google 使用非官方免 Key 接口，可能受网络、限流或接口变更影响；DeepL 使用官方 API。

## 开发

```sh
npm run typecheck   # 类型检查
npm run lint        # 代码检查
npm run build       # 编译并安装到 Raycast 本地扩展目录
```

```
src/
  translate.tsx              # 主页面命令
  translate-selection.tsx    # 划词命令
  components/                # 结果页与翻译视图
  engines/                   # deepl / google
  utils/                     # 请求、选区读取、朗读
```

扩展 id 为 `translite`，命令 id 为 `translate` 与 `translate-selection`，升级安装不会丢配置。

## 许可证

[MIT](LICENSE) · 作者：`yangxiaopeipei`
