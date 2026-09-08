const API_ROOT = '/api';
const CART_KEY = 'kalpana_cart';
const WISHLIST_KEY = 'kalpana_wishlist';
const CUSTOMER_TOKEN_KEY = 'kalpana_customer_token';
const CUSTOMER_NAME_KEY = 'kalpana_customer_name';

const STORE_WHATSAPP_NUMBER = '9779765608115';

const ICONS = {
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
  heartFilled: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
  bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',
  chevronDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
  chevronLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
  chevronRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
  arrowUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-2.8.9.9-2.7-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.7.8-.8 1-.2.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5.1-.1.2-.3.4-.4.1-.1.2-.2.2-.4.1-.2 0-.3 0-.5s-.6-1.5-.8-2c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.2s1 2.6 1.1 2.7c.1.2 2 3 4.8 4.2.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>',
  sparkle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6L12 3Z"/></svg>',
  droplet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2s7 8.5 7 13a7 7 0 1 1-14 0c0-4.5 7-13 7-13Z"/></svg>',
  lips: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M3 10c2-3 5-3 7-1 1 1 2 1 3 0 2-2 5-2 7 1-1 4-4 7-9 7s-8-3-8-7Z"/></svg>',
  bubbles: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="14" r="5"/><circle cx="17" cy="8" r="3"/></svg>',
  bottle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M10 2h4v3l2 2v13a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V7l2-2V2Z"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
  leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20c8 0 16-6 16-16C10 4 4 12 4 20Z"/><path d="M4 20c4-6 8-10 16-16"/></svg>',
  pipette: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M9 3l6 6-8 8-3-3 8-8Z"/><path d="M13 5l4-2 2 2-2 4"/><circle cx="7" cy="17" r="1" fill="currentColor" stroke="none"/></svg>'
};

const CATEGORY_ICON_MAP = {
  'all beauty': 'sparkle',
  'face care': 'droplet',
  'lips': 'lips',
  'face cleanser': 'bubbles',
  'shampoo': 'bottle',
  'keratin': 'leaf',
  'serum': 'pipette'
};

function iconForCategory(name) {
  const key = (name || '').trim().toLowerCase();
  return ICONS[CATEGORY_ICON_MAP[key]] || ICONS.sparkle;
}

// ---------- Formatting ----------

function formatPrice(price, currency) {
  const amount = Number(price) || 0;
  return `Rs ${amount.toLocaleString('ne-NP')} ${currency || 'NPR'}`;
}

// ---------- Cart (guest cart, stored per-browser) ----------

function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

function setCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(product, qty) {
  const cart = getCart();
  const quantity = Math.max(1, Number(qty) || 1);
  const existing = cart.find((item) => item.id === product.id);
  if (existing) {
    existing.qty += quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      currency: product.currency,
      image: product.image,
      qty: quantity
    });
  }
  setCart(cart);
}

function updateCartQty(id, qty) {
  const cart = getCart();
  const item = cart.find((i) => i.id === id);
  if (!item) return;
  item.qty = Math.max(1, Number(qty) || 1);
  setCart(cart);
}

function removeFromCart(id) {
  const cart = getCart().filter((i) => i.id !== id);
  setCart(cart);
}

function clearCart() {
  setCart([]);
}

function cartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function cartSubtotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.qty, 0);
}

function updateCartBadge() {
  const badge = document.getElementById('cartCount');
  if (badge) badge.textContent = cartCount();
}

// ---------- Wishlist ----------

function getWishlist() {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

function setWishlist(list) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
  updateWishlistBadge();
}

function isInWishlist(id) {
  return getWishlist().some((item) => item.id === id);
}

function toggleWishlist(product) {
  const list = getWishlist();
  const idx = list.findIndex((item) => item.id === product.id);
  if (idx >= 0) {
    list.splice(idx, 1);
  } else {
    list.push({ id: product.id, name: product.name, price: product.price, currency: product.currency, image: product.image });
  }
  setWishlist(list);
  return idx < 0;
}

function removeFromWishlist(id) {
  setWishlist(getWishlist().filter((item) => item.id !== id));
}

function wishlistCount() {
  return getWishlist().length;
}

function updateWishlistBadge() {
  const badge = document.getElementById('wishlistCount');
  if (badge) badge.textContent = wishlistCount();
}

// ---------- Customer auth ----------

function getCustomerToken() {
  return localStorage.getItem(CUSTOMER_TOKEN_KEY);
}

function isCustomerLoggedIn() {
  return Boolean(getCustomerToken());
}

function customerAuthHeaders() {
  const token = getCustomerToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function setCustomerSession(token, user) {
  localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
  localStorage.setItem(CUSTOMER_NAME_KEY, user && user.name ? user.name : '');
}

function clearCustomerSession() {
  localStorage.removeItem(CUSTOMER_TOKEN_KEY);
  localStorage.removeItem(CUSTOMER_NAME_KEY);
}

function updateAccountNav() {
  const link = document.getElementById('accountLink');
  if (!link) return;
  const label = link.querySelector('.icon-label');
  const text = isCustomerLoggedIn()
    ? `Hi, ${(localStorage.getItem(CUSTOMER_NAME_KEY) || 'Account').split(' ')[0]}`
    : 'Login';
  if (label) {
    label.textContent = text;
  } else {
    link.setAttribute('title', text);
  }
}

// ---------- Shared header ----------

function headerTemplate(subtitle) {
  return `
    <header class="site-header storefront-header">
      <div class="container header-top">
        <a href="index.html" class="brand">
          <img src="images/logo.png" alt="Muktinath Collection Stores" class="brand-logo" />
        </a>
        <form id="headerSearchForm" class="search-bar">
          <input id="headerSearchInput" type="search" placeholder="Search for products..." autocomplete="off" />
          <button type="submit" title="Search">${ICONS.search}</button>
        </form>
        <div class="icon-nav">
          <a href="wishlist.html" class="icon-btn" title="Wishlist">${ICONS.heart}<span class="icon-badge" id="wishlistCount">0</span></a>
          <a href="cart.html" class="icon-btn" title="Cart">${ICONS.bag}<span class="icon-badge" id="cartCount">0</span></a>
          <a href="orders.html" class="icon-btn" title="My Orders">${ICONS.clock}</a>
          <a href="account.html" class="icon-btn account-btn" id="accountLink" title="Account">${ICONS.user}<span class="icon-label">Login</span></a>
        </div>
      </div>
      ${subtitle ? `<div class="container header-subtitle">${subtitle}</div>` : ''}
      <nav class="category-nav">
        <div class="container category-nav-inner">
          <div class="category-nav-row" id="categoryNavRow">
            <a href="index.html" class="category-nav-item">${ICONS.sparkle}<span>All Beauty</span></a>
          </div>
          <div class="dropdown more-dropdown" id="moreDropdown">
            <button type="button" class="dropdown-toggle">More ${ICONS.chevronDown}</button>
            <div class="dropdown-menu">
              <a href="index.html#products">New Arrivals</a>
              <a href="index.html#products">Best Sellers</a>
              <a href="orders.html">Track Order</a>
              <a href="index.html#contact">Contact Us</a>
            </div>
          </div>
        </div>
      </nav>
    </header>
  `;
}

function footerTemplate() {
  return `
    <footer class="site-footer" id="contact">
      <div class="container footer-grid">
        <div>
          <h4>Muktinath Collection Stores</h4>
          <p>Quality beauty &amp; personal care products, delivered across Nepal.</p>
        </div>
        <div>
          <h4>Contact Us</h4>
          <p>Beni Municipality-07, Myagdi, Nepal<br/>9765608115 (WhatsApp)<br/>muktinathcollectionstores@gmail.com<br/>Contact Person: Jenisha KC</p>
        </div>
        <div>
          <h4>We Accept</h4>
          <p class="pay-methods">Cash on Delivery &middot; eSewa &middot; Khalti</p>
        </div>
        <div>
          <h4>Business Registration</h4>
          <p>E-commerce Reg No: 4-44-454-115/2082/83<br/>PAN No: 130388395<br/>Registration No: 2932</p>
        </div>
      </div>
      <p class="footer-copy">&copy; 2026 Muktinath Collection Stores. Made in Nepal, for Nepali skin.</p>
    </footer>
  `;
}

function floatingButtonsTemplate() {
  return `
    <button id="scrollTopBtn" class="floating-btn scroll-top-btn" title="Back to top">${ICONS.arrowUp}</button>
    <a id="whatsappBtn" class="floating-btn whatsapp-btn" title="Chat with us on WhatsApp"
       href="https://wa.me/${STORE_WHATSAPP_NUMBER}" target="_blank" rel="noopener">${ICONS.whatsapp}</a>
  `;
}

function wireHeaderEvents() {
  const searchForm = document.getElementById('headerSearchForm');
  if (searchForm) {
    searchForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const term = document.getElementById('headerSearchInput').value.trim();
      if (typeof applyFilters === 'function' && typeof searchInput !== 'undefined' && searchInput) {
        searchInput.value = term;
        applyFilters();
      } else {
        window.location.href = `index.html?search=${encodeURIComponent(term)}`;
      }
    });
  }

  const dropdown = document.getElementById('moreDropdown');
  if (dropdown) {
    const toggle = dropdown.querySelector('.dropdown-toggle');
    toggle.addEventListener('click', (event) => {
      event.stopPropagation();
      dropdown.classList.toggle('open');
    });
    document.addEventListener('click', () => dropdown.classList.remove('open'));
  }
}

async function loadHeaderCategories() {
  const row = document.getElementById('categoryNavRow');
  if (!row) return;
  try {
    const res = await fetch(`${API_ROOT}/categories`);
    const categories = await res.json();
    row.innerHTML = ['All Beauty', ...categories].map((c) => `
      <a href="index.html?category=${encodeURIComponent(c)}" class="category-nav-item">${iconForCategory(c)}<span>${c}</span></a>
    `).join('');
  } catch (err) {
    // keep default "All Beauty" entry
  }
}

function wireFloatingButtons() {
  const scrollBtn = document.getElementById('scrollTopBtn');
  if (!scrollBtn) return;
  window.addEventListener('scroll', () => {
    scrollBtn.classList.toggle('visible', window.scrollY > 300);
  });
  scrollBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function renderLayout() {
  const headerTarget = document.getElementById('siteHeader');
  if (headerTarget) {
    const subtitle = headerTarget.dataset.subtitle || '';
    headerTarget.outerHTML = headerTemplate(subtitle);
    wireHeaderEvents();
    loadHeaderCategories();
  }

  const footerTarget = document.getElementById('siteFooter');
  if (footerTarget) {
    footerTarget.outerHTML = footerTemplate();
  }

  document.body.insertAdjacentHTML('beforeend', floatingButtonsTemplate());
  wireFloatingButtons();

  updateCartBadge();
  updateWishlistBadge();
  updateAccountNav();
}

document.addEventListener('DOMContentLoaded', renderLayout);
