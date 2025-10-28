import React, { useEffect, useMemo, useState } from "react";
import { FaEdit } from "react-icons/fa";
import "../../App.css";
import "../../services.css";

export default function Requests() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const perPage = 10;

  // 🟢 Fetch vendor requests
  useEffect(() => {
    const fetchVendorRequests = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${HiiincHomeDashboardData.apiRoot}get-vendor-requests`,
          {
            method: "GET",
            credentials: "include",
            headers: { "X-WP-Nonce": HiiincHomeDashboardData.nonce },
          }
        );
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setData(json.data);
        } else {
          setData([]);
        }
      } catch (err) {
        console.error("Error fetching vendor requests:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorRequests();
  }, []);

  // 🟣 Filtering logic
  const filtered = useMemo(() => {
    let items = [...data];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      items = items.filter((item) =>
        [item.requester, item.category, item.email, item.description]
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

  // 🟢 Handlers
  const handleEdit = (item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleSave = async (formData) => {
    try {
      const response = await fetch(
        `${HiiincHomeDashboardData.apiRoot}update-vendor-request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-WP-Nonce": HiiincHomeDashboardData.nonce,
          },
          credentials: "include",
          body: JSON.stringify({ ...formData, id: editingItem.id }),
        }
      );

      const result = await response.json();
      if (result.success) {
        setData((prev) =>
          prev.map((i) => (i.id === editingItem.id ? { ...i, ...formData } : i))
        );
        setShowModal(false);
      } else {
        console.error("Update failed:", result.message);
      }
    } catch (err) {
      console.error("Error updating request:", err);
    }
  };

  return (
    <>
      <div className="toolbar">
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
          <option value="Active">Active</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : pageItems.length === 0 ? (
          <div className="no-data">No vendor requests found.</div>
        ) : (
          <table className="customer-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Name of Requester</th>
                <th>Category</th>
                <th>Email</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.requester}</td>
                  <td>{item.category}</td>
                  <td>{item.email}</td>
                  <td className="truncate" title={item.description}>
                    {item.description}
                  </td>
                  <td>
                    <span className={`status ${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(item)}
                    >
                      <FaEdit />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
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
      )}

      {showModal && (
        <RequestModal
          item={editingItem}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </>
  );
}

// 🟢 Modal Component (like ServiceModal)
function RequestModal({ item, onClose, onSave }) {
  const [formData, setFormData] = useState({
    requester: item?.requester || "",
    category: item?.category || "",
    email: item?.email || "",
    description: item?.description || "",
    status: item?.status || "Pending",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
        <h2>Edit Request</h2>

        {loading && (
          <div className="loading-overlay">
            <div className="loader"></div>
            <p>Saving changes...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ opacity: loading ? 0.6 : 1 }}>
          <label>Name of Requester</label>
          <input
            type="text"
            name="requester"
            value={formData.requester}
            onChange={handleChange}
            required
          />

          <label>Category</label>
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          />

          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
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

          <label>Status</label>
          <select name="status" value={formData.status} onChange={handleChange}>
            <option value="Pending">Pending</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
          </select>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
