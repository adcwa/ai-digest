# 数据采集说明

采集时间：2026-10-22（Asia/Shanghai）。工具：Grok Bot 的 X 公共只读接口（`x` MCP 命名空间，基于 X API v2），共约 12 次调用。

## 步骤

1. **X 新闻汇总（search_news）**——按主题拉取近 7~10 天的话题摘要，并请求 `cluster_posts_results` 字段拿到每个话题背后的原帖 ID：
   - `AI model launch release open-source`（max_age_hours=168）
   - `OpenAI Anthropic Google Meta xAI DeepSeek news`（168）
   - `AI agents developers workflow coding tools use case`（240）
   - `AI research paper benchmark`（240）
   - `Claude Duet Gemini 4 Argon OpenAI Orchestra Bio Anthropic Public Benefit Fund`（168）
2. **帖子搜索（search_posts_all）**——补充一线开发者实践与论文帖：
   - `("agent workflow" OR "my workflow" OR "Claude Code" OR Codex) (tips OR lessons OR how) -is:retweet -is:reply lang:en since:2026-10-14`
   - `(arxiv OR "new paper" OR "our paper") (LLM OR AI OR agents OR RL) -is:retweet lang:en since:2026-10-12`
   - `"Gemini 4 Argon" (from:GoogleDeepMind OR from:GeminiApp OR ...)`（找官方发布帖）
3. **批量取帖（get_posts_by_ids）**——对选中话题的前 3 个原帖 ID 批量查询，拿到作者、发布时间、原文、点赞数和 `https://x.com/<handle>/status/<id>` 链接。
4. **人工筛选与撰写**——每个分区选 15 条；优先官方/原作者帖子作为主链接，相关帖与 X 新闻汇总作为补充来源；中文标题与摘要依据原帖原文与汇总内容撰写，不添加原始数据之外的事实。
5. 运行 `scripts/build_data.py` 生成 `data/items.json`（日期统一换算为 UTC+8）。

## 选取原则

- **资讯**：模型发布、公司动态、政策（近 7~10 天）。
- **实践**：工程团队的真实工作流、可复用的技巧、开源工具。
- **研究**：论文、基准、评测方法、AI for Science。
- 去重：同一事件只保留一条，其余帖子放进 `sources`。
