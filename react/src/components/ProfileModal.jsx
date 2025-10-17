import React, { useState, useEffect } from "react";
import { getDefaultAvatar, normalizeAvatarUrl } from "./utils";
import "../profile.css";

export default function ProfileModal({ user = {}, onClose, onSave }) {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    setFormData({
      companyName: user.companyName || "",
      username: user.username || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      streetAddress: user.streetAddress || "",
      zipCode: user.zipCode || "",
      city: user.city || "",
      state: user.state || "",
      avatar: normalizeAvatarUrl(user.avatar) || getDefaultAvatar(user),
      file: null,
    });
  }, [user]);

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "zipCode" && /^\d{5}$/.test(value)) {
      try {
        const res = await fetch(`https://api.zippopotam.us/us/${value}`);
        if (!res.ok) return;
        const data = await res.json();
        const place = data.places?.[0];
        if (place) {
          setFormData((prev) => ({
            ...prev,
            city: place["place name"] || prev.city,
            state: place["state abbreviation"] || prev.state,
          }));
        }
      } catch (err) {
        console.warn("ZIP lookup failed:", err);
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormData((prev) => ({
      ...prev,
      file,
      avatar: URL.createObjectURL(file),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const body = new FormData();
      if (formData.file) body.append("file", formData.file);
      Object.entries(formData).forEach(([key, val]) => {
        if (key !== "file") body.append(key, val || "");
      });

      const res = await fetch(
        `${HiiincHomeDashboardData.apiRoot}update-profile`,
        {
          method: "POST",
          credentials: "include",
          headers: { "X-WP-Nonce": HiiincHomeDashboardData.nonce },
          body,
        }
      );

      const data = await res.json();
      if (!data?.success) throw new Error(data?.message || "Update failed");

      onSave(data.user);
      setTimeout(onClose, 200);
    } catch (err) {
      console.error("Profile update error:", err);
      alert(err.message || "Error updating profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Edit Profile</h2>

        <div className="profile-image">
          <img src={formData.avatar} alt="Avatar" className="avatar-preview" />
          <label className="upload-btn">
            Change Photo
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              hidden
            />
          </label>
        </div>

        <form onSubmit={handleSubmit}>
          {user?.role?.includes("local_provider") && (
            <>
              <label>Company Name</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
              />
            </>
          )}

          {[
            ["Username", "username", true],
            ["First Name", "firstName"],
            ["Last Name", "lastName"],
            ["Email", "email", false, "email"],
            ["Street Address", "streetAddress"],
            ["Zip Code", "zipCode"],
            ["City", "city"],
            ["State", "state"],
          ].map(([label, name, readOnly, type = "text"]) => (
            <React.Fragment key={name}>
              <label>{label}</label>
              <input
                type={type}
                name={name}
                value={formData[name] || ""}
                onChange={handleChange}
                readOnly={readOnly}
              />
            </React.Fragment>
          ))}

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="cancel-btn"
            >
              Cancel
            </button>
            <button type="submit" disabled={loading} className="save-btn">
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
