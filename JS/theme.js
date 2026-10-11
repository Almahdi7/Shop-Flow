// cspell:ignore shopflow
const KEY = "shopflow_theme";

export function getTheme() {
  const saved = localStorage.getItem(KEY);
  if (saved) return saved;

  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
}

export function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(KEY, theme);
}

export function toggleTheme() {
  let newTheme = "dark";

  if (getTheme() === "dark") {
    newTheme = "light";
  }

  applyTheme(newTheme);
  return newTheme;
}
