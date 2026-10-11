import { initLayout, showLoading, showError, showEmpty } from "../ui.js";
import { getProductById } from "../api.js";
import { isFavorite, toggleFavorite, addToCart } from "../storage.js";

initLayout();

const container = document.getElementById("product-detail");
const breadcrumb = document.getElementById("breadcrumb");
const id = Number(new URLSearchParams(location.search).get("id"));

if (!container) {
  console.warn("Product page: missing #product-detail element.");
}

function stars(rating) {
  const fullStars = Math.round(rating);
  let result = "";

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      result += "★";
    } else {
      result += "☆";
    }
  }

  return result;
}

function escapeHTML(value) {
  const entities = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  const text = String(value);
  let safeText = "";

  for (let i = 0; i < text.length; i++) {
    const character = text[i];
    if (entities[character]) {
      safeText += entities[character];
    } else {
      safeText += character;
    }
  }

  return safeText;
}

function showNotFound() {
  if (!container) return;
  showEmpty(container, "Product not found.");
  container
    .querySelector(".state")
    .insertAdjacentHTML(
      "beforeend",
      `<a class="btn" href="products.html">Browse products</a>`,
    );
}

function specsRows(p) {
  const d = p.dimensions;
  const rows = [
    ["Brand", p.brand],
    ["SKU", p.sku],
    ["Category", p.category],
    ["Weight", p.weight ? `${p.weight} kg` : null],
    ["Dimensions", d ? `${d.width} × ${d.height} × ${d.depth} cm` : null],
    ["Warranty", p.warrantyInformation],
    ["Shipping", p.shippingInformation],
    ["Returns", p.returnPolicy],
  ];
  let rowsHTML = "";

  for (let i = 0; i < rows.length; i++) {
    const label = rows[i][0];
    let value = rows[i][1];
    if (value === null || value === undefined) value = "—";
    rowsHTML += `<tr><th>${escapeHTML(label)}</th><td>${escapeHTML(value)}</td></tr>`;
  }

  return rowsHTML;
}

function reviewsHTML(p) {
  if (!p.reviews || p.reviews.length === 0) {
    return `<p class="muted">No reviews yet.</p>`;
  }

  let reviewsHTML = "";
  for (let i = 0; i < p.reviews.length; i++) {
    const review = p.reviews[i];
    const reviewDate = new Date(review.date).toLocaleDateString();
    reviewsHTML += `
      <div class="review">
        <div class="review-head">
          <strong>${escapeHTML(review.reviewerName)}</strong>
          <span class="stars">${stars(review.rating)}</span>
          <span class="muted">${escapeHTML(reviewDate)}</span>
        </div>
        <p>${escapeHTML(review.comment)}</p>
      </div>`;
  }

  return reviewsHTML;
}

function render(p) {
  const title = escapeHTML(p.title);
  document.title = `${p.title} | ShopFlow`;
  breadcrumb.innerHTML = `<a href="index.html">Home</a> / <a href="products.html">Products</a> / <span>${title}</span>`;

  let images = [p.thumbnail];
  if (p.images && p.images.length > 0) images = p.images;
  const discount = Math.round(p.discountPercentage);
  const original =
    p.discountPercentage < 100
      ? p.price / (1 - p.discountPercentage / 100)
      : null;
  const inStock = p.stock > 0;
  const maxQty = Math.min(p.stock, 10);
  const fav = isFavorite(p.id);
  let thumbnailHTML = "";
  for (let i = 0; i < images.length; i++) {
    const activeClass = i === 0 ? "active" : "";
    thumbnailHTML += `
            <button type="button" class="thumb ${activeClass}" data-src="${escapeHTML(images[i])}" aria-label="Show image ${i + 1}">
              <img src="${escapeHTML(images[i])}" alt="" />
            </button>`;
  }

  let tagsHTML = "";
  if (p.tags && p.tags.length > 0) {
    const safeTags = [];
    for (let i = 0; i < p.tags.length; i++) {
      safeTags.push(escapeHTML(p.tags[i]));
    }
    tagsHTML = `<p class="muted">Tags: ${safeTags.join(", ")}</p>`;
  }

  let reviewCount = 0;
  if (p.reviews) reviewCount = p.reviews.length;

  container.innerHTML = `
    <div class="detail">
      <div class="gallery">
        <div class="main-image"><img id="main-img" src="${escapeHTML(images[0])}" alt="${title}" /></div>
        <div class="thumbs">${thumbnailHTML}</div>
      </div>

      <div class="info">
        <h1>${title}</h1>
        <p class="card-rating">
          <span class="stars">${stars(p.rating)}</span> ${p.rating.toFixed(1)} (${reviewCount} reviews)
        </p>
        <p class="price-row">
          <span class="price">$${p.price.toFixed(2)}</span>
          ${
            discount > 0 && original !== null
              ? `<span class="old-price">$${original.toFixed(2)}</span><span class="discount">${discount}% OFF</span>`
              : ""
          }
        </p>
        <p class="stock ${inStock ? "in" : "out"}">${inStock ? `In Stock (${p.stock} left)` : "Out of stock"}</p>
        <p class="short-desc">${escapeHTML(p.description)}</p>

        <div class="buy-row">
          <div class="qty">
            <button type="button" id="qty-minus" aria-label="Decrease quantity">−</button>
            <span id="qty-value">1</span>
            <button type="button" id="qty-plus" aria-label="Increase quantity">+</button>
          </div>
          <button type="button" class="btn" id="add-btn" ${inStock ? "" : "disabled"}>Add to Cart</button>
          <button type="button" class="fav-btn static ${fav ? "active" : ""}" id="fav-btn" aria-label="Toggle favorite" aria-pressed="${fav}">
            ${fav ? "♥" : "♡"}
          </button>
        </div>
      </div>
    </div>

    <div class="tabs">
      <div class="tab-list">
        <button class="tab-btn active" data-tab="description">Description</button>
        <button class="tab-btn" data-tab="specs">Specifications</button>
        <button class="tab-btn" data-tab="reviews">Reviews</button>
      </div>
      <div class="tab-panel" id="tab-description">
        <p>${escapeHTML(p.description)}</p>
        ${tagsHTML}
      </div>
      <div class="tab-panel" id="tab-specs" hidden><table class="specs">${specsRows(p)}</table></div>
      <div class="tab-panel" id="tab-reviews" hidden>${reviewsHTML(p)}</div>
    </div>`;

  setupInteractions(p, maxQty);
}

function setupInteractions(p, maxQty) {
  // gallery: click a thumbnail, swap the main image
  document.querySelector(".thumbs").addEventListener("click", (e) => {
    const thumb = e.target.closest(".thumb");
    if (!thumb) return;
    document.getElementById("main-img").src = thumb.dataset.src;
    const thumbnails = document.querySelectorAll(".thumb");
    for (let i = 0; i < thumbnails.length; i++) {
      thumbnails[i].classList.toggle("active", thumbnails[i] === thumb);
    }
  });

  // quantity selector
  let qty = 1;
  const qtyValue = document.getElementById("qty-value");
  function changeQty(delta) {
    qty = Math.min(Math.max(qty + delta, 1), Math.max(maxQty, 1));
    qtyValue.textContent = qty;
  }
  document
    .getElementById("qty-minus")
    .addEventListener("click", () => changeQty(-1));
  document
    .getElementById("qty-plus")
    .addEventListener("click", () => changeQty(1));

  // add to cart
  const addBtn = document.getElementById("add-btn");
  addBtn.addEventListener("click", () => {
    addToCart(p, qty);
    addBtn.textContent = "Added ✓";
    setTimeout(() => (addBtn.textContent = "Add to Cart"), 1200);
  });

  // favorite
  const favBtn = document.getElementById("fav-btn");
  favBtn.addEventListener("click", () => {
    const nowFav = toggleFavorite(p.id);
    favBtn.classList.toggle("active", nowFav);
    favBtn.textContent = nowFav ? "♥" : "♡";
    favBtn.setAttribute("aria-pressed", nowFav);
  });

  // tabs
  const tabButtons = document.querySelectorAll(".tab-btn");
  for (let i = 0; i < tabButtons.length; i++) {
    const button = tabButtons[i];
    button.addEventListener("click", () => {
      for (let buttonIndex = 0; buttonIndex < tabButtons.length; buttonIndex++) {
        tabButtons[buttonIndex].classList.toggle(
          "active",
          tabButtons[buttonIndex] === button,
        );
      }

      const panels = document.querySelectorAll(".tab-panel");
      for (let panelIndex = 0; panelIndex < panels.length; panelIndex++) {
        panels[panelIndex].hidden =
          panels[panelIndex].id !== `tab-${button.dataset.tab}`;
      }
    });
  }
}

async function load() {
  if (!id) return showNotFound();
  showLoading(container);
  try {
    render(await getProductById(id));
  } catch (err) {
    if (err.status === 404) showNotFound();
    else
      showError(
        container,
        "Couldn't load this product. Check your connection.",
        load,
      );
  }
}

load();
