type BrowserTab = {
  id: number;
  title: string;
  url: string;
  input: string;
};

const SEARCH_URL = "https://duckduckgo.com/?q=";
const HOME_TITLE = "דף פרטי חדש";

let nextTabId = 1;
let activeTabId = 1;
let tabs: BrowserTab[] = [createTab()];

const appElement = document.querySelector<HTMLDivElement>("#app");

if (!appElement) {
  throw new Error("App root was not found");
}

const app = appElement;

function createTab(url = ""): BrowserTab {
  const id = nextTabId++;
  return {
    id,
    title: url ? getDisplayTitle(url) : HOME_TITLE,
    url,
    input: url
  };
}

function normalizeAddress(rawValue: string): string {
  const value = rawValue.trim();

  if (!value) {
    return "";
  }

  const hasProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(value);
  const looksLikeDomain = /^(localhost|([\w-]+\.)+[a-z]{2,})(:\d+)?(\/.*)?$/i.test(value);

  if (hasProtocol) {
    return value;
  }

  if (looksLikeDomain) {
    return `https://${value}`;
  }

  return `${SEARCH_URL}${encodeURIComponent(value)}`;
}

function getDisplayTitle(url: string): string {
  if (!url) {
    return HOME_TITLE;
  }

  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "") || url;
  } catch {
    return url;
  }
}

function getActiveTab(): BrowserTab {
  return tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];
}

function setActiveTab(partial: Partial<BrowserTab>) {
  tabs = tabs.map((tab) => (tab.id === activeTabId ? { ...tab, ...partial } : tab));
}

function navigate(rawValue: string) {
  const url = normalizeAddress(rawValue);

  if (!url) {
    setActiveTab({ url: "", input: "", title: HOME_TITLE });
  } else {
    setActiveTab({ url, input: url, title: getDisplayTitle(url) });
  }

  render();
}

function addTab(url = "") {
  const tab = createTab(url);
  tabs = [...tabs, tab];
  activeTabId = tab.id;
  render();
}

function closeTab(id: number) {
  if (tabs.length === 1) {
    tabs = [createTab()];
    activeTabId = tabs[0].id;
    render();
    return;
  }

  const index = tabs.findIndex((tab) => tab.id === id);
  tabs = tabs.filter((tab) => tab.id !== id);

  if (activeTabId === id) {
    activeTabId = tabs[Math.max(0, index - 1)]?.id ?? tabs[0].id;
  }

  render();
}

function clearSession() {
  tabs = [createTab()];
  activeTabId = tabs[0].id;
  render();
}

function render() {
  const activeTab = getActiveTab();

  app.innerHTML = `
    <main class="shell">
      <header class="header" aria-label="סרגל דפדפן פרטי">
        <div class="brand-row">
          <div class="brand">
            <div class="logo" aria-hidden="true">🛡️</div>
            <div>
              <h1>דפדפן פרטי</h1>
              <p class="subtitle">גלישה זמנית: בלי שמירת היסטוריה, בלי עוגיות קבועות באפליקציה ובלי מעקב מקומי.</p>
            </div>
          </div>
          <button class="btn danger" data-action="clear">נקה הכול</button>
        </div>
        <div class="toolbar">
          <button class="btn icon" data-action="home" title="דף חדש">⌂</button>
          <form class="address-form" id="address-form">
            <input class="address-input" id="address-input" dir="ltr" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="הקלד כתובת או חיפוש" value="${escapeHtml(activeTab.input)}" />
            <button class="btn primary" type="submit">פתח</button>
          </form>
          <button class="btn" data-action="new-tab">+ לשונית</button>
        </div>
        <nav class="tab-list" aria-label="לשוניות פרטיות">
          ${tabs.map(renderTab).join("")}
        </nav>
      </header>
      <section class="content">
        <article class="browser-card">
          <div class="privacy-strip">
            <span>מצב פרטי פעיל: הנתונים נשמרים בזיכרון בלבד ונמחקים בלחיצה על ניקוי או ברענון האפליקציה.</span>
            <div class="badges">
              <span class="badge">ללא localStorage</span>
              <span class="badge">לשוניות זמניות</span>
              <span class="badge">חיפוש DuckDuckGo</span>
            </div>
          </div>
          <div class="frame-wrap">
            ${activeTab.url ? renderFrame(activeTab.url) : renderEmptyState()}
          </div>
        </article>
      </section>
      <footer class="footer">טיפ: אתרים מסוימים חוסמים פתיחה בתוך מסגרת. במקרה כזה פתח כתובת אחרת או השתמש בקישור ישיר.</footer>
    </main>
  `;

  bindEvents();
}

function renderTab(tab: BrowserTab): string {
  const activeClass = tab.id === activeTabId ? " active" : "";

  return `
    <button class="tab${activeClass}" data-tab-id="${tab.id}" title="${escapeHtml(tab.input || HOME_TITLE)}">
      <span class="tab-title">${escapeHtml(tab.title)}</span>
      <span class="close-tab" data-close-tab-id="${tab.id}" aria-label="סגור לשונית">×</span>
    </button>
  `;
}

function renderFrame(url: string): string {
  return `<iframe class="browser-frame" sandbox="allow-forms allow-modals allow-popups allow-scripts allow-same-origin" referrerpolicy="no-referrer" src="${escapeHtml(url)}" title="תוכן הדפדפן הפרטי"></iframe>`;
}

function renderEmptyState(): string {
  const links = [
    { label: "DuckDuckGo", url: "https://duckduckgo.com" },
    { label: "Wikipedia", url: "https://www.wikipedia.org" },
    { label: "MDN", url: "https://developer.mozilla.org" }
  ];

  return `
    <div class="empty-state">
      <div class="empty-state-inner">
        <h2>לשונית פרטית חדשה</h2>
        <p>הכנס כתובת מלאה או מילת חיפוש. שום היסטוריה לא נשמרת בדפדפן האפליקציה.</p>
        <div class="quick-links">
          ${links.map((link) => `<button class="btn quick-link" data-url="${link.url}">${link.label}</button>`).join("")}
        </div>
      </div>
    </div>
  `;
}

function bindEvents() {
  document.querySelector<HTMLFormElement>("#address-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.querySelector<HTMLInputElement>("#address-input");
    navigate(input?.value ?? "");
  });

  document.querySelectorAll<HTMLElement>("[data-action]").forEach((element) => {
    element.addEventListener("click", () => {
      const action = element.dataset.action;

      if (action === "new-tab") {
        addTab();
      }

      if (action === "clear") {
        clearSession();
      }

      if (action === "home") {
        navigate("");
      }
    });
  });

  document.querySelectorAll<HTMLElement>("[data-tab-id]").forEach((element) => {
    element.addEventListener("click", () => {
      activeTabId = Number(element.dataset.tabId);
      render();
    });
  });

  document.querySelectorAll<HTMLElement>("[data-close-tab-id]").forEach((element) => {
    element.addEventListener("click", (event) => {
      event.stopPropagation();
      closeTab(Number(element.dataset.closeTabId));
    });
  });

  document.querySelectorAll<HTMLElement>("[data-url]").forEach((element) => {
    element.addEventListener("click", () => navigate(element.dataset.url ?? ""));
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

render();
