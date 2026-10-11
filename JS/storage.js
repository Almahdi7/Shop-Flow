// cspell:ignore shopflow favs
const KEYS = {
  cart: "shopflow_cart",
  favorites: "shopflow_favorites",
  orders: "shopflow_orders",
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    return fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    alert(
      "Couldn't save your data. Your browser may be blocking storage or it is full.",
    );
    return false;
  }
  window.dispatchEvent(new Event("shopflow:storage"));
  return true;
}

// Favorites are stored as an array of product IDs.
export function getFavorites() {
  return read(KEYS.favorites, []);
}

export function isFavorite(id) {
  return getFavorites().includes(id);
}

export function toggleFavorite(id) {
  const favorites = getFavorites();
  const favoriteIndex = favorites.indexOf(id);

  if (favoriteIndex !== -1) {
    favorites.splice(favoriteIndex, 1);
    write(KEYS.favorites, favorites);
    return false;
  }

  favorites.push(id);
  write(KEYS.favorites, favorites);
  return true;
}

export function getCart() {
  return read(KEYS.cart, []);
}

export function addToCart(product, quantity = 1) {
  const cart = getCart();

  let item = null;
  for (let i = 0; i < cart.length; i++) {
    if (cart[i].id === product.id) {
      item = cart[i];
      break;
    }
  }

  if (item) {
    item.qty += quantity;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      thumbnail: product.thumbnail,
      qty: quantity,
    });
  }

  write(KEYS.cart, cart);
}

export function updateQty(id, qty) {
  if (qty < 1) {
    removeFromCart(id);
    return;
  }

  const cart = getCart();
  for (let i = 0; i < cart.length; i++) {
    if (cart[i].id === id) {
      cart[i].qty = qty;
    }
  }
  write(KEYS.cart, cart);
}

export function removeFromCart(id) {
  const oldCart = getCart();
  const newCart = [];

  for (let i = 0; i < oldCart.length; i++) {
    if (oldCart[i].id !== id) {
      newCart.push(oldCart[i]);
    }
  }

  write(KEYS.cart, newCart);
}

export function clearCart() {
  return write(KEYS.cart, []);
}

export function getCartCount() {
  const cart = getCart();
  let count = 0;
  for (let i = 0; i < cart.length; i++) {
    count += cart[i].qty;
  }
  return count;
}

export function getCartTotal() {
  const cart = getCart();
  let total = 0;
  for (let i = 0; i < cart.length; i++) {
    total += cart[i].price * cart[i].qty;
  }
  return total;
}

export function getOrders() {
  return read(KEYS.orders, []);
}

export function saveOrder(order) {
  const orders = getOrders();
  orders.unshift(order);
  return write(KEYS.orders, orders);
}
