import { useEffect, useMemo, useRef, useState } from "react";
import {
  Barcode,
  Boxes,
  Minus,
  PackageOpen,
  Plus,
  RefreshCw,
  ScanBarcode,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { apiRequest } from "../services/api";
import { useCart } from "../hooks/useCart";

const currencyFormatter = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  minimumFractionDigits: 2,
});

function normalizeProduct(product) {
  return {
    ...product,
    id: product.id,
    name: product.name || "Unnamed product",
    barcode: String(product.barcode || ""),
    price: Number(product.sellingPrice ?? product.price ?? 0),
    stockQuantity: Number(
      product.stockQuantity ?? product.quantity ?? product.stock ?? 0,
    ),
    categoryName:
      product.category?.name ||
      product.categoryName ||
      "Uncategorized",
  };
}

export default function PosPage() {
  const searchInputRef = useRef(null);

  const {
    cartItems,
    subtotal,
    totalItems,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const [products, setProducts] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isActive = true;

    async function loadProducts() {
      try {
        setIsLoading(true);
        setLoadError("");

        const response = await apiRequest("/products?limit=100");
        const receivedProducts = Array.isArray(response.data)
          ? response.data
          : [];

        const activeProducts = receivedProducts
          .filter((product) => product.isActive !== false)
          .map(normalizeProduct);

        if (isActive) {
          setProducts(activeProducts);
        }
      } catch (error) {
        if (isActive) {
          setLoadError(error.message);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isActive = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setNotice(null);
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [notice]);

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(products.map((product) => product.categoryName)),
    ];

    return ["All", ...uniqueCategories.sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const searchValue = searchText.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "All" ||
        product.categoryName === selectedCategory;

      const matchesSearch =
        !searchValue ||
        product.name.toLowerCase().includes(searchValue) ||
        product.barcode.toLowerCase().includes(searchValue);

      return matchesCategory && matchesSearch;
    });
  }, [products, searchText, selectedCategory]);

  function showNotice(type, message) {
    setNotice({ type, message });
  }

  function handleAddProduct(product) {
    if (product.stockQuantity <= 0) {
      showNotice("error", `${product.name} is out of stock.`);
      return;
    }

    const currentCartItem = cartItems.find(
      (item) => item.id === product.id,
    );

    if (
      currentCartItem &&
      currentCartItem.quantity >= product.stockQuantity
    ) {
      showNotice(
        "error",
        `Only ${product.stockQuantity} unit(s) are currently available.`,
      );

      return;
    }

    addItem(product);
    showNotice("success", `${product.name} added to the cart.`);
    searchInputRef.current?.focus();
  }

  function handleSearchKeyDown(event) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    const enteredValue = searchText.trim();

    if (!enteredValue) {
      return;
    }

    const barcodeMatch = products.find(
      (product) => product.barcode === enteredValue,
    );

    if (barcodeMatch) {
      handleAddProduct(barcodeMatch);
      setSearchText("");
      return;
    }

    if (filteredProducts.length === 1) {
      handleAddProduct(filteredProducts[0]);
      setSearchText("");
      return;
    }

    showNotice(
      "error",
      filteredProducts.length === 0
        ? "No matching product was found."
        : "Multiple products match. Select one from the list.",
    );
  }

  return (
    <div className="pos-page">
      {notice && (
        <div className={`pos-notice pos-notice-${notice.type}`}>
          <span>{notice.message}</span>

          <button type="button" onClick={() => setNotice(null)}>
            <X size={17} />
          </button>
        </div>
      )}

      <section className="pos-catalogue">
        <div className="pos-page-heading">
          <div>
            <span className="page-eyebrow">CASHIER WORKSPACE</span>
            <h1>Point of Sale</h1>
            <p>Search a product or scan its barcode to begin a sale.</p>
          </div>

          <button
            className="refresh-products-button"
            type="button"
            disabled={isLoading}
            onClick={() => setReloadKey((current) => current + 1)}
          >
            <RefreshCw
              size={17}
              className={isLoading ? "rotating" : ""}
            />
            Refresh products
          </button>
        </div>

        <div className="pos-search-panel">
          <div className="pos-search-box">
            <Search size={21} />

            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by product name or scan barcode..."
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              autoFocus
            />

            {searchText && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setSearchText("");
                  searchInputRef.current?.focus();
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>

          <div className="barcode-help">
            <Barcode size={20} />

            <div>
              <strong>Barcode ready</strong>
              <span>Scan and press Enter</span>
            </div>
          </div>
        </div>

        <div className="category-filter">
          {categories.map((category) => (
            <button
              className={
                selectedCategory === category ? "active" : ""
              }
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {loadError && (
          <div className="dashboard-error">
            <strong>Products could not be loaded.</strong>
            <br />
            {loadError}
          </div>
        )}

        {isLoading ? (
          <div className="pos-state">
            <div className="loading-spinner" />
            <p>Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="pos-state">
            <PackageOpen size={43} />
            <h2>No products found</h2>
            <p>Try another product name, barcode or category.</p>
          </div>
        ) : (
          <>
            <div className="product-results-heading">
              <span>
                {filteredProducts.length} product
                {filteredProducts.length === 1 ? "" : "s"} found
              </span>

              <span>
                <Boxes size={15} />
                Live inventory
              </span>
            </div>

            <div className="pos-product-grid">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.stockQuantity <= 0;

                return (
                  <article
                    className={`pos-product-card ${
                      isOutOfStock ? "out-of-stock" : ""
                    }`}
                    key={product.id}
                  >
                    <div className="product-card-top">
                      <span className="product-category">
                        {product.categoryName}
                      </span>

                      <span
                        className={
                          isOutOfStock
                            ? "stock-badge stock-empty"
                            : product.stockQuantity <= 5
                              ? "stock-badge stock-low"
                              : "stock-badge"
                        }
                      >
                        {isOutOfStock
                          ? "Out of stock"
                          : `${product.stockQuantity} in stock`}
                      </span>
                    </div>

                    <div className="product-card-icon">
                      <ScanBarcode size={29} />
                    </div>

                    <h2>{product.name}</h2>

                    <span className="product-barcode">
                      <Barcode size={14} />
                      {product.barcode || "No barcode"}
                    </span>

                    <div className="product-card-bottom">
                      <strong>
                        {currencyFormatter.format(product.price)}
                      </strong>

                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => handleAddProduct(product)}
                      >
                        <Plus size={18} />
                        Add
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>

      <aside className="pos-cart">
        <div className="cart-heading">
          <div>
            <div className="cart-title">
              <ShoppingCart size={21} />
              <h2>Current cart</h2>
            </div>

            <p>
              {totalItems} item{totalItems === 1 ? "" : "s"} selected
            </p>
          </div>

          {cartItems.length > 0 && (
            <button
              className="clear-cart-button"
              type="button"
              onClick={clearCart}
            >
              <Trash2 size={16} />
              Clear
            </button>
          )}
        </div>

        <div className="cart-items">
          {cartItems.length === 0 ? (
            <div className="empty-cart">
              <div>
                <ShoppingCart size={30} />
              </div>

              <h3>Your cart is empty</h3>
              <p>Search or scan products to add them to the sale.</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <article className="cart-item" key={item.id}>
                <div className="cart-item-information">
                  <div>
                    <strong>{item.name}</strong>
                    <span>{currencyFormatter.format(item.price)} each</span>
                  </div>

                  <button
                    type="button"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="cart-item-controls">
                  <div className="quantity-control">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.id, item.quantity - 1)
                      }
                    >
                      <Minus size={15} />
                    </button>

                    <span>{item.quantity}</span>

                    <button
                      type="button"
                      disabled={item.quantity >= item.stockQuantity}
                      onClick={() =>
                        updateQuantity(item.id, item.quantity + 1)
                      }
                    >
                      <Plus size={15} />
                    </button>
                  </div>

                  <strong>
                    {currencyFormatter.format(
                      item.price * item.quantity,
                    )}
                  </strong>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="cart-summary">
          <div>
            <span>Items</span>
            <strong>{totalItems}</strong>
          </div>

          <div>
            <span>Subtotal</span>
            <strong>{currencyFormatter.format(subtotal)}</strong>
          </div>

          <div className="cart-total">
            <span>Total</span>
            <strong>{currencyFormatter.format(subtotal)}</strong>
          </div>

          <button
            className="checkout-button"
            type="button"
            disabled={cartItems.length === 0}
            onClick={() =>
              showNotice(
                "success",
                "Cart is ready. Payment and receipt saving come in the next checkpoint.",
              )
            }
          >
            Continue to payment
          </button>

          <p className="checkout-note">
            Sale recording and receipt generation will be connected next.
          </p>
        </div>
      </aside>
    </div>
  );
}