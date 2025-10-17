import React, { useEffect, useMemo, useState } from "react";

export default function Customers() {
  const base = [
    {
      id: 1,
      name: "Alice Johnson",
      company: "Acme Inc",
      email: "alice@acme.com",
      phone: "123-456-7890",
      country: "USA",
      status: "Active",
    },
    {
      id: 2,
      name: "Bob Smith",
      company: "Beta Corp",
      email: "bob@beta.com",
      phone: "234-567-8901",
      country: "Canada",
      status: "Inactive",
    },
    {
      id: 3,
      name: "Carol White",
      company: "Gamma LLC",
      email: "carol@gamma.com",
      phone: "345-678-9012",
      country: "UK",
      status: "Active",
    },
  ];

  function generate(count = 40) {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const b = base[i % base.length];
      arr.push({ ...b, id: i + 1, name: `${b.name.split(" ")[0]} ${i + 1}` });
    }
    return arr;
  }

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    setTimeout(() => {
      setData(generate(100));
      setLoading(false);
    }, 400);
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
          placeholder="Search customers..."
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
        ) : (
          <table className="customer-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Country</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.company}</td>
                  <td>{item.email}</td>
                  <td>{item.phone}</td>
                  <td>{item.country}</td>
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
    </>
  );
}
