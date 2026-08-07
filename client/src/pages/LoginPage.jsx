import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  ShoppingCart,
  Store,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password) {
      setError("Enter both your email address and password.");
      return;
    }

    try {
      setIsSubmitting(true);

      await login({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-showcase">
        <div className="showcase-content">
          <div className="brand">
            <div className="brand-icon">
              <Store size={28} />
            </div>

            <div>
              <strong>Supermarket POS</strong>
              <span>Retail management system</span>
            </div>
          </div>

          <div className="showcase-heading">
            <span className="eyebrow">SMART RETAIL OPERATIONS</span>

            <h1>Everything your supermarket needs in one place.</h1>

            <p>
              Process sales, manage products, monitor inventory and understand
              your store performance from one secure system.
            </p>
          </div>

          <div className="feature-grid">
            <article>
              <ShoppingCart size={22} />
              <div>
                <strong>Fast checkout</strong>
                <span>Built for busy cashier counters.</span>
              </div>
            </article>

            <article>
              <Boxes size={22} />
              <div>
                <strong>Inventory control</strong>
                <span>Know exactly what is in stock.</span>
              </div>
            </article>

            <article>
              <BarChart3 size={22} />
              <div>
                <strong>Sales insights</strong>
                <span>Understand how your store performs.</span>
              </div>
            </article>

            <article>
              <ShieldCheck size={22} />
              <div>
                <strong>Role security</strong>
                <span>Separate admin and cashier access.</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="login-form-section">
        <div className="login-card">
          <div className="mobile-brand">
            <Store size={25} />
            <span>Supermarket POS</span>
          </div>

          <div className="login-card-heading">
            <span className="login-badge">SECURE LOGIN</span>
            <h2>Welcome back</h2>
            <p>Enter your staff account details to continue.</p>
          </div>

          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email address</label>

              <div className="input-wrapper">
                <Mail size={19} />

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@supermarket.local"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>

              <div className="input-wrapper">
                <LockKeyhole size={19} />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />

                <button
                  className="password-toggle"
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <button
              className="login-button"
              type="submit"
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? "Signing in..." : "Sign in"}</span>

              {!isSubmitting && <ArrowRight size={19} />}
            </button>
          </form>

          <div className="login-security-note">
            <ShieldCheck size={18} />

            <p>
              Access is restricted to authorised supermarket staff members.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}