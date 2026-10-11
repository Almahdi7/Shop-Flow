export function formatPrice(value) {
  return "$" + value.toFixed(2);
}

export function escapeHTML(value) {
  const element = document.createElement("div");
  element.textContent = String(value);
  return element.innerHTML;
}
