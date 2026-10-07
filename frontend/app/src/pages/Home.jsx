
import React, { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import PostForm from "../components/Posts/PostForm";
import PostList from "../components/Posts/PostList";
import UserSearch from "../components/UserSearch";

function Home() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [posts, setPosts] = useState([]);

  // Start a chat with another user
  const startChatHandler = async (userId) => {
    try {
      setLoading(true);
      setError(null);

      const userInfo = JSON.parse(localStorage.getItem("userInfo"));

      if (!userInfo || !userInfo.token) {
        navigate("/login");
        return;
      }

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

  // Fetch all posts
  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const userInfo = JSON.parse(localStorage.getItem("userInfo"));

      if (!userInfo || !userInfo.token) {
        navigate("/login");
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.get("/api/posts", config);

      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to load posts"
      );
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Check login and load posts
  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo");

    if (!userInfo) {
      navigate("/login");
      return;
    }

    fetchPosts();
  }, [navigate]);

  return (
    <div className="social-home">
      <Container fluid className="px-3 px-md-4">
        {/* Page heading */}
        <div className="social-welcome text-center mb-4">
          <h1 className="social-title">Social Feed</h1>
          <p className="social-subtitle">
            Connect, share and discover what your community is posting.
          </p>
        </div>

        {loading && (
          <div className="social-loading">
            <div className="spinner-border" role="status"></div>
            <span>Loading your feed...</span>
          </div>
        )}

        {error && (
          <div className="alert alert-danger shadow-sm rounded-4 mt-3">
            {error}
          </div>
        )}

        <Row className="g-4 align-items-start">
          {/* Left sidebar */}
          <Col lg={3} md={4}>
            <div className="social-sidebar-card">
              <div className="sidebar-heading">
                <span className="sidebar-icon">🔎</span>
                <div>
                  <h5>Find People</h5>
                  <p>Discover users and start a conversation.</p>
                </div>
              </div>

              <UserSearch />
            </div>
          </Col>

          {/* Main feed */}
          <Col lg={6} md={8}>
            <div className="feed-column">
              {/* Create post section */}
              <div className="create-post-card">
                <div className="section-heading">
                  <div>
                    <h3>Share something</h3>
                    <p>Create a new post for your community.</p>
                  </div>
                  <span className="post-icon">✦</span>
                </div>

                <PostForm fetchPosts={fetchPosts} />
              </div>

              {/* Feed */}
              <div className="feed-header">
                <div>
                  <h3>Latest Posts</h3>
                  <p>See what's happening in your community.</p>
                </div>
              </div>

              <div className="posts-container">
                <PostList
                  posts={Array.isArray(posts) ? posts : []}
                  fetchPosts={fetchPosts}
                  startChartHandler={startChatHandler}
                />
              </div>
            </div>
          </Col>

          {/* Right sidebar */}
          <Col lg={3} className="d-none d-lg-block">
            <div className="social-info-card">
              <div className="info-icon">💬</div>
              <h5>Stay Connected</h5>
              <p>
                Find people, share posts and chat with your community.
              </p>

              <div className="info-item">
                <span>✓</span>
                <span>Share your moments</span>
              </div>

              <div className="info-item">
                <span>✓</span>
                <span>Connect with users</span>
              </div>

              <div className="info-item">
                <span>✓</span>
                <span>Join conversations</span>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Home;

