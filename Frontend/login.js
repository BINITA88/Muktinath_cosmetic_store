const loginBtn = document.getElementById('loginBtn');
const msg = document.getElementById('loginMessage');

loginBtn.addEventListener('click', async () => {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  msg.textContent = '';

  if (!username || !password) {
    msg.textContent = 'Username and password are required.';
    msg.style.color = '#b20e0e';
    return;
  }

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Login failed');
    }
    const { token } = await res.json();
    localStorage.setItem('adminToken', token);
    window.location.href = 'admin.html';
  } catch (err) {
    msg.textContent = `Error: ${err.message}`;
    msg.style.color = '#b20e0e';
  }
});
