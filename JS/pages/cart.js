// cspell:ignore shopflow favs

import { initLayout } from "../ui.js";
import { getCart, updateQty, removeFromCart, clearCart } from "../storage.js";

export const FREE_SHIPPING_MIN = 100;
export const SHIPPING_FEE = 9.99;

initLayout();

const container = document.getElementById("cart-content");
if (!container) {
  console.warn("Cart page: missing #cart-content element.");
}

export const formatPrice = (amount) => `$${amount.toFixed(2)}`;

export function calcTotals(items) {
  let subtotal = 0;
  for (let i = 0; i < items.length; i++) {
    subtotal += items[i].price * items[i].qty;
  }

  let shipping = SHIPPING_FEE;
  if (subtotal === 0 || subtotal >= FREE_SHIPPING_MIN) shipping = 0;

  return { subtotal, shipping, total: subtotal + shipping };
}

function itemHTML(i) {
  return `
    <div class="cart-row">
      <a href="details.html?id=${i.id}" class="cart-product">
        <img src="${i.thumbnail}" alt="${i.title}" />
        <span>${i.title}</span>
      </a>
      <span class="cart-price">${formatPrice(i.price)}</span>
      <div class="qty">
        <button data-action="dec" data-id="${i.id}" ${i.qty <= 1 ? "disabled" : ""}
                aria-label="Decrease quantity">−</button>
        <span>${i.qty}</span>
        <button data-action="inc" data-id="${i.id}" aria-label="Increase quantity">+</button>
      </div>
      <span class="cart-line-total">${formatPrice(i.price * i.qty)}</span>
      <button class="remove-btn" data-action="remove" data-id="${i.id}"
              aria-label="Remove ${i.title} from cart">🗑</button>
    </div>`;
}

function render() {
  if (!container) return;

  const cart = getCart();

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="state">
        <p>Your cart is empty.</p>
        <a class="btn" href="products.html">Browse products</a>
      </div>`;
    return;
  }

  const { subtotal, shipping, total } = calcTotals(cart);
  const missing = FREE_SHIPPING_MIN - subtotal;
  let cartItemsHTML = "";
  for (let i = 0; i < cart.length; i++) {
    cartItemsHTML += itemHTML(cart[i]);
  }

  container.innerHTML = `
    <div class="cart-layout">
      <div class="cart-list">
        <div class="cart-row cart-header">
          <span>Product</span><span>Price</span><span>Quantity</span><span>Total</span><span></span>
        </div>
        ${cartItemsHTML}
        <div class="cart-actions">
          <a href="products.html" class="btn btn-outline">← Continue shopping</a>
          <button class="link-btn" data-action="clear">Clear cart</button>
        </div>
      </div>

      <aside class="summary">
        <h2>Order Summary</h2>
        <div class="sum-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
        <div class="sum-row">
          <span>Shipping</span><span>${shipping === 0 ? "Free" : formatPrice(shipping)}</span>
        </div>
        ${shipping > 0 ? `<p class="muted small">Add ${formatPrice(missing)} more for free shipping.</p>` : ""}
        <div class="sum-row total"><span>Total</span><span>${formatPrice(total)}</span></div>
        <a href="checkout.html" class="btn btn-block">Proceed to Checkout →</a>
      </aside>
    </div>`;
}

if (container) {
  container.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const id = Number(btn.dataset.id);
    let item = null;
    const cart = getCart();
    for (let i = 0; i < cart.length; i++) {
      if (cart[i].id === id) {
        item = cart[i];
        break;
      }
    }

    switch (btn.dataset.action) {
      case "inc":
        if (item) updateQty(id, item.qty + 1);
        break;
      case "dec":
        if (item) updateQty(id, item.qty - 1);
        break;
      case "remove":
        removeFromCart(id);
        break;
      case "clear":
        if (confirm("Remove all items from your cart?")) clearCart();
        break;
    }
  });
}

window.addEventListener("shopflow:storage", render);
window.addEventListener("storage", render);

render();
