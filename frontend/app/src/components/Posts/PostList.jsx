import React, { useState } from "react";
import { Card, Button, Form } from "react-bootstrap";
import axios from "axios";
import Loader from "../Loader";
import Message from "../Message";

const getImageUrl = (image) => {
  if (!image) return "";
  if (/^https?:\/\//i.test(image)) return image;

  const normalizedImage = image.replace(/\\/g, "/");
  const uploadsIndex = normalizedImage.indexOf("/uploads/");
  const uploadPath = uploadsIndex >= 0
    ? normalizedImage.slice(uploadsIndex)
    : `/${normalizedImage.replace(/^\//, "")}`;

  return `https://social-media-backend-fwgu.onrender.com${uploadPath}`;
};

function PostList({ posts, fetchPosts ,startChartHandler}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const handleClose = () => setMessage("");
  const [commentContent, setCommentContent] = useState({});
  const [likeState, setLikeState] = useState({});

  const getConfig = () => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    return {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
  };

  const toggleLikeHandler = async (postId) => {
    try {
      const { data } = await axios.post(`/api/posts/${postId}/like`, {}, getConfig());
      setLikeState((current) => ({
        ...current,
        [postId]: { liked: data.liked, count: data.likes },
      }));
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    }
  };

  const sharePostHandler = async (postId) => {
    const shareUrl = `${window.location.origin}/post/${postId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Social Media post", url: shareUrl });
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

  const submitCommentHandler = async (postId) => {
    try {
      setLoading(true);
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      await axios.post(
        `/api/posts/${postId}/comments`,
        { content: commentContent[postId] },
        config
      );
      setCommentContent({ ...commentContent, [postId]: "" });
      fetchPosts();
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  };
  const deletePostHandler = async (postId) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        setLoading(true);
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        const config = {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userInfo.token}`,
          },
        };

        await axios.delete(
          `/api/posts/${postId}`,

          config
        );

        fetchPosts();
        setLoading(false);
      } catch (error) {
        setLoading(false);
        setError(
          error.response && error.response.data.message
            ? error.response.data.message
            : error.message
        );
      }
    }
  };

  return (
    <>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger" onClose={() => setError(null)}>
          {error}
        </Message>
      ) : (
        posts?.map((post) => {
          const currentUser = JSON.parse(localStorage.getItem("userInfo") || "null");
          const isOwner = post.user?._id?.toString() === currentUser?._id?.toString();
          const currentLikeState = likeState[post._id];
          const likeCount = currentLikeState?.count ?? post.likes?.length ?? 0;
          const isLiked = currentLikeState?.liked ?? post.likes?.some(
            (userId) => userId.toString() === currentUser?._id?.toString()
          );

          return (
            <Card key={post._id} className="my-3">
              <Card.Body>
                <Card.Title>
                  <div className="d-flex align-items-center">
                    <img
                      src={
                        post.user.profilePicture ||
                        "https://via.placeholder.com/50"
                      }
                      alt={post.user.username}
                      className="rounded-circle me-2"
                      style={{
                        width: "40px",
                        height: "40px",
                        objectFit: "cover",
                      }}
                    />
                    <span>{post.user.username}</span>
                    {isOwner && (
                      <Button
                        variant="danger"
                        className="btn-sm position-absolute top-0 end-0 m-2  btn-outline"
                        onClick={() => deletePostHandler(post._id)}
                      >
                        <i className="fa-solid fa-trash"></i>
                      </Button>
                    )}

<Button variant="light" onClick={()=>startChartHandler(post.user._id)}>Chat</Button>
                  </div>
                </Card.Title>
                <Card.Text>{post.content}</Card.Text>
                <Card.Text>
                  <small className="text-body-secondary">
                    Posted at : {post.createdAt}
                  </small>
                </Card.Text>

                {post?.image && (
                  <Card.Img
                    variant="top"
                    src={getImageUrl(post.image)}
                    alt="Post image"
                    className="card-img-top"
                    style={{
                      width: "300px",
                      height: "300px",
                      objectFit: "cover",
                    }}
                  />
                )}

              </Card.Body>

              <Card.Footer className="d-flex gap-2">
                <Button
                  variant={isLiked ? "danger" : "outline-danger"}
                  size="sm"
                  onClick={() => toggleLikeHandler(post._id)}
                >
                  {isLiked ? "Unlike" : "Like"} ({likeCount})
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => sharePostHandler(post._id)}
                >
                  Share
                </Button>
              </Card.Footer>
              
              <div
                className="accordion accordion-flush"
                id={`accordionFlushExample-${post._id}`}
              >
                <div className="accordion-item">
                  <h2 className="accordion-header">
                    <button
                      className="accordion-button collapsed"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target={`#flush-collapseOne-${post._id}`}
                      aria-expanded="false"
                      aria-controls={`flush-collapseOne-${post._id}`}
                    >
                      Comments . <i className="fa-solid fa-comment ml-3"></i>
                    </button>
                  </h2>
                  <div
                    id={`flush-collapseOne-${post._id}`}
                    className="accordion-collapse collapse"
                    data-bs-parent={`#accordionFlushExample-${post._id}`}
                  >
                    <div className="accordion-body">
                      <Form
                        onSubmit={(e) => {
                          e.preventDefault();
                          submitCommentHandler(post._id);
                        }}
                      >
                        <Form.Group controlId={`commentContent-${post._id}`}>
                          <Form.Control
                            type="text"
                            placeholder="Write a comment..."
                            value={commentContent[post._id] || ""}
                            onChange={(e) =>
                              setCommentContent({
                                ...commentContent,
                                [post._id]: e.target.value,
                              })
                            }
                          ></Form.Control>
                        </Form.Group>
                        <Button
                          type="submit"
                          variant="primary"
                          className="mt-2 btn-sm"
                        >
                          Comment
                        </Button>
                      </Form>

                      <Card.Text className="mt-2">
                        {post.comments?.map((comment) => (
                          <div key={comment._id}>
                            <strong>{comment.user.username}</strong>
                            <p>{comment.content}</p>
                          </div>
                        ))}
                      </Card.Text>
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
