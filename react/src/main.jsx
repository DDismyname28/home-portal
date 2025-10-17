import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import SignupForm from "./components/SignupForm.jsx";
import Dashboard from "./components/Dashboard.jsx";
import "./App.css";

// Mount Signup Form
const signupRoot = document.getElementById("root-signup-root");
if (signupRoot) {
  createRoot(signupRoot).render(
    <StrictMode>
      <SignupForm />
    </StrictMode>
  );
}

// Mount Dashboard
const dashboardRoot = document.getElementById("dashboard-root");
if (dashboardRoot) {
  createRoot(dashboardRoot).render(
    <StrictMode>
      <Dashboard />
    </StrictMode>
  );
}
