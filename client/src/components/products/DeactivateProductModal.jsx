import { useState } from "react";
import {
  Ban,
  TriangleAlert,
  X,
} from "lucide-react";
import { apiRequest } from "../../services/api";

export default function DeactivateProductModal({
  product,
  onClose,
  onDeactivated,
}) {
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] = useState("");

  async function handleDeactivate() {
    try {
      setIsSubmitting(true);
      setError("");

      await apiRequest(
        `/products/${product.id}/deactivate`,
        {
          method: "PATCH",
        },
      );

      onDeactivated(product);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="product-modal-overlay">
      <section
        className="deactivate-product-modal"
        role="dialog"
        aria-modal="true"
      >
        <button
          className="deactivate-close-button"
          type="button"
          disabled={isSubmitting}
          onClick={onClose}
        >
          <X size={20} />
        </button>

        <div className="deactivate-warning-icon">
          <TriangleAlert size={29} />
        </div>

        <span>DEACTIVATE PRODUCT</span>
        <h2>Remove from active sales?</h2>

        <p>
          <strong>{product.name}</strong>{" "}
          will no longer appear in the Point
          of Sale catalogue. Existing sales
          and receipts will remain unchanged.
        </p>

        {error && (
          <div className="product-form-error">
            {error}
          </div>
        )}

        <div className="product-modal-actions">
          <button
            className="secondary-product-button"
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Keep active
          </button>

          <button
            className="danger-product-button"
            type="button"
            disabled={isSubmitting}
            onClick={handleDeactivate}
          >
            <Ban size={17} />

            {isSubmitting
              ? "Deactivating..."
              : "Deactivate"}
          </button>
        </div>
      </section>
    </div>
  );
}