const STORE_PRODUCTS_KEY = 'muktinath_products';
const STORE_CATEGORIES_KEY = 'muktinath_categories';
const storeSeed = [
  { id: 'cream', name: 'Glow Radiance Cream', category: 'Face Care', price: 499, currency: 'NPR', short: 'Lightweight daily glow moisturizer.', description: 'A nourishing moisturizer for everyday glow.', ingredients: ['Aloe Vera', 'Vitamin E'], stock: 20, image: 'images/cream.png' },
  { id: 'serum', name: 'Vitamin C Serum', category: 'Serum', price: 460, currency: 'NPR', short: 'Brightening care for radiant skin.', description: 'A lightweight brightening serum.', ingredients: ['Vitamin C'], stock: 28, image: 'images/seerum.png' }
];
function getStoreProducts() { try { const data = JSON.parse(localStorage.getItem(STORE_PRODUCTS_KEY)); return Array.isArray(data) ? data : storeSeed; } catch { return storeSeed; } }
function setStoreProducts(items) { localStorage.setItem(STORE_PRODUCTS_KEY, JSON.stringify(items)); }
function getStoreCategories() { const saved = JSON.parse(localStorage.getItem(STORE_CATEGORIES_KEY) || 'null'); return Array.isArray(saved) ? saved : [...new Set(getStoreProducts().map(p => p.category))]; }
function setStoreCategories(items) { localStorage.setItem(STORE_CATEGORIES_KEY, JSON.stringify(items)); }
