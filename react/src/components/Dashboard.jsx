import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ProfileModal from "./ProfileModal";

import DashboardHome from "./pages/DashboardHome";
import Customers from "./pages/Customers";
import Projects from "./pages/Projects";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import SubmitRequest from "./SubmitRequest";
import ProviderDetails from "./ProviderDetails";
import Services from "./pages/Services";

import "../App.css";

// Normalize role consistently
function normalizeRole(rawRole) {
  if (!rawRole) return "";
  const r = Array.isArray(rawRole) ? rawRole[0] : rawRole;
  const s = String(r).toLowerCase().replace(/-/g, "_");
  if (s.includes("local") && s.includes("provider")) return "local_provider";
  if (s.includes("home") && (s.includes("member") || s.includes("subscriber")))
    return "home_member";
  return s;
}

// Cache-busting for avatar
function normalizeAvatarUrl(url) {
  if (!url || url.trim() === "") return "";
  const cleanUrl = url.replace(/\?v=\d+/, "");
  return `${cleanUrl}?v=${Date.now()}`;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showProfile, setShowProfile] = useState(false);
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const apiRoot =
    typeof HiiincHomeDashboardData !== "undefined"
      ? HiiincHomeDashboardData.apiRoot
      : "/wp-json/home-portal/v1/";

  // Fetch current user
  async function fetchUser() {
    setLoadingUser(true);
    try {
      const res = await fetch(`${apiRoot}me`, {
        credentials: "include",
        headers: { "X-WP-Nonce": HiiincHomeDashboardData?.nonce ?? "" },
      });
      const data = await res.json();
      if (data?.success && data.user) {
        const u = data.user;
        setUser({
          id: u.ID || u.id,
          username: u.username,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          role: normalizeRole(u.role),
          avatar: u.avatar ? normalizeAvatarUrl(u.avatar) : "",
          companyName: u.companyName || "",
          streetAddress: u.streetAddress || "",
          zipCode: u.zipCode || "",
          city: u.city || "",
          state: u.state || "",
          meta: u.meta || {},
        });
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Error fetching user:", err);
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  }

  useEffect(() => {
    fetchUser();
  }, []);

  // Save profile callback
  const handleProfileSave = (updatedUser) => {
    if (updatedUser) {
      setUser((prev) => ({
        ...prev,
        ...updatedUser,
        avatar: updatedUser.avatar
          ? normalizeAvatarUrl(updatedUser.avatar)
          : prev.avatar,
      }));
    } else {
      fetchUser();
    }
    setShowProfile(false);
  };

  const renderContent = () => {
    if (!user) return <p>Loading...</p>;
    const roleKey = normalizeRole(user.role);

    if (roleKey === "home_member") {
      switch (activeTab) {
        case "dashboard":
          return <DashboardHome />;
        case "submit-request":
          return <SubmitRequest />;
        case "provider-details":
          return <ProviderDetails />;
        case "reports":
          return <Reports />;
        case "settings":
          return <Settings />;
        default:
          return <DashboardHome />;
      }
    }

    if (roleKey === "local_provider") {
      switch (activeTab) {
        case "dashboard":
          return <DashboardHome />;
        case "services":
          return <Services />;
        case "customers":
          return <Customers />;
        case "projects":
          return <Projects />;
        case "reports":
          return <Reports />;
        case "settings":
          return <Settings />;
        default:
          return <DashboardHome />;
      }
    }

    return <p>Role not recognized.</p>;
  };

  if (loadingUser) return <p>Loading dashboard...</p>;

  return (
    <div className="dashboard-container flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />

      <main className="main-content flex-1">
        <Topbar
          activeTab={activeTab}
          user={user}
          onProfileClick={() => setShowProfile(true)}
        />

        <section className="content-section p-4">{renderContent()}</section>

        {/* <div className="debug-panel p-4 bg-gray-100 mt-4">
          <h3>Debug: User Meta</h3>
          <pre>{JSON.stringify(user?.meta, null, 2)}</pre>
        </div> */}
      </main>

      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onSave={handleProfileSave}
        />
      )}
    </div>
  );
}
