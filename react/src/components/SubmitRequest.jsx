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
        console.error("Error fetching requests:", result && result.message);
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
        (item) =>
          String(item.status).toLowerCase() === statusFilter.toLowerCase()
      );
    }
    return items;
  }, [data, searchTerm, statusFilter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
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
            headers: { "X-WP-Nonce": HiiincHomeDashboardData.nonce },
          }
        );

        // Try parse JSON but fallback to text for debugging
        const text = await res.text();
        let result;
        try {
          result = JSON.parse(text);
        } catch (e) {
          console.error("Non-JSON delete response:", text);
          throw new Error(
            "Server returned non-JSON response. Check server logs (console)."
          );
        }

        if (result.success) {
          setData((prev) => prev.filter((i) => i.id !== id));
        } else {
          console.error("Delete failed:", result.message);
          alert("Delete failed: " + (result.message || "Unknown error"));
        }
      } catch (err) {
        console.error("Delete failed:", err);
        alert("Delete failed: " + err.message);
      }
    }
  };

  // Robust save: handles non-JSON responses and returns a boolean success
  const handleSave = async (formData, resetForm) => {
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
          // Ensure we append empty strings instead of undefined for required fields
          body.append(key, value == null ? "" : value);
        }
      });

      if (isEditing) body.append("id", editingItem.id);

      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "X-WP-Nonce": HiiincHomeDashboardData.nonce },
        body,
      });

      const text = await res.text(); // always read text first
      // Helpful console output to debug server-side issues
      if (!text) {
        console.warn("Empty response from server on save");
      }

      let result;
      try {
        result = JSON.parse(text);
      } catch (parseErr) {
        // Server returned HTML (often PHP error/notice). Show snippet and log full text.
        console.error("Server returned non-JSON response on save:", text);
        const snippet = text.replace(/<[^>]+>/g, " ").slice(0, 500); // strip tags for alert
        throw new Error(
          "Server returned non-JSON response. Example snippet (first 500 chars):\n" +
            snippet
        );
      }

      if (result.success) {
        resetForm();
        await fetchRequests(); // refresh list same as delete
        setShowModal(false); // close modal after we successfully refreshed
        return true;
      } else {
        console.error("Error saving request:", result.message);
        // If backend returned a message, show it so user knows what's wrong
        alert("Error saving request: " + (result.message || "Unknown error"));
        return false;
      }
    } catch (err) {
      // Show friendly alert to user and log details to console for debugging
      console.error("An error occurred while saving the request:", err);
      alert(
        "An error occurred while saving the request. Check console for details.\n\n" +
          err.message
      );
      return false;
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
                    <span
                      className={`status ${String(item.status).toLowerCase()}`}
                    >
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
          onClose={() => {
            // prevent closing while saving
            if (!loading) setShowModal(false);
          }}
          onSave={handleSave}
          item={editingItem}
        />
      )}
    </>
  );
}

function RequestModal({ onClose, onSave, item }) {
  const [formData, setFormData] = useState({
    category: item?.category || "",
    service_id: item?.service_id || "",
    provider_id: item?.provider_id || "",
    provider: item?.provider || "",
    timePreference: item?.timePreference || "AM",
    date: item?.date || "",
    description: item?.description || "",
    photos: [],
    status: item?.status || "Pending",
  });

  const [previewPhotos, setPreviewPhotos] = useState(item?.photos || []);
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
        const text = await res.text();
        let result;
        try {
          result = JSON.parse(text);
        } catch (e) {
          console.error("Non-JSON providers response:", text);
          setServices([]);
          setNoProvidersMessage(
            "Error loading providers (server returned invalid response)."
          );
          return;
        }

        if (result.success) {
          if (result.data.length > 0) {
            setServices(result.data);
            setNoProvidersMessage("");
          } else {
            setServices([]);
            setNoProvidersMessage("No providers available for this category.");
          }
        } else {
          setServices([]);
          setNoProvidersMessage(result.message || "Failed to load providers.");
        }
      } catch (err) {
        console.error("Error fetching providers:", err);
        setServices([]);
        setNoProvidersMessage("Error fetching providers.");
      } finally {
        setDropdownLoading(false);
      }
    };

    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    try {
      const success = await onSave(formData, resetForm);
      // onSave will close the modal on success (parent handles setShowModal),
      // but if onSave returns false, keep modal open and allow retry
      if (!success) {
        // keep modal open - user already alerted in onSave
      }
    } catch (err) {
      console.error("Error in modal submit:", err);
      alert("An error occurred while submitting. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="profile-modal-overlay"
      onClick={() => {
        if (!loading) onClose();
      }}
    >
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
          </div>
        )}

        <h2>{item ? "Edit Request" : "Create Request"}</h2>

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
              onClick={() => !loading && onClose()}
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
