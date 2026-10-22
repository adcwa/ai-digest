# ⚡ AI 前沿速递

从 X（Twitter）精选的 **最新 AI 资讯 / AI 实践 / AI 调研与研究**，中文摘要，每条附原帖链接。
纯静态站点（HTML + CSS + 原生 JS），无需构建，Vercel 零配置即可部署。

- 覆盖时间：2026-10-12 ~ 2026-10-22（Asia/Shanghai）
- 条目：资讯 15 · 实践 15 · 研究 15，共 45 条
- 功能：分区标签页、全文搜索（按 `/` 聚焦）、标签筛选、按日期/热度排序、深色模式、响应式布局

## 目录结构

```
.
├── index.html            # 页面
├── assets/
│   ├── style.css         # 样式（含深色模式）
│   └── app.js            # 加载 data/items.json 并渲染
├── data/
│   ├── items.json        # 站点数据（前端读取）
│   └── sources.json      # 原帖 / X 新闻汇总的原始缓存（作者、时间、原文、点赞数）
└── scripts/
    ├── items_src.py      # 人工整理的中文标题、摘要、标签及对应帖子 ID
    ├── build_data.py     # 合并 items_src + sources → data/items.json
    └── GATHERING.md      # 数据采集说明
```

## 本地预览

```bash
python3 -m http.server 8000
# 打开 http://localhost:8000
```

> 直接双击 `index.html` 会因浏览器的 `file://` 限制无法 fetch JSON，请用本地服务器。

## 更新数据

1. 按 `scripts/GATHERING.md` 的方法从 X 抓取新内容；
2. 编辑 `scripts/items_src.py`（中文标题、摘要、主帖 ID、相关帖 ID）；
3. 运行 `python3 scripts/build_data.py --posts posts.json --stories stories.json`
   （若只改了文字、帖子已在缓存里，直接 `python3 scripts/build_data.py` 即可）；
4. 提交并推送，Vercel 会自动重新部署。

## 部署到 Vercel

```bash
# 推送到 GitHub 后，在 Vercel 中 Import 该仓库：
# Framework Preset 选 “Other”，Build Command 留空，Output Directory 留空（根目录）。
# 或使用 CLI：
npx vercel --prod
```

## 声明

- 所有条目均来自 X 公开帖子及 X 新闻汇总（`x.com/i/trending/...`，由 Grok 生成，可能有误），请以原帖为准。
- 摘要中标注“X 汇总称”的数字来自 X 新闻汇总，未经独立核实。
- 点赞数为抓取时的快照。
