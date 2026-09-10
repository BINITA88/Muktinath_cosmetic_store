const SHIPPING_FEE = 100;
const FREE_SHIPPING_THRESHOLD = 3000;

const checkoutForm = document.getElementById('checkoutForm');
const checkoutMessage = document.getElementById('checkoutMessage');
const placeOrderBtn = document.getElementById('placeOrderBtn');
const paymentModal = document.getElementById('paymentModal');
const paymentChoiceStep = document.getElementById('paymentChoiceStep');
const paymentProofStep = document.getElementById('paymentProofStep');
const paymentSuccessStep = document.getElementById('paymentSuccessStep');
const paymentQr = document.getElementById('paymentQr');
const paymentProof = document.getElementById('paymentProof');
const paymentProofName = document.getElementById('paymentProofName');
const paymentProofUpload = document.getElementById('paymentProofUpload');
const codPaymentNote = document.getElementById('codPaymentNote');
const proofTitle = document.getElementById('proofTitle');
let completedOrderId = null;

function escapeCheckoutHtml(value) {
  return String(value || '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));
}

function selectedPaymentMethod() {
  return document.querySelector('input[name="paymentMethod"]:checked').value;
}

function renderSelectedPayment() {
  const payment = selectedPaymentMethod();
  const files = { eSewa: 'images/eswa.png', Bank: 'images/bank.png' };
  paymentQr.hidden = !files[payment];
  paymentQr.innerHTML = files[payment] ? `<p>Scan this ${payment === 'Bank' ? 'bank payment' : 'eSewa'} QR, complete payment, then upload your receipt below.</p><img src="${files[payment]}" alt="${payment} payment QR code" />` : '';
  const isCod = payment === 'COD';
  paymentProofUpload.hidden = isCod;
  codPaymentNote.hidden = !isCod;
  proofTitle.textContent = isCod ? 'Confirm Cash on Delivery' : 'Upload payment proof';
}

document.querySelectorAll('input[name="paymentMethod"]').forEach((input) => input.addEventListener('change', renderSelectedPayment));
paymentProof.addEventListener('change', () => {
  paymentProofName.classList.remove('proof-file-name--error');
  paymentProofName.textContent = paymentProof.files[0] ? `Selected: ${paymentProof.files[0].name}` : '';
});

function renderSummary() {
  const cart = getCart();
  const list = document.getElementById('orderSummaryList');
  const currency = cart[0] ? cart[0].currency : 'NPR';
  list.innerHTML = cart.map((item) => `
    <article class="order-summary-item">
      <img src="${escapeCheckoutHtml(item.image)}" alt="${escapeCheckoutHtml(item.name)}" />
      <div><strong>${escapeCheckoutHtml(item.name)}</strong>${item.variant ? `<small>${escapeCheckoutHtml(item.variant)}</small>` : ''}<span>Qty ${item.qty}</span></div>
      <b>${formatPrice(item.price * item.qty, item.currency)}</b>
    </article>
  `).join('');
  const subtotal = cartSubtotal();
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  document.getElementById('summarySubtotal').textContent = formatPrice(subtotal, currency);
  document.getElementById('summaryShipping').textContent = shippingFee === 0 ? 'Free' : formatPrice(shippingFee, currency);
  document.getElementById('summaryTotal').textContent = formatPrice(subtotal + shippingFee, currency);
}

async function prefillFromAccount() {
  try {
    const res = await fetch(`${API_ROOT}/auth/me`, { headers: customerAuthHeaders() });
    if (!res.ok) return;
    const user = await res.json();
    document.getElementById('fullName').value = user.name || '';
    document.getElementById('phone').value = user.phone || '';
  } catch (err) { /* Fields stay blank. */ }
}

function openPaymentModal() {
  paymentChoiceStep.hidden = false;
  paymentProofStep.hidden = true;
  paymentSuccessStep.hidden = true;
  paymentModal.hidden = false;
  paymentModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  document.querySelector('input[name="paymentMethod"]:checked').focus();
}

function closePaymentModal() {
  if (completedOrderId) return;
  paymentModal.hidden = true;
  paymentModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  placeOrderBtn.focus();
}

async function getApiError(response, fallback) {
  const body = await response.text();
  try {
    return JSON.parse(body).error || fallback;
  } catch (err) {
    return fallback;
  }
}

checkoutForm.addEventListener('submit', (event) => {
  event.preventDefault();
  checkoutMessage.textContent = '';
  const requiredFields = ['fullName', 'phone', 'city', 'address'];
  if (requiredFields.some((id) => !document.getElementById(id).value.trim())) {
    checkoutMessage.style.color = '#b20e0e';
    checkoutMessage.textContent = 'Please complete all delivery details first.';
    return;
  }
  openPaymentModal();
});

async function placeOrder() {
  const cart = getCart();
  if (!cart.length) return;
  const paymentMethod = selectedPaymentMethod();
  if (paymentMethod !== 'COD' && !paymentProof.files[0]) {
    paymentProofName.textContent = 'Please upload your payment proof to continue.';
    paymentProofName.classList.add('proof-file-name--error');
    return;
  }

  const confirmOrderBtn = document.getElementById('confirmOrderBtn');
  confirmOrderBtn.disabled = true;
  confirmOrderBtn.textContent = 'Submitting order...';
  const payload = {
    items: cart.map((item) => ({ id: item.id, name: item.name, variant: item.variant || '', qty: item.qty })),
    shippingAddress: {
      fullName: document.getElementById('fullName').value.trim(), phone: document.getElementById('phone').value.trim(),
      city: document.getElementById('city').value.trim(), address: document.getElementById('address').value.trim(), notes: document.getElementById('notes').value.trim()
    }, paymentMethod
  };
  try {
    if (paymentMethod !== 'COD') {
      const proofData = new FormData();
      proofData.append('proof', paymentProof.files[0]);
      const proofRes = await fetch(`${API_ROOT}/uploads/payment-proof`, { method: 'POST', headers: customerAuthHeaders(), body: proofData });
      if (!proofRes.ok) throw new Error(await getApiError(proofRes, 'Payment upload service is unavailable. Please try again shortly.'));
      payload.paymentProof = (await proofRes.json()).image;
    }
    const res = await fetch(`${API_ROOT}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...customerAuthHeaders() }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error(await getApiError(res, 'Could not place order'));
    const order = await res.json();
    clearCart();
    completedOrderId = order.id;
    paymentProofStep.hidden = true;
    paymentSuccessStep.hidden = false;
  } catch (error) {
    paymentProofName.textContent = `Error: ${error.message}`;
    paymentProofName.classList.add('proof-file-name--error');
    confirmOrderBtn.disabled = false;
    confirmOrderBtn.textContent = 'Place order';
  }
}

document.getElementById('paymentProceedBtn').addEventListener('click', () => { paymentChoiceStep.hidden = true; paymentProofStep.hidden = false; renderSelectedPayment(); });
document.getElementById('paymentBackBtn').addEventListener('click', () => { paymentProofStep.hidden = true; paymentChoiceStep.hidden = false; });
document.getElementById('confirmOrderBtn').addEventListener('click', placeOrder);
document.getElementById('viewOrderBtn').addEventListener('click', () => { window.location.href = `order-success.html?id=${completedOrderId}`; });
document.querySelectorAll('[data-close-payment-modal]').forEach((button) => button.addEventListener('click', closePaymentModal));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !paymentModal.hidden) closePaymentModal(); });

if (!getCart().length) window.location.href = 'cart.html';
else if (!isCustomerLoggedIn()) window.location.href = 'login.html?role=customer&redirect=checkout.html';
else { renderSummary(); prefillFromAccount(); }
