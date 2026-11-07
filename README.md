# wanju

## 番茄时钟

一个独立的番茄时钟页面：25 分钟专注、5 分钟休息，只在页面内计时并在阶段结束时给出文字提示。不播放声音，也不使用系统通知。

### 界面预览

以下为实际页面截图（Chrome，浅色主题）：

| 专注阶段 | 计时进行中 |
| :---: | :---: |
| <img src="docs/evidence/pomodoro-after-focus.jpg" width="340" alt="专注阶段：显示 25:00 和开始按钮"><br><sub>专注 · 25:00</sub> | <img src="docs/evidence/pomodoro-after-running.jpg" width="340" alt="计时进行中：显示 24:59，按钮变为暂停"><br><sub>计时中 · 24:59</sub> |
| <img src="docs/evidence/pomodoro-after-break.jpg" width="340" alt="休息阶段：显示 05:00，主题切换为绿色"><br><sub>休息 · 05:00</sub> | <img src="docs/evidence/pomodoro-after-complete.jpg" width="340" alt="专注结束提示：提示点击开始进入休息"><br><sub>阶段结束提示</sub> |
| <img src="docs/evidence/pomodoro-after-mobile.jpg" width="200" alt="移动端 390×844 布局"><br><sub>移动端 · 390×844</sub> | |

- 页面入口：`pomodoro/index.html`，部署到 GitHub Pages 后访问 `/pomodoro/`。
- 本地预览：在仓库根目录运行 `python3 -m http.server 8000`，然后打开 <http://localhost:8000/pomodoro/>。
- 页面文件：`pomodoro/index.html`、`pomodoro/styles.css`、`pomodoro/timer.js`（计时逻辑）、`pomodoro/app.js`（界面绑定）。
- 计时逻辑测试：`npm test`（使用 Node 内置测试运行器，无第三方依赖）。