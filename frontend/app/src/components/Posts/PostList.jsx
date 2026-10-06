import React, { useState } from "react";
import { Card, Button, Form } from "react-bootstrap";
import axios from "axios";
import Loader from "../Loader";
import Message from "../Message";

const getImageUrl = (image) => {
  if (!image) return "";

  // Cloudinary or any other complete URL
  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  // Support old local upload paths
  const normalizedImage = image.replace(/\\/g, "/");

  const uploadsIndex = normalizedImage.indexOf("/uploads/");

  if (uploadsIndex >= 0) {
    const uploadPath = normalizedImage.slice(uploadsIndex);

    return `https://social-media-backend-fwgu.onrender.com${uploadPath}`;
  }

  return `https://social-media-backend-fwgu.onrender.com/${normalizedImage.replace(
    /^\//,
    ""
  )}`;
};

function PostList({ posts, fetchPosts, startChartHandler }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [commentContent, setCommentContent] = useState({});
  const [likeState, setLikeState] = useState({});

  const handleClose = () => setMessage("");

  const getConfig = () => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));

    return {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
  };

  // Like / Unlike
  const toggleLikeHandler = async (postId) => {
    try {
      const { data } = await axios.post(
        `/api/posts/${postId}/like`,
        {},
        getConfig()
      );

      setLikeState((current) => ({
        ...current,
        [postId]: {
          liked: data.liked,
          count: data.likes,
        },
      }));
    } catch (error) {
      setError(
        error.response?.data?.message || error.message
      );
    }
  };

  // Share post
  const sharePostHandler = async (postId) => {
    const shareUrl = `${window.location.origin}/post/${postId}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Social Media Post",
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setMessage("Post link copied");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        setError("Unable to share this post");
      }
    }
  };

  // Add comment
  const submitCommentHandler = async (postId) => {
    try {
      setLoading(true);

      const userInfo = JSON.parse(
        localStorage.getItem("userInfo")
      );

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      await axios.post(
        `/api/posts/${postId}/comments`,
        {
          content: commentContent[postId],
        },
        config
      );

      setCommentContent({
        ...commentContent,
        [postId]: "",
      });

      await fetchPosts();

      setLoading(false);
    } catch (error) {
      setLoading(false);

      setError(
        error.response?.data?.message || error.message
      );
    }
  };

  // Delete post
  const deletePostHandler = async (postId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this post?"
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      const userInfo = JSON.parse(
        localStorage.getItem("userInfo")
      );

      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      await axios.delete(
        `/api/posts/${postId}`,
        config
      );

      await fetchPosts();

      setLoading(false);
    } catch (error) {
      setLoading(false);

      setError(
        error.response?.data?.message || error.message
      );
    }
  };

  return (
    <>
      {message && (
        <Message
          variant="success"
          onClose={handleClose}
        >
          {message}
        </Message>
      )}

      {loading ? (
        <Loader />
      ) : error ? (
        <Message
          variant="danger"
          onClose={() => setError(null)}
        >
          {error}
        </Message>
      ) : (
        posts?.map((post) => {
          const currentUser = JSON.parse(
            localStorage.getItem("userInfo") || "null"
          );

          const isOwner =
            post.user?._id?.toString() ===
            currentUser?._id?.toString();

          const currentLikeState =
            likeState[post._id];

          const likeCount =
            currentLikeState?.count ??
            post.likes?.length ??
            0;

          const isLiked =
            currentLikeState?.liked ??
            post.likes?.some(
              (userId) =>
                userId.toString() ===
                currentUser?._id?.toString()
            );

          return (
            <Card
              key={post._id}
              className="my-3 shadow-sm"
            >
              {/* Post Header */}
              <Card.Body>
                <div className="d-flex align-items-center position-relative">
                  <img
                    src={
                      post.user?.profilePicture ||
                      "https://via.placeholder.com/50"
                    }
                    alt={
                      post.user?.username || "User"
                    }
                    className="rounded-circle me-2"
                    style={{
                      width: "40px",
                      height: "40px",
                      objectFit: "cover",
                    }}
                  />

                  <strong>
                    {post.user?.username || "User"}
                  </strong>

                  {isOwner && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="ms-auto"
                      onClick={() =>
                        deletePostHandler(post._id)
                      }
                    >
                      <i className="fa-solid fa-trash"></i>
                    </Button>
                  )}

                  {startChartHandler &&
                    post.user?._id && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="ms-2"
                        onClick={() =>
                          startChartHandler(
                            post.user._id
                          )
                        }
                      >
                        Chat
                      </Button>
                    )}
                </div>

                {/* Post Content */}
                <Card.Text className="mt-3">
                  {post.content}
                </Card.Text>

                {/* Post Image */}
                {post.image && (
                  <div className="text-center mt-3">
                    <img
                      src={getImageUrl(post.image)}
                      alt="Post"
                      className="img-fluid rounded"
                      style={{
                        width: "100%",
                        maxWidth: "600px",
                        maxHeight: "600px",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        console.error(
                          "Image failed to load:",
                          post.image
                        );
                      }}
                    />
                  </div>
                )}

                {/* Date */}
                <div className="mt-3">
                  <small className="text-muted">
                    Posted at:{" "}
                    {post.createdAt
                      ? new Date(
                          post.createdAt
                        ).toLocaleString()
                      : "Unknown"}
                  </small>
                </div>
              </Card.Body>

              {/* Actions */}
              <Card.Footer className="d-flex gap-2">
                <Button
                  variant={
                    isLiked
                      ? "danger"
                      : "outline-danger"
                  }
                  size="sm"
                  onClick={() =>
                    toggleLikeHandler(post._id)
                  }
                >
                  {isLiked ? "Unlike" : "Like"} (
                  {likeCount})
                </Button>

                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() =>
                    sharePostHandler(post._id)
                  }
                >
                  Share
                </Button>
              </Card.Footer>

              {/* Comments */}
              <div
                className="accordion accordion-flush"
                id={`accordion-${post._id}`}
              >
                <div className="accordion-item">
                  <h2 className="accordion-header">
                    <button
                      className="accordion-button collapsed"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target={`#comments-${post._id}`}
                      aria-expanded="false"
                      aria-controls={`comments-${post._id}`}
                    >
                      Comments{" "}
                      <i className="fa-solid fa-comment ms-2"></i>
                    </button>
                  </h2>

                  <div
                    id={`comments-${post._id}`}
                    className="accordion-collapse collapse"
                    data-bs-parent={`#accordion-${post._id}`}
                  >
                    <div className="accordion-body">
                      {/* Comment Form */}
                      <Form
                        onSubmit={(e) => {
                          e.preventDefault();
                          submitCommentHandler(
                            post._id
                          );
                        }}
                      >
                        <Form.Group
                          controlId={`comment-${post._id}`}
                        >
                          <Form.Control
                            type="text"
                            placeholder="Write a comment..."
                            value={
                              commentContent[
                                post._id
                              ] || ""
                            }
                            onChange={(e) =>
                              setCommentContent({
                                ...commentContent,
                                [post._id]:
                                  e.target.value,
                              })
                            }
                          />
                        </Form.Group>

                        <Button
                          type="submit"
                          variant="primary"
                          size="sm"
                          className="mt-2"
                        >
                          Comment
                        </Button>
                      </Form>

                      {/* Existing Comments */}
                      <div className="mt-3">
                        {post.comments?.map(
                          (comment) => (
                            <div
                              key={comment._id}
                              className="mb-3"
                            >
                              <strong>
                                {
                                  comment.user
                                    ?.username
                                }
                              </strong>

                              <p className="mb-0">
                                {comment.content}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })
      )}
    </>
  );
}

export default PostList;