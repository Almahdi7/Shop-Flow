# ShopFlow

ShopFlow is a lightweight front-end e-commerce storefront built with vanilla HTML, CSS, and JavaScript. It allows users to browse products, add items to a cart, save favorites, complete a mock checkout flow, and review previous orders.

## Project overview

This project is designed as a static shopping experience with no backend or database. Product data and user activity are stored in the browser using `localStorage`, making it easy to run locally without installing a server framework or database.

## Features

- Responsive storefront landing page
- Product listing and product detail pages
- Add to cart and update quantities
- Favorites/wishlist functionality
- Theme toggle for light and dark mode
- Checkout page with order confirmation
- Order history saved in the browser
- Clean modular JavaScript structure

## Tech stack

- HTML5
- CSS3
- JavaScript (ES modules)
- Browser localStorage for persistence

## Project structure

- `index.html` — homepage
- `products.html` — product catalog
- `details.html` — product details
- `cart.html` — cart summary
- `checkout.html` — checkout form
- `orders.html` — past orders
- `favorite.html` — saved favorites
- `CSS/` — stylesheets
- `JS/` — application logic and page scripts

## Getting started

Because this is a static frontend project, you can run it directly in a browser.

### Option 1: Open directly

- Open `index.html` in your browser.

### Option 2: Run a local web server

From the project root, run:

```bash
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

## Usage

1. Open the homepage and browse featured products.
2. Navigate to the products page to explore the catalog.
3. Add products to the cart or mark them as favorites.
4. Open the cart to update quantities or remove items.
5. Proceed to checkout and submit the order.
6. View your saved order history from the orders page.

## Storage behavior

This app stores the following in the browser using `localStorage`:

- cart items
- favorite product IDs
- saved orders
- selected theme

This means data remains available while the browser session remains active and the browser storage is not cleared.

## Notes

- This is a front-end demo and does not include user authentication, server-side validation, or a real payment system.
- The checkout process is a mock flow intended for front-end demonstration purposes.
- For personal use, data can be cleared from browser storage at any time.

## License

This project is intended for educational and demonstration use.
