import { useEffect, useState } from "react";
import {
  ArrowRight,
  Boxes,
  Package,
  ScanBarcode,
  ShieldCheck,
  Tags,
  TriangleAlert,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { apiRequest } from "../services/api";

export default function DashboardPage() {
  const { user } = useAuth();

  const [statistics, setStatistics] = useState({
    products: 0,
    categories: 0,
    lowStock: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadDashboard() {
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          apiRequest("/products?limit=100"),
          apiRequest("/categories"),
        ]);

        const products = productsResponse.data || [];
        const categories = categoriesResponse.data || [];

        const lowStockProducts = products.filter((product) => {
          const reorderLevel = product.reorderLevel ?? 5;
          return product.stockQuantity <= reorderLevel;
        });

        if (isActive) {
          setStatistics({
            products:
              productsResponse.pagination?.totalProducts || products.length,
            categories: categories.length,
            lowStock: lowStockProducts.length,
          });
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

    loadDashboard();

    return () => {
      isActive = false;
    };
  }, []);

  const currentHour = new Date().getHours();

  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 18
        ? "Good afternoon"
        : "Good evening";

  return (
    <div className="dashboard-page">
      <section className="welcome-section">
        <div>
          <span className="page-eyebrow">STORE OVERVIEW</span>
          <h1>
            {greeting}, {user?.name}.
          </h1>
          <p>
            Here is what is happening with your supermarket system today.
          </p>
        </div>

        <span className={`role-badge role-${user?.role?.toLowerCase()}`}>
          <ShieldCheck size={17} />
          {user?.role} ACCESS
        </span>
      </section>

      {error && <div className="dashboard-error">{error}</div>}

      <section className="statistics-grid">
        <article className="statistic-card">
          <div className="statistic-icon statistic-icon-blue">
            <Package size={23} />
          </div>

          <div className="statistic-card-top">
            <span>Total products</span>
            <small>LIVE</small>
          </div>

          <strong>{isLoading ? "..." : statistics.products}</strong>
          <p>Products registered in the system</p>
        </article>

        <article className="statistic-card">
          <div className="statistic-icon statistic-icon-purple">
            <Tags size={23} />
          </div>

          <div className="statistic-card-top">
            <span>Categories</span>
            <small>LIVE</small>
          </div>

          <strong>{isLoading ? "..." : statistics.categories}</strong>
          <p>Product categories available</p>
        </article>

        <article className="statistic-card">
          <div className="statistic-icon statistic-icon-orange">
            <TriangleAlert size={23} />
          </div>

          <div className="statistic-card-top">
            <span>Low stock</span>
            <small>CHECK</small>
          </div>

          <strong>{isLoading ? "..." : statistics.lowStock}</strong>
          <p>Products that may need restocking</p>
        </article>

        <article className="statistic-card">
          <div className="statistic-icon statistic-icon-green">
            <ShieldCheck size={23} />
          </div>

          <div className="statistic-card-top">
            <span>System status</span>
            <small>SECURE</small>
          </div>

          <strong className="status-text">Online</strong>
          <p>Backend and database connected</p>
        </article>
      </section>

      <section className="dashboard-lower-grid">
        <article className="getting-started-card">
          <div className="section-heading">
            <div>
              <span className="page-eyebrow">NEXT MODULES</span>
              <h2>Your POS workspace</h2>
            </div>

            <Boxes size={25} />
          </div>

          <div className="module-list">
            <div className="module-item">
              <div className="module-number">01</div>

              <div>
                <strong>Point of Sale</strong>
                <p>Barcode scanning, shopping cart and checkout.</p>
              </div>

              <ArrowRight size={19} />
            </div>

            <div className="module-item">
              <div className="module-number">02</div>

              <div>
                <strong>Product management</strong>
                <p>Create, update, search and deactivate products.</p>
              </div>

              <ArrowRight size={19} />
            </div>

            <div className="module-item">
              <div className="module-number">03</div>

              <div>
                <strong>Sales and receipts</strong>
                <p>Record transactions and produce customer receipts.</p>
              </div>

              <ArrowRight size={19} />
            </div>
          </div>
        </article>

        <article className="next-feature-card">
          <div className="next-feature-icon">
            <ScanBarcode size={31} />
          </div>

          <span className="page-eyebrow">COMING NEXT</span>
          <h2>Cashier checkout</h2>

          <p>
            Our next checkpoint will create the barcode search, product cart,
            quantity controls and payment screen.
          </p>

          <div className="feature-progress">
            <div>
              <span>Project foundation</span>
              <strong>Complete</strong>
            </div>

            <div className="progress-track">
              <span />
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}