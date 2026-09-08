import { useEffect, useMemo, useState } from 'react';

const fallbackProducts = [
  { id: 'cream', name: 'Glow Radiance Cream', category: 'Face Care', price: 499, currency: 'NPR', short: 'Lightweight daily glow moisturizer.', stock: 20 },
  { id: 'lip-balm', name: 'Rose Lip Balm', category: 'Lips', price: 220, currency: 'NPR', short: 'A soft, nourishing rose tinted balm.', stock: 35 },
  { id: 'cleanser', name: 'Herbal Facial Wash', category: 'Face Cleanser', price: 320, currency: 'NPR', short: 'A gentle cleanser for fresh, glowing skin.', stock: 15 },
  { id: 'serum', name: 'Vitamin C Serum', category: 'Serum', price: 460, currency: 'NPR', short: 'Brightening care for a radiant complexion.', stock: 28 }
];

function App() {
  const [products, setProducts] = useState(fallbackProducts);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All Beauty');
  const [query, setQuery] = useState('');

  useEffect(() => {
    Promise.all([fetch('/api/products'), fetch('/api/categories')])
      .then(async ([productResponse, categoryResponse]) => {
        if (productResponse.ok) setProducts(await productResponse.json());
        if (categoryResponse.ok) setCategories(await categoryResponse.json());
      })
      .catch(() => undefined);
  }, []);

  const filteredProducts = useMemo(() => products.filter((product) => {
    const hasCategory = activeCategory === 'All Beauty' || product.category === activeCategory;
    const hasQuery = product.name.toLowerCase().includes(query.toLowerCase());
    return hasCategory && hasQuery;
  }), [activeCategory, products, query]);

  return (
    <main className="storefront">
      <header className="topbar">
        <div className="brand-mark">K</div>
        <div><strong>Kalpana</strong><span> Cosmetic Store</span></div>
        <button className="account-button">My account</button>
      </header>

      <section className="hero">
        <p className="eyebrow">BEAUTY, SIMPLIFIED</p>
        <h1>Your everyday glow starts here.</h1>
        <p>Thoughtful skincare, makeup and haircare essentials for every routine.</p>
      </section>

      <section className="catalog" aria-label="Product catalogue">
        <div className="catalog-heading">
          <div><h2>Shop our collection</h2><p>Find beauty essentials made for you.</p></div>
          <label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" /></label>
        </div>
        <div className="category-list" role="list">
          {['All Beauty', ...categories].map((category) => (
            <button key={category} className={activeCategory === category ? 'selected' : ''} onClick={() => setActiveCategory(category)}>{category}</button>
          ))}
        </div>
        <div className="product-grid">
          {filteredProducts.map((product) => (
            <article key={product.id} className="product-card">
              <div className="product-image"><span>{product.category}</span></div>
              <div className="product-info"><p className="product-category">{product.category}</p><h3>{product.name}</h3><p>{product.short}</p><div><strong>{product.currency || 'NPR'} {product.price}</strong><button>Add to bag</button></div></div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;
