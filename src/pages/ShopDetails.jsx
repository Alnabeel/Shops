import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import { getShopProducts, getShops } from '../services/googleSheets';

export default function ShopDetails() {
  const { slug } = useParams();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [sortedProducts, setSortedProducts] = useState([]);
  const [sortType, setSortType] = useState('price-low-high'); // 'price-low-high', 'price-high-low', 'alphabetical-a-z', 'alphabetical-z-a'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  // Handle sorting
  const handleSort = (type, productsToSort = null) => {
    setSortType(type);
    const productsList = productsToSort || products;
    const sorted = [...productsList].sort((a, b) => {
      if (type === 'price-low-high') {
        // Sort by price (low to high)
        const priceA = parseFloat(a.price) || 0;
        const priceB = parseFloat(b.price) || 0;
        if (priceA !== priceB) {
          return priceA - priceB;
        }
        // If prices are equal, sort alphabetically
        return (a.name || '').localeCompare(b.name || '');
      } else if (type === 'price-high-low') {
        // Sort by price (high to low)
        const priceA = parseFloat(a.price) || 0;
        const priceB = parseFloat(b.price) || 0;
        if (priceA !== priceB) {
          return priceB - priceA;
        }
        // If prices are equal, sort alphabetically
        return (a.name || '').localeCompare(b.name || '');
      } else if (type === 'alphabetical-a-z') {
        // Sort alphabetically by name (A-Z)
        return (a.name || '').localeCompare(b.name || '');
      } else if (type === 'alphabetical-z-a') {
        // Sort alphabetically by name (Z-A)
        return (b.name || '').localeCompare(a.name || '');
      }
      return 0;
    });
    setSortedProducts(sorted);
  };

  const handleAddToCart = (product, quantity) => {
    console.log('Added to cart:', product.name, quantity);
    setCartCount(prev => prev + quantity);
    // TODO: Implement actual cart state
  };

  useEffect(() => {
    const loadShopData = async () => {
      try {
        setLoading(true);
        // 1. Fetch all shops to find the current one by slug
        const shops = await getShops();
        const currentShop = shops.find(s => s.slug === slug);
        
        if (!currentShop) {
          setError('Shop not found');
          return;
        }
        
        setShop(currentShop);

        // 2. Fetch products for this shop
        const shopProducts = await getShopProducts(currentShop.product_sheet_id);
        setProducts(shopProducts);
        // Apply default sort (by price low to high)
        handleSort('price-low-high', shopProducts);
      } catch (err) {
        console.error(err);
        setError('Failed to load shop data');
      } finally {
        setLoading(false);
      }
    };

    loadShopData();
  }, [slug]);

  if (loading) {
    return (
      <Layout>
        <div className="container loading-state">
          <div className="spinner"></div>
          <p>Loading shop details...</p>
        </div>
        <style>{`
          .loading-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 50vh;
            gap: 1rem;
            color: var(--text-secondary);
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--border);
            border-top-color: var(--primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </Layout>
    );
  }

  if (error || !shop) {
    return (
      <Layout>
        <div className="container error-state">
          <h2>Oops!</h2>
          <p>{error || 'Shop not found'}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout cartCount={cartCount} pageTitle={shop?.name}>
      <div className="shop-header">
        <div className="container">
          <div className="shop-info">
            <div className="shop-logo" style={{ backgroundColor: shop.theme_color }}>
              <img src={shop.logo_url} alt={shop.name} />
            </div>
            <div className="shop-details">
              <h1>{shop.name}</h1>
              <div className="shop-contact-info">
                <div className="contact-item">
                  <span className="label">Email:</span>
                  <a href={`mailto:${shop.contact_info}`}>{shop.contact_info}</a>
                </div>
                {shop.phone_number && (
                  <div className="contact-item">
                    <span className="label">Contact:</span>
                    <span>{shop.phone_number}</span> 
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container main-section">
        <div className="toolbar">
          <h2>Our Products</h2>
          <div className="filters">
            <div className="sort-dropdown">
              <select 
                className="sort-select"
                value={sortType}
                onChange={(e) => handleSort(e.target.value)}
              >
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
                <option value="alphabetical-a-z">Alphabetical: A-Z</option>
                <option value="alphabetical-z-a">Alphabetical: Z-A</option>
              </select>
              <ChevronDown size={16} className="sort-icon" />
            </div>
          </div>
        </div>

        <div className="product-grid">
          {sortedProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      </div>

      <style>{`
        .shop-header {
          background: var(--surface);
          padding: 1rem 0;
          border-bottom: 1px solid var(--border);
          margin-bottom: 2rem;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }

        .shop-info {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .shop-logo {
          width: 60px;
          height: 60px;
          border-radius: var(--radius-md);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .shop-logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .shop-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .shop-details h1 {
          font-size: 1.25rem;
          margin: 0;
          color: var(--text-primary);
          font-weight: 700;
        }

        .shop-contact-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .contact-item .label {
          font-weight: 500;
          color: var(--text-primary);
        }

        .contact-item a {
          color: var(--primary);
          text-decoration: none;
        }

        .contact-item a:hover {
          text-decoration: underline;
        }

        .shop-meta {
          display: flex;
          gap: 1rem;
          margin-top: 0.5rem;
        }

        .meta-btn {
          background: none;
          border: none;
          padding: 0;
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--text-secondary);
          cursor: pointer;
          position: relative;
        }

        .meta-btn:hover, .meta-btn.active {
          color: var(--primary);
        }

        .meta-btn.active::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 100%;
          height: 2px;
          background-color: var(--primary);
          border-radius: 2px;
        }

        .toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .toolbar h2 {
          font-size: 1.25rem;
          color: var(--text-primary);
        }

        .filters {
          display: flex;
          gap: 1rem;
        }

        .sort-dropdown {
          position: relative;
          display: inline-block;
        }

        .sort-select {
          appearance: none;
          padding: 0.5rem 2.5rem 0.5rem 1rem;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 180px;
        }

        .sort-select:hover {
          background: var(--background);
          border-color: var(--primary);
        }

        .sort-select:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .sort-icon {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: var(--text-secondary);
        }

        .product-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 2rem;
        }

        @media (min-width: 640px) {
          .product-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (min-width: 768px) {
          .product-grid { grid-template-columns: repeat(3, 1fr); }
        }

        @media (min-width: 1024px) {
          .product-grid { grid-template-columns: repeat(4, 1fr); }
        }
      `}</style>
    </Layout>
  );
}
