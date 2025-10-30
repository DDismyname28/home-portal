import React, { useEffect, useMemo, useState } from "react";

export default function ProviderDetails() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [activeIndex, setActiveIndex] = useState(null);
  const perPage = 10;

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${HiiincHomeDashboardData.apiRoot}providers`, {
          method: "GET",
          credentials: "include",
          headers: { "X-WP-Nonce": HiiincHomeDashboardData.nonce },
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setProviders(data);
        } else if (data.data && Array.isArray(data.data)) {
          setProviders(data.data);
        } else {
          setProviders([]);
        }
      } catch (err) {
        console.error("Error fetching providers:", err);
        setProviders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProviders();
  }, []);

  const filtered = useMemo(() => {
    let items = [...providers];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      items = items.filter((p) =>
        [p.name, p.email].filter(Boolean).join(" ").toLowerCase().includes(q)
      );
    }
    return items;
  }, [providers, searchTerm]);

  const total = filtered.length;
  const totalPages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage;
  const pageItems = filtered.slice(start, start + perPage);

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const styles = {
    toolbar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
      padding: "10px",
      background: "#f9fafb",
      borderRadius: "8px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    },
    input: {
      flex: 1,
      padding: "10px 12px",
      borderRadius: "8px",
      border: "1px solid #d1d5db",
      fontSize: "14px",
      outline: "none",
    },
    tableWrapper: {
      overflowX: "auto",
      borderRadius: "10px",
      background: "#fff",
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "14px",
    },
    th: {
      background: "#f3f4f6",
      color: "#374151",
      textAlign: "left",
      padding: "12px",
      borderBottom: "1px solid #e5e7eb",
    },
    td: {
      padding: "12px",
      borderBottom: "1px solid #f0f0f0",
    },
    row: {
      transition: "background 0.2s ease",
      cursor: "pointer",
    },
    activeRow: {
      background: "#f9fafb",
    },
    accordion: {
      background: "#f9fafb",
      transition: "all 0.3s ease",
    },
    pagination: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      marginTop: "20px",
      gap: "10px",
    },
    button: {
      padding: "6px 12px",
      borderRadius: "6px",
      border: "1px solid #d1d5db",
      background: "#fff",
      cursor: "pointer",
      fontSize: "13px",
      transition: "all 0.2s ease",
    },
    buttonDisabled: {
      opacity: 0.4,
      cursor: "not-allowed",
    },
    noData: {
      textAlign: "center",
      padding: "20px",
      color: "#6b7280",
      fontSize: "14px",
    },
  };

  return (
    <>
      <div style={styles.toolbar}>
        <input
          type="text"
          placeholder="🔍 Search providers..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          style={styles.input}
        />
      </div>

      <div style={styles.tableWrapper}>
        {loading ? (
          <div style={styles.noData}>Loading providers...</div>
        ) : pageItems.length === 0 ? (
          <div style={styles.noData}>No providers found</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Provider Name</th>
                <th style={styles.th}>Email</th>
                <th style={{ ...styles.th, textAlign: "center" }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((provider, index) => (
                <React.Fragment key={provider.id}>
                  <tr
                    style={{
                      ...styles.row,
                      ...(activeIndex === index ? styles.activeRow : {}),
                    }}
                    onClick={() => toggleAccordion(index)}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f9fafb")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        activeIndex === index ? "#f9fafb" : "#fff")
                    }
                  >
                    <td style={styles.td}>{provider.name}</td>
                    <td style={styles.td}>{provider.email}</td>
                    <td style={{ ...styles.td, textAlign: "center" }}>
                      {activeIndex === index ? "▲ Hide" : "▼ View"}
                    </td>
                  </tr>

                  {activeIndex === index && (
                    <tr>
                      <td colSpan="3" style={styles.accordion}>
                        {provider.services && provider.services.length > 0 ? (
                          <table
                            style={{
                              ...styles.table,
                              marginTop: "10px",
                              backgroundColor: "#bbddf5",
                            }}
                          >
                            <thead
                              style={{
                                background: "#bbddf5",
                                paddingLeft: "10px",
                                textAlign: "left",
                              }}
                            >
                              <tr>
                                <th
                                  style={{
                                    background: "#a8d2f0ff",
                                    paddingLeft: "10px",
                                    textAlign: "left",
                                    paddingTop: "12px",
                                    paddingBottom: "12px",
                                  }}
                                >
                                  Service
                                </th>
                                <th
                                  style={{
                                    background: "#a8d2f0ff",
                                    paddingLeft: "10px",
                                    textAlign: "left",
                                    paddingTop: "12px",
                                    paddingBottom: "12px",
                                  }}
                                >
                                  Description
                                </th>
                                <th
                                  style={{
                                    background: "#a8d2f0ff",
                                    paddingLeft: "10px",
                                    textAlign: "left",
                                    paddingTop: "12px",
                                    paddingBottom: "12px",
                                  }}
                                >
                                  Price
                                </th>
                                <th
                                  style={{
                                    background: "#a8d2f0ff",
                                    paddingLeft: "10px",
                                    textAlign: "left",
                                    paddingTop: "12px",
                                    paddingBottom: "12px",
                                  }}
                                >
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {provider.services.map((service, i) => (
                                <tr key={i}>
                                  <td style={styles.td}>{service.title}</td>
                                  <td style={styles.td}>
                                    {service.description || "—"}
                                  </td>
                                  <td style={styles.td}>
                                    {service.price || "N/A"}
                                  </td>
                                  <td style={styles.td}>
                                    {service.status || "Inactive"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div style={styles.noData}>No services available</div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            style={{
              ...styles.button,
              ...(page === 1 ? styles.buttonDisabled : {}),
            }}
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            ‹ Prev
          </button>
          <span style={{ fontSize: "13px", color: "#374151" }}>
            Page {page} of {totalPages}
          </span>
          <button
            style={{
              ...styles.button,
              ...(page === totalPages ? styles.buttonDisabled : {}),
            }}
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
