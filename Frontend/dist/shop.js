let allProducts = [];
let selectedCategory = 'All Beauty';
let productsContainer, searchInput;

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
          <span class="product-category">${product.category}</span>
          <h3>${product.name}</h3>
          <p>${product.short}</p>
          <div class="product-meta">
            <div class="price">${formatPrice(product.price, product.currency)}</div>
            <div class="stock-note ${outOfStock ? 'low' : ''}">${outOfStock ? 'Out of stock' : `${product.stock} in stock`}</div>
          </div>
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

function updateShopHeading(count) {
  const label = selectedCategory === 'All Beauty' ? 'All products' : selectedCategory;
  const title = document.getElementById('shopTitle');
  const breadcrumb = document.getElementById('shopBreadcrumbCurrent');
  const countEl = document.getElementById('shopCount');
  if (title) title.textContent = label;
  if (breadcrumb) breadcrumb.textContent = label;
  if (countEl) countEl.textContent = `${count} product${count === 1 ? '' : 's'}`;
  document.title = `${label} - Muktinath Collection Stores`;
}

function applyFilters() {
  let filtered = allProducts;
  if (selectedCategory !== 'All Beauty') {
    filtered = filtered.filter((product) => product.category.toLowerCase() === selectedCategory.toLowerCase());
  }
  const term = searchInput ? searchInput.value.trim().toLowerCase() : '';
  if (term) {
    filtered = filtered.filter((product) => product.name.toLowerCase().includes(term));
  }
  renderProducts(filtered);
  updateShopHeading(filtered.length);
}

async function loadProducts() {
  try {
    const res = await fetch(`${API_ROOT}/products`);
    if (!res.ok) throw new Error('Could not load products');
    allProducts = await res.json();
    applyFilters();
  } catch (error) {
    productsContainer.innerHTML = '<p>Unable to load products. Please start the backend and refresh.</p>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  productsContainer = document.getElementById('products');
  searchInput = document.getElementById('headerSearchInput');

  const params = new URLSearchParams(window.location.search);
  const categoryParam = params.get('category');
  const searchParam = params.get('search');
  if (categoryParam) selectedCategory = categoryParam;
  if (searchParam && searchInput) searchInput.value = searchParam;

  loadProducts();
});
