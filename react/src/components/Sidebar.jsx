import React from "react";

export default function Sidebar({ activeTab, setActiveTab, user }) {
  if (!user) return null;

  const navItemsByRole = {
    home_member: [
      { id: "dashboard", label: "📊 Dashboard" },
      { id: "submit-request", label: "📝 Requests" },
      { id: "provider-details", label: "🔍 Provider Details" },
      { id: "reports", label: "📈 Reports" },
      { id: "settings", label: "⚙️ Settings" },
    ],
    local_provider: [
      { id: "dashboard", label: "📊 Dashboard" },
      { id: "services", label: "🛠️ Services" },
      { id: "customers", label: "👥 Customers" },
      { id: "projects", label: "💼 Projects" },
      { id: "reports", label: "📈 Reports" },
      { id: "settings", label: "⚙️ Settings" },
    ],
  };

  const role = user.role; // now guaranteed string
  const navItems = navItemsByRole[role] || [];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">🏠 Portal</div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <a
            key={item.id}
            href="#"
            className={activeTab === item.id ? "active" : ""}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab(item.id);
            }}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
