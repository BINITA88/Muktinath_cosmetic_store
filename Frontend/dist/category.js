const apiRoot = '/api';
const addCategoryBtn = document.getElementById('addCategoryBtn');
const categoryList = document.getElementById('categoryList');
const categoryMessage = document.getElementById('categoryMessage');

function requireLogin() {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function authHeaders() {
  const token = localStorage.getItem('adminToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function loadCategories() {
  try {
    const res = await fetch(`${apiRoot}/categories`, { headers: authHeaders() });
    const categories = await res.json();
    categoryList.innerHTML = categories.length
      ? `<ul>${categories.map((c) => `<li>${c}</li>`).join('')}</ul>`
      : '<p>No categories yet.</p>';
  } catch (err) {
    categoryList.innerHTML = '<p>Could not load categories.</p>';
  }
}

addCategoryBtn.addEventListener('click', async () => {
  const newCategory = document.getElementById('newCategory').value.trim();
  if (!newCategory) {
    categoryMessage.textContent = 'Please enter a category name.';
    categoryMessage.style.color = '#b20e0e';
    return;
  }
  try {
    const res = await fetch(`${apiRoot}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ name: newCategory })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Could not add category');
    }
    categoryMessage.textContent = 'Category added successfully!';
    categoryMessage.style.color = '#008000';
    document.getElementById('newCategory').value = '';
    await loadCategories();
  } catch (error) {
    categoryMessage.textContent = `Error: ${error.message}`;
    categoryMessage.style.color = '#b20e0e';
  }
});

if (requireLogin()) {
  loadCategories();
}
