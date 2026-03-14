import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../services/api";
import { COUNTRIES, getCurrencyForCountry } from "../constants";

const S = {
  bg:       "#05050e",
  panel:    "#0d0820",
  border:   "#2e2e58",
  dim:      "#5050a0",
  text:     "#e8e8ff",
  subtext:  "#c8c8ee",
  cyan:     "#38bdf8",
  cyanDim:  "#0ea5c8",
  green:    "#4ade80",
  red:      "#f87171",
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
const ALL     = COUNTRIES.filter(c => !c.popular);

export default function RegisterPage() {
  const nav = useNavigate();

  const [form, setForm] = useState({
    display_name:    "",
    email:           "",
    password:        "",
    confirmPassword: "",
    country:         "South Africa",
    currency_code:   "ZAR",
    currency_symbol: "R",
    agreed:          false,
  });

  const [showCountryList, setShowCountryList] = useState(false);
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [search,          setSearch]          = useState("");
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState("");

  const dropRef = useRef(null);

  // Close dropdown on outside click
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

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }));
  }

  function selectCountry(c) {
    setForm(f => ({
      ...f,
      country:         c.name,
      currency_code:   c.currency,
      currency_symbol: c.symbol,
    }));
    setShowCountryList(false);
    setSearch("");
  }

  const filtered = search.trim()
    ? COUNTRIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : null;

  const selectedCountry = COUNTRIES.find(c => c.name === form.country) || COUNTRIES[0];

 async function handleSubmit() {
  setError("");
  if (!form.display_name.trim()) return setError("Enter a display name.");
  if (!form.email.trim())        return setError("Enter your email.");
  if (form.password.length < 8)  return setError("Password must be at least 8 characters.");
  if (form.password !== form.confirmPassword) return setError("Passwords do not match.");
  if (!form.agreed)              return setError("You must agree to the terms.");

  setLoading(true);
  try {
    await authAPI.register({
      display_name:    form.display_name.trim(),
      email:           form.email.trim().toLowerCase(),
      password:        form.password,
      country:         form.country,
      currency_code:   form.currency_code,
      currency_symbol: form.currency_symbol,
    });

    const login = await authAPI.login(form.email.trim().toLowerCase(), form.password);
    localStorage.setItem("equal_token", login.data.access_token);

    const me = await authAPI.me();
    localStorage.setItem("equal_user", JSON.stringify(me.data));

    nav("/home");
  } catch (e) {
    const detail = e.response?.data?.detail;
    const msg = Array.isArray(detail)
      ? detail.map(d => d.msg).join(", ")
      : typeof detail === "string"
      ? detail
      : "Registration failed. Please try again.";
    setError(msg);
  } finally {
    setLoading(false);
  }

  }

  return (
    <div style={{ minHeight: "100vh", background: S.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: "400px", fontFamily: "'Courier New', monospace" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ width: "72px", height: "72px", borderRadius: "50%", border: `2px solid ${S.cyan}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", background: "#06101a" }}>
            <svg viewBox="0 0 160 44" width="52" height="14">
              <defs><linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#38bdf8"/><stop offset="100%" stopColor="#0ea5c8"/></linearGradient></defs>
              <text x="2"  y="34" fontFamily="Georgia,serif" fontSize="36" fontWeight="400" fontStyle="italic" fill="url(#lg)">e</text>
              <text x="24" y="34" fontFamily="Georgia,serif" fontSize="36" fontWeight="700" fill="#e8e8ff">Q</text>
              <text x="55" y="34" fontFamily="Georgia,serif" fontSize="36" fontWeight="400" fill="#c8c8ee">ual</text>
            </svg>
          </div>
          <div style={{ fontSize: "16px", fontWeight: "bold", color: S.text, letterSpacing: "2px", marginBottom: "4px" }}>CREATE ACCOUNT</div>
          <div style={{ fontSize: "9px", color: S.dim, letterSpacing: "2px" }}>COMPLEXITY IS THE ENEMY OF EXECUTION</div>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ background: "#1a0606", border: `1px solid #ef444466`, borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "11px", color: S.red, letterSpacing: "0.5px" }}>
            {error}
          </div>
        )}

        {/* Form card */}
        <div style={{ background: S.panel, border: `1px solid ${S.border}`, borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Display name */}
          <div>
            <div style={{ fontSize: "8px", color: S.dim, letterSpacing: "1px", marginBottom: "6px" }}>DISPLAY NAME</div>
            <input
              style={{ ...S.input, border: `1px solid ${S.border}` }}
              placeholder="Your trading name"
              value={form.display_name}
              onChange={e => set("display_name", e.target.value)}
              autoComplete="off"
            />
          </div>

          {/* Email */}
          <div>
            <div style={{ fontSize: "8px", color: S.dim, letterSpacing: "1px", marginBottom: "6px" }}>EMAIL ADDRESS</div>
            <input
              style={{ ...S.input, border: `1px solid ${S.border}` }}
              type="email"
              placeholder="you@email.com"
              value={form.email}
              onChange={e => set("email", e.target.value)}
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div>
            <div style={{ fontSize: "8px", color: S.dim, letterSpacing: "1px", marginBottom: "6px" }}>PASSWORD</div>
            <div style={{ position: "relative" }}>
              <input
                style={{ ...S.input, border: `1px solid ${S.border}`, paddingRight: "44px" }}
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={e => set("password", e.target.value)}
                autoComplete="new-password"
              />
              <button
                onClick={() => setShowPassword(v => !v)}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "14px", color: S.dim }}
              >{showPassword ? "🙈" : "👁️"}</button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <div style={{ fontSize: "8px", color: S.dim, letterSpacing: "1px", marginBottom: "6px" }}>CONFIRM PASSWORD</div>
            <div style={{ position: "relative" }}>
              <input
                style={{
                  ...S.input,
                  border: form.confirmPassword && form.password !== form.confirmPassword
                    ? "1px solid #ef4444" : `1px solid ${S.border}`,
                  paddingRight: "44px"
                }}
                type={showConfirm ? "text" : "password"}
                placeholder="Repeat password"
                value={form.confirmPassword}
                onChange={e => set("confirmPassword", e.target.value)}
                autoComplete="new-password"
              />
              <button
                onClick={() => setShowConfirm(v => !v)}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "14px", color: S.dim }}
              >{showConfirm ? "🙈" : "👁️"}</button>
            </div>
          </div>

          {/* Country selector */}
          <div ref={dropRef}>
            <div style={{ fontSize: "8px", color: S.cyan, letterSpacing: "1px", marginBottom: "6px" }}>COUNTRY · SETS YOUR CURRENCY</div>

            {/* Trigger button */}
            <div
              onClick={() => setShowCountryList(v => !v)}
              style={{ background: "#0d0820", border: `1px solid ${S.cyan}66`, borderRadius: "8px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
            >
              <span style={{ fontSize: "20px" }}>{selectedCountry.flag}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "12px", color: S.cyan, fontWeight: "bold", letterSpacing: "1px" }}>{selectedCountry.name}</div>
                <div style={{ fontSize: "9px", color: S.dim, marginTop: "2px" }}>{selectedCountry.currency} · {selectedCountry.symbol}</div>
              </div>
              <span style={{ fontSize: "10px", color: S.dim }}>{showCountryList ? "▲" : "▼"}</span>
            </div>

            {/* Currency confirmation pill */}
            <div style={{ marginTop: "6px", background: "#061426", border: "1px solid #38bdf822", borderRadius: "6px", padding: "7px 12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "10px" }}>💬</span>
              <span style={{ fontSize: "9px", color: S.cyan, letterSpacing: "0.5px" }}>
                All prices will display in {selectedCountry.currency} ({selectedCountry.symbol}) — your native currency
              </span>
            </div>

            {/* Dropdown */}
            {showCountryList && (
              <div style={{ marginTop: "6px", background: "#0a0820", border: `1px solid ${S.border}`, borderRadius: "10px", overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>

                {/* Search */}
                <div style={{ padding: "10px 12px", borderBottom: `1px solid ${S.border}` }}>
                  <input
                    style={{ ...S.input, background: "#07070f", border: `1px solid ${S.border}`, padding: "8px 12px", fontSize: "11px" }}
                    placeholder="Search country..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    autoFocus
                  />
                </div>

                <div style={{ maxHeight: "220px", overflowY: "auto" }}>
                  {!filtered && (
                    <>
                      <div style={{ padding: "8px 12px 4px", fontSize: "8px", color: S.dim, letterSpacing: "1px" }}>POPULAR</div>
                      {POPULAR.map(c => (
                        <CountryRow key={c.code} c={c} selected={form.country === c.name} onSelect={selectCountry} />
                      ))}
                      <div style={{ padding: "8px 12px 4px", fontSize: "8px", color: S.dim, letterSpacing: "1px", borderTop: `1px solid ${S.border}`, marginTop: "4px" }}>ALL COUNTRIES</div>
                      {ALL.map(c => (
                        <CountryRow key={c.code} c={c} selected={form.country === c.name} onSelect={selectCountry} />
                      ))}
                    </>
                  )}
                  {filtered && filtered.length === 0 && (
                    <div style={{ padding: "16px", textAlign: "center", fontSize: "11px", color: S.dim }}>No results</div>
                  )}
                  {filtered && filtered.map(c => (
                    <CountryRow key={c.code} c={c} selected={form.country === c.name} onSelect={selectCountry} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Terms checkbox */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }} onClick={() => set("agreed", !form.agreed)}>
            <div style={{
              width: "18px", height: "18px", borderRadius: "4px",
              border: `1px solid ${form.agreed ? S.cyan : S.border}`,
              background: form.agreed ? "#061426" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, marginTop: "1px",
            }}>
              {form.agreed && (
                <svg width="10" height="10" viewBox="0 0 10 10">
                  <polyline points="2,5 4,7 8,3" stroke="#38bdf8" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span style={{ fontSize: "9px", color: S.dim, lineHeight: "1.6", letterSpacing: "0.5px" }}>
              I agree to the <span style={{ color: S.cyan }}>Terms of Service</span> and <span style={{ color: S.cyan }}>Privacy Policy</span>. eQual is a simulation platform — no real money is involved.
            </span>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              background: loading ? "#061426" : "linear-gradient(135deg,#061426,#082040)",
              border: `2px solid ${S.cyan}`,
              borderRadius: "10px", padding: "14px",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'Courier New', monospace",
              fontSize: "13px", fontWeight: "bold",
              color: loading ? S.dim : S.cyan,
              letterSpacing: "2px", width: "100%",
            }}
          >
            {loading ? "CREATING..." : "CREATE ACCOUNT ▶"}
          </button>

        </div>

        {/* Login link */}
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <span style={{ fontSize: "10px", color: S.dim }}>Already have an account? </span>
          <Link to="/login" style={{ fontSize: "10px", color: S.cyan, textDecoration: "none", letterSpacing: "1px" }}>SIGN IN</Link>
        </div>

      </div>
    </div>
  );
}

// ── Country row component ──────────────────────────────────────────────────────
function CountryRow({ c, selected, onSelect }) {
  return (
    <div
      onClick={() => onSelect(c)}
      style={{
        padding: "10px 12px",
        display: "flex", alignItems: "center", gap: "10px",
        cursor: "pointer",
        background: selected ? "#061426" : "transparent",
        borderLeft: selected ? "3px solid #38bdf8" : "3px solid transparent",
        transition: "background 0.15s",
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = "#0d0d20"; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = "transparent"; }}
    >
      <span style={{ fontSize: "16px" }}>{c.flag}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "11px", color: selected ? "#38bdf8" : "#c8c8ee", fontWeight: selected ? "bold" : "normal" }}>{c.name}</div>
        <div style={{ fontSize: "8px", color: "#5050a0", marginTop: "1px" }}>{c.currency} · {c.symbol}</div>
      </div>
      {selected && (
        <svg width="10" height="10" viewBox="0 0 10 10">
          <polyline points="2,5 4,7 8,3" stroke="#38bdf8" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  );
}
