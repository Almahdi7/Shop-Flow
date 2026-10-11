import {
  initLayout,
  showLoading,
  showError,
  showEmpty,
  productCardHTML,
  setupCardActions,
} from "../ui.js";
import { getAllProducts } from "../api.js";

initLayout();

const grid = document.getElementById("product-grid");
if (!grid) {
  console.warn("Products page: missing #product-grid element.");
}

const searchInput = document.getElementById("search");
const sortSelect = document.getElementById("sort");
const categoryList = document.getElementById("category-list");
const countEl = document.getElementById("result-count");

if (grid) setupCardActions(grid);

// Keep all current filters together so every render uses the same choices.
const state = { search: "", category: "all", price: "all", sort: "popularity" };
let allProducts = [];

function prettify(slug) {
  const words = slug.split("-");
  let label = "";

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const capitalizedWord = word[0].toUpperCase() + word.slice(1);
    if (i > 0) label += " ";
    label += capitalizedWord;
  }

  return label;
}

function debounce(fn, delay = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/* ---------- filter + sort ---------- */
function getVisibleProducts() {
  const searchText = state.search.trim().toLowerCase();

  let minimumPrice = 0;
  let maximumPrice = Infinity;
  if (state.price !== "all") {
    const priceParts = state.price.split("-");
    minimumPrice = Number(priceParts[0]);
    if (priceParts[1]) maximumPrice = Number(priceParts[1]);
  }

  const visibleProducts = [];
  for (let i = 0; i < allProducts.length; i++) {
    const product = allProducts[i];
    const matchesCategory =
      state.category === "all" || product.category === state.category;
    const matchesPrice =
      product.price >= minimumPrice && product.price < maximumPrice;
    const brand = product.brand || "";
    const matchesSearch =
      searchText === "" ||
      product.title.toLowerCase().includes(searchText) ||
      brand.toLowerCase().includes(searchText);

    if (matchesCategory && matchesPrice && matchesSearch) {
      visibleProducts.push(product);
    }
  }

  // Sort the filtered results according to the selected option.
  if (state.sort === "popularity") {
    visibleProducts.sort((first, second) => second.rating - first.rating);
  } else if (state.sort === "price-asc") {
    visibleProducts.sort((first, second) => first.price - second.price);
  } else if (state.sort === "price-desc") {
    visibleProducts.sort((first, second) => second.price - first.price);
  } else if (state.sort === "name") {
    visibleProducts.sort((first, second) =>
      first.title.localeCompare(second.title),
    );
  }

  return visibleProducts;
}

/* ---------- rendering ---------- */
function render() {
  if (!grid || !countEl) return;

  const visibleProducts = getVisibleProducts();
  let countLabel = `${visibleProducts.length} products`;
  if (visibleProducts.length === 1) countLabel = "1 product";
  countEl.textContent = countLabel;

  if (visibleProducts.length === 0) {
    showEmpty(grid, "No products match your filters.");
    grid
      .querySelector(".state")
      .insertAdjacentHTML(
        "beforeend",
        `<button class="btn" id="clear-filters">Clear filters</button>`,
      );
    document
      .getElementById("clear-filters")
      .addEventListener("click", resetFilters);
    return;
  }
  let cardsHTML = "";
  for (let i = 0; i < visibleProducts.length; i++) {
    cardsHTML += productCardHTML(visibleProducts[i]);
  }
  grid.innerHTML = cardsHTML;
}

function renderCategories() {
  if (!categoryList) return;

  const categories = [];
  for (let i = 0; i < allProducts.length; i++) {
    const category = allProducts[i].category;
    if (!categories.includes(category)) categories.push(category);
  }
  categories.sort();

  let categoriesHTML =
    `<li><button class="cat-btn active" data-cat="all">All</button></li>`;
  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    categoriesHTML += `<li><button class="cat-btn" data-cat="${category}">${prettify(category)}</button></li>`;
  }
  categoryList.innerHTML = categoriesHTML;
}

function resetFilters() {
  if (!searchInput || !sortSelect || !categoryList) return;

  state.search = "";
  state.category = "all";
  state.price = "all";
  state.sort = "popularity";
  searchInput.value = "";
  sortSelect.value = "popularity";
  const allPriceRadio = document.querySelector(
    'input[name="price"][value="all"]',
  );
  if (allPriceRadio) allPriceRadio.checked = true;
  const categoryButtons = categoryList.querySelectorAll(".cat-btn");
  for (let i = 0; i < categoryButtons.length; i++) {
    categoryButtons[i].classList.toggle(
      "active",
      categoryButtons[i].dataset.cat === "all",
    );
  }
  render();
}

if (searchInput) {
  searchInput.addEventListener(
    "input",
    debounce(() => {
      state.search = searchInput.value;
      render();
    }),
  );
}

if (sortSelect) {
  sortSelect.addEventListener("change", () => {
    state.sort = sortSelect.value;
    render();
  });
}

const priceRadios = document.querySelectorAll('input[name="price"]');
for (let i = 0; i < priceRadios.length; i++) {
  priceRadios[i].addEventListener("change", () => {
    const radio = priceRadios[i];
    state.price = radio.value;
    render();
  });
}

if (categoryList) {
  categoryList.addEventListener("click", (e) => {
    const btn = e.target.closest(".cat-btn");
    if (!btn) return;
    state.category = btn.dataset.cat;
    const buttons = categoryList.querySelectorAll(".cat-btn");
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].classList.remove("active");
    }
    btn.classList.add("active");
    render();
  });
}

async function init() {
  if (!grid) return;

  showLoading(grid);
  try {
    allProducts = await getAllProducts();
    renderCategories();
    render();
  } catch {
    showError(grid, "Couldn't load products. Check your connection.", init);
  }
}

init();
