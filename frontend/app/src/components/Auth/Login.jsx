import React, { useState, useEffect } from "react";
import {
  Form,
  Button,
  Container,
  Row,
  Col,
  InputGroup,
  Card,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Loader from "../Loader";
import Message from "../Message";

function Login() {
  const navigate = useNavigate();

  const [message, setMessage] = useState("");
  const [show, setShow] = useState("fa fa-eye-slash");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
  });

  const [formErrors, setFormErrors] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    validateField(name, value);
  };

  const validateField = (name, value) => {
    let errorMessage = "";

    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(value)) {
        errorMessage = "Invalid email format";
      }
    }

    if (name === "password") {
      if (!value) {
        errorMessage = "Password is required";
      }
    }

    setFormErrors((prev) => ({
      ...prev,
      [name]: errorMessage,
    }));
  };

  const getValidationClass = (name) => {
    if (formValues[name] === "") return "";
    return formErrors[name] ? "is-invalid" : "is-valid";
  };

  const isFormValid = () => {
    return (
      formValues.email !== "" &&
      formValues.password !== "" &&
      !formErrors.email &&
      !formErrors.password
    );
  };

  const clearForm = () => {
    setFormValues({
      email: "",
      password: "",
    });

    setFormErrors({
      email: "",
      password: "",
    });
  };

  const showPassword = () => {
    const input = document.getElementById("pass1");

    if (input.type === "password") {
      input.type = "text";
      setShow("fa fa-eye");
    } else {
      input.type = "password";
      setShow("fa fa-eye-slash");
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    if (!isFormValid()) {
      setMessage("Please enter a valid email and password.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setError("");

      const config = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      const { data } = await axios.post(
        "https://social-media-backend-fwgu.onrender.com/api/auth/login",
        formValues,
        config
      );

      console.log("LOGIN SUCCESS:", data);

      localStorage.setItem("userInfo", JSON.stringify(data));

      clearForm();

      navigate("/profile", { replace: true });
    } catch (error) {
      console.error("LOGIN ERROR:", error);

      setError(
        error.response?.data?.message ||
          "Login failed. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo");

    if (userInfo) {
      navigate("/profile", { replace: true });
    }
  }, [navigate]);

  return (
    <Container>
      <Row>
        <Col md="4"></Col>

        {loading ? (
          <Loader />
        ) : (
          <Col md="4">
            <Card className="mt-4 p-3">
              <Form onSubmit={submitHandler}>
                <br />

                <h3 className="text-center bg-light text-dark">
                  Login Here
                </h3>

                {message && (
                  <Message
                    variant="warning"
                    onClose={() => setMessage("")}
                  >
                    {message}
                  </Message>
                )}

                {error && (
                  <Message
                    variant="danger"
                    onClose={() => setError("")}
                  >
                    {error}
                  </Message>
                )}

                <Form.Group controlId="email">
                  <Form.Label>Email</Form.Label>

                  <Form.Control
                    type="email"
                    placeholder="Enter your Email"
                    name="email"
                    value={formValues.email}
                    onChange={handleChange}
                    isInvalid={!!formErrors.email}
                    className={getValidationClass("email")}
                  />

                  <Form.Control.Feedback type="invalid">
                    {formErrors.email}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    <span>
                      <i className={show}></i>
                    </span>{" "}
                    Password
                  </Form.Label>

                  <InputGroup className="mb-3">
                    <InputGroup.Checkbox onClick={showPassword} />

                    <Form.Control
                      required
                      type="password"
                      name="password"
                      id="pass1"
                      value={formValues.password}
                      placeholder="Enter your Password"
                      isInvalid={!!formErrors.password}
                      className={getValidationClass("password")}
                      onChange={handleChange}
                    />

                    <Form.Control.Feedback type="invalid">
                      {formErrors.password}
                    </Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>

                <Button
                  className="mt-3 w-100"
                  variant="success"
                  type="submit"
                  disabled={!isFormValid() || loading}
                >
                  Login
                </Button>
              </Form>
            </Card>

            <Row className="py-3">
              <Col>
                New User? <Link to="/signup">Sign Up</Link>
              </Col>
            </Row>
          </Col>
        )}

        <Col md="4"></Col>
      </Row>
    </Container>
  );
}

export default Login;