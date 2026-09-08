const $ = (id) => document.getElementById(id);
let products = [];
let cats = [];
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
  `).join('') || '<p class="admin-empty">No products yet.</p>';
  $('categoriesList').innerHTML = cats.map((category) => `<article><span>${escapeHtml(category)}</span><div><button data-r="${escapeHtml(category)}">Rename</button><button class="danger" data-c="${escapeHtml(category)}">Delete</button></div></article>`).join('');
  document.querySelectorAll('[data-e]').forEach((button) => { button.onclick = () => edit(button.dataset.e); });
  document.querySelectorAll('[data-d]').forEach((button) => { button.onclick = () => delProduct(button.dataset.d); });
  document.querySelectorAll('[data-r]').forEach((button) => { button.onclick = () => rename(button.dataset.r); });
  document.querySelectorAll('[data-c]').forEach((button) => { button.onclick = () => delCat(button.dataset.c); });
}

async function edit(id) {
  const product = await api(`/products/${id}`);
  ['name', 'category', 'price', 'stock', 'short', 'description'].forEach((key) => { $(key).value = product[key] || ''; });
  $('ingredients').value = (product.ingredients || []).join(',');
  $('imageUrl').value = product.image;
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
  if (name === 'tiktok') loadTikTokPosts();
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
      </table></div>` : '<p class="admin-empty">No orders yet.</p>';
    document.querySelectorAll('[data-payment-id]').forEach((select) => select.addEventListener('change', () => updateOrder(select.dataset.paymentId, { paymentVerification: select.value })));
    document.querySelectorAll('[data-order-id]').forEach((select) => select.addEventListener('change', () => updateOrder(select.dataset.orderId, { status: select.value })));
  } catch (error) {
    $('ordersList').innerHTML = '<p class="admin-empty">Could not load orders. Please try again.</p>';
    msg(error.message, true);
  }
}

async function loadTikTokPosts() {
  try {
    const posts = await api('/admin/tiktok-posts');
    $('adminTikTokList').innerHTML = posts.length ? posts.map((post) => `
      <article class="admin-tiktok-row">
        <div><strong>TikTok video</strong><a href="${escapeHtml(post.url)}" target="_blank" rel="noopener">${escapeHtml(post.url)}</a><small>Added ${formatOrderDate(post.createdAt)}</small></div>
        <button class="admin-secondary danger" data-tiktok-delete="${post.id}">Remove</button>
      </article>
    `).join('') : '<p class="admin-empty">No TikTok videos added yet.</p>';
    document.querySelectorAll('[data-tiktok-delete]').forEach((button) => button.addEventListener('click', async () => {
      if (!confirm('Remove this TikTok video from the homepage?')) return;
      try { await api(`/admin/tiktok-posts/${button.dataset.tiktokDelete}`, { method: 'DELETE' }); msg('TikTok video removed'); loadTikTokPosts(); } catch (error) { msg(error.message, true); }
    }));
  } catch (error) {
    $('adminTikTokList').innerHTML = '<p class="admin-empty">Could not load TikTok videos.</p>';
    msg(error.message, true);
  }
}

document.querySelectorAll('.admin-nav').forEach((button) => { button.onclick = () => panel(button.dataset.panel); });
$('logoutBtn').onclick = () => { localStorage.removeItem('adminToken'); location = 'login.html?role=admin'; };
$('cancelEditBtn').onclick = reset;
$('productSearch').oninput = render;
$('refreshOrders').onclick = orders;
$('tiktokAdminForm').onsubmit = async (event) => {
  event.preventDefault();
  try {
    await api('/admin/tiktok-posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: $('tiktokPostUrl').value.trim() }) });
    $('tiktokPostUrl').value = '';
    msg('TikTok video added');
    loadTikTokPosts();
  } catch (error) { msg(error.message, true); }
};
$('categoryForm').onsubmit = async (event) => {
  event.preventDefault();
  try { await api('/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: $('newCategory').value }) }); $('newCategory').value = ''; load(); } catch (error) { msg(error.message, true); }
};
$('adminForm').onsubmit = async (event) => {
  event.preventDefault();
  try {
    let image = $('imageUrl').value;
    const file = $('imageFile').files[0];
    if (file) { const formData = new FormData(); formData.append('image', file); image = (await api('/uploads/product-image', { method: 'POST', body: formData })).image; }
    const id = $('productId').value;
    const product = { name: $('name').value, category: $('category').value, price: +$('price').value, stock: +$('stock').value, short: $('short').value, description: $('description').value, ingredients: $('ingredients').value, image, currency: 'NPR' };
    await api(id ? `/products/${id}` : '/products', { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(product) });
    reset(); msg('Product saved'); load();
  } catch (error) { msg(error.message, true); }
};

(async () => {
  try { await api('/admin/check'); $('authStatus').textContent = 'Atlas admin'; load(); } catch (error) { location = 'login.html?role=admin'; }
})();
