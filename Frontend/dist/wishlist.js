const wishlistContent = document.getElementById('wishlistContent');

function renderWishlist() {
  const items = getWishlist();

  if (!items.length) {
    wishlistContent.className = 'empty-state';
    wishlistContent.innerHTML = `
      <p>Your wishlist is empty.</p>
      <a class="btn" href="index.html">Discover Products</a>
    `;
    return;
  }

  wishlistContent.className = 'wishlist-grid';
  wishlistContent.innerHTML = items.map((item) => `
    <article class="card wishlist-card" data-id="${item.id}" tabindex="0" role="link" aria-label="View details for ${item.name}">
      <div class="card-img-wrap">
        <img src="${item.image}" alt="${item.name}" />
        <button class="wishlist-btn active" data-id="${item.id}" title="Remove from wishlist">${ICONS.heartFilled}</button>
      </div>
      <div class="card-content">
        <h3>${item.name}</h3>
        <div class="price">${formatPrice(item.price, item.currency)}</div>
        <div class="card-actions">
          <button class="btn add-to-cart-btn" data-id="${item.id}">Add to Cart</button>
        </div>
      </div>
    </article>
  `).join('');

  wishlistContent.querySelectorAll('.wishlist-card').forEach((card) => {
    const openDetails = () => {
      window.location.href = `details.html?id=${card.dataset.id}`;
    };

    card.addEventListener('click', openDetails);
    card.addEventListener('keydown', (event) => {
      if ((event.key === 'Enter' || event.key === ' ') && !event.target.closest('button')) {
        event.preventDefault();
        openDetails();
      }
    });
  });

  wishlistContent.querySelectorAll('.wishlist-btn').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      removeFromWishlist(button.dataset.id);
      renderWishlist();
    });
  });

  wishlistContent.querySelectorAll('.add-to-cart-btn').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const item = items.find((i) => i.id === button.dataset.id);
      if (!item) return;
      addToCart(item, 1);
      const original = button.textContent;
      button.textContent = 'Added!';
      setTimeout(() => { button.textContent = original; }, 1000);
    });
  });
}

renderWishlist();
