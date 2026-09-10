const $ = (id) => document.getElementById(id);

const ADMIN_ICONS = {
  box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8 12 3 3 8l9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>',
  tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 11.6 12.9 4H4v8.9l7.6 7.6a2 2 0 0 0 2.8 0l6.1-6.1a2 2 0 0 0 0-2.8Z"/><circle cx="8.5" cy="8.5" r="1.4" fill="currentColor" stroke="none"/></svg>',
  receipt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2Z"/><path d="M9 7h6"/><path d="M9 11h6"/><path d="M9 15h4"/></svg>',
  video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="14" height="12" rx="2"/><path d="M16 10.5 22 7v10l-6-3.5Z"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="13"/><circle cx="12" cy="16.3" r="0.9" fill="currentColor" stroke="none"/></svg>'
};

function emptyState(icon, title, subtitle) {
  return `<div class="admin-empty"><span class="admin-empty-icon">${icon}</span><strong>${title}</strong><p>${subtitle}</p></div>`;
}

function revealWelcomeText(el, text) {
  if (!el) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = text; return; }
  let charIndex = 0;
  el.innerHTML = text.split(' ').map((word) => {
    const chars = word.split('').map((char) => {
      const span = `<span class="admin-welcome-char" style="animation-delay:${charIndex * 40}ms">${char}</span>`;
      charIndex += 1;
      return span;
    }).join('');
    return `<span class="admin-welcome-word">${chars}</span>`;
  }).join(' ');
}
let products = [];
let cats = [];
let savedProductImages = [];
let savedImageVariants = [];
const ORDER_STATUSES = ['Payment Verification', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const PAYMENT_STATUSES = ['Awaiting review', 'Verified', 'Not verified', 'Not required'];

const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('adminToken')}` });

async function api(url, options = {}) {
  const response = await fetch(`/api${url}`, { ...options, headers: { ...auth(), ...(options.headers || {}) } });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || 'Request failed');
  return data;
}

function msg(text, error = false) {
  $('adminMessage').textContent = text;
  $('adminMessage').className = `admin-message ${error ? 'error' : 'success'}`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function productVariants() {
  return [...new Set($('variants').value.split(',').map((variant) => variant.trim()).filter(Boolean))];
}

function selectedImageFiles() {
  return Array.from(document.querySelectorAll('[data-image-file-input]'))
    .flatMap((input) => Array.from(input.files))
    .slice(0, 6);
}

function resetImageInputs() {
  document.querySelectorAll('[data-image-file-input]:not(#imageFiles)').forEach((input) => input.remove());
  $('imageFiles').value = '';
}

function bindImageInput(input) {
  input.addEventListener('change', () => renderUploadPreview(selectedImageFiles()));
}

function renderSavedImagePreview() {
  $('imagePreview').innerHTML = savedProductImages.length
    ? savedProductImages.map((image, index) => {
      const shade = savedImageVariants.find((item) => item.image === image)?.variant;
      return `<figure><img src="${escapeHtml(image)}" alt="Saved product image ${index + 1}"><figcaption>${index === 0 ? 'Cover image' : shade || `Image ${index + 1}`}</figcaption></figure>`;
    }).join('')
    : '<span>Upload up to 6 product images. Add shades first to link each image to a colour.</span>';
}

function renderUploadPreview(files) {
  const variants = productVariants();
  if (!files.length) {
    renderSavedImagePreview();
    return;
  }
  $('imagePreview').innerHTML = files.map((file, index) => `<figure><img src="${URL.createObjectURL(file)}" alt="New product image ${index + 1}"><figcaption>${index === 0 ? 'Cover image' : `Image ${index + 1}`}</figcaption><select data-image-variant="${index}" aria-label="Shade for image ${index + 1}"><option value="">${index === 0 ? 'Cover / no shade' : 'No shade'}</option>${variants.map((variant) => `<option value="${escapeHtml(variant)}">${escapeHtml(variant)}</option>`).join('')}</select></figure>`).join('');
}

function formatOrderDate(value) {
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function paymentStatusFor(order) {
  return order.paymentVerification || (order.paymentMethod === 'COD' ? 'Not required' : 'Awaiting review');
}

function optionList(values, selected) {
  return values.map((value) => `<option value="${value}" ${value === selected ? 'selected' : ''}>${value}</option>`).join('');
}

async function load() {
  const [dashboard, categories, catalog] = await Promise.all([api('/admin/dashboard'), api('/categories'), api('/products')]);
  cats = categories;
  products = catalog;
  $('statProducts').textContent = dashboard.products;
  $('statCategories').textContent = dashboard.categories;
  $('statOrders').textContent = dashboard.orders;
  $('statPending').textContent = dashboard.pendingOrders;
  $('category').innerHTML = cats.map((category) => `<option>${escapeHtml(category)}</option>`).join('');
  render();
}

function render() {
  const query = $('productSearch').value.toLowerCase();
  $('productsList').innerHTML = products.filter((product) => (product.name + product.category).toLowerCase().includes(query)).map((product) => `
    <article class="admin-product-row"><img src="${product.image}" alt=""><div><strong>${escapeHtml(product.name)}</strong><span>${escapeHtml(product.category)} · Rs ${product.price} · ${product.stock} in stock</span></div><div><button data-e="${product.id}">Edit</button><button class="danger" data-d="${product.id}">Delete</button></div></article>
  `).join('') || emptyState(ADMIN_ICONS.box, query ? 'No matching products' : 'No products yet', query ? 'Try a different search term.' : 'Add your first product using the form above.');
  $('categoriesList').innerHTML = cats.length ? cats.map((category) => `<article><span>${escapeHtml(category)}</span><div><button data-r="${escapeHtml(category)}">Rename</button><button class="danger" data-c="${escapeHtml(category)}">Delete</button></div></article>`).join('') : emptyState(ADMIN_ICONS.tag, 'No categories yet', 'Add your first category using the form above.');
  document.querySelectorAll('[data-e]').forEach((button) => { button.onclick = () => edit(button.dataset.e); });
  document.querySelectorAll('[data-d]').forEach((button) => { button.onclick = () => delProduct(button.dataset.d); });
  document.querySelectorAll('[data-r]').forEach((button) => { button.onclick = () => rename(button.dataset.r); });
  document.querySelectorAll('[data-c]').forEach((button) => { button.onclick = () => delCat(button.dataset.c); });
}

async function edit(id) {
  const product = await api(`/products/${id}`);
  ['name', 'category', 'price', 'stock', 'short', 'description'].forEach((key) => { $(key).value = product[key] || ''; });
  $('ingredients').value = (product.ingredients || []).join(',');
  $('variants').value = (product.variants || []).join(',');
  savedProductImages = product.images?.length ? product.images : [product.image];
  savedImageVariants = product.imageVariants || [];
  resetImageInputs();
  renderSavedImagePreview();
  $('productId').value = id;
  $('saveBtn').textContent = 'Update product';
  $('cancelEditBtn').hidden = false;
  panel('products');
}

function reset() {
  $('adminForm').reset();
  $('productId').value = '';
  $('saveBtn').textContent = 'Save product';
  $('cancelEditBtn').hidden = true;
  savedProductImages = [];
  savedImageVariants = [];
  resetImageInputs();
  renderSavedImagePreview();
}

async function delProduct(id) {
  if (!confirm('Delete product?')) return;
  try { await api(`/products/${id}`, { method: 'DELETE' }); msg('Product deleted'); load(); } catch (error) { msg(error.message, true); }
}

async function rename(category) {
  const name = prompt('New name', category);
  if (!name) return;
  try { await api(`/categories/${encodeURIComponent(category)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) }); load(); } catch (error) { msg(error.message, true); }
}

async function delCat(category) {
  if (!confirm('Delete category?')) return;
  try { await api(`/categories/${encodeURIComponent(category)}`, { method: 'DELETE' }); load(); } catch (error) { msg(error.message, true); }
}

function panel(name) {
  document.querySelectorAll('.admin-nav').forEach((button) => button.classList.toggle('active', button.dataset.panel === name));
  document.querySelectorAll('.admin-panel').forEach((section) => section.classList.toggle('active', section.dataset.panelContent === name));
  if (name === 'orders') orders();
  if (name === 'videos') loadShowcaseVideos();
}

async function updateOrder(id, update) {
  try {
    await api(`/admin/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(update) });
    msg('Order updated');
    orders();
  } catch (error) {
    msg(error.message, true);
  }
}

async function orders() {
  try {
    const list = await api('/admin/orders');
    $('ordersList').innerHTML = list.length ? `
      <div class="admin-orders-table"><table><colgroup><col class="order-col"><col class="customer-col"><col class="items-col"><col class="total-col"><col class="proof-col"><col class="payment-status-col"><col class="order-status-col"></colgroup>
        <thead><tr><th>Order</th><th>Customer & delivery</th><th>Items</th><th>Total</th><th>Payment & proof</th><th>Payment status</th><th>Order status</th></tr></thead>
        <tbody>${list.map((order) => {
          const address = order.shippingAddress || {};
          const proof = order.paymentProof ? `<a class="payment-proof-link" href="${order.paymentProof}" target="_blank" rel="noopener">View screenshot ↗</a>` : '<span class="admin-no-proof">No document</span>';
          return `<tr>
            <td><strong>#${escapeHtml(String(order.id).slice(-6))}</strong><small>${formatOrderDate(order.createdAt)}</small></td>
            <td><strong>${escapeHtml(order.customerName || address.fullName)}</strong><small>${escapeHtml(address.phone)}<br>${escapeHtml(address.address)}, ${escapeHtml(address.city)}${address.notes ? `<br><em>${escapeHtml(address.notes)}</em>` : ''}</small></td>
            <td class="admin-order-items">${(order.items || []).map((item) => `<span>${escapeHtml(item.name)} <b>×${item.qty}</b></span>`).join('')}</td>
            <td><strong>Rs ${Number(order.total || 0).toLocaleString('en-NP')}</strong><small>${order.currency || 'NPR'}</small></td>
            <td><strong>${escapeHtml(order.paymentMethod || 'COD')}</strong>${proof}</td>
            <td><select class="admin-payment-status" data-payment-id="${order.id}">${optionList(PAYMENT_STATUSES, paymentStatusFor(order))}</select></td>
            <td><select class="admin-order-status" data-order-id="${order.id}">${optionList(ORDER_STATUSES, order.status || 'Pending')}</select></td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>` : emptyState(ADMIN_ICONS.receipt, 'No orders yet', 'Customer orders will show up here as soon as they come in.');
    document.querySelectorAll('[data-payment-id]').forEach((select) => select.addEventListener('change', () => updateOrder(select.dataset.paymentId, { paymentVerification: select.value })));
    document.querySelectorAll('[data-order-id]').forEach((select) => select.addEventListener('change', () => updateOrder(select.dataset.orderId, { status: select.value })));
  } catch (error) {
    $('ordersList').innerHTML = emptyState(ADMIN_ICONS.alert, 'Could not load orders', 'Please try again.');
    msg(error.message, true);
  }
}

async function loadShowcaseVideos() {
  try {
    const videos = await api('/admin/showcase-videos');
    $('adminVideoList').innerHTML = videos.length ? videos.map((video) => `
      <article class="admin-tiktok-row">
        <video src="${escapeHtml(video.video)}" muted preload="metadata" class="admin-video-thumb"></video>
        <div><strong>${escapeHtml(video.caption || 'Beauty video')}</strong><a href="${escapeHtml(video.video)}" target="_blank" rel="noopener">${escapeHtml(video.video)}</a><small>Added ${formatOrderDate(video.createdAt)}</small></div>
        <button class="admin-secondary danger" data-video-delete="${video.id}">Remove</button>
      </article>
    `).join('') : emptyState(ADMIN_ICONS.video, 'No videos uploaded yet', 'Upload a short video above to feature it on the store homepage.');
    document.querySelectorAll('[data-video-delete]').forEach((button) => button.addEventListener('click', async () => {
      if (!confirm('Remove this video from the homepage?')) return;
      try { await api(`/admin/showcase-videos/${button.dataset.videoDelete}`, { method: 'DELETE' }); msg('Video removed'); loadShowcaseVideos(); } catch (error) { msg(error.message, true); }
    }));
  } catch (error) {
    $('adminVideoList').innerHTML = emptyState(ADMIN_ICONS.alert, 'Could not load videos', 'Please try again.');
    msg(error.message, true);
  }
}

document.querySelectorAll('.admin-nav').forEach((button) => { button.onclick = () => panel(button.dataset.panel); });
function onLogoutModalKeydown(event) {
  if (event.key === 'Escape') closeLogoutModal();
}
function openLogoutModal() {
  $('logoutModal').hidden = false;
  document.addEventListener('keydown', onLogoutModalKeydown);
}
function closeLogoutModal() {
  $('logoutModal').hidden = true;
  document.removeEventListener('keydown', onLogoutModalKeydown);
}
$('logoutBtn').onclick = openLogoutModal;
$('logoutCancelBtn').onclick = closeLogoutModal;
$('logoutConfirmBtn').onclick = () => { localStorage.removeItem('adminToken'); location = 'login.html?role=admin'; };
$('logoutModal').addEventListener('click', (event) => { if (event.target === $('logoutModal')) closeLogoutModal(); });
$('cancelEditBtn').onclick = reset;
$('productSearch').oninput = render;
$('variants').addEventListener('input', () => {
  const files = selectedImageFiles();
  if (files.length) renderUploadPreview(files);
});
bindImageInput($('imageFiles'));
$('addImageInput').addEventListener('click', () => {
  if (selectedImageFiles().length >= 6) {
    msg('You can upload a maximum of 6 images.', true);
    return;
  }
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.dataset.imageFileInput = '';
  $('imageUploadInputs').append(input);
  bindImageInput(input);
  input.click();
});
renderSavedImagePreview();
$('refreshOrders').onclick = orders;
$('videoAdminForm').onsubmit = async (event) => {
  event.preventDefault();
  const file = $('videoFile').files[0];
  if (!file) { msg('Choose a video file to upload', true); return; }
  try {
    msg('Uploading video…');
    const formData = new FormData();
    formData.append('video', file);
    const { video } = await api('/uploads/showcase-video', { method: 'POST', body: formData });
    await api('/admin/showcase-videos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ video, caption: $('videoCaption').value.trim() }) });
    $('videoAdminForm').reset();
    msg('Video added');
    loadShowcaseVideos();
  } catch (error) { msg(error.message, true); }
};
$('categoryForm').onsubmit = async (event) => {
  event.preventDefault();
  try { await api('/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: $('newCategory').value }) }); $('newCategory').value = ''; load(); } catch (error) { msg(error.message, true); }
};
$('adminForm').onsubmit = async (event) => {
  event.preventDefault();
  try {
    const imageFiles = selectedImageFiles();
    let uploadedImages = [];
    let imageVariants = savedImageVariants;
    if (imageFiles.length) {
      const formData = new FormData();
      imageFiles.forEach((file) => formData.append('images', file));
      uploadedImages = (await api('/uploads/product-images', { method: 'POST', body: formData })).images;
      imageVariants = uploadedImages.map((image, index) => ({
        image,
        variant: document.querySelector(`[data-image-variant="${index}"]`)?.value || ''
      })).filter((item) => item.variant);
    }
    const images = uploadedImages.length ? uploadedImages : savedProductImages;
    const image = images[0];
    const id = $('productId').value;
    const product = { name: $('name').value, category: $('category').value, price: +$('price').value, stock: +$('stock').value, short: $('short').value, description: $('description').value, ingredients: $('ingredients').value, variants: $('variants').value, image, images, imageVariants, currency: 'NPR' };
    await api(id ? `/products/${id}` : '/products', { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(product) });
    reset(); msg('Product saved'); load();
  } catch (error) { msg(error.message, true); }
};

(async () => {
  try { await api('/admin/check'); revealWelcomeText($('adminWelcome'), 'Welcome Kalpana Acharya to admin Dashboard!'); load(); } catch (error) { location = 'login.html?role=admin'; }
})();
