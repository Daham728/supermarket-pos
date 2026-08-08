import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Banknote,
  Eye,
  PackageCheck,
  ReceiptText,
  RefreshCw,
  Search,
  ShoppingBag,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { apiRequest } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import SaleDetailsModal from "../components/sales/SaleDetailsModal";

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

function isInsideDateRange(
  dateValue,
  dateRange,
) {
  if (dateRange === "all") {
    return true;
  }

  const saleDate = new Date(dateValue);

  if (Number.isNaN(saleDate.getTime())) {
    return false;
  }

  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  if (dateRange === "7days") {
    startDate.setDate(
      startDate.getDate() - 6,
    );
  }

  if (dateRange === "30days") {
    startDate.setDate(
      startDate.getDate() - 29,
    );
  }

  return saleDate >= startDate;
}

function getSaleItemCount(sale) {
  return (sale.items || []).reduce(
    (total, item) =>
      total + item.quantity,
    0,
  );
}

export default function SalesPage() {
  const { user } = useAuth();

  const [sales, setSales] = useState([]);
  const [searchText, setSearchText] =
    useState("");

  const [dateRange, setDateRange] =
    useState("today");

  const [cashierFilter, setCashierFilter] =
    useState("All");

  const [selectedSale, setSelectedSale] =
    useState(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] = useState("");

  const [reloadKey, setReloadKey] =
    useState(0);

  useEffect(() => {
    let isActive = true;

    async function loadSales() {
      try {
        setIsLoading(true);
        setError("");

        const response = await apiRequest(
          "/sales?limit=100",
        );

        if (isActive) {
          setSales(
            Array.isArray(response.data)
              ? response.data
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

    loadSales();

    return () => {
      isActive = false;
    };
  }, [reloadKey]);

  const cashierNames = useMemo(() => {
    const names = sales
      .map((sale) => sale.cashier?.name)
      .filter(Boolean);

    return [
      ...new Set(names),
    ].sort();
  }, [sales]);

  const filteredSales = useMemo(() => {
    const normalizedSearch = searchText
      .trim()
      .toLowerCase();

    return sales.filter((sale) => {
      const matchesDate = isInsideDateRange(
        sale.createdAt,
        dateRange,
      );

      const matchesCashier =
        cashierFilter === "All" ||
        sale.cashier?.name ===
          cashierFilter;

      const matchesSearch =
        !normalizedSearch ||
        sale.receiptNumber
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        sale.cashier?.name
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        sale.cashier?.email
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        sale.items?.some(
          (item) =>
            item.productName
              ?.toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            item.barcode
              ?.toLowerCase()
              .includes(
                normalizedSearch,
              ),
        );

      return (
        matchesDate &&
        matchesCashier &&
        matchesSearch
      );
    });
  }, [
    sales,
    searchText,
    dateRange,
    cashierFilter,
  ]);

  const summary = useMemo(() => {
    const revenueCents =
      filteredSales.reduce(
        (total, sale) =>
          total + sale.totalCents,
        0,
      );

    const itemsSold =
      filteredSales.reduce(
        (total, sale) =>
          total +
          getSaleItemCount(sale),
        0,
      );

    const averageSaleCents =
      filteredSales.length > 0
        ? Math.round(
            revenueCents /
              filteredSales.length,
          )
        : 0;

    return {
      revenueCents,
      transactionCount:
        filteredSales.length,
      itemsSold,
      averageSaleCents,
    };
  }, [filteredSales]);

  return (
    <div className="sales-page">
      <section className="sales-page-heading">
        <div>
          <span className="page-eyebrow">
            TRANSACTION MANAGEMENT
          </span>

          <h1>Sales History</h1>

          <p>
            {user?.role === "ADMIN"
              ? "Review every supermarket transaction and receipt."
              : "Review the sales completed using your cashier account."}
          </p>
        </div>

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

          Refresh sales
        </button>
      </section>

      <section className="sales-summary-grid">
        <article className="sales-summary-card">
          <div className="sales-summary-icon sales-revenue-icon">
            <Banknote size={22} />
          </div>

          <span>Revenue</span>

          <strong>
            {formatCents(
              summary.revenueCents,
            )}
          </strong>

          <small>
            Current filtered results
          </small>
        </article>

        <article className="sales-summary-card">
          <div className="sales-summary-icon sales-transactions-icon">
            <ReceiptText size={22} />
          </div>

          <span>Transactions</span>

          <strong>
            {summary.transactionCount}
          </strong>

          <small>
            Completed receipts
          </small>
        </article>

        <article className="sales-summary-card">
          <div className="sales-summary-icon sales-items-icon">
            <PackageCheck size={22} />
          </div>

          <span>Items sold</span>

          <strong>
            {summary.itemsSold}
          </strong>

          <small>
            Total product units
          </small>
        </article>

        <article className="sales-summary-card">
          <div className="sales-summary-icon sales-average-icon">
            <TrendingUp size={22} />
          </div>

          <span>Average sale</span>

          <strong>
            {formatCents(
              summary.averageSaleCents,
            )}
          </strong>

          <small>
            Revenue per transaction
          </small>
        </article>
      </section>

      <section className="sales-filter-card">
        <div className="sales-search-box">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search receipt, cashier, barcode or product..."
            value={searchText}
            onChange={(event) =>
              setSearchText(
                event.target.value,
              )
            }
          />

          {searchText && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() =>
                setSearchText("")
              }
            >
              ×
            </button>
          )}
        </div>

        <select
          className="sales-filter-select"
          value={dateRange}
          onChange={(event) =>
            setDateRange(
              event.target.value,
            )
          }
        >
          <option value="today">
            Today
          </option>

          <option value="7days">
            Last 7 days
          </option>

          <option value="30days">
            Last 30 days
          </option>

          <option value="all">
            All available sales
          </option>
        </select>

        {user?.role === "ADMIN" && (
          <select
            className="sales-filter-select"
            value={cashierFilter}
            onChange={(event) =>
              setCashierFilter(
                event.target.value,
              )
            }
          >
            <option value="All">
              All cashiers
            </option>

            {cashierNames.map((name) => (
              <option
                value={name}
                key={name}
              >
                {name}
              </option>
            ))}
          </select>
        )}
      </section>

      {error && (
        <div className="dashboard-error">
          <strong>
            Sales could not be loaded.
          </strong>

          <br />

          {error}
        </div>
      )}

      <section className="sales-table-card">
        <div className="sales-table-heading">
          <div>
            <ShoppingBag size={19} />

            <div>
              <h2>Transactions</h2>

              <span>
                {filteredSales.length} sale
                {filteredSales.length === 1
                  ? ""
                  : "s"}{" "}
                displayed
              </span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="sales-empty-state">
            <div className="loading-spinner" />
            <p>Loading sales...</p>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="sales-empty-state">
            <ReceiptText size={40} />
            <h3>No sales found</h3>

            <p>
              Try changing the search or
              date filters.
            </p>
          </div>
        ) : (
          <div className="sales-table-wrapper">
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Receipt</th>
                  <th>Date and time</th>
                  <th>Cashier</th>
                  <th>Items</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>

              <tbody>
                {filteredSales.map(
                  (sale) => (
                    <tr key={sale.id}>
                      <td>
                        <div className="receipt-number-cell">
                          <ReceiptText
                            size={16}
                          />

                          <span>
                            {
                              sale.receiptNumber
                            }
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="sale-date-cell">
                          <strong>
                            {new Date(
                              sale.createdAt,
                            ).toLocaleDateString(
                              "en-LK",
                              {
                                dateStyle:
                                  "medium",
                              },
                            )}
                          </strong>

                          <span>
                            {new Date(
                              sale.createdAt,
                            ).toLocaleTimeString(
                              "en-LK",
                              {
                                hour: "2-digit",
                                minute:
                                  "2-digit",
                              },
                            )}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="cashier-cell">
                          <div>
                            <UserRound
                              size={14}
                            />
                          </div>

                          <span>
                            {sale.cashier
                              ?.name ||
                              "Staff"}
                          </span>
                        </div>
                      </td>

                      <td>
                        {getSaleItemCount(
                          sale,
                        )}
                      </td>

                      <td>
                        {sale.paymentMethod}
                      </td>

                      <td>
                        <strong className="sale-total-cell">
                          {formatCents(
                            sale.totalCents,
                          )}
                        </strong>
                      </td>

                      <td>
                        <span className="sale-status-pill">
                          {sale.status}
                        </span>
                      </td>

                      <td>
                        <button
                          className="sale-view-button"
                          type="button"
                          aria-label={`View ${sale.receiptNumber}`}
                          onClick={() =>
                            setSelectedSale(
                              sale,
                            )
                          }
                        >
                          <Eye size={17} />
                          View
                        </button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedSale && (
        <SaleDetailsModal
          sale={selectedSale}
          onClose={() =>
            setSelectedSale(null)
          }
        />
      )}
    </div>
  );
}