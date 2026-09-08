const apiRoot = '/api';
const content = document.getElementById('adminOrdersContent');
const ORDER_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

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

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatPrice(price, currency) {
  return `Rs ${(Number(price) || 0).toLocaleString('ne-NP')} ${currency || 'NPR'}`;
}

async function loadOrders() {
  try {
    const res = await fetch(`${apiRoot}/admin/orders`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Could not load orders');
    const orders = await res.json();

    if (!orders.length) {
      content.innerHTML = '<p>No orders placed yet.</p>';
      return;
    }

    content.innerHTML = `
      <table class="orders-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Date</th>
            <th>Customer</th>
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
              <td>${order.shippingAddress.fullName}<br/><small>${order.shippingAddress.phone}</small></td>
              <td class="order-items-preview">${order.items.map((i) => `${i.name} x${i.qty}`).join(', ')}</td>
              <td>${formatPrice(order.total, order.currency)}</td>
              <td>${order.paymentMethod}</td>
              <td>
                <select class="status-select" data-id="${order.id}">
                  ${ORDER_STATUSES.map((s) => `<option value="${s}" ${s === order.status ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    content.querySelectorAll('.status-select').forEach((select) => {
      select.addEventListener('change', async () => {
        const id = select.dataset.id;
        const status = select.value;
        try {
          const res = await fetch(`${apiRoot}/admin/orders/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify({ status })
          });
          if (!res.ok) throw new Error('Update failed');
        } catch (err) {
          alert('Could not update order status.');
        }
      });
    });
  } catch (error) {
    content.innerHTML = '<p>Could not load orders.</p>';
  }
}

if (requireLogin()) {
  loadOrders();
}
