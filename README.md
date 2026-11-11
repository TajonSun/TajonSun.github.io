# 喧闹的城堡 · 资料站

《喧闹的城堡》(Hustle Castle) 玩家向资料站，纯静态实现，可直接部署到 GitHub Pages。

- 经验：开局顺序、居民星级与繁殖、前期资源与工人、战斗编队、武器取舍、套装重做、付费与建筑师
- 制作材料计算：红装重做精粹计算、资源攒积时间计算、训练排程计算（全部前端实时计算）
- 活动：竞技场、传送门、黑门、部落战、节日活动的机制与参与建议，数据独立可编辑

## 目录结构

```
.
├─ index.html                 页面入口（相对路径引用资源）
├─ assets/
│  ├─ css/style.css           全站样式（响应式、暗色主题）
│  └─ js/
│     ├─ calc.js              计算内核（浏览器挂 window.CastleCalc，Node 可 require）
│     └─ app.js               渲染与表单交互
├─ data/
│  ├─ content.js              经验内容、部位字典、来源与缺口
│  └─ events.js               活动数据（可编辑）
├─ tests/calc.test.js         计算内核断言测试
├─ .nojekyll                  跳过 Jekyll 处理，保证静态文件原样发布
└─ README.md
```

## 本地预览

直接双击 `index.html` 即可（脚本为经典 script，不使用 ES Module 与 fetch，`file://` 下也能运行）。
建议同时用本地服务器验证一次：

```bash
python -m http.server 8000
# 打开 http://localhost:8000
```

运行计算测试：

```bash
node tests/calc.test.js
```

## 部署到 GitHub Pages

### 方式一：仓库根目录直接发布（无需构建）

1. 新建仓库，把本目录所有文件提交到默认分支（`main`）。
2. 仓库 **Settings → Pages → Build and deployment**：
   - Source 选 `Deploy from a branch`
   - Branch 选 `main`，目录选 `/ (root)`
3. 保存后等待构建，访问 `https://<用户名>.github.io/<仓库名>/`。

项目站点在子路径下发布，本工程所有资源均为相对路径，无需改配置。`.nojekyll` 用于避免 Jekyll 忽略特殊目录。

### 方式二：GitHub Actions 部署静态文件

`.github/workflows/pages.yml` 已提供最小工作流：检出仓库后用 `actions/upload-pages-artifact` + `actions/deploy-pages` 发布，适合后续加构建步骤。开启步骤：
仓库 **Settings → Pages → Source** 选择 `GitHub Actions`，然后推送 `main` 分支触发。

### 自定义域名

在 **Settings → Pages → Custom domain** 填域名，并在域名服务商处配置 CNAME 指向 `<用户名>.github.io`。

## 数据维护

- 经验与来源：`data/content.js`（`expCards` / `sources` / `gaps`）
- 活动：`data/events.js`。公开渠道拿不到可靠的当期排期，默认只写机制与建议；确认到当期活动后，把 `status` 改为「当期」并填写 `period`（如 `2026-11-05 至 2026-11-18`）。
- 精粹产出：`assets/js/calc.js` 顶部的 `ESSENCE_PER_SALVAGE`（武器 3 / 护甲 3 / 魂 2 / 戒指 1 / 项链 1），改后测试会自动覆盖。

## 数据口径与缺口

- 精粹数值、技能点上限、建筑师钻石价格、套装优先级均来自玩家社区攻略，游戏版本更新后可能变化，页面已标注「玩家经验」。
- 官方配方数值、当期活动排期、套装属性区间未获取，页面「数据说明」中如实列出。
- 资源与训练计算为线性估算，不含加速、加成、掠夺与仓库上限。

## 来源

- 百度百科 · 喧闹的城堡：https://baike.baidu.com/item/喧闹的城堡/65814487
- 百度贴吧 · 装备篇：https://tieba.baidu.com/p/8090653079
- 百度贴吧 · 竞技场与部落战争浅谈：https://tieba.baidu.com/p/5807006457
- 3h3 · 新手攻略：https://m.3h3.com/az/287223.html
- 嗨客 · 攻略大全：https://www.hackhome.com/InfoView/431868_full.html
- 32r · 游戏介绍：https://m.32r.com/app/87994.html
- GitHub Pages 文档：https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages

本站为玩家整理，非官方站点，与游戏发行方无关联。