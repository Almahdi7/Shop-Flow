// cspell:ignore shopflow
import {
  initLayout,
  showLoading,
  showError,
  showEmpty,
  productCardHTML,
  setupCardActions,
  renderPagination,
} from "../ui.js";
import { getAllProducts } from "../api.js";

initLayout();

const PAGE_SIZE = 8;
const container = document.getElementById("featured-products");
const pagination = document.getElementById("pagination");
const sectionTop = document.querySelector(".section-head");

let items = [];
let page = 1;

setupCardActions(container);

const totalPages = () => Math.ceil(items.length / PAGE_SIZE);

// ?page=3 in the URL, clamped so ?page=999 or ?page=abc can't break anything
function readPageFromURL() {
  const n = Number(new URLSearchParams(location.search).get("page"));
  return Number.isInteger(n) && n >= 1 ? Math.min(n, totalPages()) : 1;
}

function render() {
  const start = (page - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, items.length);
  let cardsHTML = "";
  for (let i = start; i < end; i++) {
    cardsHTML += productCardHTML(items[i]);
  }
  container.innerHTML = cardsHTML;
  renderPagination(pagination, {
    page,
    totalPages: totalPages(),
    onChange: goToPage,
  });
}

function goToPage(n) {
  page = n;
  render();
  history.replaceState(
    null,
    "",
    n === 1 ? location.pathname : `${location.pathname}?page=${n}`,
  );
  sectionTop.scrollIntoView({ behavior: "smooth" });
}

function startHero(products) {
  const slider = document.getElementById("hero-slider");
  // Sort a copy so the original product list stays unchanged.
  const slides = products.slice();
  slides.sort((firstProduct, secondProduct) => {
    return secondProduct.discountPercentage - firstProduct.discountPercentage;
  });
  slides.length = Math.min(slides.length, 5);

  let dotsHTML = "";
  for (let i = 0; i < slides.length; i++) {
    dotsHTML += `<button class="dot" data-i="${i}" aria-label="Show slide ${i + 1}"></button>`;
  }

  slider.innerHTML =
    `<a class="hero-slide" id="hero-link" href="#">
      <img id="hero-img" alt="" />
      <span id="hero-caption"></span>
    </a>
    <div class="dots">${dotsHTML}</div>`;

  const link = document.getElementById("hero-link");
  const img = document.getElementById("hero-img");
  const caption = document.getElementById("hero-caption");
  const dots = slider.querySelectorAll(".dot");
  let index = 0;
  let timer;

  function showSlide(slideIndex) {
    index = slideIndex;
    const product = slides[slideIndex];

    link.href = `details.html?id=${product.id}`;
    img.src = product.thumbnail;
    img.alt = product.title;
    caption.textContent = `${product.title} · ${Math.round(product.discountPercentage)}% off`;

    // Highlight the dot for the slide currently being shown.
    for (let i = 0; i < dots.length; i++) {
      if (i === slideIndex) {
        dots[i].classList.add("active");
      } else {
        dots[i].classList.remove("active");
      }
    }
  }

  function stopSlideshow() {
    clearInterval(timer);
  }

  function startSlideshow() {
    stopSlideshow(); // Keep only one timer running at a time.
    timer = setInterval(function () {
      const nextIndex = (index + 1) % slides.length;
      showSlide(nextIndex);
    }, 4000);
  }

  // Clicking a dot changes the slide and restarts its four-second timer.
  for (let i = 0; i < dots.length; i++) {
    const dot = dots[i];
    dot.addEventListener("click", function () {
      showSlide(Number(dot.dataset.i));
      startSlideshow();
    });
  }

  slider.addEventListener("mouseenter", stopSlideshow);
  slider.addEventListener("mouseleave", startSlideshow);

  showSlide(0);
  // Do not autoplay for visitors who prefer reduced motion.
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    startSlideshow();
  }
}

async function loadFeatured() {
  showLoading(container);
  pagination.innerHTML = "";
  try {
    const products = await getAllProducts();
    startHero(products);

    items = [...products].sort((a, b) => b.rating - a.rating);
    if (items.length === 0) {
      showEmpty(container, "No products available right now.");
      return;
    }
    page = readPageFromURL();
    render();
  } catch {
    showError(
      container,
      "Couldn't load products. Check your connection.",
      loadFeatured,
    );
  }
}

loadFeatured();
