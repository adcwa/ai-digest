(() => {
  const $ = (s) => document.querySelector(s);
  const state = { data: null, section: "all", q: "", tag: null, sort: "date" };
  const SEC_ICON = { news: "📰", practice: "🛠️", research: "🔬" };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const hl = (text) => {
    const t = esc(text);
    if (!state.q) return t;
    const q = esc(state.q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return t.replace(new RegExp(q, "gi"), (m) => `<mark>${m}</mark>`);
  };
  const fmtNum = (n) => (n == null ? "" : n >= 10000 ? (n / 10000).toFixed(1) + " 万" : n.toLocaleString("zh-CN"));

  function renderHeader() {
    const d = state.data;
    $("#meta").textContent = `最后更新：${d.updated}（${d.timezone}） · 覆盖时间：${d.window}`;
    const counts = Object.keys(d.sections).map((k) => [k, d.items.filter((i) => i.section === k).length]);
    $("#stats").innerHTML =
      `<div class="stat"><b>${d.items.length}</b><span>精选条目</span></div>` +
      counts.map(([k, n]) => `<div class="stat"><b>${n}</b><span>${SEC_ICON[k]} ${esc(d.sections[k])}</span></div>`).join("");
    const tabs = [["all", "全部", d.items.length], ...counts.map(([k, n]) => [k, `${SEC_ICON[k]} ${d.sections[k]}`, n])];
    $("#tabs").innerHTML = tabs
      .map(([k, label, n]) => `<button class="tab" role="tab" data-sec="${k}" aria-selected="${k === state.section}">${esc(label)}<span class="n">${n}</span></button>`)
      .join("");
    $("#tabs").onclick = (e) => {
      const b = e.target.closest(".tab");
      if (!b) return;
      state.section = b.dataset.sec;
      state.tag = null;
      syncHash();
      renderHeader();
      renderTags();
      render();
    };
  }

  function renderTags() {
    const pool = state.data.items.filter((i) => state.section === "all" || i.section === state.section);
    const freq = {};
    pool.forEach((i) => i.tags.forEach((t) => (freq[t] = (freq[t] || 0) + 1)));
    const tags = Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([t]) => t);
    $("#tags").innerHTML = tags.map((t) => `<button class="tagbtn ${t === state.tag ? "on" : ""}" data-tag="${esc(t)}">#${esc(t)}</button>`).join("");
    $("#tags").onclick = (e) => {
      const b = e.target.closest(".tagbtn");
      if (!b) return;
      state.tag = state.tag === b.dataset.tag ? null : b.dataset.tag;
      renderTags();
      render();
    };
  }

  function filtered() {
    const q = state.q.toLowerCase();
    let items = state.data.items.filter((i) => {
      if (state.section !== "all" && i.section !== state.section) return false;
      if (state.tag && !i.tags.includes(state.tag)) return false;
      if (!q) return true;
      return [i.title, i.summary, i.author, i.tags.join(" ")].join(" ").toLowerCase().includes(q);
    });
    items = items.slice().sort((a, b) => (state.sort === "likes" ? (b.likes || 0) - (a.likes || 0) : b.date.localeCompare(a.date)));
    return items;
  }

  function card(i) {
    const secName = state.data.sections[i.section];
    const extra = i.sources.slice(1).map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join("");
    return `<article class="card" data-sec="${i.section}">
      <div class="card-top"><span class="badge">${SEC_ICON[i.section]} ${esc(secName)}</span><time datetime="${i.date}">${i.date}</time></div>
      <h3><a href="${esc(i.url)}" target="_blank" rel="noopener">${hl(i.title)}</a></h3>
      <p>${hl(i.summary)}</p>
      <div class="tagrow">${i.tags.map((t) => `<span>#${hl(t)}</span>`).join("")}</div>
      <div class="card-foot">
        <a class="author" href="${esc(i.url)}" target="_blank" rel="noopener">${hl(i.author)} ↗</a>
        ${i.likes != null ? `<span class="likes">♥ ${fmtNum(i.likes)}</span>` : ""}
        ${extra ? `<div class="srcs">${extra}</div>` : ""}
      </div>
    </article>`;
  }

  function render() {
    const items = filtered();
    $("#grid").innerHTML = items.map(card).join("");
    $("#empty").hidden = items.length > 0;
    const parts = [];
    if (state.tag) parts.push(`标签 #${state.tag}`);
    if (state.q) parts.push(`关键词 “${state.q}”`);
    $("#resultInfo").textContent = `共 ${items.length} 条${parts.length ? " · " + parts.join(" · ") : ""}`;
  }

  function syncHash() {
    history.replaceState(null, "", state.section === "all" ? location.pathname : `#${state.section}`);
  }

  function initTheme() {
    $("#themeToggle").onclick = () => {
      const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = t;
      localStorage.setItem("theme", t);
    };
  }

  async function init() {
    initTheme();
    const h = location.hash.slice(1);
    try {
      const res = await fetch("data/items.json", { cache: "no-cache" });
      state.data = await res.json();
    } catch (e) {
      $("#meta").textContent = "数据加载失败：" + e.message;
      return;
    }
    if (state.data.sections[h]) state.section = h;
    renderHeader();
    renderTags();
    render();
    let timer;
    $("#search").addEventListener("input", (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => { state.q = e.target.value.trim(); render(); }, 120);
    });
    $("#sort").addEventListener("change", (e) => { state.sort = e.target.value; render(); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "/" && document.activeElement !== $("#search")) { e.preventDefault(); $("#search").focus(); }
    });
  }
  init();
})();
