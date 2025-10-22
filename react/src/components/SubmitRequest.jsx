import React, { useEffect, useMemo, useState } from "react";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import "../App.css";
import "../request.css";

export default function Requests() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const perPage = 10;

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${HiiincHomeDashboardData.apiRoot}get-requests`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              "X-WP-Nonce": HiiincHomeDashboardData.nonce,
            },
          }
        );
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          setData(result.data);
        } else {
          console.error("Error fetching requests:", result.message);
        }
      } catch (err) {
        console.error("Error fetching requests:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const filtered = useMemo(() => {
    let items = [...data];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      items = items.filter((item) =>
        [item.category, item.provider, item.description, item.date]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    if (statusFilter !== "all") {
      items = items.filter(
        (item) => item.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }
    return items;
  }, [data, searchTerm, statusFilter]);

  const total = filtered.length;
  const totalPages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage;
  const pageItems = filtered.slice(start, start + perPage);

  const handleAddRequest = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this request?")) {
      try {
        const res = await fetch(
          `${HiiincHomeDashboardData.apiRoot}delete-request/${id}`,
          {
            method: "DELETE",
            credentials: "include",
            headers: {
              "X-WP-Nonce": HiiincHomeDashboardData.nonce,
            },
          }
        );
        const result = await res.json();
        if (result.success) {
          setData((prev) => prev.filter((i) => i.id !== id));
        } else {
          console.error("Delete failed:", result.message);
        }
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  const handleSave = async (formData) => {
    setLoading(true);
    try {
      const isEditing = !!editingItem;
      const endpoint = `${HiiincHomeDashboardData.apiRoot}create-request`;

      const body = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "photos" && Array.isArray(value)) {
          value.forEach((file) => {
            if (file instanceof File) body.append("photos[]", file);
          });
        } else {
          body.append(key, value);
        }
      });

      if (isEditing) body.append("id", editingItem.id);

      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "X-WP-Nonce": HiiincHomeDashboardData.nonce },
        body,
      });

      const result = await res.json();

      if (result.success) {
        if (isEditing) {
          setData((prev) =>
            prev.map((i) =>
              i.id === editingItem.id ? { ...i, ...formData } : i
            )
          );
        } else {
          setData((prev) => [
            ...prev,
            { ...formData, id: result.id, status: "Pending" },
          ]);
        }
        setShowModal(false);
      } else {
        console.error("Error saving request:", result.message);
      }
    } catch (err) {
      console.error("An error occurred while saving the request:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="toolbar">
        <button className="add-btn" onClick={handleAddRequest}>
          <FaPlus /> Create Request
        </button>
        <input
          type="text"
          placeholder="Search requests..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Declined">Declined</option>
        </select>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : pageItems.length === 0 ? (
          <div className="no-data">No requests found.</div>
        ) : (
          <table className="service-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Provider</th>
                <th>Time</th>
                <th>Date</th>
                <th>Description</th>
                <th>Photos</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.category}</td>
                  <td>{item.provider || "N/A"}</td>
                  <td>{item.timePreference}</td>
                  <td>{item.date}</td>
                  <td className="truncate" title={item.description}>
                    {item.description}
                  </td>
                  <td>
                    {item.photos && item.photos.length > 0 ? (
                      item.photos.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt="upload"
                          style={{ width: 50, marginRight: 5 }}
                        />
                      ))
                    ) : (
                      <span>No photos</span>
                    )}
                  </td>
                  <td>
                    <span className={`status ${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="actions">
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(item)}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(item.id)}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="pagination">
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          ‹ Prev
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next ›
        </button>
      </div>

      {showModal && (
        <RequestModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          item={editingItem}
        />
      )}
    </>
  );
}

// 🔵 MODAL COMPONENT
function RequestModal({ onClose, onSave, item }) {
  const serviceCategories = [
    "House washing",
    "Roof soft wash",
    "Driveway sealing / patio cleaning",
    "Window cleaning",
    "Gutter cleaning",
    "HVAC services",
    "Pool care",
    "Pressure washing",
    "Landscaping",
    "Pest control",
    "Others",
  ];

  const [formData, setFormData] = useState({
    category: item?.category || "",
    provider: item?.provider || "",
    timePreference: item?.timePreference || "AM",
    date: item?.date || "",
    description: item?.description || "",
    photos: item?.photos || [],
    status: item?.status || "Pending",
  });

  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noProvidersMessage, setNoProvidersMessage] = useState("");

  useEffect(() => {
    const fetchProviders = async () => {
      if (!formData.category) {
        setProviders([]);
        setNoProvidersMessage("");
        return;
      }
      try {
        const res = await fetch(
          `${
            HiiincHomeDashboardData.apiRoot
          }get-vendors-by-category?category=${encodeURIComponent(
            formData.category
          )}`,
          {
            headers: { "X-WP-Nonce": HiiincHomeDashboardData.nonce },
            credentials: "include",
          }
        );
        const result = await res.json();
        if (result.success) {
          if (result.data.length > 0) {
            setProviders(result.data);
            setNoProvidersMessage("");
          } else {
            setProviders([]);
            setNoProvidersMessage("No providers available for this category.");
          }
        } else {
          console.error("Failed to fetch providers:", result.message);
        }
      } catch (err) {
        console.error("Error fetching providers:", err);
      }
    };
    fetchProviders();
  }, [formData.category]);

  // ✅ UPDATED: Append multiple files instead of replacing
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "photos") {
      const filesArr = Array.from(files);
      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...filesArr], // append multiple
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // ✅ Remove specific photo preview
  const handleRemovePhoto = (index) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{item ? "Edit Request" : "Create Request"}</h2>
        {loading && (
          <div className="loading-overlay">
            <div className="loader"></div>
            <p>Saving request...</p>
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ opacity: loading ? 0.6 : 1 }}>
          <label>Service Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select a category</option>
            {serviceCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {providers.length > 0 && (
            <>
              <label>Available Providers</label>
              <select
                name="provider"
                value={formData.provider}
                onChange={handleChange}
                required
              >
                <option value="">Select a provider</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </>
          )}

          {noProvidersMessage && (
            <div className="no-providers-box">
              <img
                src="https://cdn-icons-png.flaticon.com/512/4076/4076505.png"
                alt="no providers"
                style={{ width: "60px", opacity: 0.8, marginBottom: "8px" }}
              />
              <h4>No Providers Available</h4>
              <p>{noProvidersMessage}</p>
            </div>
          )}

          <label>Preferred Time</label>
          <div className="time-radio-group">
            <label>
              <input
                type="radio"
                name="timePreference"
                value="AM"
                checked={formData.timePreference === "AM"}
                onChange={handleChange}
              />
              AM
            </label>
            <label>
              <input
                type="radio"
                name="timePreference"
                value="PM"
                checked={formData.timePreference === "PM"}
                onChange={handleChange}
              />
              PM
            </label>
          </div>

          <label>Date</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />

          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            placeholder="Describe your service request..."
          />

          <label>Upload Photos</label>
          <input
            type="file"
            name="photos"
            multiple
            accept="image/*"
            onChange={handleChange}
          />

          {/* ✅ PREVIEW WITH REMOVE BUTTONS */}
          <div className="photo-preview">
            {formData.photos.map((file, i) => (
              <div
                key={i}
                style={{
                  display: "inline-block",
                  position: "relative",
                  marginRight: 8,
                }}
              >
                <img
                  src={file instanceof File ? URL.createObjectURL(file) : file}
                  alt="preview"
                  style={{
                    width: 60,
                    height: 60,
                    objectFit: "cover",
                    borderRadius: 5,
                    border: "1px solid #ccc",
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(i)}
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    background: "#ff4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: 18,
                    height: 18,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {item && (
            <>
              <label>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Declined">Declined</option>
              </select>
            </>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
