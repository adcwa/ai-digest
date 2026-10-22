#!/usr/bin/env python3
"""把人工整理的条目（scripts/items_src.py）与 X 原始帖子缓存（data/sources.json）合并，生成 data/items.json。

用法：
    python3 scripts/build_data.py [--posts /path/to/posts.json] [--stories /path/to/stories.json]

--posts / --stories 指向通过 X API（Grok Bot 的 x 工具）抓取的原始结果；
不传时直接使用仓库内已有的 data/sources.json 缓存。
"""
import json, sys, argparse, datetime as dt
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from items_src import ITEMS  # noqa: E402

TZ = dt.timezone(dt.timedelta(hours=8))  # Asia/Shanghai
SECTIONS = {
    "news": "最新 AI 资讯",
    "practice": "AI 实践",
    "research": "AI 调研 / 研究",
}

def to_local(iso):
    t = dt.datetime.fromisoformat(iso.replace("Z", "+00:00"))
    return t.astimezone(TZ).strftime("%Y-%m-%d")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--posts")
    ap.add_argument("--stories")
    a = ap.parse_args()
    src_path = ROOT / "data" / "sources.json"
    cache = json.loads(src_path.read_text()) if src_path.exists() else {"posts": {}, "stories": {}}
    if a.posts:
        raw = json.loads(Path(a.posts).read_text())
        need = {i for it in ITEMS for i in [it[1], *it[6]]}
        for pid in need:
            p = raw.get(pid)
            if p:
                cache["posts"][pid] = {
                    "id": pid, "username": p.get("username"), "created_at": p["created_at"],
                    "text": p.get("text", ""), "url": p["url"],
                    "likes": p.get("public_metrics", {}).get("like_count"),
                    "reposts": p.get("public_metrics", {}).get("repost_count"),
                }
    if a.stories:
        raw = json.loads(Path(a.stories).read_text())
        for it in ITEMS:
            sid = it[2]
            if sid and sid in raw:
                s = raw[sid]
                cache["stories"][sid] = {"id": sid, "name": s["name"], "summary": s["summary"],
                                         "updated_at": s["updated_at"], "url": s["url"]}
    out = []
    for n, (sec, pid, sid, title, summary, tags, rel) in enumerate(ITEMS):
        p = cache["posts"].get(pid)
        if not p:
            raise SystemExit(f"缺少帖子 {pid}，请先用 --posts 提供原始数据")
        sources = [{"label": f"@{p['username']} 原帖", "url": p["url"]}]
        for r in rel:
            rp = cache["posts"].get(r)
            if rp:
                sources.append({"label": f"@{rp['username']}", "url": rp["url"]})
        if sid and sid in cache["stories"]:
            sources.append({"label": "X 新闻汇总", "url": cache["stories"][sid]["url"]})
        out.append({
            "id": f"{sec}-{n:02d}", "section": sec, "title": title, "summary": summary,
            "author": "@" + p["username"], "date": to_local(p["created_at"]),
            "url": p["url"], "likes": p.get("likes"), "tags": tags, "sources": sources,
        })
    order = {k: i for i, k in enumerate(SECTIONS)}
    out.sort(key=lambda x: (order[x["section"]], x["date"]), reverse=False)
    # within a section, newest first
    res = []
    for k in SECTIONS:
        res += sorted([x for x in out if x["section"] == k], key=lambda x: x["date"], reverse=True)
    data = {
        "title": "AI 前沿速递",
        "updated": dt.datetime.now(TZ).strftime("%Y-%m-%d %H:%M"),
        "timezone": "Asia/Shanghai (UTC+8)",
        "window": "2026-10-12 ~ 2026-10-22",
        "sections": SECTIONS,
        "items": res,
    }
    (ROOT / "data" / "items.json").write_text(json.dumps(data, ensure_ascii=False, indent=2))
    src_path.write_text(json.dumps(cache, ensure_ascii=False, indent=1))
    from collections import Counter
    print("wrote", len(res), "items", dict(Counter(x["section"] for x in res)))

if __name__ == "__main__":
    main()
