import { initLayout } from "../ui.js";
import { getOrders } from "../storage.js";
import { formatPrice, escapeHTML } from "../utils.js";

initLayout();

const container = document.getElementById("orders-content");
const banner = document.getElementById("order-banner");
const orders = getOrders(); // New orders are saved at the start of the list.

function orderHTML(order, index) {
  const date = new Date(order.date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  let itemCount = 0;
  for (let i = 0; i < order.items.length; i++) {
    itemCount += order.items[i].qty;
  }

  const subtotal = order.totals.subtotal;
  const shipping = order.totals.shipping;
  const total = order.totals.total;
  const customer = order.customer;
  let itemLabel = `${itemCount} items`;
  if (itemCount === 1) itemLabel = "1 item";
  let itemsHTML = "";
  for (let i = 0; i < order.items.length; i++) {
    const item = order.items[i];
    itemsHTML += `
            <li>
              <img src="${item.thumbnail}" alt="" />
              <div><p>${item.title}</p><p class="muted small">Qty ${item.qty} × ${formatPrice(item.price)}</p></div>
              <span>${formatPrice(item.price * item.qty)}</span>
            </li>`;
  }

  return `
    <details class="order-card" ${index === 0 ? "open" : ""}>
      <summary class="order-head">
        <div>
          <h3>Order ${order.id}</h3>
          <small class="muted">${date} · ${itemLabel}</small>
        </div>
        <span class="status">${order.status}</span>
        <strong>${formatPrice(total)}</strong>
      </summary>

      <div class="order-body">
        <ul class="sum-items order-items">
          ${itemsHTML}
        </ul>
        <div class="order-foot">
          <p class="muted small">
            Shipped to ${escapeHTML(customer.name)}, ${escapeHTML(customer.address)},
            ${escapeHTML(customer.city)} ${escapeHTML(customer.zip)}, ${escapeHTML(customer.country)}<br />
            Paid with card ending in ${order.payment.last4}
          </p>
          <div class="order-sums">
            <div class="sum-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
            <div class="sum-row"><span>Shipping</span><span>${shipping === 0 ? "Free" : formatPrice(shipping)}</span></div>
            <div class="sum-row total"><span>Total</span><span>${formatPrice(total)}</span></div>
          </div>
        </div>
      </div>
    </details>`;
}

function showConfirmation() {
  const placedId = new URLSearchParams(location.search).get("placed");
  let orderWasPlaced = false;
  for (let i = 0; i < orders.length; i++) {
    if (orders[i].id === placedId) orderWasPlaced = true;
  }

  if (placedId && orderWasPlaced) {
    banner.textContent = `Order ${placedId} placed successfully. Thank you for shopping with ShopFlow!`;
    banner.hidden = false;
  }
  // remove ?placed=... so a refresh doesn't show the banner again
  if (placedId) history.replaceState(null, "", "orders.html");
}

function render() {
  if (orders.length === 0) {
    container.innerHTML = `
      <div class="state">
        <p>You haven't placed any orders yet.</p>
        <a class="btn" href="products.html">Start shopping</a>
      </div>`;
    return;
  }
  let ordersHTML = "";
  for (let i = 0; i < orders.length; i++) {
    ordersHTML += orderHTML(orders[i], i);
  }
  container.innerHTML = `<div class="orders-list">${ordersHTML}</div>`;
}

showConfirmation();
render();
