import { NavLink, Outlet, useNavigate } from "react-router";
import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  LogOut,
  Package,
  ReceiptText,
  ScanBarcode,
  Store,
  Tags,
  Users,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const navigationItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
    available: true,
  },
  {
    label: "Point of Sale",
    icon: ScanBarcode,
    available: false,
  },
  {
    label: "Products",
    icon: Package,
    available: false,
  },
  {
    label: "Categories",
    icon: Tags,
    available: false,
  },
  {
    label: "Inventory",
    icon: Boxes,
    available: false,
  },
  {
    label: "Sales",
    icon: ReceiptText,
    available: false,
  },
  {
    label: "Reports",
    icon: BarChart3,
    available: false,
  },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Store size={24} />
          </div>

          <div>
            <strong>Supermarket</strong>
            <span>POS System</span>
          </div>
        </div>

        <nav className="sidebar-navigation">
          <span className="navigation-label">WORKSPACE</span>

          {navigationItems.map((item) => {
            const Icon = item.icon;

            if (item.available) {
              return (
                <NavLink
                  className={({ isActive }) =>
                    `navigation-item ${isActive ? "active" : ""}`
                  }
                  key={item.label}
                  to={item.path}
                  end
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </NavLink>
              );
            }

            return (
              <button
                className="navigation-item navigation-disabled"
                key={item.label}
                type="button"
                disabled
              >
                <Icon size={20} />
                <span>{item.label}</span>
                <small>Soon</small>
              </button>
            );
          })}

          {user?.role === "ADMIN" && (
            <>
              <span className="navigation-label management-label">
                MANAGEMENT
              </span>

              <button
                className="navigation-item navigation-disabled"
                type="button"
                disabled
              >
                <Users size={20} />
                <span>Staff users</span>
                <small>Soon</small>
              </button>
            </>
          )}
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>

          <div className="user-details">
            <strong>{user?.name}</strong>
            <span>{user?.role}</span>
          </div>

          <button
            className="logout-icon-button"
            type="button"
            title="Log out"
            onClick={handleLogout}
          >
            <LogOut size={19} />
          </button>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="header-location">
              <Store size={16} />
              Main supermarket
            </span>
          </div>

          <div className="header-actions">
            <span className="online-status">
              <span />
              System online
            </span>

            <button
              className="header-logout-button"
              type="button"
              onClick={handleLogout}
            >
              <LogOut size={18} />
              Log out
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          <Outlet />
        </div>
      </section>
    </div>
  );
}