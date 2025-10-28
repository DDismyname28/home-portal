import React, { useEffect, useMemo, useState } from "react";

export default function Customers() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 10;

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

        const json = await res.json(); // ✅ FIX: parse JSON

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

  const filtered = useMemo(() => {
    let items = [...data];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      items = items.filter((item) =>
        [item.name, item.company, item.email, item.phone, item.country]
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
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : data.length === 0 ? (
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
              </tr>
            </thead>
            <tbody>
              {pageItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.requester}</td>
                  <td>{item.category}</td>
                  <td>{item.email}</td>
                  <td>{item.description}</td>
                  <td>
                    <span className={`status ${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
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
    </>
  );
}
