import { useState } from "react";
import {
  FaUser,
  FaEnvelope,
  FaHome,
  FaMapMarkerAlt,
  FaBuilding,
  FaIdBadge,
  FaLock,
  FaSpinner,
} from "react-icons/fa";
import "../App.css";

const SignupForm = () => {
  const [isSignup, setIsSignup] = useState(true);
  const [membershipType, setMembershipType] = useState("regular");
  const [form, setForm] = useState({
    companyName: "",
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    streetAddress: "",
    zipCode: "",
    city: "",
    state: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setNotification({ message: "", type: "" });
  };

  const handleZipChange = async (e) => {
    const zip = e.target.value;
    setForm((prev) => ({ ...prev, zipCode: zip }));
    setErrors((prev) => ({ ...prev, zipCode: "" }));

    if (zip.length === 5) {
      try {
        const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
        if (!res.ok) throw new Error("Zip not found");
        const data = await res.json();
        const place = data.places[0];
        setForm((prev) => ({
          ...prev,
          city: place["place name"],
          state: place["state abbreviation"],
        }));
      } catch {
        setErrors((prev) => ({ ...prev, zipCode: "Invalid zip code" }));
        setForm((prev) => ({ ...prev, city: "", state: "" }));
      }
    } else {
      setForm((prev) => ({ ...prev, city: "", state: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setNotification({ message: "", type: "" });

    const endpoint = isSignup
      ? "/wp-json/home-portal/v1/signup"
      : "/wp-json/home-portal/v1/signin";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isSignup
            ? { ...form, membershipType }
            : { login: form.username, password: form.password }
        ),
      });

      const data = await res.json();

      if (data.success) {
        setNotification({
          message: data.message || "Success!",
          type: "success",
        });

        // Auto redirect if signin returns dashboard URL
        if (data.redirect_url) {
          window.location.href = data.redirect_url;
          return;
        }

        if (isSignup) {
          setForm({
            companyName: "",
            username: "",
            firstName: "",
            lastName: "",
            email: "",
            streetAddress: "",
            zipCode: "",
            city: "",
            state: "",
            password: "",
          });
        }
      } else {
        setNotification({
          message: data.message || "An unexpected error occurred.",
          type: "error",
        });
      }
    } catch {
      setNotification({
        message: "Network error. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderError = (field) =>
    errors[field] ? <p className="error-message">{errors[field]}</p> : null;

  return (
    <div className="signup-form-container">
      <div className="signup-modal">
        <h2>{isSignup ? "Create Account" : "Sign In"}</h2>
        <p>
          {isSignup
            ? "Join Home Portal today"
            : "Welcome back! Please sign in."}
        </p>

        {notification.message && (
          <div
            className={`notification ${notification.type}`}
            style={{ whiteSpace: "pre-line" }}
          >
            {notification.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isSignup ? (
            <>
              <label>Type of Membership</label>
              <div className="input-wrapper">
                <FaIdBadge className="icon" />
                <select
                  name="membershipType"
                  value={membershipType}
                  onChange={(e) => setMembershipType(e.target.value)}
                  required
                >
                  <option value="regular">Regular Member</option>
                  <option value="provider">Local Service Provider</option>
                </select>
              </div>
              {membershipType === "provider" && (
                <>
                  <label>Company Name</label>
                  <div className="input-wrapper">
                    <FaBuilding className="icon" />
                    <input
                      type="text"
                      name="companyName"
                      placeholder="Enter your company name"
                      value={form.companyName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </>
              )}

              <label>Username</label>
              <div className="input-wrapper">
                <FaUser className="icon" />
                <input
                  type="text"
                  name="username"
                  placeholder="Enter your username"
                  value={form.username}
                  onChange={handleChange}
                  required
                />
              </div>
              <label>First Name</label>
              <div className="input-wrapper">
                <FaUser className="icon" />
                <input
                  type="text"
                  name="firstName"
                  placeholder="Enter your first name"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <label>Last Name</label>
              <div className="input-wrapper">
                <FaUser className="icon" />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Enter your last name"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
              <label>Email</label>
              <div className="input-wrapper">
                <FaEnvelope className="icon" />
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <label>Street Address</label>
              <div className="input-wrapper">
                <FaHome className="icon" />
                <input
                  type="text"
                  name="streetAddress"
                  placeholder="Enter your street address"
                  value={form.streetAddress}
                  onChange={handleChange}
                  required
                />
              </div>
              <label>Zip Code</label>
              <div className="input-wrapper">
                <FaMapMarkerAlt className="icon" />
                <input
                  type="text"
                  name="zipCode"
                  placeholder="Enter your zip code"
                  value={form.zipCode}
                  onChange={handleZipChange}
                  required
                />
              </div>
              <label>City</label>
              <div className="input-wrapper">
                <FaMapMarkerAlt className="icon" />
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={form.city}
                  onChange={handleChange}
                  required
                />
              </div>
              <label>State</label>
              <div className="input-wrapper">
                <FaMapMarkerAlt className="icon" />
                <input
                  type="text"
                  name="state"
                  placeholder="State"
                  value={form.state}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="terms">
                <input type="checkbox" required />
                <span>
                  I agree to the{" "}
                  <a href="/terms" target="_blank" rel="noopener noreferrer">
                    Terms
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer">
                    Privacy Policy
                  </a>
                </span>
              </div>

              <button type="submit" disabled={loading}>
                {loading ? <FaSpinner className="spinner" /> : "Create Account"}
              </button>
            </>
          ) : (
            <>
              <label>Username or Email</label>
              <div className="input-wrapper">
                <FaUser className="icon" />
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Username or Email"
                  required
                />
              </div>
              <label>Password</label>
              <div className="input-wrapper">
                <FaLock className="icon" />
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Password"
                  required
                />
              </div>
              <button type="submit" disabled={loading}>
                {loading ? <FaSpinner className="spinner" /> : "Sign In"}
              </button>
            </>
          )}
        </form>

        <p className="toggle-auth">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <span onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? "Sign In" : "Sign Up"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default SignupForm;
