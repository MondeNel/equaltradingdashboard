import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../services/api";

const S = {
  bg: "#05050e",
  panel: "#0d0820",
  border: "#2e2e58",
  dim: "#5050a0",
  text: "#e8e8ff",
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

export default function LoginPage() {

  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * Handle login
   */
  async function handleLogin() {

    setError("");

    if (!email.trim()) return setError("Enter your email.");
    if (!password.trim()) return setError("Enter your password.");

    setLoading(true);

    try {

      const res = await authAPI.login(
        email.trim().toLowerCase(),
        password
      );

      localStorage.setItem("equal_token", res.data.access_token);

      const me = await authAPI.me();
      localStorage.setItem("equal_user", JSON.stringify(me.data));

      nav("/home");

    } catch (e) {

      setError(
        e.response?.data?.detail || "Invalid email or password."
      );

    } finally {
      setLoading(false);
    }
  }

  /**
   * Submit on Enter key
   */
  function handleKeyDown(e) {
    if (e.key === "Enter") handleLogin();
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
      <div style={{ width: "100%", maxWidth: "400px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>

          <div
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              color: S.text,
              letterSpacing: "3px",
              marginBottom: "6px",
            }}
          >
            WELCOME BACK
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

        {/* Error */}
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

        {/* Form */}
        <div
          style={{
            background: S.panel,
            border: `1px solid ${S.border}`,
            borderRadius: "16px",
            padding: "28px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >

          {/* Email */}
          <div>
            <div
              style={{
                fontSize: "8px",
                color: S.dim,
                letterSpacing: "1px",
                marginBottom: "6px",
              }}
            >
              EMAIL ADDRESS
            </div>

            <input
              style={S.input}
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div>
            <div
              style={{
                fontSize: "8px",
                color: S.dim,
                letterSpacing: "1px",
                marginBottom: "6px",
              }}
            >
              PASSWORD
            </div>

            <div style={{ position: "relative" }}>
              <input
                style={{
                  ...S.input,
                  paddingRight: "44px",
                }}
                type={showPass ? "text" : "password"}
                placeholder="Your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="current-password"
              />

              {/* Toggle */}
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: S.dim,
                }}
              >
                {showPass ? (
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path
                      stroke="#38bdf8"
                      strokeWidth="2"
                      fill="none"
                      d="M3 3l18 18"
                    />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path
                      stroke="#38bdf8"
                      strokeWidth="2"
                      fill="none"
                      d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="3"
                      stroke="#38bdf8"
                      strokeWidth="2"
                      fill="none"
                    />
                  </svg>
                )}
              </button>
            </div>

            <div style={{ textAlign: "right", marginTop: "6px" }}>
              <span
                style={{
                  fontSize: "9px",
                  color: S.cyan,
                  cursor: "pointer",
                  letterSpacing: "1px",
                }}
              >
                FORGOT PASSWORD?
              </span>
            </div>
          </div>

          {/* Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              background: loading
                ? "#061426"
                : "linear-gradient(135deg,#061426,#082040)",
              border: `2px solid ${S.cyan}`,
              borderRadius: "10px",
              padding: "14px",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'Courier New', monospace",
              fontSize: "13px",
              fontWeight: "bold",
              color: loading ? S.dim : S.cyan,
              letterSpacing: "2px",
              width: "100%",
              marginTop: "4px",
            }}
          >
            {loading ? "SIGNING IN..." : "SIGN IN"}
          </button>

        </div>

        {/* Register link */}
        <div style={{ textAlign: "center", marginTop: "20px" }}>

          <span style={{ fontSize: "10px", color: S.dim }}>
            Don't have an account?
          </span>

          <Link
            to="/register"
            style={{
              fontSize: "10px",
              color: S.cyan,
              marginLeft: "6px",
              textDecoration: "none",
              letterSpacing: "1px",
            }}
          >
            CREATE ACCOUNT
          </Link>

        </div>

      </div>
    </div>
  );
}