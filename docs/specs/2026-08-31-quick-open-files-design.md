# Quick Open Files — 设计文档

日期：2026-08-31 · 状态：已实现

## 背景与目标

将 Sublime Text 插件 [danielfrg/sublime-open](https://github.com/danielfrg/sublime-open)（已归档）1:1 复刻为 VSCode 扩展：通过 QuickPick 提供「书签直达 + 文件系统逐级浏览」，目标发布到 VSCode Marketplace。

## 核心决策

| 决策 | 选择 | 依据 |
|---|---|---|
| UI 载体 | `window.createQuickPick()` 手动管理生命周期 | `onDidAccept` 后不自动关闭，persistent browsing 无闪烁 |
| 分组方式 | `QuickPickItemKind.Separator` 分隔 Bookmarks / 当前目录 | 官方 UX 指南（separators），取代原插件 `bookmark_prefix` |
| 上下文展示 | title = 当前目录；detail = 完整路径；`matchOnDetail` | 官方 UX 指南（多步流程标题、detail 上下文） |
| 上级导航 | `QuickInputButtons.Back` 按钮 + 列表首项 `../` | 官方多步流程模式；键盘用户友好 |
| 排除规则 | `quickOpenFiles.excludePatterns`（minimatch），未设置时回退全局 `files.exclude` | 对应原插件回退 Preferences 的行为 |
| 书签作用域 | `application`（仅用户级，不随工作区覆盖） | 跨工作区书签语义 |
| 排除的配置 | 无 `bookmarkPrefix`（被分隔线取代）、无显式 `activationEvents`（≥1.74 隐式生成） | 官方文档 |
| 打包 | esbuild 单文件 → `dist/extension.js`；`.vscodeignore` 排除源码 | 官方 bundling 指南 |
| 快捷键 | `ctrl+alt+o` / mac `cmd+alt+o`（原 CMD+SHIFT+O 被内置"转到符号"占用） | 官方 keybinding 语法 |

## 模块

- `src/extension.ts` — 激活入口，注册 `quickOpenFiles.browse` 命令
- `src/settings.ts` — 读配置 + `files.exclude` 回退
- `src/filesList.ts` — 纯逻辑（无 vscode 依赖）：`~` 展开、书签解析、目录列举/过滤/排序、`../` 项、软链接跟随
- `src/browse.ts` — `BrowseSession`：QuickPick 状态机（根视图 → 目录视图），选择分发、persistent browsing、代数计数防脏写、Esc 清理

## 交互流

1. 触发命令 → 书签区（缺失书签省略并警告）+（可选）活动文件所在目录区
2. 选目录 → 就地下钻，title 更新；`../` 或 Back 按钮回上级
3. 选文件 → `showTextDocument(preserveFocus: persistentBrowsing)`；persistent 模式下面板保持并刷新为该文件所在目录
4. Esc/失焦 → 面板关闭并 dispose

## 测试

- `filesList.test.ts`（vitest，13 例）：`~` 展开、书签存在性、目录优先排序、排除规则、根目录无 `../`、软链接、错误目录
- 打包验证：`vsce package` 产物仅含 `dist/extension.js` + 清单 + 文档

## 发布检查清单（需用户操作）

1. 在 [Marketplace Publisher 管理页](https://marketplace.visualstudio.com/manage) 创建 publisher，改 `package.json` 的 `publisher` 字段
2. 按[官方发布指南](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)创建凭据（注意：全局 PAT 2026-12-01 退役，推荐 Entra ID + `vsce publish --azure-credential`）
3. 创建 GitHub 仓库并在 `package.json` 填 `repository`，补充 `media/demo.gif`
4. `npx vsce package` → `npx vsce publish`
