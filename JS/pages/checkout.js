import { initLayout } from "../ui.js";
import { getCart, saveOrder, clearCart } from "../storage.js";

const FREE_SHIPPING_MIN = 100;
const SHIPPING_FEE = 9.99;

function formatPrice(value) {
  return `$${value.toFixed(2)}`;
}

function calcTotals(items) {
  let subtotal = 0;
  for (let i = 0; i < items.length; i++) {
    subtotal += items[i].price * items[i].qty;
  }

  let shipping = SHIPPING_FEE;
  if (subtotal === 0 || subtotal >= FREE_SHIPPING_MIN) shipping = 0;
  return { subtotal, shipping, total: subtotal + shipping };
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

initLayout();

const form = document.getElementById("checkout-form");
const layout = document.getElementById("checkout-layout");
const emptyBox = document.getElementById("checkout-empty");
const placeBtn = document.getElementById("place-btn");
let current = 1;

function isValidExpiry(v) {
  const expiryParts = v.match(/^(\d{2})\/(\d{2})$/);
  if (!expiryParts) return false;

  const month = Number(expiryParts[1]);
  const year = 2000 + Number(expiryParts[2]);
  if (month < 1 || month > 12) return false;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  if (year > currentYear) return true;
  if (year === currentYear && month >= currentMonth) return true;
  return false;
}

const RULES = {
  fullName: [(v) => v.trim().length >= 3, "Please enter your full name."],
  email: [
    (v) => /^\S+@\S+\.\S+$/.test(v.trim()),
    "Enter a valid email address.",
  ],
  phone: [
    (v) => /^\+?[\d\s-]{7,15}$/.test(v.trim()),
    "Enter a valid phone number.",
  ],
  country: [(v) => v !== "", "Please choose a country."],
  address: [(v) => v.trim().length >= 5, "Please enter your street address."],
  city: [(v) => v.trim().length >= 2, "Please enter your city."],
  zip: [
    (v) => /^[\w\s-]{3,10}$/.test(v.trim()),
    "Enter a valid ZIP / postal code.",
  ],
  cardName: [(v) => v.trim().length >= 3, "Enter the name on the card."],
  cardNumber: [
    (v) => /^\d{16}$/.test(v.replace(/\s/g, "")),
    "Card number must be 16 digits.",
  ],
  expiry: [isValidExpiry, "Enter a valid future date (MM/YY)."],
  cvv: [(v) => /^\d{3,4}$/.test(v), "CVV must be 3 or 4 digits."],
};

const STEP_FIELDS = {
  1: ["fullName", "email", "phone", "country", "address", "city", "zip"],
  2: ["cardName", "cardNumber", "expiry", "cvv"],
};

function validateField(name) {
  const input = form.elements[name];
  const rule = RULES[name];
  const testValue = rule[0];
  const errorMessage = rule[1];
  const ok = testValue(input.value);
  const field = input.closest(".field");
  field.classList.toggle("invalid", !ok);
  if (ok) {
    field.querySelector(".error-msg").textContent = "";
  } else {
    field.querySelector(".error-msg").textContent = errorMessage;
  }
  return ok;
}

function validateStep(step) {
  const fieldsToCheck = STEP_FIELDS[step];
  let allFieldsAreValid = true;

  for (let i = 0; i < fieldsToCheck.length; i++) {
    if (!validateField(fieldsToCheck[i])) {
      allFieldsAreValid = false;
    }
  }

  if (!allFieldsAreValid) {
    const firstInvalidInput = form.querySelector(
      ".field.invalid input, .field.invalid select",
    );
    if (firstInvalidInput) firstInvalidInput.focus();
    return false;
  }
  return true;
}

function goToStep(stepNumber) {
  current = stepNumber;

  const stepSections = form.querySelectorAll(".step");
  for (let i = 0; i < stepSections.length; i++) {
    stepSections[i].hidden =
      Number(stepSections[i].dataset.step) !== stepNumber;
  }

  const progressItems = form.querySelectorAll(".stepper li");
  for (let i = 0; i < progressItems.length; i++) {
    const step = Number(progressItems[i].dataset.step);
    progressItems[i].classList.toggle("active", step === stepNumber);
    progressItems[i].classList.toggle("done", step < stepNumber);
  }

  if (stepNumber === 3) renderReview();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function nextStep() {
  if (validateStep(current)) goToStep(current + 1);
}

form.addEventListener("click", (e) => {
  if (e.target.closest("[data-next]")) nextStep();
  if (e.target.closest("[data-back]")) goToStep(current - 1);
  const edit = e.target.closest("[data-goto]");
  if (edit) goToStep(Number(edit.dataset.goto));
});

// Pressing Enter in a field submits the form: treat it as "Continue"
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (current < 3) return nextStep();
  placeOrder();
});

form.addEventListener("input", (e) => {
  const name = e.target.name;
  const field = e.target.closest(".field");
  if (field && field.classList.contains("invalid")) {
    validateField(name);
  }
});

form.elements.cardNumber.addEventListener("input", (e) => {
  const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
  e.target.value = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
});

form.elements.expiry.addEventListener("input", (e) => {
  let d = e.target.value.replace(/\D/g, "").slice(0, 4);
  if (d.length >= 3) d = `${d.slice(0, 2)}/${d.slice(2)}`;
  e.target.value = d;
});

form.elements.cvv.addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/\D/g, "");
});

function renderSummary(items) {
  const { subtotal, shipping, total } = calcTotals(items);
  let itemsHTML = "";

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    itemsHTML += `
        <li>
          <img src="${item.thumbnail}" alt="" />
          <div><p>${item.title}</p><p class="muted small">Qty ${item.qty}</p></div>
          <span>${formatPrice(item.price * item.qty)}</span>
        </li>`;
  }

  document.getElementById("checkout-summary").innerHTML = `
    <h2>Order Summary</h2>
    <ul class="sum-items">
      ${itemsHTML}
    </ul>
    <div class="sum-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
    <div class="sum-row"><span>Shipping</span><span>${shipping === 0 ? "Free" : formatPrice(shipping)}</span></div>
    <div class="sum-row total"><span>Total</span><span>${formatPrice(total)}</span></div>`;
}

function renderReview() {
  const formValues = readFormValues();
  const last4 = formValues.cardNumber.replace(/\s/g, "").slice(-4);
  document.getElementById("review").innerHTML = `
    <div class="review-block">
      <h3>Shipping to</h3>
      <p>${escapeHTML(formValues.fullName)}<br>${escapeHTML(formValues.address)}<br>
         ${escapeHTML(formValues.city)}, ${escapeHTML(formValues.zip)}<br>${escapeHTML(formValues.country)}</p>
      <p class="muted">${escapeHTML(formValues.email)} · ${escapeHTML(formValues.phone)}</p>
      <button type="button" class="link-btn" data-goto="1">Edit</button>
    </div>
    <div class="review-block">
      <h3>Payment</h3>
      <p>Card ending in <strong>${last4}</strong></p>
      <button type="button" class="link-btn" data-goto="2">Edit</button>
    </div>`;
}

function readFormValues() {
    const values = {};
    for (let i = 0; i < form.elements.length; i++) {
      const input = form.elements[i];
      if (input.name) values[input.name] = input.value;
    }
    return values;
}

function placeOrder() {
    const items = getCart();
    if (items.length === 0) return; // cart was emptied in another tab

    const formValues = readFormValues();
    const order = {
    id: "SF-" + Date.now().toString(36).toUpperCase(),
    date: new Date().toISOString(),
    status: "Confirmed",
    customer: {
      name: formValues.fullName.trim(),
      email: formValues.email.trim(),
      phone: formValues.phone.trim(),
      address: formValues.address.trim(),
      city: formValues.city.trim(),
      zip: formValues.zip.trim(),
      country: formValues.country,
    },
    payment: {
      method: "Card",
      last4: formValues.cardNumber.replace(/\s/g, "").slice(-4),
    },
    items,
    totals: calcTotals(items),
  };

  placeBtn.disabled = true;
  placeBtn.textContent = "Placing order...";

  setTimeout(() => {
    if (!saveOrder(order)) {
      placeBtn.disabled = false;
      placeBtn.textContent = "Place order";
      return; // keep the cart so nothing is lost
    }
    clearCart();
    location.href = `orders.html?placed=${order.id}`;
  }, 1200);
}

function init() {
  const items = getCart();
  if (items.length === 0) {
    layout.hidden = true;
    emptyBox.hidden = false;
    return;
  }
  renderSummary(items);
}

init();
