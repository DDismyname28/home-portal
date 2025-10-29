import React, { useEffect, useMemo, useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import "../App.css";
import "../request.css";

export default function Requests() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const perPage = 10;

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${HiiincHomeDashboardData.apiRoot}get-requests`,
        {
          method: "GET",
          credentials: "include",
          headers: { "X-WP-Nonce": HiiincHomeDashboardData.nonce },
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

  useEffect(() => {
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
            headers: { "X-WP-Nonce": HiiincHomeDashboardData.nonce },
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

  const handleSave = async (formData, resetForm) => {
    setLoading(true);
    try {
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

      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "X-WP-Nonce": HiiincHomeDashboardData.nonce },
        body,
      });

      const result = await res.json();
      if (result.success) {
        resetForm();
        await fetchRequests(); // ✅ Refresh list
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
                <th>Preffered Time</th>
                <th>Scheduled Date</th>
                <th>Description</th>
                <th>Photos</th>
                <th>Job History</th>
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
                    {item.history && item.history.length > 0 ? (
                      <ul className="history-list">
                        {item.history.map((h, i) => (
                          <li key={i}>
                            <strong>{h.date}</strong> — {h.note}{" "}
                            <em>by {h.author}</em>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span>No history</span>
                    )}
                  </td>
                  <td>
                    <span className={`status ${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="actions">
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
        <RequestModal onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
    </>
  );
}

function RequestModal({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    category: "",
    service_id: "",
    provider_id: "",
    provider: "",
    timePreference: "AM",
    date: "",
    description: "",
    photos: [],
    status: "Pending",
  });

  const [previewPhotos, setPreviewPhotos] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(false);
  const [noProvidersMessage, setNoProvidersMessage] = useState("");

  useEffect(() => {
    const fetchServices = async () => {
      if (!formData.category) {
        setServices([]);
        setNoProvidersMessage("");
        return;
      }

      setDropdownLoading(true);
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
            setServices(result.data);
            setNoProvidersMessage("");
          } else {
            setServices([]);
            setNoProvidersMessage("No providers available for this category.");
          }
        }
      } catch (err) {
        console.error("Error fetching providers:", err);
      } finally {
        setDropdownLoading(false);
      }
    };

    fetchServices();
  }, [formData.category]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "photos") {
      const selectedFiles = Array.from(files);
      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...selectedFiles],
      }));
      const newPreviews = selectedFiles.map((f) => URL.createObjectURL(f));
      setPreviewPhotos((prev) => [...prev, ...newPreviews]);
    } else if (name === "service_id") {
      const selected = services.find(
        (s) => String(s.service_id) === String(value)
      );
      setSelectedService(selected || null);
      setFormData((prev) => ({
        ...prev,
        service_id: selected?.service_id || "",
        provider_id: selected?.provider_id || "",
        provider: selected?.provider_name || "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const removePhoto = (index) => {
    setPreviewPhotos((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const resetForm = () => {
    setFormData({
      category: "",
      service_id: "",
      provider_id: "",
      provider: "",
      timePreference: "AM",
      date: "",
      description: "",
      photos: [],
      status: "Pending",
    });
    setPreviewPhotos([]);
    setSelectedService(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave(formData, resetForm);
    setLoading(false);
  };

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
          </div>
        )}

        <h2>Create Request</h2>

        <form onSubmit={handleSubmit}>
          <label>Service Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select a category</option>
            {[
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
            ].map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {dropdownLoading && (
            <div className="dropdown-loading">
              <div className="loading-spinner small"></div>
            </div>
          )}

          {services.length > 0 && !dropdownLoading && (
            <>
              <label>Available Providers / Services</label>
              <select
                name="service_id"
                value={formData.service_id}
                onChange={handleChange}
                required
              >
                <option value="">Select a provider / service</option>
                {services.map((s) => (
                  <option key={s.service_id} value={s.service_id}>
                    {s.provider_name} — {s.service_title}{" "}
                    {s.service_price ? `(${s.service_price})` : ""}
                  </option>
                ))}
              </select>

              {selectedService && (
                <div
                  className="service-card"
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    padding: "15px",
                    marginTop: "10px",
                    background: "#f9f9f9",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  <small
                    style={{
                      margin: "0 0 8px",
                      color: "#333",
                      textAlign: "center",
                      display: "block",
                    }}
                  >
                    <strong>{selectedService.service_title}</strong>
                  </small>
                  <small style={{ margin: "4px 0" }}>
                    <strong>Provider:</strong> {selectedService.provider_name}
                  </small>
                  <br />
                  <small style={{ margin: "4px 0" }}>
                    <strong>Price:</strong> {selectedService.service_price}
                  </small>
                  <br />
                  <small style={{ margin: "6px 0" }}>
                    <strong>Description: </strong>
                    {selectedService.service_description}
                  </small>
                </div>
              )}
            </>
          )}

          {noProvidersMessage && (
            <div className="no-providers-box">
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
          />

          <label>Upload Photos</label>
          <input
            type="file"
            name="photos"
            accept="image/*"
            multiple
            onChange={handleChange}
          />

          {previewPhotos.length > 0 && (
            <div
              className="preview-container"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
                gap: "10px",
                marginTop: "10px",
              }}
            >
              {previewPhotos.map((url, i) => (
                <div
                  key={i}
                  className="preview-item"
                  style={{
                    position: "relative",
                    width: "80px",
                    height: "80px",
                  }}
                >
                  <img
                    src={url}
                    alt={`preview-${i}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "6px",
                      border: "1px solid #ddd",
                    }}
                  />
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removePhoto(i)}
                    style={{
                      position: "absolute",
                      top: "-6px",
                      right: "-6px",
                      background: "#f33",
                      color: "#fff",
                      border: "none",
                      borderRadius: "50%",
                      width: "20px",
                      height: "20px",
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

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
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
