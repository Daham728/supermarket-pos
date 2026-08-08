import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Ban,
  Boxes,
  Package,
  PackageCheck,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Tag,
  TriangleAlert,
} from "lucide-react";
import { apiRequest } from "../services/api";
import ProductFormModal from "../components/products/ProductFormModal";
import DeactivateProductModal from "../components/products/DeactivateProductModal";

const currencyFormatter = new Intl.NumberFormat(
  "en-LK",
  {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
  },
);

function getPrice(product, field) {
  if (product[field] !== undefined) {
    return Number(product[field]);
  }

  const centsField =
    field === "costPrice"
      ? "costPriceCents"
      : "sellingPriceCents";

  return Number(
    product[centsField] || 0,
  ) / 100;
}

export default function ProductsPage() {
  const [products, setProducts] =
    useState([]);

  const [categories, setCategories] =
    useState([]);

  const [searchText, setSearchText] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState("all");

  const [editingProduct, setEditingProduct] =
    useState(null);

  const [
    deactivatingProduct,
    setDeactivatingProduct,
  ] = useState(null);

  const [isCreating, setIsCreating] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [reloadKey, setReloadKey] =
    useState(0);

  useEffect(() => {
    let isActive = true;

    async function loadData() {
      try {
        setIsLoading(true);
        setError("");

        const [
          productsResponse,
          categoriesResponse,
        ] = await Promise.all([
          apiRequest(
            "/products?includeInactive=true&limit=100",
          ),
          apiRequest("/categories"),
        ]);

        if (isActive) {
          setProducts(
            Array.isArray(
              productsResponse.data,
            )
              ? productsResponse.data
              : [],
          );

          setCategories(
            Array.isArray(
              categoriesResponse.data,
            )
              ? categoriesResponse.data.filter(
                  (category) =>
                    category.isActive !==
                    false,
                )
              : [],
          );
        }
      } catch (requestError) {
        if (isActive) {
          setError(requestError.message);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isActive = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timeoutId = window.setTimeout(
      () => setNotice(null),
      3000,
    );

    return () =>
      window.clearTimeout(timeoutId);
  }, [notice]);

  const statistics = useMemo(() => {
    const activeProducts = products.filter(
      (product) => product.isActive,
    );

    const lowStockProducts =
      activeProducts.filter(
        (product) =>
          product.stockQuantity <=
          product.reorderLevel,
      );

    return {
      total: products.length,
      active: activeProducts.length,
      inactive:
        products.length -
        activeProducts.length,
      lowStock:
        lowStockProducts.length,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const searchValue = searchText
      .trim()
      .toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !searchValue ||
        product.name
          .toLowerCase()
          .includes(searchValue) ||
        product.barcode
          .toLowerCase()
          .includes(searchValue) ||
        product.sku
          .toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          product.isActive) ||
        (statusFilter === "inactive" &&
          !product.isActive);

      const productCategoryId = String(
        product.categoryId ||
          product.category?.id ||
          "",
      );

      const matchesCategory =
        categoryFilter === "all" ||
        productCategoryId ===
          categoryFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory
      );
    });
  }, [
    products,
    searchText,
    statusFilter,
    categoryFilter,
  ]);

  function completeChange(message) {
    setIsCreating(false);
    setEditingProduct(null);
    setDeactivatingProduct(null);

    setNotice({
      type: "success",
      message,
    });

    setReloadKey(
      (current) => current + 1,
    );
  }

  return (
    <div className="products-page">
      {notice && (
        <div className="pos-notice pos-notice-success">
          <span>{notice.message}</span>
        </div>
      )}

      <section className="products-page-heading">
        <div>
          <span className="page-eyebrow">
            INVENTORY CATALOGUE
          </span>

          <h1>Product Management</h1>

          <p>
            Create, update and deactivate
            supermarket products.
          </p>
        </div>

        <div className="products-heading-actions">
          <button
            className="refresh-products-button"
            type="button"
            disabled={isLoading}
            onClick={() =>
              setReloadKey(
                (current) => current + 1,
              )
            }
          >
            <RefreshCw
              size={17}
              className={
                isLoading ? "rotating" : ""
              }
            />

            Refresh
          </button>

          <button
            className="create-product-button"
            type="button"
            onClick={() =>
              setIsCreating(true)
            }
          >
            <Plus size={18} />
            Add product
          </button>
        </div>
      </section>

      <section className="product-statistics-grid">
        <article>
          <Package size={21} />
          <span>Total products</span>
          <strong>
            {statistics.total}
          </strong>
        </article>

        <article>
          <PackageCheck size={21} />
          <span>Active products</span>
          <strong>
            {statistics.active}
          </strong>
        </article>

        <article>
          <TriangleAlert size={21} />
          <span>Low stock</span>
          <strong>
            {statistics.lowStock}
          </strong>
        </article>

        <article>
          <Ban size={21} />
          <span>Inactive</span>
          <strong>
            {statistics.inactive}
          </strong>
        </article>
      </section>

      <section className="product-filter-card">
        <div className="product-management-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search name, barcode or SKU..."
            value={searchText}
            onChange={(event) =>
              setSearchText(
                event.target.value,
              )
            }
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value,
            )
          }
        >
          <option value="all">
            All statuses
          </option>
          <option value="active">
            Active
          </option>
          <option value="inactive">
            Inactive
          </option>
        </select>

        <select
          value={categoryFilter}
          onChange={(event) =>
            setCategoryFilter(
              event.target.value,
            )
          }
        >
          <option value="all">
            All categories
          </option>

          {categories.map((category) => (
            <option
              key={category.id}
              value={String(category.id)}
            >
              {category.name}
            </option>
          ))}
        </select>
      </section>

      {error && (
        <div className="dashboard-error">
          {error}
        </div>
      )}

      <section className="products-table-card">
        <div className="products-table-heading">
          <Boxes size={19} />

          <div>
            <h2>Products</h2>

            <span>
              {filteredProducts.length}{" "}
              product(s) displayed
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="sales-empty-state">
            <div className="loading-spinner" />
            <p>Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="sales-empty-state">
            <Package size={42} />
            <h3>No products found</h3>
            <p>
              Try adjusting the filters or
              create a new product.
            </p>
          </div>
        ) : (
          <div className="products-table-wrapper">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Barcode / SKU</th>
                  <th>Category</th>
                  <th>Cost</th>
                  <th>Selling price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map(
                  (product) => {
                    const isLowStock =
                      product.isActive &&
                      product.stockQuantity <=
                        product.reorderLevel;

                    return (
                      <tr key={product.id}>
                        <td>
                          <div className="management-product-cell">
                            <div>
                              <Package
                                size={17}
                              />
                            </div>

                            <span>
                              <strong>
                                {product.name}
                              </strong>

                              <small>
                                {product.unit}
                              </small>
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="product-code-cell">
                            <span>
                              {product.barcode}
                            </span>

                            <small>
                              {product.sku}
                            </small>
                          </div>
                        </td>

                        <td>
                          <span className="product-category-pill">
                            <Tag size={12} />

                            {product.category
                              ?.name ||
                              "Uncategorized"}
                          </span>
                        </td>

                        <td>
                          {currencyFormatter.format(
                            getPrice(
                              product,
                              "costPrice",
                            ),
                          )}
                        </td>

                        <td>
                          <strong className="management-selling-price">
                            {currencyFormatter.format(
                              getPrice(
                                product,
                                "sellingPrice",
                              ),
                            )}
                          </strong>
                        </td>

                        <td>
                          <span
                            className={
                              isLowStock
                                ? "management-stock stock-warning"
                                : "management-stock"
                            }
                          >
                            {
                              product.stockQuantity
                            }

                            {isLowStock && (
                              <TriangleAlert
                                size={13}
                              />
                            )}
                          </span>
                        </td>

                        <td>
                          <span
                            className={
                              product.isActive
                                ? "management-status active"
                                : "management-status inactive"
                            }
                          >
                            {product.isActive
                              ? "ACTIVE"
                              : "INACTIVE"}
                          </span>
                        </td>

                        <td>
                          <div className="product-action-buttons">
                            <button
                              type="button"
                              title="Edit product"
                              disabled={
                                !product.isActive
                              }
                              onClick={() =>
                                setEditingProduct(
                                  product,
                                )
                              }
                            >
                              <Pencil
                                size={15}
                              />
                            </button>

                            <button
                              className="deactivate-action"
                              type="button"
                              title="Deactivate product"
                              disabled={
                                !product.isActive
                              }
                              onClick={() =>
                                setDeactivatingProduct(
                                  product,
                                )
                              }
                            >
                              <Ban size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {(isCreating ||
        editingProduct) && (
        <ProductFormModal
          product={editingProduct}
          categories={categories}
          onClose={() => {
            setIsCreating(false);
            setEditingProduct(null);
          }}
          onSaved={(savedProduct) =>
            completeChange(
              editingProduct
                ? `${savedProduct.name} updated successfully.`
                : `${savedProduct.name} created successfully.`,
            )
          }
        />
      )}

      {deactivatingProduct && (
        <DeactivateProductModal
          product={
            deactivatingProduct
          }
          onClose={() =>
            setDeactivatingProduct(
              null,
            )
          }
          onDeactivated={(product) =>
            completeChange(
              `${product.name} deactivated successfully.`,
            )
          }
        />
      )}
    </div>
  );
}