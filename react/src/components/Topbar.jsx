import React, { useMemo } from "react";
import { getDefaultAvatar, normalizeAvatarUrl } from "./utils";

const TAB_TITLES = {
  dashboard: "📊 Dashboard",
  "submit-request": "📝 Submit a Request",
  "provider-details": "🔍 Provider Details",
  customers: "👥 Customers Management",
  projects: "💼 Projects",
  reports: "📈 Reports",
  settings: "⚙️ Settings",
};

export default function Topbar({ activeTab, onProfileClick, user }) {
  const title = TAB_TITLES[activeTab] || "";

  const avatarUrl = useMemo(() => {
    const validUrl = user?.avatar ? normalizeAvatarUrl(user.avatar) : "";
    return validUrl || getDefaultAvatar(user);
  }, [user?.avatar, user?.firstName, user?.username]);

  return (
    <header className="topbar flex items-center justify-between p-4 bg-white shadow-md">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="user-info flex items-center space-x-4">
        <span className="notif text-xl cursor-pointer">🔔</span>
        <img
          src={avatarUrl}
          alt="User Avatar"
          className="user-avatar w-10 h-10 rounded-full object-cover border border-gray-300"
          onClick={onProfileClick}
          onError={(e) => {
            if (!e.currentTarget.dataset.fallback) {
              e.currentTarget.src = getDefaultAvatar(
                user?.firstName || user?.username
              );
              e.currentTarget.dataset.fallback = "true";
            }
          }}
          style={{ cursor: "pointer" }}
        />
      </div>
    </header>
  );
}
