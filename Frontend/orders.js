const ordersContent = document.getElementById('ordersContent');

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

async function loadOrders() {
  try {
    const res = await fetch(`${API_ROOT}/orders`, { headers: customerAuthHeaders() });
    if (!res.ok) throw new Error('Could not load orders');
    const orders = await res.json();

    if (!orders.length) {
      ordersContent.innerHTML = `
        <div class="empty-state">
          <p>You haven't placed any orders yet.</p>
          <a class="btn" href="index.html">Start Shopping</a>
        </div>
      `;
      return;
    }

    ordersContent.innerHTML = `
      <table class="orders-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Date</th>
            <th>Items</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map((order) => `
            <tr>
              <td>#${order.id}</td>
              <td>${formatDate(order.createdAt)}</td>
              <td class="order-items-preview">${order.items.map((i) => `${i.name} x${i.qty}`).join(', ')}</td>
              <td>${formatPrice(order.total, order.currency)}</td>
              <td>${order.paymentMethod}</td>
              <td><span class="status-badge status-${order.status}">${order.status}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    ordersContent.innerHTML = '<p>Could not load your orders. Please try again.</p>';
  }
}

if (!isCustomerLoggedIn()) {
  window.location.href = 'login.html?role=customer&redirect=orders.html';
} else {
  loadOrders();
}
