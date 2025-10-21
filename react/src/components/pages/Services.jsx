import React, { useEffect, useMemo, useState } from "react";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import "../../App.css";
import "../../services.css";

export default function Services() {
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const perPage = 10;

  // 🟢 Fetch services and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch services
        const servicesRes = await fetch(
          `${HiiincHomeDashboardData.apiRoot}get-services`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              "X-WP-Nonce": HiiincHomeDashboardData.nonce, // ✅ add this
            },
          }
        );
        const result = await servicesRes.json();
        if (result.success && Array.isArray(result.data)) {
          setData(result.data);
        } else {
          console.error("Error fetching services:", result.message);
        }

        // Fetch categories
        const categoriesRes = await fetch(
          "/wp-json/wp/v2/service_category?per_page=100"
        );
        const categoriesData = await categoriesRes.json();
        setCategories(
          categoriesData.map((cat) => ({
            id: cat.id,
            name: cat.name,
          }))
        );
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 🟣 Filter logic
  const filtered = useMemo(() => {
    let items = [...data];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      items = items.filter((item) =>
        [item.name, item.category, item.description, item.importantNotes]
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
  const handleAddService = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        const res = await fetch(
          `${HiiincHomeDashboardData.apiRoot}delete-service/${id}`,
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
      const payload = editingItem
        ? { ...formData, id: editingItem.id }
        : { ...formData, status: "Active" }; // ✅ Set Active when creating

      const response = await fetch(
        `${HiiincHomeDashboardData.apiRoot}create-service`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-WP-Nonce": HiiincHomeDashboardData.nonce,
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      if (result.success) {
        if (editingItem) {
          setData((prev) =>
            prev.map((i) =>
              i.id === editingItem.id ? { ...i, ...formData } : i
            )
          );
        } else {
          setData((prev) => [
            ...prev,
            { ...formData, id: result.id, status: "Active" },
          ]);
        }
        setShowModal(false);
      } else {
        console.error("Error saving service:", result.message);
      }
    } catch (err) {
      console.error("An error occurred while saving the service:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="toolbar">
        <button className="add-btn" onClick={handleAddService}>
          <FaPlus /> Add Service
        </button>
        <input
          type="text"
          placeholder="Search services..."
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
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : pageItems.length === 0 ? (
          <div className="no-data">No services found.</div>
        ) : (
          <table className="service-table">
            <thead>
              <tr>
                <th>Service Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Description</th>
                <th>Important Notes</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.category}</td>
                  <td>${item.price}</td>
                  <td className="truncate" title={item.description}>
                    {item.description}
                  </td>
                  <td className="truncate" title={item.importantNotes}>
                    {item.importantNotes}
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
        <ServiceModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          item={editingItem}
          categories={categories}
        />
      )}
    </>
  );
}

function ServiceModal({ onClose, onSave, item, categories }) {
  const [formData, setFormData] = useState({
    name: item?.name || "",
    category: item?.category || "",
    price: item?.price || "",
    description: item?.description || "",
    importantNotes: item?.importantNotes || "",
    status: item?.status || "Active", // ✅ Default Active for new services
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
        <h2>{item ? "Edit Service" : "Add Service"}</h2>

        {loading && (
          <div className="loading-overlay">
            <div className="loader"></div>
            <p>Saving service...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ opacity: loading ? 0.6 : 1 }}>
          <label>Service Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <label>Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>

          <label>Price</label>
          <input
            type="number"
            name="price"
            value={formData.price}
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

          <label>Important Notes</label>
          <textarea
            name="importantNotes"
            value={formData.importantNotes}
            onChange={handleChange}
            rows={3}
          />

          {item && (
            <>
              <label>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </>
          )}

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
