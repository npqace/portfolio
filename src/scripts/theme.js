(() => {
  const key = "ace-portfolio-theme";
  const system = window.matchMedia("(prefers-color-scheme: dark)");
  const root = document.documentElement;
  const chromeColor = document.querySelector('meta[name="theme-color"]');
  let button;
  let preference;

  function readPreference() {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function applyTheme() {
    const dark = preference === "dark" || (preference !== "light" && system.matches);
    root.dataset.theme = dark ? "dark" : "light";
    chromeColor.content = dark ? "#191a18" : "#f8f6f1";
    if (button) {
      button.setAttribute("aria-pressed", String(dark));
      button.title = dark ? "Switch to light mode" : "Switch to dark mode";
    }
  }

  preference = readPreference();
  applyTheme();
  system.addEventListener("change", applyTheme);
  window.addEventListener("storage", event => {
    if (event.key === key || event.key === null) {
      preference = readPreference();
      applyTheme();
    }
  });
  window.addEventListener("pageshow", event => {
    if (event.persisted) {
      preference = readPreference();
      applyTheme();
    }
  });
  document.addEventListener("DOMContentLoaded", () => {
    button = document.querySelector(".theme-toggle");
    if (!button) return;
    applyTheme();
    button.hidden = false;
    button.addEventListener("click", () => {
      preference = root.dataset.theme === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(key, preference);
      } catch {
        // The current page can still switch themes when storage is unavailable.
      }
      applyTheme();
    });
  });
})();
