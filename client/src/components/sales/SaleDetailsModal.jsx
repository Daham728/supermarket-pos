import {
  Printer,
  ReceiptText,
  X,
} from "lucide-react";

const currencyFormatter = new Intl.NumberFormat(
  "en-LK",
  {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
  },
);

function formatCents(cents) {
  return currencyFormatter.format(
    Number(cents || 0) / 100,
  );
}

export default function SaleDetailsModal({
  sale,
  onClose,
}) {
  function handleOverlayClick(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className="checkout-overlay"
      onMouseDown={handleOverlayClick}
    >
      <section
        className="checkout-dialog receipt-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Sale receipt details"
      >
        <div className="receipt-success">
          <button
            className="receipt-modal-close"
            type="button"
            aria-label="Close receipt"
            onClick={onClose}
          >
            <X size={20} />
          </button>

          <div className="receipt-success-icon">
            <ReceiptText size={31} />
          </div>

          <span>SALE RECEIPT</span>
          <h2>Transaction details</h2>
          <p>{sale.receiptNumber}</p>
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
                {sale.receiptNumber}
              </strong>
            </div>

            <div>
              <span>Date</span>
              <strong>
                {new Date(
                  sale.createdAt,
                ).toLocaleString("en-LK")}
              </strong>
            </div>

            <div>
              <span>Cashier</span>
              <strong>
                {sale.cashier?.name ||
                  "Staff member"}
              </strong>
            </div>

            <div>
              <span>Payment</span>
              <strong>
                {sale.paymentMethod}
              </strong>
            </div>

            <div>
              <span>Status</span>
              <strong>{sale.status}</strong>
            </div>
          </div>

          <div className="receipt-items">
            {sale.items?.map((item) => (
              <div
                className="receipt-item"
                key={item.id}
              >
                <div>
                  <strong>
                    {item.productName}
                  </strong>

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
                  sale.subtotalCents,
                )}
              </strong>
            </div>

            <div>
              <span>Discount</span>
              <strong>
                {formatCents(
                  sale.discountCents,
                )}
              </strong>
            </div>

            <div className="receipt-grand-total">
              <span>Total</span>
              <strong>
                {formatCents(
                  sale.totalCents,
                )}
              </strong>
            </div>

            <div>
              <span>Cash received</span>
              <strong>
                {formatCents(
                  sale.amountPaidCents,
                )}
              </strong>
            </div>

            <div className="receipt-change">
              <span>Change</span>
              <strong>
                {formatCents(
                  sale.changeCents,
                )}
              </strong>
            </div>
          </div>

          <div className="receipt-footer">
            <p>
              Thank you for shopping with us.
            </p>

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
            Close receipt
          </button>
        </div>
      </section>
    </div>
  );
}