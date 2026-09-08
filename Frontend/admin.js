const apiRoot = '/api';
const adminForm = document.getElementById('adminForm');
const message = document.getElementById('adminMessage');
const categorySelect = document.getElementById('category');
const logoutBtn = document.getElementById('logoutBtn');
const authStatus = document.getElementById('authStatus');

function authHeaders() {
  const token = localStorage.getItem('adminToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function requireLogin() {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

async function validateToken() {
  try {
    const res = await fetch(`${apiRoot}/admin/check`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Not authorized');
    const data = await res.json();
    authStatus.textContent = `Logged in as admin`; 
    return data;
  } catch (err) {
    localStorage.removeItem('adminToken');
    window.location.href = 'login.html';
  }
}

async function loadCategories() {
  try {
    const res = await fetch(`${apiRoot}/categories`, { headers: authHeaders() });
    const categories = await res.json();
    categorySelect.innerHTML = categories.length
      ? categories.map((c) => `<option value="${c}">${c}</option>`).join('')
      : '<option value="">No categories</option>';
  } catch (err) {
    categorySelect.innerHTML = '<option value="">Error loading</option>';
  }
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

adminForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.textContent = '';

  let imageData = document.getElementById('imageUrl').value.trim();
  const imageFileInput = document.getElementById('imageFile');
  if (!imageData && imageFileInput.files.length > 0) {
    imageData = await readImageFile(imageFileInput.files[0]);
  }

  if (!imageData) {
    message.textContent = 'Please provide an image URL or upload an image.';
    message.style.color = '#b20e0e';
    return;
  }

  const payload = {
    name: document.getElementById('name').value.trim(),
    category: document.getElementById('category').value,
    price: Number(document.getElementById('price').value),
    currency: document.getElementById('currency').value.trim() || 'NPR',
    short: document.getElementById('short').value.trim(),
    description: document.getElementById('description').value.trim(),
    ingredients: document.getElementById('ingredients').value.trim(),
    stock: Number(document.getElementById('stock').value),
    image: imageData
  };

  try {
    const res = await fetch(`${apiRoot}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Save failed');
    }
    message.textContent = 'Product added successfully!';
    message.style.color = '#008000';
    adminForm.reset();
    await loadCategories();
  } catch (error) {
    message.textContent = `Error: ${error.message}`;
    message.style.color = '#b20e0e';
  }
});

logoutBtn.addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.removeItem('adminToken');
  window.location.href = 'login.html';
});

if (requireLogin()) {
  validateToken();
  loadCategories();
}
