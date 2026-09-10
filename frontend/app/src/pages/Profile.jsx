
import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Button,
  Card,
  Form,
  ListGroup,
} from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Loader from "../components/Loader";
import Message from "../components/Message";
import QRCode from "qrcode";
import UserPosts from "../components/Posts/UserPosts";

const getImageUrl = (image) => {
  if (!image) return "";
  if (/^https?:\/\//i.test(image)) return image;

  const normalizedImage = image.replace(/\\/g, "/");
  const uploadsIndex = normalizedImage.indexOf("/uploads/");

  const uploadPath =
    uploadsIndex >= 0
      ? normalizedImage.slice(uploadsIndex)
      : `/${normalizedImage.replace(/^\//, "")}`;

  return `https://social-media-backend-fwgu.onrender.com${uploadPath}`;
};

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);
  const [profilePicture, setProfilePicture] = useState(null);

  const [userPosts, setUserPosts] = useState([]);

  const handleClose = () => setMessage("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const userInfo = localStorage.getItem("userInfo");

        if (!userInfo) {
          navigate("/login");
          return;
        }

        const parsedUser = JSON.parse(userInfo);

        const config = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${parsedUser.token}`,
          },
        };

        // Get profile
        const { data } = await axios.get("/api/users/profile", config);
        setUser(data);

        // Get user posts
        const { data: postsData } = await axios.get(
          `/api/posts/user/${parsedUser._id}`,
          config
        );

        // FIX: Make sure userPosts is always an array
        setUserPosts(Array.isArray(postsData) ? postsData : []);

        // Generate QR code if 2FA secret exists
        if (data.twoFactorAuthSecret) {
          const otpauthurl = `otpauth://totp/SecretKey?secret=${data.twoFactorAuthSecret}`;

          QRCode.toDataURL(
            otpauthurl,
            { width: 200, margin: 2 },
            (err, url) => {
              if (!err) {
                setQrCodeUrl(url);
              }
            }
          );
        }
      } catch (error) {
        setError(
          error.response && error.response.data.message
            ? error.response.data.message
            : error.message
        );

        if (error.response && error.response.status === 401) {
          localStorage.removeItem("userInfo");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const startChartHandler = async (userId) => {
    try {
      setLoading(true);

      const userInfo = JSON.parse(localStorage.getItem("userInfo"));

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.post("/api/chat", { userId }, config);

      navigate(`/chat/${data._id}`);
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const searchHandler = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      const parsedUser = JSON.parse(localStorage.getItem("userInfo"));

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${parsedUser.token}`,
        },
      };

      const { data } = await axios.get(
        `/api/users/search?q=${encodeURIComponent(keyword.trim())}`,
        config
      );

      // Make sure search results are always an array
      setResults(Array.isArray(data) ? data : []);
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadProfilePictureHandler = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      const userInfo = localStorage.getItem("userInfo");

      if (!userInfo) {
        navigate("/login");
        return;
      }

      const parsedUser = JSON.parse(userInfo);

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${parsedUser.token}`,
        },
      };

      const formData = new FormData();
      formData.append("profilePicture", profilePicture);

      const { data } = await axios.post(
        "/api/users/profile/upload",
        formData,
        config
      );

      setMessage("Profile Picture Updated Successfully");

      setUser({
        ...user,
        profilePicture: data.profilePicture,
      });
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const enable2FA = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const userInfo = localStorage.getItem("userInfo");
      const parsedUser = JSON.parse(userInfo);

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${parsedUser.token}`,
        },
      };

      const { data } = await axios.post(
        "/api/auth/enable-2fa",
        {},
        config
      );

      const otpauthUrl = data.secret;

      QRCode.toDataURL(
        otpauthUrl,
        { width: 200, margin: 2 },
        (err, url) => {
          if (err) {
            setError("Failed to generate QR Code");
          } else {
            setQrCodeUrl(url);
          }
        }
      );

      setMessage("Two Factor authentication enabled successfully...");
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const followUser = async (userId) => {
    try {
      setLoading(true);

      const userInfo = localStorage.getItem("userInfo");
      const parsedUser = JSON.parse(userInfo);

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${parsedUser.token}`,
        },
      };

      if (!userId) {
        throw new Error("User ID is missing");
      }

      await axios.post(`/api/users/${userId}/follow`, {}, config);

      setMessage("User followed Successfully");

      const { data } = await axios.get(
        "/api/users/profile",
        config
      );

      setUser(data);
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const unfollowUser = async (userId) => {
    try {
      setLoading(true);

      const userInfo = localStorage.getItem("userInfo");
      const parsedUser = JSON.parse(userInfo);

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${parsedUser.token}`,
        },
      };

      if (!userId) {
        throw new Error("User ID is missing");
      }

      await axios.delete(`/api/users/${userId}/follow`, config);

      setMessage("User unfollowed successfully");

      const { data } = await axios.get(
        "/api/users/profile",
        config
      );

      setUser(data);
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Row>
        <Col md="5">
          <Card className="mt-4 p-3">
            <h3 className="text-center bg-light text-dark mt-2">
              Welcome
            </h3>

            {message && (
              <Message variant="success" onClose={() => setMessage("")}>
                {message}
              </Message>
            )}

            {error && (
              <Message variant="danger" onClose={() => setError(null)}>
                {error}
              </Message>
            )}

            {/* Profile Picture Section */}
            <div className="text-center">
              {user.profilePicture ? (
                <img
                  src={getImageUrl(user.profilePicture)}
                  alt="Profile"
                  className="rounded-circle"
                  width="100"
                  height="100"
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <img
                  src="https://via.placeholder.com/100"
                  alt="Default Profile"
                  className="rounded-circle"
                  width="100"
                  height="100"
                />
              )}
            </div>

            <Form
              onSubmit={uploadProfilePictureHandler}
              className="mt-3"
            >
              <Form.Group>
                <Form.Control
                  type="file"
                  onChange={(e) =>
                    setProfilePicture(e.target.files[0])
                  }
                />
              </Form.Group>

              <Button
                type="submit"
                variant="light"
                className="mt-3 btn-sm"
              >
                Upload/Edit Profile Picture
              </Button>
            </Form>

            <ul className="list-group mt-3">
              <li className="list-group-item list-group-item-light d-flex justify-content-between align-items-center">
                <strong>Username:</strong> {user.username}
              </li>

              <li className="list-group-item list-group-item-secondary d-flex justify-content-between align-items-center">
                <strong>Email:</strong> {user.email}
              </li>

              {!user.twoFactorAuth && (
                <Button
                  onClick={enable2FA}
                  variant="primary"
                  className="mt-3"
                >
                  Enable 2FA
                </Button>
              )}

              {qrCodeUrl && (
                <div
                  className="accordion accordion-flush mt-3"
                  id="accordionFlushExample"
                >
                  <div className="accordion-item">
                    <h2 className="accordion-header">
                      <button
                        className="accordion-button collapsed"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#flush-collapseOne"
                        aria-expanded="false"
                        aria-controls="flush-collapseOne"
                      >
                        Authenticate QR Code
                      </button>
                    </h2>

                    <div
                      id="flush-collapseOne"
                      className="accordion-collapse collapse"
                      data-bs-parent="#accordionFlushExample"
                    >
                      <div className="accordion-body text-center">
                        <img
                          src={qrCodeUrl}
                          alt="2FA QR Code"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </ul>
          </Card>
        </Col>

        <Col md="7">
          <Card className="mt-4 p-3">
            <h3 className="text-center bg-light text-dark mt-2">
              Search Users
            </h3>

            <Form
              onSubmit={searchHandler}
              className="d-flex"
            >
              <Form.Control
                type="text"
                placeholder="Search by username or email"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />

              <Button
                className="ms-2"
                type="submit"
              >
                Search
              </Button>
            </Form>

            {loading && <Loader />}

            <ListGroup className="mt-3">
              {Array.isArray(results) &&
                results.map((result) => (
                  <ListGroup.Item
                    key={result._id}
                    className="d-flex align-items-center gap-2"
                  >
                    <Link to={`/profile/${result._id}`}>
                      {result.username}
                    </Link>

                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => followUser(result._id)}
                    >
                      Follow
                    </Button>

                    <Button
                      variant="light"
                      size="sm"
                      onClick={() =>
                        startChartHandler(result._id)
                      }
                    >
                      Chat
                    </Button>
                  </ListGroup.Item>
                ))}
            </ListGroup>

            <Row>
              {/* Followers */}
              <Col md={6}>
                <h5 className="mt-4 bg-light p-2 text-center">
                  Followers{" "}
                  <span className="badge bg-primary rounded-pill">
                    {Array.isArray(user.followers)
                      ? user.followers.length
                      : 0}
                  </span>
                </h5>

                {Array.isArray(user.followers) &&
                  user.followers.map((follower, index) => {
                    const followerId =
                      follower._id || follower;

                    return (
                      <Row
                        className="g-2 mb-2"
                        key={
                          followerId?.toString() || index
                        }
                      >
                        <Col>
                          <Card className="h-100 text-center p-2">
                            <Card.Body className="d-flex align-items-center p-0">
                              <Link
                                to={`/user/${followerId}`}
                              >
                                <Card.Img
                                  variant="top"
                                  src={
                                    follower.profilePicture
                                      ? getImageUrl(
                                          follower.profilePicture
                                        )
                                      : "https://via.placeholder.com/50"
                                  }
                                  alt={
                                    follower.username ||
                                    "Follower"
                                  }
                                  className="rounded-circle me-2"
                                  style={{
                                    width: "50px",
                                    height: "50px",
                                    objectFit: "cover",
                                  }}
                                />
                              </Link>

                              <Card.Title className="mb-0 fs-6 text-truncate">
                                <Link
                                  to={`/user/${followerId}`}
                                >
                                  {follower.username ||
                                    followerId}
                                </Link>
                              </Card.Title>

                              <Button
                                variant="success"
                                className="ms-auto btn-sm"
                                onClick={() =>
                                  followUser(followerId)
                                }
                              >
                                Follow
                              </Button>
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                    );
                  })}
              </Col>

              {/* Following */}
              <Col md={6}>
                <h5 className="mt-4 bg-light p-2 text-center">
                  Following{" "}
                  <span className="badge bg-primary rounded-pill">
                    {Array.isArray(user.following)
                      ? user.following.length
                      : 0}
                  </span>
                </h5>

                {Array.isArray(user.following) &&
                  user.following.map((following, index) => {
                    const followingId =
                      following._id || following;

                    return (
                      <Row
                        className="g-2 mb-2"
                        key={
                          followingId?.toString() || index
                        }
                      >
                        <Col>
                          <Card className="h-100 text-center p-2">
                            <Card.Body className="d-flex align-items-center p-0">
                              <Link
                                to={`/user/${followingId}`}
                              >
                                <Card.Img
                                  variant="top"
                                  src={
                                    following.profilePicture
                                      ? getImageUrl(
                                          following.profilePicture
                                        )
                                      : "https://via.placeholder.com/50"
                                  }
                                  alt={
                                    following.username ||
                                    "Following"
                                  }
                                  className="rounded-circle me-2"
                                  style={{
                                    width: "50px",
                                    height: "50px",
                                    objectFit: "cover",
                                  }}
                                />
                              </Link>

                              <Card.Title className="mb-0 fs-6 text-truncate">
                                <Link
                                  to={`/user/${followingId}`}
                                >
                                  {following.username ||
                                    followingId}
                                </Link>
                              </Card.Title>

                              <Button
                                variant="danger"
                                className="ms-auto btn-sm"
                                onClick={() =>
                                  unfollowUser(followingId)
                                }
                              >
                                Unfollow
                              </Button>
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                    );
                  })}
              </Col>
            </Row>

            <hr />

            <h3 className="text-center mt-4">
              Your Posts
            </h3>

            <Row className="g-2">
              {Array.isArray(userPosts) &&
                userPosts.map((post) => (
                  <Col
                    key={post._id}
                    xs={4}
                  >
                    <Card>
                      {post.image && (
                        <Link
                          to={`/post/${post._id}`}
                        >
                          <Card.Img
                            variant="top"
                            src={getImageUrl(post.image)}
                            alt="Post image"
                            className="img-fluid"
                            style={{
                              width: "100%",
                              height: "150px",
                              objectFit: "cover",
                            }}
                          />
                        </Link>
                      )}
                    </Card>
                  </Col>
                ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Profile;
