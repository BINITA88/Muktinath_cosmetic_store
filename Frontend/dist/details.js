const detailsContainer = document.getElementById('product-details');
const params = new URLSearchParams(window.location.search);
const id = params.get('id');

let currentProduct = null;
let selectedVariant = '';

function escapeHtml(value) {
  return String(value || '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));
}

function variantLabel(product) {
  return product.category && product.category.toLowerCase().includes('lip') ? 'Shade' : 'Option';
}

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
    const variants = Array.isArray(product.variants) ? product.variants.filter(Boolean) : [];
    const images = [...new Set((Array.isArray(product.images) && product.images.length ? product.images : [product.image]).filter(Boolean))];
    const imageVariants = Array.isArray(product.imageVariants) ? product.imageVariants.filter((item) => images.includes(item.image) && item.variant) : [];
    selectedVariant = variants[0] || '';
    const initialImage = imageVariants.find((item) => item.variant === selectedVariant)?.image || images[0];
    const label = variantLabel(product);
    const variantPicker = variants.length ? `
      <fieldset class="variant-picker">
        <legend>Choose ${label.toLowerCase()}: <strong id="selectedVariant">${escapeHtml(selectedVariant)}</strong></legend>
        <div class="variant-options" role="radiogroup" aria-label="Choose ${label.toLowerCase()}">
          ${variants.map((variant, index) => `<button type="button" class="variant-option ${index === 0 ? 'is-selected' : ''}" data-variant="${escapeHtml(variant)}" role="radio" aria-checked="${index === 0}">${escapeHtml(variant)}</button>`).join('')}
        </div>
      </fieldset>` : '';

    detailsContainer.innerHTML = `
      <section class="product-gallery ${images.length > 1 ? 'has-thumbnails' : ''}" aria-label="${escapeHtml(product.name)} image gallery">
        ${images.length > 1 ? `<div class="product-thumbnail-list" role="list" aria-label="Product image thumbnails">
          ${images.map((image, index) => { const shade = imageVariants.find((item) => item.image === image)?.variant || ''; return `<button class="product-thumbnail ${image === initialImage ? 'is-selected' : ''}" type="button" data-image="${escapeHtml(image)}" data-variant="${escapeHtml(shade)}" data-index="${index}" aria-label="Show ${escapeHtml(shade || `image ${index + 1}`)}" aria-current="${image === initialImage}"><img src="${escapeHtml(image)}" alt=""></button>`; }).join('')}
        </div>` : ''}
        <div class="product-image-frame">
          <img id="mainProductImage" src="${escapeHtml(initialImage)}" alt="${escapeHtml(product.name)}" />
          <span class="detail-category">${escapeHtml(product.category)}</span>
        </div>
      </section>
      <section class="product-info">
        <p class="detail-kicker">Muktinath Collection Stores</p>
        <h1>${escapeHtml(product.name)}</h1>
        <p class="detail-short">${escapeHtml(product.short)}</p>
        <div class="detail-price-row">
          <div class="detail-price">${formatPrice(product.price, product.currency)}</div>
          <span class="detail-stock ${outOfStock ? 'low' : ''}">${outOfStock ? 'Out of stock' : 'In stock'}</span>
        </div>
        <div class="detail-description">
          <h2>About this product</h2>
          <p>${escapeHtml(product.description)}</p>
        </div>
        ${variantPicker}
        <div class="purchase-row">
          <div class="qty-control">
            <span>Quantity</span>
            <div class="qty-stepper" id="qtyStepper">
              <button type="button" id="qtyMinus" aria-label="Decrease quantity">−</button>
              <input type="number" id="qtyInput" value="1" min="1" max="${product.stock}" aria-label="Quantity" />
              <button type="button" id="qtyPlus" aria-label="Increase quantity">+</button>
            </div>
          </div>
          <div class="detail-actions">
            <button class="btn" id="addToCartBtn" ${outOfStock ? 'disabled' : ''}>Add to Cart</button>
            <button class="btn detail-buy-btn" id="buyNowBtn" ${outOfStock ? 'disabled' : ''}>Buy Now</button>
          </div>
        </div>
        <div class="detail-assurances"><span>✓ Authentic products</span><span>✓ Cash on delivery</span><span>✓ Secure checkout</span></div>
        <div id="detailsMessage" class="admin-message" aria-live="polite"></div>
        <div class="ingredient-block">
          <h2>Key ingredients</h2>
          <ul class="details-list">${(product.ingredients || []).map((ingredient) => `<li>${escapeHtml(ingredient)}</li>`).join('')}</ul>
        </div>
      </section>
    `;

    wireProductInteractions(product, variants, images, imageVariants);
  } catch (error) {
    detailsContainer.innerHTML = '<p>Could not fetch product details. Please ensure backend is running.</p>';
  }
}

function currentQty() {
  const input = document.getElementById('qtyInput');
  return Math.max(1, Math.min(Number(input.value) || 1, Number(currentProduct.stock) || 1));
}

function wireProductInteractions(product, variants, images, imageVariants) {
  const qtyInput = document.getElementById('qtyInput');
  document.getElementById('qtyMinus').addEventListener('click', () => {
    qtyInput.value = Math.max(1, Number(qtyInput.value) - 1);
  });
  document.getElementById('qtyPlus').addEventListener('click', () => {
    qtyInput.value = Math.min(Number(product.stock), Number(qtyInput.value) + 1);
  });

  const mainImage = document.getElementById('mainProductImage');
  const selectImage = (image) => {
    const thumbnail = document.querySelector(`.product-thumbnail[data-image="${CSS.escape(image)}"]`);
    mainImage.src = image;
    mainImage.alt = `${product.name} view ${thumbnail ? Number(thumbnail.dataset.index) + 1 : 1}`;
    document.querySelectorAll('.product-thumbnail').forEach((item) => {
      const isSelected = item.dataset.image === image;
      item.classList.toggle('is-selected', isSelected);
      item.setAttribute('aria-current', String(isSelected));
    });
  };
  const selectVariant = (variant, updateImage = true) => {
    selectedVariant = variant;
    const selectedVariantLabel = document.getElementById('selectedVariant');
    if (selectedVariantLabel) selectedVariantLabel.textContent = selectedVariant;
    document.querySelectorAll('.variant-option').forEach((option) => {
      const isSelected = option.dataset.variant === variant;
      option.classList.toggle('is-selected', isSelected);
      option.setAttribute('aria-checked', String(isSelected));
    });
    const matchingImage = updateImage && imageVariants.find((item) => item.variant === variant)?.image;
    if (matchingImage) selectImage(matchingImage);
  };

  if (variants.length) {
    document.querySelectorAll('.variant-option').forEach((button) => {
      button.addEventListener('click', () => selectVariant(button.dataset.variant));
    });
  }

  if (images.length > 1) {
    document.querySelectorAll('.product-thumbnail').forEach((button) => {
      button.addEventListener('click', () => {
        selectImage(button.dataset.image);
        if (button.dataset.variant) selectVariant(button.dataset.variant, false);
      });
    });
  }

  const message = document.getElementById('detailsMessage');
  const addSelectedProduct = () => addToCart(product, currentQty(), selectedVariant);

  document.getElementById('addToCartBtn').addEventListener('click', () => {
    addSelectedProduct();
    message.style.color = '#176554';
    message.textContent = selectedVariant ? `${selectedVariant} added to cart!` : 'Added to cart!';
  });

  document.getElementById('buyNowBtn').addEventListener('click', () => {
    addSelectedProduct();
    window.location.href = 'checkout.html';
  });

}

loadProductDetails(id);
