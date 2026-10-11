import {
  initLayout,
  showLoading,
  showError,
  showEmpty,
  productCardHTML,
  setupCardActions,
} from "../ui.js";
import { getAllProducts } from "../api.js";
import { getFavorites } from "../storage.js";

initLayout();

const grid = document.getElementById("favorites-grid");
const countEl = document.getElementById("fav-count");
let allProducts = [];
let renderedIds = "";

setupCardActions(grid);

function render() {
  const favoriteIds = getFavorites();
  renderedIds = favoriteIds.join(",");

  // Show the newest favorite first, and skip products no longer in the API.
  const items = [];
  for (let i = favoriteIds.length - 1; i >= 0; i--) {
    const favoriteId = favoriteIds[i];
    for (let productIndex = 0; productIndex < allProducts.length; productIndex++) {
      if (allProducts[productIndex].id === favoriteId) {
        items.push(allProducts[productIndex]);
        break;
      }
    }
  }

  let itemCountText = `${items.length} saved items`;
  if (items.length === 1) itemCountText = "1 saved item";
  countEl.textContent = itemCountText;

  if (items.length === 0) {
    showEmpty(grid, "You haven't saved any favorites yet.");
    grid
      .querySelector(".state")
      .insertAdjacentHTML(
        "beforeend",
        `<a class="btn" href="products.html">Browse products</a>`,
      );
    return;
  }
  let cardsHTML = "";
  for (let i = 0; i < items.length; i++) {
    cardsHTML += productCardHTML(items[i]);
  }
  grid.innerHTML = cardsHTML;
}

// Re-render only when the favorites list itself changed (not on cart changes)
function onStorageChange() {
  const currentFavoriteIds = getFavorites().join(",");
  if (allProducts.length > 0 && currentFavoriteIds !== renderedIds) {
    render();
  }
}
window.addEventListener("shopflow:storage", onStorageChange);
window.addEventListener("storage", onStorageChange);

async function init() {
  showLoading(grid);
  try {
    allProducts = await getAllProducts();
    render();
  } catch {
    showError(
      grid,
      "Couldn't load your favorites. Check your connection.",
      init,
    );
  }
}

init();
