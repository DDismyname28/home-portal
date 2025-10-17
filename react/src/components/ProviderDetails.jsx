import React, { useState } from "react";

export default function ProviderDetails() {
  const [providerId, setProviderId] = useState("");
  const [providerInfo, setProviderInfo] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();

    // TODO: Replace with your actual endpoint
    // For now, simulate result:
    setProviderInfo({
      name: "John's Electrical Services",
      email: "john@example.com",
      phone: "0917-123-4567",
      address: "Taguig City, Metro Manila",
      rating: "4.8 / 5",
    });
  };

  return (
    <div className="page-container">
      <form className="search-form" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Enter provider ID or name"
          value={providerId}
          onChange={(e) => setProviderId(e.target.value)}
          required
        />
        <button type="submit" className="btn-primary">
          Search
        </button>
      </form>

      {providerInfo && (
        <div className="provider-card">
          <h3>{providerInfo.name}</h3>
          <p>
            <strong>Email:</strong> {providerInfo.email}
          </p>
          <p>
            <strong>Phone:</strong> {providerInfo.phone}
          </p>
          <p>
            <strong>Address:</strong> {providerInfo.address}
          </p>
          <p>
            <strong>Rating:</strong> {providerInfo.rating}
          </p>
        </div>
      )}
    </div>
  );
}
