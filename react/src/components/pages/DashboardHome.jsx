import React, { useEffect, useState } from "react";
import "../../DashboardHome.css";

export default function DashboardHome() {
  const [report, setReport] = useState(null);
  const [user, setUser] = useState(null);
  const [streetViewUrl, setStreetViewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [apiKey, setApiKey] = useState(""); // <-- ✅ API Key loaded dynamically

  /**
   * Fetch Google Maps API Key from WP Settings REST endpoint
   */
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const res = await fetch(`${HiiincHomeDashboardData.apiRoot}settings`, {
          method: "GET",
          credentials: "include",
        });
        const json = await res.json();

        if (json.success && json.apiKey) {
          setApiKey(json.apiKey);
        } else {
          console.warn("No API key found in settings");
        }
      } catch (err) {
        console.error("Error fetching API key:", err);
      }
    };

    fetchApiKey();
  }, []);

  /**
   * Fetch report data
   */
  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`${HiiincHomeDashboardData.apiRoot}reports`, {
          method: "GET",
          credentials: "include",
          headers: { "X-WP-Nonce": HiiincHomeDashboardData.nonce },
        });
        const json = await res.json();
        if (json.success) setReport(json);
        else setError(json.message || "Unable to load report data.");
      } catch (err) {
        console.error("Error fetching reports:", err);
        setError("An error occurred while fetching reports.");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, []);

  /**
   * Fetch user data & generate Street View URL
   * Waits until apiKey is available ✅
   */
  useEffect(() => {
    if (!apiKey) return; // <-- ✅ don't run until API key is ready

    const fetchUser = async () => {
      try {
        const res = await fetch(`${HiiincHomeDashboardData.apiRoot}me`, {
          method: "GET",
          credentials: "include",
          headers: { "X-WP-Nonce": HiiincHomeDashboardData.nonce },
        });
        const json = await res.json();

        if (json.success) {
          const userData = json.user;
          setUser(userData);

          let {
            lat,
            long: lng,
            streetAddress,
            city,
            state,
            zipCode,
          } = userData;

          // If no coordinates, geocode address
          if ((!lat || !lng) && streetAddress) {
            const fullAddress = `${streetAddress || ""} ${city || ""} ${
              state || ""
            } ${zipCode || ""}`.trim();

            const geoRes = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
                fullAddress
              )}&key=${apiKey}`
            );
            const geoData = await geoRes.json();

            if (geoData.status === "OK" && geoData.results.length > 0) {
              lat = geoData.results[0].geometry.location.lat;
              lng = geoData.results[0].geometry.location.lng;
            }
          }

          if (lat && lng) {
            const embedUrl = `https://www.google.com/maps/embed/v1/streetview?key=${apiKey}&location=${lat},${lng}&heading=210&pitch=10&fov=90`;
            setStreetViewUrl(embedUrl);
          }
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    fetchUser();
  }, [apiKey]); // ✅ re-run when API key arrives

  const computeSummary = () => {
    if (!report || !report.success) return null;

    const totals = { Pending: 0, Active: 0, Completed: 0, Total: 0 };
    const months =
      report.role === "local_provider"
        ? Object.values(report.data.months)
        : Object.values(report.data);

    months.forEach((m) => {
      totals.Pending += m.Pending;
      totals.Active += m.Active;
      totals.Completed += m.Completed;
      totals.Total += m.Total;
    });

    if (report.role === "local_provider") {
      totals.services = report.data.services_offered;
    }

    return totals;
  };

  const summary = computeSummary();

  return (
    <div className="dashboard-home">
      <header className="dashboard-header">
        <div>
          <h1>
            Welcome back{" "}
            {user?.username
              ? `${user.username} 👋`
              : report?.role === "local_provider"
              ? "Local Provider 👋"
              : "Home Member 👋"}
          </h1>
          <p className="welcome-text">Here’s your current report overview.</p>
        </div>
      </header>

      {loading ? (
        <div className="loading-state">Loading report data...</div>
      ) : error ? (
        <div className="error-state">{error}</div>
      ) : summary ? (
        <>
          <section className="dashboard-summary">
            <div className="summary-card">
              <h3>Total Requests</h3>
              <p>{summary.Total}</p>
              <span className="trend neutral">All-time</span>
            </div>

            <div className="summary-card">
              <h3>Active</h3>
              <p>{summary.Active}</p>
              <span className="trend positive">In progress</span>
            </div>

            <div className="summary-card">
              <h3>Pending</h3>
              <p>{summary.Pending}</p>
              <span className="trend neutral">Awaiting action</span>
            </div>

            <div className="summary-card">
              <h3>Completed</h3>
              <p>{summary.Completed}</p>
              <span className="trend positive">Done</span>
            </div>

            {report.role === "local_provider" && (
              <div className="summary-card">
                <h3>Services Offered</h3>
                <p>{summary.services}</p>
                <span className="trend neutral">Published services</span>
              </div>
            )}
          </section>

          <section className="street-view-section">
            <h2>Street View</h2>
            {!apiKey && <p>GEO Location API key not found.</p>}
            {apiKey && streetViewUrl ? (
              <iframe
                title="Street View"
                src={streetViewUrl}
                width="100%"
                height="700"
                style={{
                  border: 0,
                  borderRadius: "10px",
                  boxShadow: "0 0 10px rgba(0,0,0,0.1)",
                }}
                allowFullScreen
                loading="lazy"
              ></iframe>
            ) : apiKey ? (
              <p>No address available to show Street View.</p>
            ) : null}
          </section>
        </>
      ) : (
        <div className="no-data">No report data available.</div>
      )}
    </div>
  );
}
