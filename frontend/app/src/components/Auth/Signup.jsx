
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function Signup() {
  const navigate = useNavigate();

  const [formValues, setFormValues] = useState({
    username: "",
    email: "",
    password: "",
    confirmpassword: "",
    termsAccepted: false,
  });

  // FIX: use null for "no error"
  const [formErrors, setFormErrors] = useState({
    username: null,
    email: null,
    password: null,
    confirmpassword: null,
    termsAccepted: null,
  });

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const validateField = (name, value) => {
    let error = null;

    if (name === "username") {
      if (!value.trim()) {
        error = "Username is required";
      } else if (value.trim().length < 3) {
        error = "Username must be at least 3 characters";
      }
    }

    if (name === "email") {
      if (!value.trim()) {
        error = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        error = "Enter a valid email address";
      }
    }

    if (name === "password") {
      if (!value) {
        error = "Password is required";
      } else if (value.length < 6) {
        error = "Password must be at least 6 characters";
      }
    }

    if (name === "confirmpassword") {
      if (!value) {
        error = "Please confirm your password";
      } else if (value !== formValues.password) {
        error = "Passwords do not match";
      }
    }

    if (name === "termsAccepted") {
      if (!value) {
        error = "You must accept the terms";
      }
    }

    return error;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    const newValue = type === "checkbox" ? checked : value;

    setFormValues((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    setFormErrors((prev) => ({
      ...prev,
      [name]: validateField(name, newValue),
    }));

    setServerError("");
  };

  const isFormValid = () => {
    return (
      formValues.username.trim() &&
      formValues.email.trim() &&
      formValues.password &&
      formValues.confirmpassword &&
      formValues.password === formValues.confirmpassword &&
      formValues.termsAccepted &&
      Object.values(formErrors).every((error) => error === null)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setServerError("");

    // Validate everything one more time before sending
    const errors = {
      username: validateField("username", formValues.username),
      email: validateField("email", formValues.email),
      password: validateField("password", formValues.password),
      confirmpassword: validateField(
        "confirmpassword",
        formValues.confirmpassword
      ),
      termsAccepted: validateField(
        "termsAccepted",
        formValues.termsAccepted
      ),
    };

    setFormErrors(errors);

    if (Object.values(errors).some((error) => error !== null)) {
      return;
    }

    try {
      setLoading(true);

      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      const { data } = await axios.post(
        "/api/auth/signup",
        formValues,
        config
      );

      console.log("Signup successful:", data);

      // If backend returns user/token, save it
      if (data?.token) {
        localStorage.setItem("userInfo", JSON.stringify(data));
      }

      // Go to login after successful signup
      navigate("/login");
    } catch (error) {
      console.error("Signup error:", error);

      setServerError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Signup failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow">
            <div className="card-body p-4">
              <h2 className="text-center mb-4">Create Account</h2>

              {serverError && (
                <div className="alert alert-danger">
                  {serverError}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Username */}
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">
                    Username
                  </label>

                  <input
                    type="text"
                    id="username"
                    name="username"
                    className={`form-control ${
                      formErrors.username ? "is-invalid" : ""
                    }`}
                    value={formValues.username}
                    onChange={handleChange}
                    placeholder="Enter username"
                  />

                  {formErrors.username && (
                    <div className="invalid-feedback">
                      {formErrors.username}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>

                  <input
                    type="email"
                    id="email"
                    name="email"
                    className={`form-control ${
                      formErrors.email ? "is-invalid" : ""
                    }`}
                    value={formValues.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                  />

                  {formErrors.email && (
                    <div className="invalid-feedback">
                      {formErrors.email}
                    </div>
                  )}
                </div>

                {/* Password */}
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>

                  <input
                    type="password"
                    id="password"
                    name="password"
                    className={`form-control ${
                      formErrors.password ? "is-invalid" : ""
                    }`}
                    value={formValues.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                  />

                  {formErrors.password && (
                    <div className="invalid-feedback">
                      {formErrors.password}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="mb-3">
                  <label
                    htmlFor="confirmpassword"
                    className="form-label"
                  >
                    Confirm Password
                  </label>

                  <input
                    type="password"
                    id="confirmpassword"
                    name="confirmpassword"
                    className={`form-control ${
                      formErrors.confirmpassword ? "is-invalid" : ""
                    }`}
                    value={formValues.confirmpassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                  />

                  {formErrors.confirmpassword && (
                    <div className="invalid-feedback">
                      {formErrors.confirmpassword}
                    </div>
                  )}
                </div>

                {/* Terms */}
                <div className="form-check mb-3">
                  <input
                    type="checkbox"
                    id="termsAccepted"
                    name="termsAccepted"
                    className={`form-check-input ${
                      formErrors.termsAccepted ? "is-invalid" : ""
                    }`}
                    checked={formValues.termsAccepted}
                    onChange={handleChange}
                  />

                  <label
                    htmlFor="termsAccepted"
                    className="form-check-label"
                  >
                    I agree to the terms and conditions
                  </label>

                  {formErrors.termsAccepted && (
                    <div className="invalid-feedback">
                      {formErrors.termsAccepted}
                    </div>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading || !isFormValid()}
                >
                  {loading ? "Creating Account..." : "Sign Up"}
                </button>
              </form>

              <div className="text-center mt-3">
                <span>Already have an account? </span>
                <Link to="/login">Login</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;

