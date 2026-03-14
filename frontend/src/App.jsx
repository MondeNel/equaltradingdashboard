import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import RegisterPage  from "./pages/RegisterPage";
import LoginPage     from "./pages/LoginPage";
import LandingPage   from "./pages/LandingPage";
import TradingPage   from "./pages/TradingPage";
import ProfilePage   from "./pages/ProfilePage";

// ── Auth guard ────────────────────────────────────────────────────────────────
function PrivateRoute({ children }) {
  const token = localStorage.getItem("equal_token");
  return token ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const token = localStorage.getItem("equal_token");
  return token ? <Navigate to="/home" replace /> : children;
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />

        {/* Protected routes */}
        <Route path="/home"    element={<PrivateRoute><LandingPage /></PrivateRoute>} />
        <Route path="/trade"   element={<PrivateRoute><TradingPage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
