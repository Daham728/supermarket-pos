import { useMemo, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  Printer,
  ReceiptText,
  X,
} from "lucide-react";
import { apiRequest } from "../../services/api";

const currencyFormatter = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  minimumFractionDigits: 2,
});

function formatCents(cents) {
  return currencyFormatter.format(
    Number(cents || 0) / 100,
  );
}

function createQuickAmounts(total) {
  const roundedHundred =
    Math.ceil(total / 100) * 100;

  return [
    total,
    roundedHundred,
    roundedHundred + 500,
    roundedHundred + 1000,
  ].filter(
    (amount, index, amounts) =>
      amount >= total &&
      amounts.indexOf(amount) === index,
  );
}

export default function CheckoutModal({
  cartItems,
  subtotal,
  onClose,
  onSaleCompleted,
}) {
  const [amountPaid, setAmountPaid] = useState(
    subtotal.toFixed(2),
  );

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] = useState("");
  const [completedSale, setCompletedSale] =
    useState(null);

  const totalCents = Math.round(subtotal * 100);

  const amountPaidCents = Math.round(
    Number(amountPaid || 0) * 100,
  );

  const changeCents = Math.max(
    amountPaidCents - totalCents,
    0,
  );

  const quickAmounts = useMemo(
    () => createQuickAmounts(subtotal),
    [subtotal],
  );

  const isAmountValid =
    Number.isFinite(Number(amountPaid)) &&
    amountPaidCents >= totalCents;

  function handleClose() {
    if (!isSubmitting) {
      onClose();
    }
  }

  function handleOverlayClick(event) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!isAmountValid) {
      setError(
        "The cash received must be equal to or greater than the total.",
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await apiRequest("/sales", {
        method: "POST",
        body: JSON.stringify({
          paymentMethod: "CASH",
          amountPaidCents,
          discountCents: 0,
          items: cartItems.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      const sale = response.data;

      setCompletedSale(sale);
      onSaleCompleted(sale);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (completedSale) {
    return (
      <div
        className="checkout-overlay"
        onMouseDown={handleOverlayClick}
      >
        <section
          className="checkout-dialog receipt-dialog"
          role="dialog"
          aria-modal="true"
          aria-label="Completed sale receipt"
        >
          <div className="receipt-success">
            <div className="receipt-success-icon">
              <CheckCircle2 size={34} />
            </div>

            <span>PAYMENT SUCCESSFUL</span>
            <h2>Sale completed</h2>
            <p>
              Receipt {completedSale.receiptNumber}
            </p>
          </div>

          <div className="receipt-paper">
            <div className="receipt-store">
              <ReceiptText size={28} />
              <h3>Supermarket POS</h3>
              <span>Customer sales receipt</span>
            </div>

            <div className="receipt-details">
              <div>
                <span>Receipt</span>
                <strong>
                  {completedSale.receiptNumber}
                </strong>
              </div>

              <div>
                <span>Date</span>
                <strong>
                  {new Date(
                    completedSale.createdAt,
                  ).toLocaleString("en-LK")}
                </strong>
              </div>

              <div>
                <span>Cashier</span>
                <strong>
                  {completedSale.cashier?.name ||
                    "Staff member"}
                </strong>
              </div>

              <div>
                <span>Payment</span>
                <strong>
                  {completedSale.paymentMethod}
                </strong>
              </div>
            </div>

            <div className="receipt-items">
              {completedSale.items?.map((item) => (
                <div
                  className="receipt-item"
                  key={item.id}
                >
                  <div>
                    <strong>{item.productName}</strong>
                    <span>
                      {item.quantity} ×{" "}
                      {formatCents(
                        item.unitPriceCents,
                      )}
                    </span>
                  </div>

                  <strong>
                    {formatCents(
                      item.lineTotalCents,
                    )}
                  </strong>
                </div>
              ))}
            </div>

            <div className="receipt-totals">
              <div>
                <span>Subtotal</span>
                <strong>
                  {formatCents(
                    completedSale.subtotalCents,
                  )}
                </strong>
              </div>

              <div>
                <span>Discount</span>
                <strong>
                  {formatCents(
                    completedSale.discountCents,
                  )}
                </strong>
              </div>

              <div className="receipt-grand-total">
                <span>Total</span>
                <strong>
                  {formatCents(
                    completedSale.totalCents,
                  )}
                </strong>
              </div>

              <div>
                <span>Cash received</span>
                <strong>
                  {formatCents(
                    completedSale.amountPaidCents,
                  )}
                </strong>
              </div>

              <div className="receipt-change">
                <span>Change</span>
                <strong>
                  {formatCents(
                    completedSale.changeCents,
                  )}
                </strong>
              </div>
            </div>

            <div className="receipt-footer">
              <p>Thank you for shopping with us.</p>
              <span>
                Please keep this receipt for your
                records.
              </span>
            </div>
          </div>

          <div className="receipt-actions">
            <button
              className="secondary-checkout-button"
              type="button"
              onClick={() => window.print()}
            >
              <Printer size={18} />
              Print receipt
            </button>

            <button
              className="primary-checkout-button"
              type="button"
              onClick={onClose}
            >
              Start new sale
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div
      className="checkout-overlay"
      onMouseDown={handleOverlayClick}
    >
      <section
        className="checkout-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Cash payment"
      >
        <div className="checkout-modal-heading">
          <div>
            <div className="checkout-heading-icon">
              <Banknote size={24} />
            </div>

            <div>
              <span>CASH PAYMENT</span>
              <h2>Complete checkout</h2>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close checkout"
            disabled={isSubmitting}
            onClick={handleClose}
          >
            <X size={21} />
          </button>
        </div>

        <div className="payment-total-card">
          <span>Amount to collect</span>
          <strong>
            {currencyFormatter.format(subtotal)}
          </strong>
          <small>
            {cartItems.reduce(
              (total, item) =>
                total + item.quantity,
              0,
            )}{" "}
            item(s)
          </small>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="payment-form-group">
            <label htmlFor="amountPaid">
              Cash received
            </label>

            <div className="money-input">
              <span>LKR</span>

              <input
                id="amountPaid"
                type="number"
                min="0"
                step="0.01"
                value={amountPaid}
                disabled={isSubmitting}
                onChange={(event) => {
                  setAmountPaid(event.target.value);
                  setError("");
                }}
                autoFocus
              />
            </div>
          </div>

          <div className="quick-cash-options">
            <span>Quick cash</span>

            <div>
              {quickAmounts.map((amount) => (
                <button
                  type="button"
                  key={amount}
                  disabled={isSubmitting}
                  onClick={() =>
                    setAmountPaid(
                      amount.toFixed(2),
                    )
                  }
                >
                  {currencyFormatter.format(amount)}
                </button>
              ))}
            </div>
          </div>

          <div
            className={`change-display ${
              isAmountValid
                ? "change-valid"
                : "change-invalid"
            }`}
          >
            <span>
              {isAmountValid
                ? "Change to return"
                : "Remaining amount"}
            </span>

            <strong>
              {formatCents(
                isAmountValid
                  ? changeCents
                  : totalCents -
                      Math.max(amountPaidCents, 0),
              )}
            </strong>
          </div>

          {error && (
            <div
              className="checkout-error"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="checkout-modal-actions">
            <button
              className="secondary-checkout-button"
              type="button"
              disabled={isSubmitting}
              onClick={handleClose}
            >
              Cancel
            </button>

            <button
              className="primary-checkout-button"
              type="submit"
              disabled={
                isSubmitting || !isAmountValid
              }
            >
              {isSubmitting
                ? "Processing sale..."
                : "Complete sale"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}