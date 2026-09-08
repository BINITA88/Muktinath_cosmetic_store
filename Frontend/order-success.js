const params = new URLSearchParams(window.location.search);
const orderId = params.get('id');
const content = document.getElementById('orderSuccessContent');

async function loadOrder() {
  if (!orderId) {
    content.innerHTML = '<p>No order found.</p>';
    return;
  }
  try {
    const res = await fetch(`${API_ROOT}/orders/${orderId}`, { headers: customerAuthHeaders() });
    if (!res.ok) {
      content.innerHTML = '<p>Order not found.</p>';
      return;
    }
    const order = await res.json();
    content.innerHTML = `
      <div class="tick">✅</div>
      <h2>Thank you, ${order.shippingAddress.fullName}!</h2>
      <p>Your order <span class="order-id">#${order.id}</span> has been placed successfully.</p>
      <p>Payment method: <strong>${order.paymentMethod}</strong> &middot; Total: <strong>${formatPrice(order.total, order.currency)}</strong></p>
      <p>We'll deliver to: ${order.shippingAddress.address}, ${order.shippingAddress.city}</p>
      <div class="actions">
        <a class="btn" href="index.html">Continue Shopping</a>
        <a class="btn btn-outline" href="orders.html">View My Orders</a>
      </div>
    `;
  } catch (error) {
    content.innerHTML = '<p>Could not load order details.</p>';
  }
}

loadOrder();
