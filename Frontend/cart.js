const cartContent = document.getElementById('cartContent');
const SHIPPING_FEE = 100;
const FREE_SHIPPING_THRESHOLD = 3000;

function renderCart() {
  const cart = getCart();
  if (!cart.length) {
    cartContent.innerHTML = `
      <div class="empty-state">
        <p>Your cart is empty.</p>
        <a class="btn" href="index.html">Continue Shopping</a>
      </div>
    `;
    return;
  }

  const subtotal = cartSubtotal();
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shippingFee;
  const currency = cart[0].currency || 'NPR';

  cartContent.innerHTML = `
    <div class="cart-layout">
      <div class="cart-items">
        ${cart.map((item) => `
          <div class="cart-row" data-key="${item.key || cartItemKey(item.id, item.variant)}">
            <img src="${item.image}" alt="${item.name}" />
            <div class="cart-info">
              <h4>${item.name}</h4>
              ${item.variant ? `<small class="cart-variant">${item.variant}</small>` : ''}
              <div class="unit-price">${formatPrice(item.price, item.currency)} each</div>
              <div class="qty-stepper">
                <button type="button" class="qty-minus">-</button>
                <input type="number" class="qty-input" value="${item.qty}" min="1" />
                <button type="button" class="qty-plus">+</button>
              </div>
            </div>
            <div class="line-total">${formatPrice(item.price * item.qty, item.currency)}</div>
            <button class="cart-remove">Remove</button>
          </div>
        `).join('')}
      </div>
      <div class="cart-summary">
        <h3>Order Summary</h3>
        <div class="summary-line"><span>Subtotal</span><span>${formatPrice(subtotal, currency)}</span></div>
        <div class="summary-line"><span>Shipping</span><span>${shippingFee === 0 ? 'Free' : formatPrice(shippingFee, currency)}</span></div>
        <div class="summary-line total"><span>Total</span><span>${formatPrice(total, currency)}</span></div>
        <button id="checkoutBtn" class="btn" style="width:100%; margin-top:0.6rem;">Proceed to Checkout</button>
      </div>
    </div>
  `;

  wireCartEvents();
}

function wireCartEvents() {
  cartContent.querySelectorAll('.cart-row').forEach((row) => {
    const key = row.dataset.key;
    row.querySelector('.qty-minus').addEventListener('click', () => {
      const input = row.querySelector('.qty-input');
      const value = Math.max(1, Number(input.value) - 1);
      updateCartQty(key, value);
      renderCart();
    });
    row.querySelector('.qty-plus').addEventListener('click', () => {
      const input = row.querySelector('.qty-input');
      const value = Number(input.value) + 1;
      updateCartQty(key, value);
      renderCart();
    });
    row.querySelector('.qty-input').addEventListener('change', (e) => {
      updateCartQty(key, e.target.value);
      renderCart();
    });
    row.querySelector('.cart-remove').addEventListener('click', () => {
      removeFromCart(key);
      renderCart();
    });
  });

  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      window.location.href = 'checkout.html';
    });
  }
}

renderCart();
