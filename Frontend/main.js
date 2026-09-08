let allProducts = [];
let selectedCategory = 'All Beauty';
let productsContainer, showcaseTrack, searchInput;

function renderProducts(products) {
  if (!products.length) {
    productsContainer.innerHTML = '<p>No products found.</p>';
    return;
  }
  productsContainer.innerHTML = products.map((product) => {
    const outOfStock = Number(product.stock) === 0;
    const wished = isInWishlist(product.id);
    return `
      <article class="card product-card" data-id="${product.id}" tabindex="0" role="link" aria-label="View details for ${product.name}">
        <div class="card-img-wrap">
          <img src="${product.image}" alt="${product.name}" />
          <button class="wishlist-btn ${wished ? 'active' : ''}" data-id="${product.id}" title="Save to wishlist">${wished ? ICONS.heartFilled : ICONS.heart}</button>
        </div>
        <div class="card-content">
          <h3>${product.name}</h3>
          <p>${product.short}</p>
          <div class="price">${formatPrice(product.price, product.currency)}</div>
          <div class="stock-note ${outOfStock ? 'low' : ''}">${outOfStock ? 'Out of stock' : `${product.stock} in stock`}</div>
          <div class="card-actions">
            <button class="btn add-to-cart-btn" data-id="${product.id}" ${outOfStock ? 'disabled' : ''}>Add to Cart</button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  productsContainer.querySelectorAll('.product-card').forEach((card) => {
    const openDetails = () => {
      window.location.href = `details.html?id=${card.dataset.id}`;
    };

    card.addEventListener('click', openDetails);
    card.addEventListener('keydown', (event) => {
      if ((event.key === 'Enter' || event.key === ' ') && !event.target.closest('button')) {
        event.preventDefault();
        openDetails();
      }
    });
  });

  productsContainer.querySelectorAll('.add-to-cart-btn').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const product = allProducts.find((p) => p.id === button.dataset.id);
      if (!product) return;
      addToCart(product, 1);
      const original = button.textContent;
      button.textContent = 'Added!';
      setTimeout(() => { button.textContent = original; }, 1000);
    });
  });

  productsContainer.querySelectorAll('.wishlist-btn').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const product = allProducts.find((p) => p.id === button.dataset.id);
      if (!product) return;
      const nowActive = toggleWishlist(product);
      button.classList.toggle('active', nowActive);
      button.innerHTML = nowActive ? ICONS.heartFilled : ICONS.heart;
    });
  });
}

function applyFilters() {
  let filtered = allProducts;
  if (selectedCategory !== 'All Beauty') {
    filtered = filtered.filter((product) => product.category.toLowerCase() === selectedCategory.toLowerCase());
  }
  const term = searchInput.value.trim().toLowerCase();
  if (term) {
    filtered = filtered.filter((product) => product.name.toLowerCase().includes(term));
  }
  renderProducts(filtered);
}

function renderShowcase(products) {
  const byCategory = {};
  products.forEach((p) => {
    if (!byCategory[p.category]) byCategory[p.category] = p.image;
  });
  showcaseTrack.innerHTML = Object.keys(byCategory).map((cat) => `
    <a href="index.html?category=${encodeURIComponent(cat)}" class="showcase-tile" style="background-image:url('${byCategory[cat]}')">
      <span class="showcase-badge">${cat}</span>
    </a>
  `).join('');
}

function initHeroCarousel() {
  const carousel = document.getElementById('heroCarousel');
  if (!carousel) return;

  const track = carousel.querySelector('.hero-carousel-track');
  const slides = Array.from(carousel.querySelectorAll('.hero-slide'));
  const dots = Array.from(carousel.querySelectorAll('.hero-carousel-dots button'));
  const prevButton = carousel.querySelector('.hero-carousel-prev');
  const nextButton = carousel.querySelector('.hero-carousel-next');
  let activeIndex = 0;
  let autoPlayId;

  const showSlide = (nextIndex) => {
    activeIndex = (nextIndex + slides.length) % slides.length;
    track.style.transform = `translateX(-${activeIndex * 100}%)`;
    slides.forEach((slide, index) => {
      const isActive = index === activeIndex;
      slide.classList.toggle('is-active', isActive);
      slide.setAttribute('aria-hidden', String(!isActive));
    });
    dots.forEach((dot, index) => {
      const isActive = index === activeIndex;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-current', String(isActive));
    });
  };

  const stopAutoPlay = () => window.clearInterval(autoPlayId);
  const startAutoPlay = () => {
    stopAutoPlay();
    autoPlayId = window.setInterval(() => showSlide(activeIndex + 1), 5000);
  };

  prevButton.addEventListener('click', () => {
    showSlide(activeIndex - 1);
    startAutoPlay();
  });
  nextButton.addEventListener('click', () => {
    showSlide(activeIndex + 1);
    startAutoPlay();
  });
  dots.forEach((dot, index) => dot.addEventListener('click', () => {
    showSlide(index);
    startAutoPlay();
  }));
  carousel.addEventListener('mouseenter', stopAutoPlay);
  carousel.addEventListener('mouseleave', startAutoPlay);
  carousel.addEventListener('focusin', stopAutoPlay);
  carousel.addEventListener('focusout', startAutoPlay);

  startAutoPlay();
}

async function loadProducts() {
  try {
    const res = await fetch(`${API_ROOT}/products`);
    allProducts = await res.json();
    renderShowcase(allProducts);
    applyFilters();
  } catch (error) {
    productsContainer.innerHTML = '<p>Unable to load products. Please start the backend and refresh.</p>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  productsContainer = document.getElementById('products');
  showcaseTrack = document.getElementById('showcaseTrack');
  searchInput = document.getElementById('headerSearchInput');

  const params = new URLSearchParams(window.location.search);
  const categoryParam = params.get('category');
  const searchParam = params.get('search');
  if (categoryParam) selectedCategory = categoryParam;
  if (searchParam && searchInput) searchInput.value = searchParam;

  document.getElementById('showcasePrev').addEventListener('click', () => {
    showcaseTrack.scrollBy({ left: -360, behavior: 'smooth' });
  });
  document.getElementById('showcaseNext').addEventListener('click', () => {
    showcaseTrack.scrollBy({ left: 360, behavior: 'smooth' });
  });

  initHeroCarousel();
  loadProducts();
});
