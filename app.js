/* Справочник оператора v4.0.0 — единое приложение из двух инструкций */
(() => {
  "use strict";
  const VERSION = "4.2.0";
  const M = window.MANUAL;
  M.books.forEach((b, i) => { b.short = i === 0 ? "Котельное оборудование" : "Автоклавное отделение"; });
  const $ = (s) => document.querySelector(s);

  const ICONS = {
    home: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 11l8-7 8 7v8a2 2 0 01-2 2h-4v-6h-4v6H6a2 2 0 01-2-2v-8z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3L2.5 20h19L12 3z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 10v4M12 17.5v.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    flame: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3c1 3.5-3 5.5-3 9a5 5 0 0010 0c0-2-1-3.5-2-4.5.2 2-1 3-2 3 .5-3-1-6-3-7.5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M19 19H6a2 2 0 00-2 2" stroke="currentColor" stroke-width="2"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    gauge: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 19a9 9 0 1114 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 14l4-5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="15" r="1.6" fill="currentColor"/></svg>',
    wrench: '<svg viewBox="0 0 24 24" fill="none"><path d="M14.7 6.3a4 4 0 105.4 5.4L21 12.6a7 7 0 11-9.9-9.9l.9.9a4 4 0 002.7 2.7z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 15L4 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none"><path d="M7 3h7l5 5v13H7V3z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M14 3v5h5M10 13h6M10 17h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  const state = { view: { type: "home" } };

  /* ---------- Вспомогательное ---------- */
  function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
  function mark(text, q) {
    const e = esc(text);
    if (!q) return e;
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return e.replace(new RegExp(`(${safe})`, "gi"), "<mark>$1</mark>");
  }
  function chapterOf(bi, ci) { return M.books[bi].chapters[ci]; }

  /* ---------- Боковое меню ---------- */
  function renderNav() {
    const v = state.view;
    const isCh = (bi, ci) => v.type === "chapter" && v.book === bi && v.ch === ci;
    const groups = M.books.map((b, bi) => `
      <details class="nav-group" ${v.type === "chapter" && v.book === bi ? "open" : ""}>
        <summary>${bi === 1 ? ICONS.gauge : ICONS.flame}<span>${b.short}</span><span class="count">${b.chapters.length}</span>${ICONS.chev}</summary>
        <div class="nav-group-list">
          ${b.chapters.map((c, ci) => `<button class="chapter-link ${isCh(bi, ci) ? "active" : ""}" data-ch="${bi}:${ci}">${esc(c.title)}</button>`).join("")}
        </div>
      </details>`).join("");

    $("#sidebarNav").innerHTML = `
      <button class="nav-btn ${v.type === "home" ? "active" : ""}" data-view="home">${ICONS.home}<span>Главная панель</span></button>
      <button class="nav-btn ${v.type === "faults" ? "active" : ""}" data-view="faults">${ICONS.alert}<span>Неисправности и аварии</span></button>
      ${groups}`;
  }

  /* ---------- Главная ---------- */
  function renderHome() {
    hlHide();
    const keyChapters = [
      { bi: 1, ci: 0, ic: "gauge", t: "Устройство АСУ и автоклава", s: "SCADA, СБУ, крышки, вакуум" },
      { bi: 1, ci: 4, ic: "doc", t: "Режимы и циклограммы", s: "Параметры обработки кирпича-сырца" },
      { bi: 0, ci: 2, ic: "flame", t: "ГРУ и клапаны ПЗК", s: "Газовая безопасность котлов" },
      { bi: 0, ci: 1, ic: "wrench", t: "Водоподготовка (ХВО)", s: "Фильтры, деаэратор, качество воды" }
    ];
    $("#content").innerHTML = `
      <div class="page">
        <section class="hero">
          <div class="hero-kicker">Оперативное пособие работника</div>
          <h1>Автоклавное отделение и котельная</h1>
        </section>

        <h2 class="section-title">${ICONS.alert} Быстрый доступ</h2>
        <div class="cards">
          <button class="card danger" data-view="faults">
            <div class="card-ic">${ICONS.alert}</div>
            <b>Неисправности и аварии</b>
            <span>${M.faults.length} ситуаций с причинами и действиями — откройте при проблеме</span>
          </button>
          ${keyChapters.map((k) => `
            <button class="card" data-ch="${k.bi}:${k.ci}">
              <div class="card-ic">${ICONS[k.ic]}</div>
              <b>${esc(k.t)}</b>
              <span>${esc(k.s)}</span>
            </button>`).join("")}
        </div>

        <h2 class="section-title">${ICONS.book} Разделы справочника</h2>
        <div class="cards">
          ${M.books.map((b, bi) => `
            <button class="card" data-ch="${bi}:0">
              <div class="card-ic">${bi === 1 ? ICONS.gauge : ICONS.flame}</div>
              <b>${esc(b.short)}</b>
              <span>${esc(b.title)} · ${b.chapters.length} разделов</span>
            </button>`).join("")}
        </div>
      </div>`;
  }

  /* ---------- Неисправности и аварии ---------- */
  function renderFaults(filter = "all") {
    hlHide();
    const subs = [...new Set(M.faults.map((f) => f.subsystemTitle))];
    const list = M.faults.filter((f) => filter === "all" || f.subsystemTitle === filter);
    $("#content").innerHTML = `
      <div class="page">
        <div class="crumb"><button data-view="home">Главная</button><span>/</span><span>Неисправности и аварии</span></div>
        <div class="hero" style="padding:22px 24px;margin-bottom:16px">
          <div class="hero-kicker">База аварийных ситуаций</div>
          <h1 style="font-size:22px">Неисправности и аварии</h1>
          <p>Действия при отказах оборудования. При реальной аварии сначала обеспечьте безопасность, затем сообщите диспетчеру.</p>
        </div>
        <div class="fault-filters">
          <button class="${filter === "all" ? "active" : ""}" data-ff="all">Все (${M.faults.length})</button>
          ${subs.map((s) => `<button class="${filter === s ? "active" : ""}" data-ff="${esc(s)}">${esc(s)}</button>`).join("")}
        </div>
        ${list.map((f, i) => `
          <details class="fault" ${i < 1 ? "open" : ""}>
            <summary><span class="fault-dot"></span><b>${esc(f.title)}</b><span class="sub">${esc(f.subsystemTitle)}</span></summary>
            <div class="fault-body">
              <p><span class="lbl">Причина</span>${esc(f.cause)}</p>
              <p><span class="lbl">Действия</span>${esc(f.solution)}</p>
            </div>
          </details>`).join("")}
      </div>`;
    document.querySelectorAll("[data-ff]").forEach((b) =>
      b.addEventListener("click", () => renderFaults(b.dataset.ff)));
  }

  /* ---------- Плавающая панель навигации по совпадениям ---------- */
  const hlbar = document.createElement("div");
  hlbar.className = "hlbar";
  hlbar.hidden = true;
  hlbar.innerHTML = `
    <span class="hlbar-count">0 из 0</span>
    <button type="button" data-hl="up" aria-label="Предыдущее"><svg viewBox="0 0 24 24" fill="none"><path d="M6 15l6-6 6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    <button type="button" data-hl="down" aria-label="Следующее"><svg viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    <button type="button" data-hl="close" aria-label="Закрыть"><svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>`;
  document.body.appendChild(hlbar);

  let hlMarks = [];
  let hlIndex = -1;

  function hlUpdate() {
    hlbar.querySelector(".hlbar-count").textContent = hlMarks.length ? `${hlIndex + 1} из ${hlMarks.length}` : "0 из 0";
    hlMarks.forEach((m, i) => m.classList.toggle("hl-current", i === hlIndex));
  }
  function hlGo(i) {
    if (!hlMarks.length) return;
    hlIndex = (i + hlMarks.length) % hlMarks.length;
    hlUpdate();
    hlMarks[hlIndex].scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function hlHide() { hlbar.hidden = true; hlMarks = []; hlIndex = -1; }
  function hlShow(q) {
    hlMarks = [...document.querySelectorAll("#content mark")];
    if (!hlMarks.length) { hlHide(); return; }
    hlbar.hidden = false;
    hlIndex = 0;
    hlUpdate();
  }
  hlbar.addEventListener("click", (e) => {
    const b = e.target.closest("[data-hl]");
    if (!b) return;
    if (b.dataset.hl === "up") hlGo(hlIndex - 1);
    else if (b.dataset.hl === "down") hlGo(hlIndex + 1);
    else hlHide();
  });

  /* ---------- Глава ---------- */
  function renderChapter(bi, ci, focus, q) {
    const book = M.books[bi];
    const ch = book.chapters[ci];
    const prev = ci > 0 ? book.chapters[ci - 1] : null;
    const next = ci < book.chapters.length - 1 ? book.chapters[ci + 1] : null;
    const blocksHtml = ch.items.map((it, idx) => {
      const id = `blk-${idx}`;
      if (it.k === "img")
        return `<figure class="art-fig" id="${id}"><img loading="lazy" src="${it.src}" alt="Схема / фото из инструкции"><figcaption>Схема / фото из инструкции · ${esc(ch.title)}</figcaption></figure>`;
      if (it.k === "h")
        return `<h2 class="art-h" id="${id}">${mark(it.t, q)}</h2>`;
      if (it.k === "li")
        return `<div class="art-li" id="${id}"><span class="li-dot"></span><span>${mark(it.t, q)}</span></div>`;
      if (it.k === "warn")
        return `<div class="art-warn" id="${id}">${ICONS.alert}<div>${mark(it.t, q)}</div></div>`;
      if (it.k === "toc")
        return `<button class="art-toc ${it.to ? "" : "no-link"}" id="${id}" ${it.to ? `data-toc-book="${bi}" data-toc-to="${it.to}" ${it.blk != null ? `data-toc-blk="${it.blk}"` : ""}` : "disabled"}>${ICONS.doc}<span>${mark(it.t, q)}</span>${it.to ? ICONS.right : ""}</button>`;
      return `<div class="art-block" id="${id}">${mark(it.t, q)}</div>`;
    }).join("");
    $("#content").innerHTML = `
      <div class="page">
        <div class="crumb">
          <button data-view="home">Главная</button><span>/</span>
          <button data-ch="${bi}:0">${esc(book.short)}</button><span>/</span>
          <span>${esc(ch.title)}</span>
        </div>
        <article class="article">
          <h1>${mark(ch.title, q)}</h1>
          ${blocksHtml}
        </article>
        <div class="chapter-nav">
          <button data-ch="${bi}:${ci - 1}" ${prev ? "" : "disabled"}>${ICONS.left}<span>${prev ? esc(prev.title).slice(0, 40) : ""}</span></button>
          <button data-ch="${bi}:${ci + 1}" ${next ? "" : "disabled"} style="margin-left:auto"><span>${next ? esc(next.title).slice(0, 40) : ""}</span>${ICONS.right}</button>
        </div>
      </div>`;
    if (focus != null) {
      setTimeout(() => {
        const el = document.getElementById("blk-" + focus);
        if (el) { el.classList.add("hl-jump"); el.scrollIntoView({ behavior: "smooth", block: "center" }); }
      }, 120);
    } else {
      $("#content").scrollTop = 0;
    }
    if (q) hlShow(q); else hlHide();
  }

  /* ---------- Поиск ---------- */
  const searchInput = $("#searchInput");
  const searchBox = $("#searchResults");
  const clearBtn = $("#clearSearch");

  function doSearch(q) {
    const query = q.trim();
    clearBtn.hidden = !query;
    if (query.length < 2) { searchBox.hidden = true; searchBox.innerHTML = ""; return; }
    const lq = query.toLowerCase();
    const out = [];
    M.books.forEach((b, bi) => b.chapters.forEach((c, ci) => {
      if (c.title.toLowerCase().includes(lq)) {
        out.push({ bi, ci, n: null, kind: "chapter", title: c.title, snippet: "Открыть раздел целиком" });
      }
      c.items.forEach((it, idx) => {
        if (it.k === "img") {
          if (c.title.toLowerCase().includes(lq)) {
            out.push({ bi, ci, n: idx, kind: "img", title: c.title, snippet: "Схема / фото из инструкции" });
          }
          return;
        }
        const hay = (it.t || "").toLowerCase();
        if (hay.includes(lq)) {
          const i = hay.indexOf(lq);
          const snip = it.t.slice(Math.max(0, i - 60), i + 120);
          out.push({ bi, ci, n: idx, kind: "text", title: c.title, snippet: "…" + snip.trim() + "…" });
        }
      });
    }));
    M.faults.forEach((f, fi) => {
      if ((f.title + " " + f.cause + " " + f.solution).toLowerCase().includes(lq)) {
        out.push({ fault: fi, kind: "fault", title: f.title, snippet: f.cause.slice(0, 140) });
      }
    });
    const total = out.length;
    const shown = out.slice(0, 50);
    searchBox.innerHTML = `
      <div class="sr-head">Найдено: ${total}${total > 50 ? " · показаны первые 50" : ""}</div>
      ${shown.map((r, idx) => `
        <button class="sr-item" data-sr="${idx}">
          <span class="sr-badge ${r.kind === "fault" ? "fault" : r.bi === 1 ? "autoclave" : "boiler"}">${r.kind === "fault" ? "Авария" : r.kind === "img" ? "Схема" : r.kind === "chapter" ? "Раздел" : r.bi === 1 ? "Автоклавы" : "Котельная"}</span>
          <span class="sr-title">${mark(r.title, query)}</span>
          <span class="sr-snippet">${mark(r.snippet, query)}</span>
        </button>`).join("") || '<div class="sr-head">Ничего не найдено — попробуйте другие слова</div>'}`;
    searchBox.hidden = false;
    searchBox.querySelectorAll("[data-sr]").forEach((el) => el.addEventListener("click", () => {
      const r = shown[Number(el.dataset.sr)];
      searchBox.hidden = true;
      if (r.kind === "fault") navigate({ type: "faults" });
      else navigate({ type: "chapter", book: r.bi, ch: r.ci, focus: r.n, q: query });
    }));
  }

  searchInput.addEventListener("input", (e) => doSearch(e.target.value));
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const first = searchBox.querySelector("[data-sr]");
      if (first) first.click();
    }
  });
  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    doSearch("");
    searchInput.focus();
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search") && !e.target.closest("#searchResults")) searchBox.hidden = true;
  });

  /* ---------- Навигация ---------- */
  function navigate(view) {
    state.view = view;
    renderNav();
    if (view.type === "home") renderHome();
    else if (view.type === "faults") renderFaults();
    else if (view.type === "chapter") renderChapter(view.book, view.ch, view.focus, view.q);
    closeSidebar();
  }

  document.addEventListener("click", (e) => {
    const v = e.target.closest("[data-view]");
    if (v) { navigate({ type: v.dataset.view }); return; }
    const c = e.target.closest("[data-ch]");
    if (c) {
      const [bi, ci] = c.dataset.ch.split(":").map(Number);
      navigate({ type: "chapter", book: bi, ch: ci });
      return;
    }
    const t = e.target.closest("[data-toc-to]");
    if (t) {
      const bi = Number(t.dataset.tocBook);
      const to = t.dataset.tocTo;
      const ci = M.books[bi].chapters.findIndex((ch) => ch.id === to);
      if (ci >= 0) {
        navigate({ type: "chapter", book: bi, ch: ci, focus: t.dataset.tocBlk != null ? Number(t.dataset.tocBlk) : null });
      }
    }
  });

  /* ---------- Мобильное меню ---------- */
  const sidebar = $("#sidebar");
  const backdrop = $("#sidebarBackdrop");
  function closeSidebar() { sidebar.classList.remove("open"); backdrop.classList.remove("show"); }
  $("#menuToggle").addEventListener("click", () => {
    sidebar.classList.toggle("open");
    backdrop.classList.toggle("show", sidebar.classList.contains("open"));
  });
  backdrop.addEventListener("click", closeSidebar);

  /* ---------- Сеть ---------- */
  function net() {
    const on = navigator.onLine;
    $(".net-dot").classList.toggle("off", !on);
    $("#networkStatusText").textContent = on ? "Сеть доступна" : "Оффлайн-режим";
  }
  window.addEventListener("online", net);
  window.addEventListener("offline", net);

  /* ---------- Service Worker: принудительное обновление ---------- */
  if ("serviceWorker" in navigator) {
    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloading) return;
      reloading = true;
      location.reload();
    });
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").then((reg) => {
        if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
        reg.addEventListener("updatefound", () => {
          const sw = reg.installing;
          if (!sw) return;
          sw.addEventListener("statechange", () => {
            if (sw.state === "installed" && navigator.serviceWorker.controller) {
              sw.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
        setInterval(() => reg.update(), 60 * 1000);
      }).catch(() => {});
    });
  }

  /* ---------- Старт ---------- */
  $("#sidebarVersion").textContent = "v" + VERSION;
  renderNav();
  renderHome();
  net();
})();
