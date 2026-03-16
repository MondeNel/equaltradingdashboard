import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../services/api";
import { COUNTRIES } from "../constants";

/**
 * UI Theme
 */
const S = {
  bg: "#05050e",
  panel: "#0d0820",
  border: "#2e2e58",
  dim: "#5050a0",
  text: "#e8e8ff",
  subtext: "#c8c8ee",
  cyan: "#38bdf8",
  red: "#f87171",
  input: {
    background: "#0d0820",
    border: "1px solid #2e2e58",
    borderRadius: "8px",
    padding: "12px 14px",
    color: "#e8e8ff",
    fontSize: "13px",
    fontFamily: "'Courier New', monospace",
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
  },
};

const POPULAR = COUNTRIES.filter(c => c.popular);
const ALL = COUNTRIES.filter(c => !c.popular);

export default function RegisterPage() {

  const nav = useNavigate();
  const dropRef = useRef(null);

  const [form, setForm] = useState({
    display_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "South Africa",
    currency_code: "ZAR",
    currency_symbol: "R",
    agreed: false,
  });

  const [showCountryList, setShowCountryList] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    function handler(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setShowCountryList(false);
        setSearch("");
      }
    }

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /**
   * Update form
   */
  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }));
  }

  /**
   * Country selection
   */
  function selectCountry(c) {
    setForm(f => ({
      ...f,
      country: c.name,
      currency_code: c.currency,
      currency_symbol: c.symbol,
    }));

    setShowCountryList(false);
    setSearch("");
  }

  const filtered = search.trim()
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : null;

  const selectedCountry =
    COUNTRIES.find(c => c.name === form.country) || COUNTRIES[0];

  /**
   * Submit form
   */
  async function handleSubmit() {

    setError("");

    if (!form.display_name.trim())
      return setError("Enter a display name.");

    if (!form.email.trim())
      return setError("Enter your email.");

    if (form.password.length < 8)
      return setError("Password must be at least 8 characters.");

    if (form.password !== form.confirmPassword)
      return setError("Passwords do not match.");

    if (!form.agreed)
      return setError("You must agree to the terms.");

    setLoading(true);

    try {

      await authAPI.register({
        display_name: form.display_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        country: form.country,
        currency_code: form.currency_code,
        currency_symbol: form.currency_symbol,
      });

      const login = await authAPI.login(
        form.email.trim().toLowerCase(),
        form.password
      );

      const token = login.data.access_token;
      localStorage.setItem("equal_token", token);

      const me = await authAPI.me();
      localStorage.setItem("equal_user", JSON.stringify(me.data));

      nav("/home");

    } catch (e) {

      const detail = e.response?.data?.detail;

      const msg = Array.isArray(detail)
        ? detail.map(d => d.msg).join(", ")
        : typeof detail === "string"
        ? detail
        : "Registration failed.";

      setError(msg);

    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: S.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "420px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              color: S.text,
              letterSpacing: "2px",
            }}
          >
            CREATE ACCOUNT
          </div>

          <div
            style={{
              fontSize: "9px",
              color: S.dim,
              letterSpacing: "2px",
            }}
          >
            COMPLEXITY IS THE ENEMY OF EXECUTION
          </div>
        </div>

        {error && (
          <div
            style={{
              background: "#1a0606",
              border: "1px solid #ef444466",
              borderRadius: "8px",
              padding: "10px 14px",
              marginBottom: "16px",
              fontSize: "11px",
              color: S.red,
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            background: S.panel,
            border: `1px solid ${S.border}`,
            borderRadius: "16px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >

          {/* Display Name */}
          <input
            style={S.input}
            placeholder="Display name"
            value={form.display_name}
            onChange={e => set("display_name", e.target.value)}
          />

          {/* Email */}
          <input
            style={S.input}
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={e => set("email", e.target.value)}
          />

          {/* Password */}
          <div style={{ position: "relative" }}>
            <input
              style={{ ...S.input, paddingRight: "40px" }}
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={e => set("password", e.target.value)}
            />

            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: S.dim,
              }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {/* Confirm Password */}
          <div style={{ position: "relative" }}>
            <input
              style={{ ...S.input, paddingRight: "40px" }}
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm password"
              value={form.confirmPassword}
              onChange={e => set("confirmPassword", e.target.value)}
            />

            <button
              type="button"
              onClick={() => setShowConfirm(v => !v)}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: S.dim,
              }}
            >
              {showConfirm ? "Hide" : "Show"}
            </button>
          </div>

          {/* COUNTRY SELECTOR */}
          <div ref={dropRef}>

            <div
              style={{
                fontSize: "8px",
                color: S.cyan,
                marginBottom: "6px",
                letterSpacing: "1px",
              }}
            >
              COUNTRY · SETS YOUR CURRENCY
            </div>

            <div
              onClick={() => setShowCountryList(v => !v)}
              style={{
                background: "#0d0820",
                border: `1px solid ${S.cyan}66`,
                borderRadius: "8px",
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
              }}
            >

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "12px",
                    color: S.cyan,
                    fontWeight: "bold",
                  }}
                >
                  {selectedCountry.name}
                </div>

                <div
                  style={{
                    fontSize: "9px",
                    color: S.dim,
                  }}
                >
                  {selectedCountry.currency} · {selectedCountry.symbol}
                </div>
              </div>

              <span style={{ fontSize: "10px", color: S.dim }}>
                {showCountryList ? "▲" : "▼"}
              </span>

            </div>

            {showCountryList && (
              <div
                style={{
                  marginTop: "6px",
                  background: "#0a0820",
                  border: `1px solid ${S.border}`,
                  borderRadius: "10px",
                }}
              >

                <div style={{ padding: "10px" }}>
                  <input
                    style={S.input}
                    placeholder="Search country..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>

                <div style={{ maxHeight: "220px", overflowY: "auto" }}>

                  {(filtered || POPULAR).map(c => (
                    <CountryRow
                      key={c.code}
                      c={c}
                      selected={form.country === c.name}
                      onSelect={selectCountry}
                    />
                  ))}

                </div>
              </div>
            )}

          </div>

          {/* Terms */}
          <div
            style={{ display: "flex", gap: "10px", cursor: "pointer" }}
            onClick={() => set("agreed", !form.agreed)}
          >

            <div
              style={{
                width: "18px",
                height: "18px",
                border: `1px solid ${
                  form.agreed ? S.cyan : S.border
                }`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {form.agreed && (
                <svg width="10" height="10" viewBox="0 0 10 10">
                  <polyline
                    points="2,5 4,7 8,3"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    fill="none"
                  />
                </svg>
              )}
            </div>

            <span style={{ fontSize: "9px", color: S.dim }}>
              I agree to the Terms of Service and Privacy Policy.
            </span>

          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              background: "linear-gradient(135deg,#061426,#082040)",
              border: `2px solid ${S.cyan}`,
              borderRadius: "10px",
              padding: "14px",
              fontSize: "13px",
              fontWeight: "bold",
              color: S.cyan,
              letterSpacing: "2px",
              cursor: "pointer",
            }}
          >
            {loading ? "CREATING..." : "CREATE ACCOUNT"}
          </button>

        </div>

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <span style={{ fontSize: "10px", color: S.dim }}>
            Already have an account?
          </span>

          <Link
            to="/login"
            style={{
              fontSize: "10px",
              color: S.cyan,
              marginLeft: "6px",
              textDecoration: "none",
            }}
          >
            SIGN IN
          </Link>
        </div>

      </div>
    </div>
  );
}

/**
 * Country row component
 */
function CountryRow({ c, selected, onSelect }) {

  return (
    <div
      onClick={() => onSelect(c)}
      style={{
        padding: "10px 12px",
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
        background: selected ? "#061426" : "transparent",
        borderLeft: selected
          ? "3px solid #38bdf8"
          : "3px solid transparent",
      }}
    >

      <div style={{ flex: 1 }}>

        <div
          style={{
            fontSize: "11px",
            color: selected ? "#38bdf8" : "#c8c8ee",
            fontWeight: selected ? "bold" : "normal",
          }}
        >
          {c.name}
        </div>

        <div
          style={{
            fontSize: "8px",
            color: "#5050a0",
          }}
        >
          {c.currency} · {c.symbol}
        </div>

      </div>

      {selected && (
        <svg width="10" height="10" viewBox="0 0 10 10">
          <polyline
            points="2,5 4,7 8,3"
            stroke="#38bdf8"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      )}

    </div>
  );
}