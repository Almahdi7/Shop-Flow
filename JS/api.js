const BASE_URL = "https://dummyjson.com";
let productsCache = null;

async function request(path) {
  const response = await fetch(BASE_URL + path);

  if (!response.ok) {
    const error = new Error("Request failed (" + response.status + ")");
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export async function getAllProducts() {
  if (productsCache) return productsCache;

  const data = await request("/products?limit=0");
  productsCache = data.products;
  return productsCache;
}

export function getProductById(id) {
  return request("/products/" + id);
}
