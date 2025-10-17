import React, { useState } from "react";

export default function SubmitRequest() {
  const [form, setForm] = useState({
    service: "",
    subject: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const services = [
    "Electrical",
    "Plumbing",
    "Cleaning",
    "Carpentry",
    "Painting",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // Replace with your actual WordPress endpoint
      const response = await fetch("/wp-json/home-portal/v1/submit-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) throw new Error("Failed to submit request");

      setMessage("Your request has been submitted successfully!");
      setForm({ service: "", subject: "", description: "" });
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="page-container"
      style={{ maxWidth: "600px", margin: "0 auto" }}
    >
      <h2>Submit a Service Request</h2>

      {message && (
        <div
          style={{
            marginBottom: "16px",
            padding: "10px",
            borderRadius: "4px",
            backgroundColor: message.startsWith("Error")
              ? "#f8d7da"
              : "#d4edda",
            color: message.startsWith("Error") ? "#721c24" : "#155724",
          }}
        >
          {message}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "16px" }}
      >
        <div className="form-group">
          <label>Service</label>
          <select
            name="service"
            value={form.service}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          >
            <option value="">Select a service</option>
            {services.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Subject</label>
          <input
            type="text"
            name="subject"
            value={form.subject}
            onChange={handleChange}
            required
            placeholder="Enter subject"
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            placeholder="Describe your request"
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              minHeight: "120px",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px",
            borderRadius: "4px",
            border: "none",
            backgroundColor: "#007bff",
            color: "#fff",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
}
