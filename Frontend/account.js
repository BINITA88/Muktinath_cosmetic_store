const params = new URLSearchParams(window.location.search);
const redirectTo = params.get('redirect') || 'index.html';

const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginPanel = document.getElementById('loginPanel');
const registerPanel = document.getElementById('registerPanel');
const authMessage = document.getElementById('authMessage');

loginTab.addEventListener('click', () => {
  loginTab.classList.add('active');
  registerTab.classList.remove('active');
  loginPanel.classList.add('active');
  registerPanel.classList.remove('active');
  authMessage.textContent = '';
});

registerTab.addEventListener('click', () => {
  registerTab.classList.add('active');
  loginTab.classList.remove('active');
  registerPanel.classList.add('active');
  loginPanel.classList.remove('active');
  authMessage.textContent = '';
});

function showError(err) {
  authMessage.style.color = '#b20e0e';
  authMessage.textContent = `Error: ${err.message}`;
}

document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!email || !password) {
    authMessage.style.color = '#b20e0e';
    authMessage.textContent = 'Email and password are required.';
    return;
  }
  try {
    const res = await fetch(`${API_ROOT}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    const { token, user } = await res.json();
    setCustomerSession(token, user);
    window.location.href = redirectTo;
  } catch (err) {
    showError(err);
  }
});

document.getElementById('registerBtn').addEventListener('click', async () => {
  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const phone = document.getElementById('registerPhone').value.trim();
  const password = document.getElementById('registerPassword').value;
  if (!name || !email || !password) {
    authMessage.style.color = '#b20e0e';
    authMessage.textContent = 'Name, email and password are required.';
    return;
  }
  try {
    const res = await fetch(`${API_ROOT}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Registration failed');
    }
    const { token, user } = await res.json();
    setCustomerSession(token, user);
    window.location.href = redirectTo;
  } catch (err) {
    showError(err);
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  clearCustomerSession();
  window.location.reload();
});

function renderAuthState() {
  if (isCustomerLoggedIn()) {
    document.getElementById('loggedOutView').style.display = 'none';
    document.getElementById('loggedInView').style.display = 'block';
    document.getElementById('accountInfo').textContent = `Logged in as ${localStorage.getItem(CUSTOMER_NAME_KEY) || 'customer'}`;
  } else {
    document.getElementById('loggedOutView').style.display = 'block';
    document.getElementById('loggedInView').style.display = 'none';
  }
}

renderAuthState();
