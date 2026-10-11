// cspell:ignore shopflow
import { getTheme, applyTheme, toggleTheme } from "./theme.js";
import { getAllProducts } from "./api.js";
import {
  isFavorite,
  toggleFavorite,
  addToCart,
  getCartCount,
} from "./storage.js";
const LINKS = [
  ["index.html", "Home"],
  ["products.html", "Products"],
  ["favorite.html", "Favorites"],
  ["cart.html", "Cart"],
  ["orders.html", "Orders"],
];

function renderHeader() {
  const header = document.getElementById("site-header");
  let currentPage = location.pathname.split("/").pop();
  if (!currentPage) currentPage = "index.html";

  let linksHTML = "";
  for (let i = 0; i < LINKS.length; i++) {
    const href = LINKS[i][0];
    const label = LINKS[i][1];
    let activeClass = "";

    if (href === currentPage) activeClass = "active";
    linksHTML += `<a href="${href}" class="${activeClass}">${label}</a>`;
  }

  header.innerHTML = `
    <a href="index.html" class="logo">Shop<span>Flow</span></a>
    <nav>${linksHTML}</nav>
    <button id="theme-toggle" aria-label="Toggle light/dark mode"></button>`;

  const cartLink = document.querySelector('nav a[href="cart.html"]');
  cartLink.insertAdjacentHTML(
    "beforeend",
    `<span id="cart-count" class="badge" hidden>0</span>`,
  );

  updateCartCount();
  window.addEventListener("shopflow:storage", updateCartCount);
  window.addEventListener("storage", updateCartCount);

  const btn = document.getElementById("theme-toggle");
  updateThemeIcon(btn);
  btn.addEventListener("click", () => {
    toggleTheme();
    updateThemeIcon(btn);
  });
}

function updateThemeIcon(button) {
  if (getTheme() === "dark") {
    button.textContent = "☀️";
  } else {
    button.textContent = "🌙";
  }
}

function updateCartCount() {
  const badge = document.getElementById("cart-count");
  if (!badge) return;

  const count = getCartCount();
  badge.textContent = count;
  badge.hidden = count === 0;
}
export function initLayout() {
  applyTheme(getTheme());
  renderHeader();
}

export function showLoading(container) {
  container.innerHTML = `
    <div class="state">
      <div class="spinner"></div>
      <p>Loading...</p>
    </div>`;
}

export function showError(container, message, onRetry) {
  container.innerHTML = `
    <div class="state error">
      <p>${message}</p>
      <button class="btn" id="retry-btn">Try again</button>
    </div>`;
  const retryButton = document.getElementById("retry-btn");
  retryButton.addEventListener("click", onRetry);
}

export function showEmpty(container, message) {
  container.innerHTML = `<div class="state"><p>${message}</p></div>`;
}

export function productCardHTML(p) {
  const fav = isFavorite(p.id);
  return `
    <article class="product-card">
      <button class="fav-btn ${fav ? "active" : ""}" data-action="favorite"
              data-id="${p.id}" aria-label="Toggle favorite" aria-pressed="${fav}">
        ${fav ? "♥" : "♡"}
      </button>
      <a href="details.html?id=${p.id}" class="card-image">
        <img src="${p.thumbnail}" alt="${p.title}" loading="lazy" />
      </a>
      <div class="card-body">
        <h3 class="card-title">${p.title}</h3>
        <p class="card-price">$${p.price.toFixed(2)}</p>
        <p class="card-rating">★ ${p.rating.toFixed(1)}</p>
        <button class="btn btn-block" data-action="add-cart" data-id="${p.id}">
          Add to cart
        </button>
      </div>
    </article>`;
}

export function setupCardActions(container) {
  container.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const id = Number(btn.dataset.id);

    if (btn.dataset.action === "favorite") {
      const nowFav = toggleFavorite(id);
      btn.classList.toggle("active", nowFav);
      btn.textContent = nowFav ? "♥" : "♡";
      btn.setAttribute("aria-pressed", nowFav);
    } else if (btn.dataset.action === "add-cart") {
      const products = await getAllProducts();

      let selectedProduct = null;
      for (let i = 0; i < products.length; i++) {
        if (products[i].id === id) {
          selectedProduct = products[i];
          break;
        }
      }

      addToCart(selectedProduct);
      btn.textContent = "Added ✓";
      setTimeout(function () {
        btn.textContent = "Add to cart";
      }, 1000);
    }
  });
}

function pageList(page, total) {
  const candidates = [1, total, page - 1, page, page + 1];
  const visiblePages = [];

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    if (candidate < 1 || candidate > total) continue;
    if (!visiblePages.includes(candidate)) visiblePages.push(candidate);
  }

  visiblePages.sort(function (firstPage, secondPage) {
    return firstPage - secondPage;
  });

  const output = [];
  for (let i = 0; i < visiblePages.length; i++) {
    if (i > 0 && visiblePages[i] - visiblePages[i - 1] > 1) {
      output.push("…");
    }
    output.push(visiblePages[i]);
  }
  return output;
}

export function renderPagination(container, { page, totalPages, onChange }) {
  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let buttonsHTML = "";
  const pages = pageList(page, totalPages);

  for (let i = 0; i < pages.length; i++) {
    const pageNumber = pages[i];
    if (pageNumber === "…") {
      buttonsHTML += `<span class="page-gap">…</span>`;
    } else {
      let activeClass = "";
      let currentAttribute = "";
      if (pageNumber === page) {
        activeClass = "active";
        currentAttribute = 'aria-current="page"';
      }

      buttonsHTML += `<button class="page-btn ${activeClass}" data-page="${pageNumber}" ${currentAttribute}>${pageNumber}</button>`;
    }
  }

  let previousDisabled = "";
  let nextDisabled = "";
  if (page === 1) previousDisabled = "disabled";
  if (page === totalPages) nextDisabled = "disabled";

  container.innerHTML = `
    <button class="page-btn" data-page="${page - 1}" ${previousDisabled}
            aria-label="Previous page">←</button>
    ${buttonsHTML}
    <button class="page-btn" data-page="${page + 1}" ${nextDisabled}
            aria-label="Next page">→</button>`;

  container.onclick = (e) => {
    const btn = e.target.closest("[data-page]");
    if (!btn || btn.disabled) return;
    onChange(Number(btn.dataset.page));
  };
}
