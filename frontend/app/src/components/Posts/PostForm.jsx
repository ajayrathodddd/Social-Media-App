import React, { useState, useRef } from "react";
import { Form, Button } from "react-bootstrap";
import axios from "axios";
import Loader from "../Loader";
import Message from "../Message";

function PostForm({ fetchPosts }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);

  // File input DOM reference to reset file selection UI
  const fileInputRef = useRef(null);

  const submitHandler = async (e) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("content", content);
    if (image) {
      formData.append("image", image);
    }

    try {
      setLoading(true);
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));

      if (!userInfo || !userInfo.token) {
        throw new Error("You must be logged in to create a post.");
      }

      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.post(
        "https://social-media-backend-fwgu.onrender.com/api/posts",
        formData,
        config
      );

      if (image && !data.image) {
        throw new Error("The image was not saved. Please try again.");
      }

      // Reset state and file input UI
      setContent("");
      setImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Refresh parent post feed
      if (fetchPosts) {
        fetchPosts();
      }

      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(
        err.response && err.response.data.message
          ? err.response.data.message
          : err.message
      );
    }
  };

  return (
    <>
      {error && (
        <Message variant="danger" onClose={() => setError(null)}>
          {error}
        </Message>
      )}

      <Form onSubmit={submitHandler}>
        <Form.Group controlId="content">
          <Form.Control
            type="text"
            placeholder="Post something..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group controlId="image" className="mt-3">
          <Form.Control
            ref={fileInputRef}
            type="file"
            onChange={(e) => setImage(e.target.files[0])}
          />
        </Form.Group>

        <Button
          type="submit"
          variant="primary"
          className="mt-3"
          disabled={loading}
        >
          {loading ? <Loader size="sm" /> : "Post"}{" "}
          <i className="fa-solid fa-upload"></i>
        </Button>
      </Form>
    </>
  );
}

export default PostForm;