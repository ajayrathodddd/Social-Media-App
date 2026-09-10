
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

      // Make sure posts is always an array
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
    <Container>
      {loading && (
        <div className="text-center mt-3">
          Loading...
        </div>
      )}

      {error && (
        <div className="alert alert-danger mt-3">
          {error}
        </div>
      )}

      <Row>
        {/* Left sidebar */}
        <Col md={3}>
          <UserSearch />
        </Col>

        {/* Main content */}
        <Col md={6}>
          <h3 className="text-center bg-light text-dark mt-2 p-2">
            Upload Posts
          </h3>

          <PostForm fetchPosts={fetchPosts} />

          <hr />

          <PostList
            posts={Array.isArray(posts) ? posts : []}
            fetchPosts={fetchPosts}
            startChartHandler={startChatHandler}
          />
        </Col>

        {/* Right sidebar */}
        <Col md={3}></Col>
      </Row>
    </Container>
  );
}

export default Home;

