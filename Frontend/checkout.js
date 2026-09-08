const SHIPPING_FEE = 100;
const FREE_SHIPPING_THRESHOLD = 3000;

const checkoutForm = document.getElementById('checkoutForm');
const checkoutMessage = document.getElementById('checkoutMessage');
const placeOrderBtn = document.getElementById('placeOrderBtn');

function renderSummary() {
  const cart = getCart();
  const list = document.getElementById('orderSummaryList');
  const currency = cart[0] ? cart[0].currency : 'NPR';
  list.innerHTML = cart.map((item) => `
    <div class="order-summary-item">
      <span>${item.name} x${item.qty}</span>
      <span>${formatPrice(item.price * item.qty, item.currency)}</span>
    </div>
  `).join('');

  const subtotal = cartSubtotal();
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shippingFee;

  document.getElementById('summarySubtotal').textContent = formatPrice(subtotal, currency);
  document.getElementById('summaryShipping').textContent = shippingFee === 0 ? 'Free' : formatPrice(shippingFee, currency);
  document.getElementById('summaryTotal').textContent = formatPrice(total, currency);
}

async function prefillFromAccount() {
  try {
    const res = await fetch(`${API_ROOT}/auth/me`, { headers: customerAuthHeaders() });
    if (!res.ok) return;
    const user = await res.json();
    document.getElementById('fullName').value = user.name || '';
    document.getElementById('phone').value = user.phone || '';
  } catch (err) {
    // ignore, fields stay blank
  }
}

checkoutForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  checkoutMessage.textContent = '';

  const cart = getCart();
  if (!cart.length) {
    checkoutMessage.style.color = '#b20e0e';
    checkoutMessage.textContent = 'Your cart is empty.';
    return;
  }

  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
  const payload = {
    items: cart.map((item) => ({ id: item.id, name: item.name, qty: item.qty })),
    shippingAddress: {
      fullName: document.getElementById('fullName').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      city: document.getElementById('city').value.trim(),
      address: document.getElementById('address').value.trim(),
      notes: document.getElementById('notes').value.trim()
    },
    paymentMethod
  };

  placeOrderBtn.disabled = true;
  placeOrderBtn.textContent = 'Placing order...';

  try {
    const res = await fetch(`${API_ROOT}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...customerAuthHeaders() },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Could not place order');
    }
    const order = await res.json();
    clearCart();
    window.location.href = `order-success.html?id=${order.id}`;
  } catch (error) {
    checkoutMessage.style.color = '#b20e0e';
    checkoutMessage.textContent = `Error: ${error.message}`;
    placeOrderBtn.disabled = false;
    placeOrderBtn.textContent = 'Place Order';
  }
});

if (!getCart().length) {
  window.location.href = 'cart.html';
} else if (!isCustomerLoggedIn()) {
  window.location.href = 'account.html?redirect=checkout.html';
} else {
  renderSummary();
  prefillFromAccount();
}
