import React, { useEffect, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Loader from "../components/Loader";
import Message from "../components/Message";
import QRCode from "qrcode";
import "./Profile.css";

const getImageUrl = (image) => {
  if (!image) return "";

  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  const normalizedImage = image.replace(/\\/g, "/");

  const uploadsIndex = normalizedImage.indexOf("/uploads/");

  const uploadPath =
    uploadsIndex >= 0
      ? normalizedImage.slice(uploadsIndex)
      : `/${normalizedImage.replace(/^\/+/, "")}`;

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

        const { data } = await axios.get(
          "/api/users/profile",
          config
        );

        setUser(data);

        const { data: postsData } = await axios.get(
          `/api/posts/user/${parsedUser._id}`,
          config
        );

        setUserPosts(
          Array.isArray(postsData) ? postsData : []
        );

        if (data.twoFactorAuthSecret) {
          const otpauthUrl =
            `otpauth://totp/SecretKey?secret=${data.twoFactorAuthSecret}`;

          QRCode.toDataURL(
            otpauthUrl,
            {
              width: 200,
              margin: 2,
            },
            (err, url) => {
              if (!err) {
                setQrCodeUrl(url);
              }
            }
          );
        }
      } catch (error) {
        setError(
          error.response?.data?.message ||
            error.message ||
            "Unable to load profile"
        );

        if (error.response?.status === 401) {
          localStorage.removeItem("userInfo");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  /* ================= CHAT ================= */

  const startChartHandler = async (userId) => {
    try {
      setLoading(true);
      setError(null);

      const userInfo = JSON.parse(
        localStorage.getItem("userInfo")
      );

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.post(
        "/api/chat",
        { userId },
        config
      );

      navigate(`/chat/${data._id}`);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to start chat"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================= SEARCH ================= */

  const searchHandler = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      const parsedUser = JSON.parse(
        localStorage.getItem("userInfo")
      );

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${parsedUser.token}`,
        },
      };

      const { data } = await axios.get(
        `/api/users/search?q=${encodeURIComponent(
          keyword.trim()
        )}`,
        config
      );

      setResults(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Search failed"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================= PROFILE IMAGE ================= */

  const uploadProfilePictureHandler = async (e) => {
    e.preventDefault();

    if (!profilePicture) {
      setError("Please select an image first.");
      return;
    }

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

      formData.append(
        "profilePicture",
        profilePicture
      );

      const { data } = await axios.post(
        "/api/users/profile/upload",
        formData,
        config
      );

      setMessage(
        "Profile picture updated successfully."
      );

      setUser((previousUser) => ({
        ...previousUser,
        profilePicture: data.profilePicture,
      }));

      setProfilePicture(null);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Profile picture upload failed"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================= 2FA ================= */

  const enable2FA = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const userInfo =
        localStorage.getItem("userInfo");

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
        {
          width: 200,
          margin: 2,
        },
        (err, url) => {
          if (err) {
            setError(
              "Failed to generate QR Code"
            );
          } else {
            setQrCodeUrl(url);
          }
        }
      );

      setMessage(
        "Two-factor authentication enabled successfully."
      );
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to enable two-factor authentication"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================= FOLLOW ================= */

  const followUser = async (userId) => {
    try {
      setLoading(true);
      setError(null);

      const userInfo =
        localStorage.getItem("userInfo");

      const parsedUser = JSON.parse(userInfo);

      if (!userId) {
        throw new Error("User ID is missing");
      }

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${parsedUser.token}`,
        },
      };

      await axios.post(
        `/api/users/${userId}/follow`,
        {},
        config
      );

      setMessage("User followed successfully.");

      const { data } = await axios.get(
        "/api/users/profile",
        config
      );

      setUser(data);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to follow user"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================= UNFOLLOW ================= */

  const unfollowUser = async (userId) => {
    try {
      setLoading(true);
      setError(null);

      const userInfo =
        localStorage.getItem("userInfo");

      const parsedUser = JSON.parse(userInfo);

      if (!userId) {
        throw new Error("User ID is missing");
      }

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${parsedUser.token}`,
        },
      };

      await axios.delete(
        `/api/users/${userId}/follow`,
        config
      );

      setMessage(
        "User unfollowed successfully."
      );

      const { data } = await axios.get(
        "/api/users/profile",
        config
      );

      setUser(data);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to unfollow user"
      );
    } finally {
      setLoading(false);
    }
  };

  const followersCount = Array.isArray(user.followers)
    ? user.followers.length
    : 0;

  const followingCount = Array.isArray(user.following)
    ? user.following.length
    : 0;

  const postsCount = Array.isArray(userPosts)
    ? userPosts.length
    : 0;

  return (
    <div className="ajay-profile-page">

      {/* ================= PROFILE HEADER ================= */}

      <section className="ajay-profile-header">

        <div className="ajay-profile-header-top">
          <div className="ajay-profile-avatar-area">

            {user.profilePicture ? (
              <img
                src={getImageUrl(
                  user.profilePicture
                )}
                alt="Profile"
                className="ajay-profile-avatar"
              />
            ) : (
              <div className="ajay-profile-avatar ajay-profile-avatar-default">
                {user.username
                  ?.charAt(0)
                  ?.toUpperCase() || "U"}
              </div>
            )}

          </div>

          <div className="ajay-profile-identity">

            <span className="ajay-profile-eyebrow">
              MY PROFILE
            </span>

            <h1>
              {user.username || "User"}
            </h1>

            <p>
              {user.email ||
                "No email available"}
            </p>

          </div>

        </div>

        <div className="ajay-profile-stats">

          <div className="ajay-stat">
            <strong>{postsCount}</strong>
            <span>Posts</span>
          </div>

          <div className="ajay-stat">
            <strong>{followersCount}</strong>
            <span>Followers</span>
          </div>

          <div className="ajay-stat">
            <strong>{followingCount}</strong>
            <span>Following</span>
          </div>

        </div>

      </section>

      {/* ================= MESSAGES ================= */}

      {message && (
        <div className="ajay-profile-message">
          <Message
            variant="success"
            onClose={() => setMessage("")}
          >
            {message}
          </Message>
        </div>
      )}

      {error && (
        <div className="ajay-profile-message">
          <Message
            variant="danger"
            onClose={() => setError(null)}
          >
            {error}
          </Message>
        </div>
      )}

      {/* ================= MAIN CONTENT ================= */}

      <div className="ajay-profile-content">

        {/* ================= LEFT COLUMN ================= */}

        <aside className="ajay-profile-sidebar">

          {/* PROFILE PHOTO */}

          <section className="ajay-profile-section">

            <div className="ajay-section-heading">
              <div>
                <span className="ajay-section-kicker">
                  PROFILE
                </span>

                <h2>Profile picture</h2>

                <p>
                  Keep your profile photo
                  up to date.
                </p>
              </div>
            </div>

            <Form
              onSubmit={
                uploadProfilePictureHandler
              }
              className="ajay-upload-form"
            >

              <Form.Control
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setProfilePicture(
                    e.target.files?.[0] || null
                  )
                }
                className="ajay-file-input"
              />

              <Button
                type="submit"
                disabled={
                  !profilePicture || loading
                }
                className="ajay-primary-button"
              >
                {loading
                  ? "Uploading..."
                  : "Upload new picture"}
              </Button>

            </Form>

          </section>

          {/* ACCOUNT */}

          <section className="ajay-profile-section">

            <div className="ajay-section-heading">
              <div>
                <span className="ajay-section-kicker">
                  ACCOUNT
                </span>

                <h2>Account information</h2>

                <p>
                  Your basic account details.
                </p>
              </div>
            </div>

            <div className="ajay-info-list">

              <div className="ajay-info-item">
                <span>Username</span>
                <strong>
                  {user.username || "-"}
                </strong>
              </div>

              <div className="ajay-info-item">
                <span>Email</span>
                <strong>
                  {user.email || "-"}
                </strong>
              </div>

            </div>

          </section>

          {/* SECURITY */}

          <section className="ajay-profile-section">

            <div className="ajay-section-heading">
              <div>
                <span className="ajay-section-kicker">
                  SECURITY
                </span>

                <h2>Account security</h2>

                <p>
                  Protect your account with
                  two-factor authentication.
                </p>
              </div>
            </div>

            {!user.twoFactorAuth && (
              <Button
                onClick={enable2FA}
                disabled={loading}
                className="ajay-primary-button"
              >
                Enable two-factor authentication
              </Button>
            )}

            {user.twoFactorAuth && (
              <div className="ajay-security-success">
                <span>✓</span>
                <div>
                  <strong>
                    Two-factor authentication
                  </strong>
                  <small>
                    Your account is protected.
                  </small>
                </div>
              </div>
            )}

            {qrCodeUrl && (
              <div className="ajay-qr-area">

                <button
                  type="button"
                  className="ajay-qr-toggle"
                  onClick={() => {
                    const element =
                      document.getElementById(
                        "profile-qr-code"
                      );

                    if (element) {
                      element.classList.toggle(
                        "ajay-qr-visible"
                      );
                    }
                  }}
                >
                  View authentication QR code
                </button>

                <div
                  id="profile-qr-code"
                  className="ajay-qr-content"
                >
                  <img
                    src={qrCodeUrl}
                    alt="2FA QR Code"
                  />
                </div>

              </div>
            )}

          </section>

        </aside>

        {/* ================= RIGHT COLUMN ================= */}

        <main className="ajay-profile-main">

          {/* FIND PEOPLE */}

          <section className="ajay-profile-section">

            <div className="ajay-section-heading ajay-section-heading-inline">

              <div>
                <span className="ajay-section-kicker">
                  DISCOVER
                </span>

                <h2>Find people</h2>

                <p>
                  Search for users and connect
                  with your community.
                </p>
              </div>

            </div>

            <Form
              onSubmit={searchHandler}
              className="ajay-search-form"
            >

              <Form.Control
                type="text"
                placeholder="Search by username or email..."
                value={keyword}
                onChange={(e) =>
                  setKeyword(e.target.value)
                }
                className="ajay-search-input"
              />

              <Button
                type="submit"
                disabled={loading}
                className="ajay-search-button"
              >
                Search
              </Button>

            </Form>

            {loading && <Loader />}

            {Array.isArray(results) &&
              results.length > 0 && (
                <div className="ajay-search-results">

                  {results.map((result) => (
                    <div
                      key={result._id}
                      className="ajay-user-row"
                    >

                      <Link
                        to={`/profile/${result._id}`}
                        className="ajay-user-identity"
                      >

                        {result.profilePicture ? (
                          <img
                            src={getImageUrl(
                              result.profilePicture
                            )}
                            alt={
                              result.username ||
                              "User"
                            }
                            className="ajay-small-avatar"
                          />
                        ) : (
                          <div className="ajay-small-avatar ajay-small-avatar-default">
                            {result.username
                              ?.charAt(0)
                              ?.toUpperCase() ||
                              "U"}
                          </div>
                        )}

                        <div>
                          <strong>
                            {result.username}
                          </strong>

                          <span>
                            View profile
                          </span>
                        </div>

                      </Link>

                      <div className="ajay-user-actions">

                        <Button
                          onClick={() =>
                            followUser(
                              result._id
                            )
                          }
                          className="ajay-follow-button"
                        >
                          Follow
                        </Button>

                        <Button
                          onClick={() =>
                            startChartHandler(
                              result._id
                            )
                          }
                          className="ajay-chat-button"
                        >
                          Chat
                        </Button>

                      </div>

                    </div>
                  ))}

                </div>
              )}

          </section>

          {/* CONNECTIONS */}

          <section className="ajay-profile-section">

            <div className="ajay-section-heading">

              <div>
                <span className="ajay-section-kicker">
                  COMMUNITY
                </span>

                <h2>Connections</h2>

                <p>
                  People following you and people
                  you follow.
                </p>
              </div>

            </div>

            <div className="ajay-connections-grid">

              {/* FOLLOWERS */}

              <div className="ajay-connection-column">

                <div className="ajay-connection-title">
                  <h3>Followers</h3>
                  <span>
                    {followersCount}
                  </span>
                </div>

                {Array.isArray(user.followers) &&
                user.followers.length > 0 ? (
                  user.followers.map(
                    (follower, index) => {
                      const followerId =
                        follower._id ||
                        follower;

                      return (
                        <div
                          className="ajay-connection-row"
                          key={
                            followerId?.toString() ||
                            index
                          }
                        >

                          <Link
                            to={`/user/${followerId}`}
                            className="ajay-user-identity"
                          >

                            {follower.profilePicture ? (
                              <img
                                src={getImageUrl(
                                  follower.profilePicture
                                )}
                                alt={
                                  follower.username ||
                                  "Follower"
                                }
                                className="ajay-small-avatar"
                              />
                            ) : (
                              <div className="ajay-small-avatar ajay-small-avatar-default">
                                {follower.username
                                  ?.charAt(0)
                                  ?.toUpperCase() ||
                                  "U"}
                              </div>
                            )}

                            <div>
                              <strong>
                                {follower.username ||
                                  followerId}
                              </strong>
                            </div>

                          </Link>

                          <Button
                            onClick={() =>
                              followUser(
                                followerId
                              )
                            }
                            className="ajay-mini-follow"
                          >
                            Follow
                          </Button>

                        </div>
                      );
                    }
                  )
                ) : (
                  <div className="ajay-empty-state">
                    No followers yet.
                  </div>
                )}

              </div>

              {/* FOLLOWING */}

              <div className="ajay-connection-column">

                <div className="ajay-connection-title">
                  <h3>Following</h3>
                  <span>
                    {followingCount}
                  </span>
                </div>

                {Array.isArray(user.following) &&
                user.following.length > 0 ? (
                  user.following.map(
                    (following, index) => {
                      const followingId =
                        following._id ||
                        following;

                      return (
                        <div
                          className="ajay-connection-row"
                          key={
                            followingId?.toString() ||
                            index
                          }
                        >

                          <Link
                            to={`/user/${followingId}`}
                            className="ajay-user-identity"
                          >

                            {following.profilePicture ? (
                              <img
                                src={getImageUrl(
                                  following.profilePicture
                                )}
                                alt={
                                  following.username ||
                                  "Following"
                                }
                                className="ajay-small-avatar"
                              />
                            ) : (
                              <div className="ajay-small-avatar ajay-small-avatar-default">
                                {following.username
                                  ?.charAt(0)
                                  ?.toUpperCase() ||
                                  "U"}
                              </div>
                            )}

                            <div>
                              <strong>
                                {following.username ||
                                  followingId}
                              </strong>
                            </div>

                          </Link>

                          <Button
                            onClick={() =>
                              unfollowUser(
                                followingId
                              )
                            }
                            className="ajay-mini-unfollow"
                          >
                            Unfollow
                          </Button>

                        </div>
                      );
                    }
                  )
                ) : (
                  <div className="ajay-empty-state">
                    Not following anyone yet.
                  </div>
                )}

              </div>

            </div>

          </section>

          {/* YOUR POSTS */}

          <section className="ajay-profile-section">

            <div className="ajay-section-heading ajay-post-heading">

              <div>
                <span className="ajay-section-kicker">
                  YOUR CONTENT
                </span>

                <h2>Your posts</h2>

                <p>
                  Photos and posts you've shared
                  with the community.
                </p>
              </div>

              <strong className="ajay-post-count">
                {postsCount}
              </strong>

            </div>

            {Array.isArray(userPosts) &&
            userPosts.length > 0 ? (

              <div className="ajay-post-grid">

                {userPosts.map((post) => (
                  <div
                    key={post._id}
                    className="ajay-post-item"
                  >

                    {post.image ? (
                      <Link
                        to={`/post/${post._id}`}
                      >
                        <img
                          src={getImageUrl(
                            post.image
                          )}
                          alt="Post"
                          className="ajay-post-image"
                        />
                      </Link>
                    ) : (
                      <div className="ajay-text-post">
                        <span>✦</span>
                        <small>
                          Text Post
                        </small>
                      </div>
                    )}

                  </div>
                ))}

              </div>

            ) : (

              <div className="ajay-no-posts">
                <div className="ajay-no-posts-icon">
                  +
                </div>

                <h3>No posts yet</h3>

                <p>
                  Start sharing something
                  with your community.
                </p>

              </div>

            )}

          </section>

        </main>

      </div>

    </div>
  );
}

export default Profile;