const form = document.getElementById('unifiedLoginForm');
const loginBtn = document.getElementById('loginBtn');
const msg = document.getElementById('loginMessage');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const redirectTo = new URLSearchParams(window.location.search).get('redirect') || 'index.html';
let selectedRole = new URLSearchParams(window.location.search).get('role') === 'admin' ? 'admin' : 'customer';

const roles = {
  customer: {
    title: 'Welcome back', subtitle: 'Sign in to continue your beauty journey.', emailLabel: 'Email',
    email: 'customer@muktinath.com', password: 'customer123', button: 'Sign in as customer',
    demo: ''
  },
  admin: {
    title: 'Store admin', subtitle: 'Sign in to manage products, orders, and customers.', emailLabel: 'Admin email',
    email: 'admin@muktinath.com', password: 'muktinath123', button: 'Sign in as admin',
    demo: ''
  }
};

function setRole(role) {
  selectedRole = role;
  const config = roles[role];
  document.querySelectorAll('.login-role').forEach((button) => {
    const active = button.dataset.role === role;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  document.getElementById('loginTitle').textContent = config.title;
  document.getElementById('loginSubtitle').textContent = config.subtitle;
  document.getElementById('emailLabel').childNodes[0].textContent = config.emailLabel;
  usernameInput.value = config.email;
  passwordInput.value = config.password;
  usernameInput.placeholder = config.email;
  passwordInput.placeholder = 'Enter your password';
  loginBtn.textContent = config.button;
  msg.textContent = '';
  msg.className = 'admin-login-message';
}

async function readError(response, fallback) {
  const text = await response.text();
  try { return JSON.parse(text).error || fallback; } catch (error) { return fallback; }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginBtn.disabled = true;
  loginBtn.textContent = 'Signing in...';
  try {
    if (selectedRole === 'admin') {
      const res = await fetch('/api/admin/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput.value.trim(), password: passwordInput.value })
      });
      if (!res.ok) throw new Error(await readError(res, 'Admin login failed'));
      const data = await res.json();
      localStorage.setItem('adminToken', data.token);
      window.location.href = 'admin.html';
      return;
    }

    let data;
    if (usernameInput.value.trim() === roles.customer.email && passwordInput.value === roles.customer.password) {
      const res = await fetch('/api/auth/demo-login', { method: 'POST' });
      if (!res.ok) throw new Error(await readError(res, 'Customer login failed'));
      data = await res.json();
    } else {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: usernameInput.value.trim(), password: passwordInput.value })
      });
      if (!res.ok) throw new Error(await readError(res, 'Customer login failed'));
      data = await res.json();
    }
    localStorage.setItem('kalpana_customer_token', data.token);
    localStorage.setItem('kalpana_customer_name', data.user && data.user.name ? data.user.name : '');
    window.location.href = redirectTo;
  } catch (error) {
    msg.textContent = `Error: ${error.message}`;
    msg.classList.add('is-error');
    loginBtn.disabled = false;
    loginBtn.textContent = roles[selectedRole].button;
  }
});

document.querySelectorAll('.login-role').forEach((button) => button.addEventListener('click', () => setRole(button.dataset.role)));
setRole(selectedRole);
