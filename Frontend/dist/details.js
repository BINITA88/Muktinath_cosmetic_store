const detailsContainer = document.getElementById('product-details');
const params = new URLSearchParams(window.location.search);
const id = params.get('id');

let currentProduct = null;

async function loadProductDetails(productId) {
  if (!productId) {
    detailsContainer.innerHTML = '<p>Invalid product selected.</p>';
    return;
  }

  try {
    const res = await fetch(`${API_ROOT}/products/${productId}`);
    if (!res.ok) {
      detailsContainer.innerHTML = '<p>Product not found.</p>';
      return;
    }
    const product = await res.json();
    currentProduct = product;
    const outOfStock = Number(product.stock) === 0;

    detailsContainer.innerHTML = `
      <img src="${product.image}" alt="${product.name}" />
      <h1>${product.name}</h1>
      <div class="detail-row"><strong>Category:</strong> ${product.category}</div>
      <div class="detail-row"><strong>Price:</strong> ${formatPrice(product.price, product.currency)}</div>
      <div class="detail-row"><strong>Stock:</strong> ${outOfStock ? 'Out of stock' : `${product.stock} units available`}</div>
      <div class="detail-row"><strong>Description:</strong> ${product.description}</div>
      <div class="detail-row"><strong>Ingredients:</strong></div>
      <ul class="details-list">${product.ingredients.map((ing) => `<li>${ing}</li>`).join('')}</ul>
      <div class="detail-row">
        <div class="qty-stepper" id="qtyStepper">
          <button type="button" id="qtyMinus">-</button>
          <input type="number" id="qtyInput" value="1" min="1" max="${product.stock}" />
          <button type="button" id="qtyPlus">+</button>
        </div>
      </div>
      <div class="card-actions" style="max-width:420px;">
        <button class="btn btn-outline" id="addToCartBtn" ${outOfStock ? 'disabled' : ''}>Add to Cart</button>
        <button class="btn" id="buyNowBtn" ${outOfStock ? 'disabled' : ''}>Buy Now</button>
        <button class="btn btn-outline" id="wishlistBtn">${isInWishlist(product.id) ? ICONS.heartFilled : ICONS.heart} Wishlist</button>
      </div>
      <div id="detailsMessage" class="admin-message"></div>
    `;

    wireQuantityAndCart(product);
  } catch (error) {
    detailsContainer.innerHTML = '<p>Could not fetch product details. Please ensure backend is running.</p>';
  }
}

function currentQty() {
  const input = document.getElementById('qtyInput');
  return Math.max(1, Math.min(Number(input.value) || 1, Number(currentProduct.stock) || 1));
}

function wireQuantityAndCart(product) {
  const qtyInput = document.getElementById('qtyInput');
  document.getElementById('qtyMinus').addEventListener('click', () => {
    qtyInput.value = Math.max(1, Number(qtyInput.value) - 1);
  });
  document.getElementById('qtyPlus').addEventListener('click', () => {
    qtyInput.value = Math.min(Number(product.stock), Number(qtyInput.value) + 1);
  });

  const message = document.getElementById('detailsMessage');

  document.getElementById('addToCartBtn').addEventListener('click', () => {
    addToCart(product, currentQty());
    message.style.color = '#008000';
    message.textContent = 'Added to cart!';
  });

  document.getElementById('buyNowBtn').addEventListener('click', () => {
    addToCart(product, currentQty());
    window.location.href = 'checkout.html';
  });

  document.getElementById('wishlistBtn').addEventListener('click', (event) => {
    const nowActive = toggleWishlist(product);
    event.currentTarget.innerHTML = `${nowActive ? ICONS.heartFilled : ICONS.heart} Wishlist`;
  });
}

loadProductDetails(id);
