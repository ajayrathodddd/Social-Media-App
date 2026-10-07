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
        "http://localhost:5000/api/posts",
        formData,
        config,
      );

      // Make sure the backend returned the image URL
      if (image && !data.image) {
        throw new Error("The image was not uploaded. Please try again.");
      }

      // Reset form
      setContent("");
      setImage(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Refresh posts
      if (fetchPosts) {
        fetchPosts();
      }
      

      setLoading(false);
    } catch (err) {
      setLoading(false);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Something went wrong while creating the post.",
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
            accept="image/jpeg,image/jpg,image/png"
            onChange={(e) => {
              setImage(e.target.files[0]);
            }}
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
