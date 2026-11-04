(function () {
  const FULL_DOCUMENTS = window.FULL_MANUAL_DOCUMENTS || [];
  const APP_VERSION = window.FULL_MANUAL_VERSION || '2.0.3';
  const FULL_HEADINGS = FULL_DOCUMENTS.flatMap((d,di)=>d.blocks.map((b,bi)=>({doc:di,block:bi,text:b.text||'',type:b.type})).filter(x=>x.type==='text'&&x.text.trim().length>0&&x.text.trim().length<180));
  const ALL_SECTIONS = [
    ...(window.AUTOCLAVE_SECTIONS || []),
    ...(window.BOILER_SECTIONS || []),
    ...FULL_DOCUMENTS.flatMap((d,di) => [{id:`full-doc-${di+1}`,title:`${di===0?'Котельная — полный справочник': 'Автоклавы — полный справочник'}`,summary:`Цельная база работника: ${d.blocks.filter(b=>b.type==='text').length} текстовых фрагментов и ${d.blocks.filter(b=>b.type==='image').length} изображений`,keywords:'полная инструкция исходный документ схема рисунок параметр процедура',category:di===0?'boiler':'autoclave',content:d.blocks.map(b=>b.type==='text'?`<p>${b.text}</p>`:`<img src="${b.src}">`).join(''),fullDocument:d}])
  ];
  const FAULTS = window.FAULTS_DATABASE || [];

  // Состояние приложения
  let currentView = { type: "home", id: "home", faultFilter: "all" };
  let activeHighlights = [];
  let currentHighlightIdx = 0;

  // DOM-элементы
  const sidebar = document.getElementById("sidebar");
  const sidebarBackdrop = document.getElementById("sidebarBackdrop");
  const sidebarNav = document.getElementById("sidebarNav");
  const mainView = document.getElementById("mainView");
  const contentScroll = document.getElementById("contentScroll");

  const searchInput = document.getElementById("searchInput");
  const searchClearBtn = document.getElementById("searchClearBtn");
  const searchDropdown = document.getElementById("searchDropdown");
  const searchResultsList = document.getElementById("searchResultsList");
  const searchCountText = document.getElementById("searchCountText");
  const closeSearchDropdownBtn = document.getElementById("closeSearchDropdownBtn");

  const highlightBar = document.getElementById("highlightBar");
  const highlightTermLabel = document.getElementById("highlightTermLabel");
  const highlightCurrentIdxEl = document.getElementById("highlightCurrentIdx");
  const highlightTotalCountEl = document.getElementById("highlightTotalCount");
  const prevHighlightBtn = document.getElementById("prevHighlightBtn");
  const nextHighlightBtn = document.getElementById("nextHighlightBtn");
  const clearHighlightsBtn = document.getElementById("clearHighlightsBtn");

  const normsModal = document.getElementById("normsModal");
  const normsModalBtn = document.getElementById("normsModalBtn");
  const closeNormsModalBtn = document.getElementById("closeNormsModalBtn");

  // 1. Построение бокового меню (разделы из обоих документов + Справочник неисправностей)
  function renderSidebar() {
    const acSections = window.AUTOCLAVE_SECTIONS || [];
    const blSections = window.BOILER_SECTIONS || [];

    sidebarNav.innerHTML = `
      <div class="nav-group">
        <button class="nav-item ${currentView.type === "home" ? "active" : ""}" data-nav-type="home">
          <span class="nav-item-icon">🏠</span>
          <span class="nav-item-title">Главная панель</span>
        </button>
        <button class="nav-item nav-emergency ${currentView.type === "faults" ? "active" : ""}" data-nav-type="faults" data-fault-filter="all">
          <span class="nav-item-icon">🚨</span>
          <span class="nav-item-title">Неисправности и аварии</span>
        </button>
      </div>

      <div class="nav-group">
        <div class="nav-group-header">
          <span>Автоклавное отделение</span>
          <span class="nav-group-badge">${acSections.length} тем · полный текст и схемы</span>
        </div>
        <button class="nav-item ${currentView.type === "section" && currentView.id === "full-doc-2" ? "active" : ""}" data-nav-type="section" data-section-id="full-doc-2"><span class="nav-item-icon">📚</span><span class="nav-item-title">Все разделы автоклавов и схемы</span></button>
        ${acSections
          .map(
            (s) => `
          <button class="nav-item ${currentView.type === "section" && currentView.id === s.id ? "active" : ""}" data-nav-type="section" data-section-id="${s.id}">
            <span class="nav-item-icon">${s.icon}</span>
            <span class="nav-item-title">${s.title}</span>
          </button>
        `
          )
          .join("")}
      </div>

      <div class="nav-group">
        <div class="nav-group-header">
          <span>Котельное оборудование</span>
          <span class="nav-group-badge">${blSections.length} тем · полный текст и схемы</span>
        </div>
        <button class="nav-item ${currentView.type === "section" && currentView.id === "full-doc-1" ? "active" : ""}" data-nav-type="section" data-section-id="full-doc-1"><span class="nav-item-icon">📚</span><span class="nav-item-title">Все разделы котельной и схемы</span></button>
        ${blSections
          .map(
            (s) => `
          <button class="nav-item ${currentView.type === "section" && currentView.id === s.id ? "active" : ""}" data-nav-type="section" data-section-id="${s.id}">
            <span class="nav-item-icon">${s.icon}</span>
            <span class="nav-item-title">${s.title}</span>
          </button>
        `
          )
          .join("")}
      </div>
    `;
  }

  // Управление мобильным меню
  function openMobileSidebar() {
    sidebar.classList.add("open");
    sidebarBackdrop.classList.add("open");
  }

  function closeMobileSidebar() {
    sidebar.classList.remove("open");
    sidebarBackdrop.classList.remove("open");
  }

  // 2. Рендер Главной панели (информативная, с прямым переходом к разделам и авариям)
  function renderHomeView() {
    clearHighlightsUI();
    const acSections = window.AUTOCLAVE_SECTIONS || [];
    const blSections = window.BOILER_SECTIONS || [];

    mainView.innerHTML = `
      <section class="hero-banner">
        <span class="hero-tag">Оперативное пособие работника • Оффлайн база</span>
        <h1 class="hero-title">Автоклавное отделение и Котельная</h1>
        <p class="hero-desc">
          Быстрый рабочий справочник оператора и диспетчера: пошаговые алгоритмы управления автоклавами, 
          настройки циклограмм, действия при зависании SCADA и нештатных ситуациях, обслуживание ХВО, деаэратора, ГРУ и котлов LOOS.
        </p>
        <div class="hero-stats">
          <div class="stat-card">
            <span class="stat-label">Режим автоклавов (8 шт.)</span>
            <span class="stat-value">1,2 МПа • до 203 °C</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Ручной доступ HMI (Класс B)</span>
            <span class="stat-value amber">Пароль: 456 (Q1 влево)</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Деаэратор и ХВО</span>
            <span class="stat-value emerald">80% (105 °C) • Ввод 6 бар</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Сброс аварий контроллеров</span>
            <span class="stat-value">STOP / reset — 5 сек</span>
          </div>
        </div>
      </section>

      <h2 class="dashboard-section-title">🚨 Экстренные ситуации (прямой переход к инструкции)</h2>
      <div class="emergency-grid">
        <button class="emergency-card" data-quick-action="section" data-target-id="ac-scada-fail">
          <div class="emergency-card-top">
            <span class="emergency-icon">🖥️</span>
            <span class="emergency-badge">ЧП Автоклавы</span>
          </div>
          <h4>Зависла программа SCADA</h4>
          <p>Отключение QF-3, QF-4, таблица ручного ввода циклограммы (1215 кПа) и перезапуск</p>
        </button>

        <button class="emergency-card" data-quick-action="section" data-target-id="ac-anti-dip">
          <div class="emergency-card-top">
            <span class="emergency-icon">📉</span>
            <span class="emergency-badge">Циклограмма</span>
          </div>
          <h4>Предотвращение «провалов»</h4>
          <p>Подъём до 12,5 атм на горизонте и отключение автоматов QF-3, QF-4 при пуске</p>
        </button>

        <button class="emergency-card" data-quick-action="section" data-target-id="bl-gru">
          <div class="emergency-card-top">
            <span class="emergency-icon">🔥</span>
            <span class="emergency-badge">ЧП Котельная</span>
          </div>
          <h4>Сработал ГАЗ / Взведение ГРУ</h4>
          <p>Сброс пульта ПК-3 и пошаговое взведение клапанов К1, ПЗК-1, ПЗК-2 и К2</p>
        </button>

        <button class="emergency-card" data-quick-action="faults" data-fault-filter="all">
          <div class="emergency-card-top">
            <span class="emergency-icon">🛠️</span>
            <span class="emergency-badge">Таблицы ошибок</span>
          </div>
          <h4>Все неисправности и КВ</h4>
          <p>Залипание концевиков крышек, вакуум-насоса, клапанов, метод пропуска ошибки</p>
        </button>
      </div>

      <h2 class="dashboard-section-title">⚡ Быстрый доступ к частым операциям</h2>
      <div class="quick-grid">
        <button class="quick-card" data-quick-action="section" data-target-id="ac-control">
          <span class="quick-card-cat">Автоклавы • Раздел 3</span>
          <h4>Закрытие / открытие крышек и Перепуск</h4>
          <p>Порядок работы гидроцилиндров, штырь СБУ и правила перепуска пара</p>
        </button>

        <button class="quick-card" data-quick-action="section" data-target-id="ac-hmi">
          <span class="quick-card-cat">Автоклавы • Раздел 4</span>
          <h4>Ручное управление клапанами с HMI</h4>
          <p>Вход под Старшим оператором (456), поворот реле Q1 и схема 8 клапанов</p>
        </button>

        <button class="quick-card" data-quick-action="section" data-target-id="ac-valves-brick">
          <span class="quick-card-cat">Автоклавы • Раздел 12</span>
          <h4>Рядовой vs Лицевой кирпич</h4>
          <p>Разница положения вентиля №1, работа привода №8 и смотровое стекло №3</p>
        </button>

        <button class="quick-card" data-quick-action="section" data-target-id="ac-cleaning">
          <span class="quick-card-cat">Автоклавы • Раздел 9</span>
          <h4>Чистка автоклава и замена прокладки</h4>
          <p>Остывание 100 °C / 80 °C, чистка фильтров шилом 3 мм, осмотр резины</p>
        </button>

        <button class="quick-card" data-quick-action="section" data-target-id="bl-water">
          <span class="quick-card-cat boiler">Котельная • Раздел 1</span>
          <h4>Скважина №2 и переход на ТЭЦ</h4>
          <p>Сброс ошибки частотника (Q2 → Q1 → rdY) и переключение кранов АБК</p>
        </button>

        <button class="quick-card" data-quick-action="section" data-target-id="bl-deaerator">
          <span class="quick-card-cat boiler">Котельная • Раздел 3</span>
          <h4>Деаэратор, Бак ХВО и Химия 160/710</h4>
          <p>Работа клапанов V1 (79%) и V2 (76%), пропорция реагентов 1:9 по канистре</p>
        </button>

        <button class="quick-card" data-quick-action="section" data-target-id="bl-boilers">
          <span class="quick-card-cat boiler">Котельная • Раздел 5</span>
          <h4>Котлы LOOS и продувка стёкол</h4>
          <p>Ежедневная продувка водоуказательных стёкол и запуск котла с холодного состояния</p>
        </button>

        <button class="quick-card" data-quick-action="section" data-target-id="bl-steam-heat-gvs">
          <span class="quick-card-cat boiler">Котельная • Раздел 6</span>
          <h4>Отопление (ТРМ212) и ГВС (UBA)</h4>
          <p>Настройка температуры (3 раза ПРОГ.), перезагрузка автомата и сброс котла ГВС</p>
        </button>
      </div>

      <h2 class="dashboard-section-title">📚 Полное оглавление обоих документов</h2>
      <div class="docs-columns">
        <div class="doc-panel">
          <div class="doc-panel-header">
            <span>📘</span>
            <h3>Инструкция оператора автоклавного отделения</h3>
          </div>
          ${acSections
            .map(
              (s) => `
            <button class="doc-section-link" data-quick-action="section" data-target-id="${s.id}">
              <span>${s.icon} ${s.title}</span>
              <span>→</span>
            </button>
          `
            )
            .join("")}
        </div>

        <div class="doc-panel">
          <div class="doc-panel-header">
            <span>📙</span>
            <h3>Инструкция по работе котельного оборудования</h3>
          </div>
          ${blSections
            .map(
              (s) => `
            <button class="doc-section-link" data-quick-action="section" data-target-id="${s.id}">
              <span>${s.icon} ${s.title}</span>
              <span>→</span>
            </button>
          `
            )
            .join("")}
        </div>
      </div>
    `;

    contentScroll.scrollTop = 0;
  }

  // 3. Рендер выбранного раздела пособия
  function renderSectionView(sectionId, highlightKeyword) {
    const idx = ALL_SECTIONS.findIndex((s) => s.id === sectionId);
    if (idx === -1) {
      renderHomeView();
      return;
    }

    const section = ALL_SECTIONS[idx];
    if (section.fullDocument) {
      const body = section.fullDocument.blocks.map((b,i)=>b.type==='image'?`<figure class="full-source-figure"><img loading="lazy" src="${b.src}" alt="Иллюстрация из исходной инструкции"><figcaption>Иллюстрация ${i+1}</figcaption></figure>`:`<div class="full-source-block" id="full-block-${i}">${b.text}</div>`).join('');
      mainView.innerHTML = `<article class="article-card" id="articleContainer"><div class="article-TopBar"><span class="article-category-badge ${section.category}">Полный исходный документ</span><button class="text-btn" id="backToHomeFromArticle" type="button">← К главной панели</button></div><h1 class="article-title">${section.title}</h1><p class="article-summary">${section.summary}</p><div class="article-body" id="articleBodyContent">${body}</div></article>`;
      document.getElementById('backToHomeFromArticle').addEventListener('click',()=>navigateTo({type:'home',id:'home'}));
      if(highlightKeyword&&highlightKeyword.trim().length>=2)applyKeywordHighlighting(highlightKeyword.trim());else{clearHighlightsUI();contentScroll.scrollTop=0} return;
    }
    const prevSection = idx > 0 ? ALL_SECTIONS[idx - 1] : null;
    const nextSection = idx < ALL_SECTIONS.length - 1 ? ALL_SECTIONS[idx + 1] : null;

    mainView.innerHTML = `
      <article class="article-card" id="articleContainer">
        <div class="article-TopBar">
          <span class="article-category-badge ${section.category}">
            ${section.icon} ${section.categoryTitle}
          </span>
          <button class="text-btn" id="backToHomeFromArticle" type="button">← К главной панели</button>
        </div>

        <h1 class="article-title">${section.title}</h1>
        <p class="article-summary">${section.summary}</p>

        <div class="article-body" id="articleBodyContent">
          ${section.content}
        </div>

        <div class="article-footer-nav">
          ${
            prevSection
              ? `
            <button class="nav-step-btn prev" data-quick-action="section" data-target-id="${prevSection.id}">
              <span>← Предыдущий раздел</span>
              <strong>${prevSection.title}</strong>
            </button>
          `
              : `<div></div>`
          }
          ${
            nextSection
              ? `
            <button class="nav-step-btn next" data-quick-action="section" data-target-id="${nextSection.id}">
              <span>Следующий раздел →</span>
              <strong>${nextSection.title}</strong>
            </button>
          `
              : `<div></div>`
          }
        </div>
      </article>
    `;

    document.getElementById("backToHomeFromArticle").addEventListener("click", () => {
      navigateTo({ type: "home", id: "home" });
    });

    if (highlightKeyword && highlightKeyword.trim().length >= 2) {
      applyKeywordHighlighting(highlightKeyword.trim());
    } else {
      clearHighlightsUI();
      contentScroll.scrollTop = 0;
    }
  }

  // 4. Рендер интерактивного справочника неисправностей
  function renderFaultsView(filter = "all", highlightKeyword = "") {
    const filtered =
      filter === "all" ? FAULTS : FAULTS.filter((f) => f.subsystem === filter);

    mainView.innerHTML = `
      <article class="article-card">
        <div class="article-TopBar">
          <span class="article-category-badge" style="background: rgba(239,68,68,0.18); color: #fca5a5;">
            🚨 Оперативный справочник неисправностей
          </span>
          <button class="text-btn" id="backToHomeFromFaults" type="button">← К главной панели</button>
        </div>

        <h1 class="article-title">Возможные неисправности и методы их устранения</h1>
        <p class="article-summary">
          Выберите узел для фильтрации ошибок. Для сброса аварий на контроллерах Segnetics SMH 2Gi 
          нажмите и удерживайте <strong>5 секунд кнопку «STOP»</strong>.
        </p>

        <div class="faults-tabs">
          <button class="fault-tab-btn ${filter === "all" ? "active" : ""}" data-fault-tab="all">
            Все узлы (${FAULTS.length})
          </button>
          <button class="fault-tab-btn ${filter === "lids" ? "active" : ""}" data-fault-tab="lids">
            Крышки автоклава
          </button>
          <button class="fault-tab-btn ${filter === "vacuum" ? "active" : ""}" data-fault-tab="vacuum">
            Вакуумный насос
          </button>
          <button class="fault-tab-btn ${filter === "process" ? "active" : ""}" data-fault-tab="process">
            Автоклавная обработка
          </button>
          <button class="fault-tab-btn ${filter === "boiler" ? "active" : ""}" data-fault-tab="boiler">
            Котельная и ГРУ
          </button>
        </div>

        <div id="articleBodyContent">
          ${filtered
            .map(
              (item) => `
            <div class="fault-card-item">
              <div class="fault-card-header">
                <span class="fault-card-title">${item.title}</span>
                <span class="fault-subsystem-tag">${item.subsystemTitle}</span>
              </div>
              <div class="fault-cause"><strong>Причина:</strong> ${item.cause}</div>
              <div class="fault-solution"><strong>Метод устранения:</strong> ${item.solution}</div>
            </div>
          `
            )
            .join("")}
        </div>
      </article>
    `;

    document.getElementById("backToHomeFromFaults").addEventListener("click", () => {
      navigateTo({ type: "home", id: "home" });
    });

    if (highlightKeyword && highlightKeyword.trim().length >= 2) {
      applyKeywordHighlighting(highlightKeyword.trim());
    } else {
      clearHighlightsUI();
      contentScroll.scrollTop = 0;
    }
  }

  // Навигация между экранами
  function navigateTo(viewState, highlightKeyword = "") {
    currentView = viewState;
    renderSidebar();
    closeMobileSidebar();

    if (viewState.type === "home") {
      renderHomeView();
    } else if (viewState.type === "section") {
      renderSectionView(viewState.id, highlightKeyword);
    } else if (viewState.type === "faults") {
      renderFaultsView(viewState.faultFilter || "all", highlightKeyword);
    }
  }

  // 5. Подсветка ключевых слов внутри открытого раздела и скролл к слову
  function clearHighlightsUI() {
    activeHighlights = [];
    currentHighlightIdx = 0;
    highlightBar.classList.add("hidden");

    const bodyEl = document.getElementById("articleBodyContent");
    if (!bodyEl) return;
    const marks = bodyEl.querySelectorAll("mark.search-hl");
    marks.forEach((m) => {
      const parent = m.parentNode;
      parent.replaceChild(document.createTextNode(m.textContent), m);
      parent.normalize();
    });
  }

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function applyKeywordHighlighting(keyword) {
    clearHighlightsUI();
    const bodyEl = document.getElementById("articleBodyContent");
    if (!bodyEl || !keyword) return;

    const regex = new RegExp(`(${escapeRegExp(keyword)})`, "gi");
    const walker = document.createTreeWalker(bodyEl, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];

    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (
        node.parentNode &&
        node.parentNode.nodeName !== "SCRIPT" &&
        node.parentNode.nodeName !== "STYLE" &&
        node.parentNode.nodeName !== "MARK" &&
        regex.test(node.nodeValue)
      ) {
        textNodes.push(node);
      }
      regex.lastIndex = 0;
    }

    textNodes.forEach((node) => {
      const frag = document.createDocumentFragment();
      let lastIdx = 0;
      const text = node.nodeValue;
      regex.lastIndex = 0;
      let match;

      while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIdx) {
          frag.appendChild(document.createTextNode(text.slice(lastIdx, match.index)));
        }
        const mark = document.createElement("mark");
        mark.className = "search-hl";
        mark.textContent = match[0];
        frag.appendChild(mark);
        activeHighlights.push(mark);
        lastIdx = regex.lastIndex;
      }

      if (lastIdx < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIdx)));
      }
      node.parentNode.replaceChild(frag, node);
    });

    if (activeHighlights.length > 0) {
      highlightTermLabel.textContent = keyword;
      highlightTotalCountEl.textContent = activeHighlights.length;
      highlightBar.classList.remove("hidden");
      focusHighlightAtIndex(0);
    } else {
      contentScroll.scrollTop = 0;
    }
  }

  function focusHighlightAtIndex(index) {
    if (activeHighlights.length === 0) return;
    activeHighlights.forEach((el) => el.classList.remove("active-hl"));

    currentHighlightIdx = (index + activeHighlights.length) % activeHighlights.length;
    const targetEl = activeHighlights[currentHighlightIdx];
    targetEl.classList.add("active-hl");
    highlightCurrentIdxEl.textContent = currentHighlightIdx + 1;

    setTimeout(() => {
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
  }

  // 6. Умный поиск по всем разделам и базе неисправностей
  function stripHtml(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }

  function buildSnippet(plainText, query) {
    const lowerText = plainText.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const matchIndex = lowerText.indexOf(lowerQuery);

    if (matchIndex === -1) {
      return plainText.slice(0, 130) + "...";
    }

    const start = Math.max(0, matchIndex - 45);
    const end = Math.min(plainText.length, matchIndex + query.length + 75);
    let snippet = plainText.slice(start, end).trim();

    if (start > 0) snippet = "..." + snippet;
    if (end < plainText.length) snippet = snippet + "...";

    const regex = new RegExp(`(${escapeRegExp(query)})`, "gi");
    return snippet.replace(regex, "<mark>$1</mark>");
  }

  function performSearch(rawQuery) {
    const query = rawQuery.trim();
    if (query.length < 2) {
      searchDropdown.classList.add("hidden");
      return;
    }

    const lowerQuery = query.toLowerCase();
    const results = [];

    // Поиск по разделам обоих документов
    ALL_SECTIONS.forEach((sec) => {
      const plainBody = stripHtml(sec.content).replace(/\s+/g, " ");
      const searchable = `${sec.title} ${sec.summary} ${sec.keywords} ${plainBody}`.toLowerCase();

      if (searchable.includes(lowerQuery)) {
        const countMatches = (
          searchable.match(new RegExp(escapeRegExp(lowerQuery), "g")) || []
        ).length;

        results.push({
          type: "section",
          id: sec.id,
          badgeClass: sec.category,
          badgeText: sec.category === "autoclave" ? "Автоклавы" : "Котельная",
          title: sec.title,
          snippet: buildSnippet(`${sec.summary}. ${plainBody}`, query),
          matches: countMatches
        });
      }
    });

    // Поиск по базе неисправностей
    FAULTS.forEach((f) => {
      const fullText = `${f.title} ${f.cause} ${f.solution}`;
      if (fullText.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: "faults",
          faultFilter: f.subsystem,
          badgeClass: "fault",
          badgeText: `Авария • ${f.subsystemTitle}`,
          title: f.title,
          snippet: buildSnippet(`${f.cause} — ${f.solution}`, query),
          matches: 2
        });
      }
    });

    results.sort((a, b) => b.matches - a.matches);

    searchCountText.textContent = `Найдено совпадений: ${results.length}`;
    if (results.length === 0) {
      searchResultsList.innerHTML = `
        <div style="padding: 18px; text-align: center; color: var(--text-muted); font-size: 13.5px;">
          По запросу «<strong>${query}</strong>» ничего не найдено. Попробуйте ввести другое ключевое слово (например: <em>СБУ, перепуск, 456, ПЗК, ХВО, 1215</em>).
        </div>
      `;
    } else {
      searchResultsList.innerHTML = results
        .map(
          (r, idx) => `
        <div class="search-result-item" data-res-idx="${idx}">
          <div class="search-result-meta">
            <span class="search-badge ${r.badgeClass}">${r.badgeText}</span>
          </div>
          <div class="search-result-title">${r.title}</div>
          <div class="search-result-snippet">${r.snippet}</div>
        </div>
      `
        )
        .join("");

      // Обработчик клика по результату — переходит к разделу и скроллит к слову
      const items = searchResultsList.querySelectorAll(".search-result-item");
      items.forEach((el) => {
        el.addEventListener("click", () => {
          const itemData = results[Number(el.getAttribute("data-res-idx"))];
          searchDropdown.classList.add("hidden");

          if (itemData.type === "section") {
            navigateTo({ type: "section", id: itemData.id }, query);
          } else {
            navigateTo(
              { type: "faults", id: "faults", faultFilter: itemData.faultFilter },
              query
            );
          }
        });
      });
    }

    searchDropdown.classList.remove("hidden");
  }

  // 7. Слушатели событий
  function initEventListeners() {
    // Делегирование кликов по боковому меню
    sidebarNav.addEventListener("click", (e) => {
      const btn = e.target.closest(".nav-item");
      if (!btn) return;
      const navType = btn.getAttribute("data-nav-type");

      if (navType === "home") {
        navigateTo({ type: "home", id: "home" });
      } else if (navType === "faults") {
        navigateTo({ type: "faults", id: "faults", faultFilter: "all" });
      } else if (navType === "section") {
        const secId = btn.getAttribute("data-section-id");
        navigateTo({ type: "section", id: secId });
      }
    });

    // Делегирование кликов в основной области (Быстрый доступ, оглавление, табы аварий)
    mainView.addEventListener("click", (e) => {
      const quickBtn = e.target.closest("[data-quick-action]");
      if (quickBtn) {
        const action = quickBtn.getAttribute("data-quick-action");
        if (action === "section") {
          const targetId = quickBtn.getAttribute("data-target-id");
          navigateTo({ type: "section", id: targetId });
        } else if (action === "faults") {
          const filter = quickBtn.getAttribute("data-fault-filter") || "all";
          navigateTo({ type: "faults", id: "faults", faultFilter: filter });
        }
        return;
      }

      const faultTab = e.target.closest("[data-fault-tab]");
      if (faultTab) {
        const filter = faultTab.getAttribute("data-fault-tab");
        currentView.faultFilter = filter;
        renderFaultsView(filter);
      }
    });

    // Кнопки Домой и Мобильное меню
    document.getElementById("brandHomeBtn").addEventListener("click", () => {
      navigateTo({ type: "home", id: "home" });
    });
    document.getElementById("topHomeBtn").addEventListener("click", () => {
      navigateTo({ type: "home", id: "home" });
    });
    document.getElementById("openSidebarBtn").addEventListener("click", openMobileSidebar);
    document.getElementById("closeSidebarBtn").addEventListener("click", closeMobileSidebar);
    sidebarBackdrop.addEventListener("click", closeMobileSidebar);

    // Поле поиска: ввод текста
    searchInput.addEventListener("input", (e) => {
      const val = e.target.value;
      if (val.length > 0) {
        searchClearBtn.classList.remove("hidden");
      } else {
        searchClearBtn.classList.add("hidden");
        searchDropdown.classList.add("hidden");
      }
      performSearch(val);
    });

    searchInput.addEventListener("focus", () => {
      if (searchInput.value.trim().length >= 2) {
        performSearch(searchInput.value);
      }
    });

    // ВАЖНО: Кнопка «×» в строке поиска очищает ТОЛЬКО строку поиска и закрывает выпадашку,
    // НЕ выкидывая пользователя с текущей открытой страницы на главную!
    searchClearBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      searchInput.value = "";
      searchClearBtn.classList.add("hidden");
      searchDropdown.classList.add("hidden");
      searchInput.focus();
    });

    closeSearchDropdownBtn.addEventListener("click", () => {
      searchDropdown.classList.add("hidden");
    });

    // Закрытие выпадашки поиска при клике вне её
    document.addEventListener("click", (e) => {
      if (!document.getElementById("searchWrapper").contains(e.target)) {
        searchDropdown.classList.add("hidden");
      }
    });

    // Кнопки навигации по подсвеченным словам в тексте
    prevHighlightBtn.addEventListener("click", () => {
      focusHighlightAtIndex(currentHighlightIdx - 1);
    });
    nextHighlightBtn.addEventListener("click", () => {
      focusHighlightAtIndex(currentHighlightIdx + 1);
    });
    clearHighlightsBtn.addEventListener("click", clearHighlightsUI);

    // Модальное окно сводки норм и параметров
    normsModalBtn.addEventListener("click", () => {
      normsModal.classList.remove("hidden");
    });
    closeNormsModalBtn.addEventListener("click", () => {
      normsModal.classList.add("hidden");
    });
    normsModal.addEventListener("click", (e) => {
      if (e.target === normsModal) {
        normsModal.classList.add("hidden");
      }
    });
  }

  // Регистрация Service Worker для полной оффлайн-работы
  function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("./sw.js")
          .catch((err) => console.warn("SW registration note:", err));
      });
    }
  }

  // Принудительная проверка актуальности сборки: старая версия не используется молча.
  async function enforceBuildVersion(){try{const r=await fetch(`./full-index.js?build=${APP_VERSION}&t=${Date.now()}`,{cache:'no-store'});if(!r.ok)throw new Error('build check failed');document.getElementById('sidebarVersion').textContent=`Версия пособия: ${APP_VERSION}`;if('serviceWorker' in navigator){const reg=await navigator.serviceWorker.getRegistration();if(reg)await reg.update();}}catch(e){const el=document.getElementById('sidebarVersion');if(el)el.textContent=`Версия пособия: ${APP_VERSION} · офлайн`;}}
  enforceBuildVersion();
  // Старт приложения
  renderSidebar();
  renderHomeView();
  initEventListeners();
  registerServiceWorker();
})();