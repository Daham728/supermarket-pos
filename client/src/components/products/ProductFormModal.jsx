import { useState } from "react";
import {
  PackagePlus,
  Save,
  X,
} from "lucide-react";
import { apiRequest } from "../../services/api";

function getProductPrice(product, field) {
  if (!product) {
    return "";
  }

  if (product[field] !== undefined) {
    return product[field];
  }

  const centsField =
    field === "costPrice"
      ? "costPriceCents"
      : "sellingPriceCents";

  if (product[centsField] !== undefined) {
    return product[centsField] / 100;
  }

  return "";
}

function getInitialForm(product) {
  return {
    barcode: product?.barcode || "",
    sku: product?.sku || "",
    name: product?.name || "",
    description:
      product?.description || "",
    costPrice: getProductPrice(
      product,
      "costPrice",
    ),
    sellingPrice: getProductPrice(
      product,
      "sellingPrice",
    ),
    stockQuantity:
      product?.stockQuantity ?? 0,
    reorderLevel:
      product?.reorderLevel ?? 5,
    unit: product?.unit || "ITEM",
    categoryId:
      product?.categoryId ||
      product?.category?.id ||
      "",
  };
}

export default function ProductFormModal({
  product,
  categories,
  onClose,
  onSaved,
}) {
  const isEditing = Boolean(product);

  const [form, setForm] = useState(() =>
    getInitialForm(product),
  );

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] =
    useState([]);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setFieldErrors([]);
  }

  function handleOverlayClick(event) {
    if (
      event.target === event.currentTarget &&
      !isSubmitting
    ) {
      onClose();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setFieldErrors([]);

    const costPrice = Number(
      form.costPrice,
    );

    const sellingPrice = Number(
      form.sellingPrice,
    );

    const stockQuantity = Number(
      form.stockQuantity,
    );

    const reorderLevel = Number(
      form.reorderLevel,
    );

    const categoryId = Number(
      form.categoryId,
    );

    if (
      !form.barcode.trim() ||
      !form.sku.trim() ||
      !form.name.trim()
    ) {
      setError(
        "Barcode, SKU and product name are required.",
      );
      return;
    }

    if (
      !Number.isFinite(costPrice) ||
      costPrice < 0
    ) {
      setError(
        "Enter a valid cost price.",
      );
      return;
    }

    if (
      !Number.isFinite(sellingPrice) ||
      sellingPrice < costPrice
    ) {
      setError(
        "Selling price must be equal to or greater than the cost price.",
      );
      return;
    }

    if (
      !Number.isInteger(stockQuantity) ||
      stockQuantity < 0
    ) {
      setError(
        "Stock quantity must be a whole number of zero or more.",
      );
      return;
    }

    if (
      !Number.isInteger(reorderLevel) ||
      reorderLevel < 0
    ) {
      setError(
        "Reorder level must be a whole number of zero or more.",
      );
      return;
    }

    if (
      !Number.isInteger(categoryId) ||
      categoryId <= 0
    ) {
      setError("Select a category.");
      return;
    }

    const body = {
      barcode: form.barcode.trim(),
      sku: form.sku
        .trim()
        .toUpperCase(),
      name: form.name.trim(),
      description:
        form.description.trim() || null,
      costPrice,
      sellingPrice,
      stockQuantity,
      reorderLevel,
      unit: form.unit
        .trim()
        .toUpperCase(),
      categoryId,
    };

    try {
      setIsSubmitting(true);

      const response = await apiRequest(
        isEditing
          ? `/products/${product.id}`
          : "/products",
        {
          method: isEditing
            ? "PUT"
            : "POST",
          body: JSON.stringify(body),
        },
      );

      onSaved(response.data);
    } catch (requestError) {
      setError(requestError.message);

      setFieldErrors(
        Array.isArray(
          requestError.details,
        )
          ? requestError.details
          : [],
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="product-modal-overlay"
      onMouseDown={handleOverlayClick}
    >
      <section
        className="product-form-modal"
        role="dialog"
        aria-modal="true"
        aria-label={
          isEditing
            ? "Edit product"
            : "Create product"
        }
      >
        <div className="product-modal-heading">
          <div>
            <div className="product-modal-icon">
              <PackagePlus size={24} />
            </div>

            <div>
              <span>
                {isEditing
                  ? "UPDATE INVENTORY"
                  : "NEW INVENTORY ITEM"}
              </span>

              <h2>
                {isEditing
                  ? "Edit product"
                  : "Create product"}
              </h2>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close form"
            disabled={isSubmitting}
            onClick={onClose}
          >
            <X size={21} />
          </button>
        </div>

        <form
          className="product-form"
          onSubmit={handleSubmit}
        >
          {error && (
            <div className="product-form-error">
              <strong>{error}</strong>

              {fieldErrors.length > 0 && (
                <ul>
                  {fieldErrors.map(
                    (fieldError, index) => (
                      <li key={index}>
                        {fieldError.field
                          ? `${fieldError.field}: `
                          : ""}
                        {fieldError.message}
                      </li>
                    ),
                  )}
                </ul>
              )}
            </div>
          )}

          <div className="product-form-grid">
            <div className="product-form-group product-form-wide">
              <label htmlFor="productName">
                Product name
              </label>

              <input
                id="productName"
                name="name"
                type="text"
                value={form.name}
                disabled={isSubmitting}
                onChange={handleChange}
                placeholder="Example: Fresh Milk 1L"
                required
              />
            </div>

            <div className="product-form-group">
              <label htmlFor="barcode">
                Barcode
              </label>

              <input
                id="barcode"
                name="barcode"
                type="text"
                value={form.barcode}
                disabled={isSubmitting}
                onChange={handleChange}
                placeholder="Example: 4791234567890"
                required
              />
            </div>

            <div className="product-form-group">
              <label htmlFor="sku">
                SKU
              </label>

              <input
                id="sku"
                name="sku"
                type="text"
                value={form.sku}
                disabled={isSubmitting}
                onChange={handleChange}
                placeholder="Example: MILK-001"
                required
              />
            </div>

            <div className="product-form-group">
              <label htmlFor="categoryId">
                Category
              </label>

              <select
                id="categoryId"
                name="categoryId"
                value={form.categoryId}
                disabled={isSubmitting}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select category
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="product-form-group">
              <label htmlFor="unit">
                Unit
              </label>

              <select
                id="unit"
                name="unit"
                value={form.unit}
                disabled={isSubmitting}
                onChange={handleChange}
              >
                <option value="ITEM">
                  Item
                </option>
                <option value="PACK">
                  Pack
                </option>
                <option value="KG">
                  Kilogram
                </option>
                <option value="G">
                  Gram
                </option>
                <option value="L">
                  Litre
                </option>
                <option value="ML">
                  Millilitre
                </option>
              </select>
            </div>

            <div className="product-form-group">
              <label htmlFor="costPrice">
                Cost price (LKR)
              </label>

              <input
                id="costPrice"
                name="costPrice"
                type="number"
                min="0"
                step="0.01"
                value={form.costPrice}
                disabled={isSubmitting}
                onChange={handleChange}
                required
              />
            </div>

            <div className="product-form-group">
              <label htmlFor="sellingPrice">
                Selling price (LKR)
              </label>

              <input
                id="sellingPrice"
                name="sellingPrice"
                type="number"
                min="0"
                step="0.01"
                value={form.sellingPrice}
                disabled={isSubmitting}
                onChange={handleChange}
                required
              />
            </div>

            <div className="product-form-group">
              <label htmlFor="stockQuantity">
                Stock quantity
              </label>

              <input
                id="stockQuantity"
                name="stockQuantity"
                type="number"
                min="0"
                step="1"
                value={form.stockQuantity}
                disabled={isSubmitting}
                onChange={handleChange}
                required
              />
            </div>

            <div className="product-form-group">
              <label htmlFor="reorderLevel">
                Reorder level
              </label>

              <input
                id="reorderLevel"
                name="reorderLevel"
                type="number"
                min="0"
                step="1"
                value={form.reorderLevel}
                disabled={isSubmitting}
                onChange={handleChange}
                required
              />
            </div>

            <div className="product-form-group product-form-wide">
              <label htmlFor="description">
                Description
              </label>

              <textarea
                id="description"
                name="description"
                rows="3"
                value={form.description}
                disabled={isSubmitting}
                onChange={handleChange}
                placeholder="Optional product description"
              />
            </div>
          </div>

          <div className="product-modal-actions">
            <button
              className="secondary-product-button"
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              className="primary-product-button"
              type="submit"
              disabled={isSubmitting}
            >
              <Save size={17} />

              {isSubmitting
                ? "Saving product..."
                : isEditing
                  ? "Save changes"
                  : "Create product"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}