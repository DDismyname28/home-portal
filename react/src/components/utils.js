// src/assets/js/utils/avatar.js
export const getDefaultAvatar = (user = {}) => {
  const first = user.firstName?.trim() || "";
  const last = user.lastName?.trim() || "";
  const name = (first + " " + last).trim() || user.username || "User";

  // This API will automatically show initials (e.g., "Djofil Demerin" → "DD")
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=0D8ABC&color=fff`;
};

export const normalizeAvatarUrl = (url) => {
  if (!url || !url.trim()) return "";
  let cleanUrl = url.trim().replace(/\\/g, "");

  // Remove cache-busting ?v=123 or &v=123 at the end of the URL
  cleanUrl = cleanUrl.replace(/([&?])v=\d+$/, "");

  return cleanUrl;
};
