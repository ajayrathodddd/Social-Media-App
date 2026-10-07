import React, { useState } from "react";
import { Form } from "react-bootstrap";
import axios from "axios";
import Loader from "../Loader";
import Message from "../Message";

const getImageUrl = (image) => {
  if (!image) return "";

  // Cloudinary or any complete URL
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
    /^\/+/,
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
    const userInfo = JSON.parse(
      localStorage.getItem("userInfo")
    );

    return {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
  };

  // =========================
  // LIKE / UNLIKE
  // =========================

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
        error.response?.data?.message ||
          error.message
      );
    }
  };

  // =========================
  // SHARE POST
  // =========================

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

  // =========================
  // ADD COMMENT
  // =========================

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
        error.response?.data?.message ||
          error.message
      );
    }
  };

  // =========================
  // DELETE POST
  // =========================

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
        error.response?.data?.message ||
          error.message
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
        <div className="social-post-feed">
          {posts?.map((post) => {
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

            const commentCount =
              post.comments?.length || 0;

            /*
             * IMPORTANT:
             * Profile image and post image are completely separate.
             */
            const profileImage =
              post.user?.profilePicture
                ? getImageUrl(post.user.profilePicture)
                : "https://via.placeholder.com/50";

            return (
              <article
                key={post._id}
                className="premium-post-card"
              >
                {/* =========================
                    POST HEADER
                ========================= */}

                <div className="premium-post-header">
                  <div
                    className="premium-user"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      minWidth: 0,
                    }}
                  >
                    {/* PROFILE PHOTO
                        This is ALWAYS small.
                    */}
                    <img
                      src={profileImage}
                      alt={
                        post.user?.username || "User"
                      }
                      className="premium-avatar"
                      style={{
                        width: "48px",
                        height: "48px",
                        minWidth: "48px",
                        minHeight: "48px",
                        maxWidth: "48px",
                        maxHeight: "48px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        display: "block",
                        flexShrink: 0,
                      }}
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://via.placeholder.com/50";
                      }}
                    />

                    <div className="premium-user-details">
                      <h6>
                        {post.user?.username ||
                          "User"}
                      </h6>

                      <span>
                        {post.createdAt
                          ? new Date(
                              post.createdAt
                            ).toLocaleString()
                          : "Recently"}
                      </span>
                    </div>
                  </div>

                  <div className="premium-header-actions">
                    {/* CHAT */}

                    {startChartHandler &&
                      post.user?._id && (
                        <button
                          type="button"
                          className="premium-small-button"
                          onClick={() =>
                            startChartHandler(
                              post.user._id
                            )
                          }
                          title="Start chat"
                        >
                          <span className="premium-symbol">
                            💬
                          </span>
                        </button>
                      )}

                    {/* DELETE */}

                    {isOwner && (
                      <button
                        type="button"
                        className="premium-small-button delete-button"
                        onClick={() =>
                          deletePostHandler(post._id)
                        }
                        title="Delete post"
                      >
                        <span className="premium-symbol">
                          🗑
                        </span>
                      </button>
                    )}

                    {/* MORE */}

                    {!isOwner && (
                      <button
                        type="button"
                        className="premium-small-button"
                        title="More options"
                      >
                        <span className="premium-more">
                          •••
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* =========================
                    POST TEXT
                ========================= */}

                {post.content && (
                  <div className="premium-post-text">
                    {post.content}
                  </div>
                )}

                {/* =========================
                    ACTUAL POST IMAGE
                ========================= */}

                {post.image && (
                  <div className="premium-image-container">
                    <img
                      src={getImageUrl(post.image)}
                      alt="Post"
                      className="premium-post-image"
                      onError={(e) => {
                        console.error(
                          "Post image failed to load:",
                          post.image
                        );
                      }}
                    />
                  </div>
                )}

                {/* =========================
                    ENGAGEMENT SUMMARY
                ========================= */}

                <div className="premium-engagement">
                  <div className="engagement-left">
                    {likeCount > 0 && (
                      <>
                        <span className="like-circle">
                          <span>♥</span>
                        </span>

                        <span>
                          {likeCount}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="engagement-right">
                    {commentCount > 0 && (
                      <span>
                        {commentCount}{" "}
                        {commentCount === 1
                          ? "comment"
                          : "comments"}
                      </span>
                    )}
                  </div>
                </div>

                {/* =========================
                    ACTION BUTTONS
                ========================= */}

                <div className="premium-actions">
                  {/* LIKE */}

                  <button
                    type="button"
                    className={`premium-action ${
                      isLiked
                        ? "premium-liked"
                        : ""
                    }`}
                    onClick={() =>
                      toggleLikeHandler(post._id)
                    }
                  >
                    <span className="premium-action-icon">
                      {isLiked ? "♥" : "♡"}
                    </span>

                    <span>Like</span>
                  </button>

                  {/* COMMENT */}

                  <button
                    type="button"
                    className="premium-action"
                    onClick={() =>
                      document
                        .getElementById(
                          `comment-${post._id}`
                        )
                        ?.focus()
                    }
                  >
                    <span className="premium-action-icon">
                      💬
                    </span>

                    <span>Comment</span>
                  </button>

                  {/* SHARE */}

                  <button
                    type="button"
                    className="premium-action"
                    onClick={() =>
                      sharePostHandler(post._id)
                    }
                  >
                    <span className="premium-action-icon">
                      ↗
                    </span>

                    <span>Share</span>
                  </button>
                </div>

                {/* =========================
                    COMMENTS
                ========================= */}

                <div className="premium-comments">
                  <div className="premium-comment-title">
                    <span className="comment-title-icon">
                      💬
                    </span>

                    <span>Comments</span>
                  </div>

                  {/* COMMENT INPUT */}

                  <Form
                    className="premium-comment-form"
                    onSubmit={(e) => {
                      e.preventDefault();

                      if (
                        !commentContent[
                          post._id
                        ]?.trim()
                      ) {
                        return;
                      }

                      submitCommentHandler(
                        post._id
                      );
                    }}
                  >
                    {/* Current user's profile photo */}

                    <img
                      src={
                        currentUser?.profilePicture
                          ? getImageUrl(
                              currentUser.profilePicture
                            )
                          : "https://via.placeholder.com/35"
                      }
                      alt="You"
                      className="comment-user-avatar"
                      style={{
                        width: "36px",
                        height: "36px",
                        minWidth: "36px",
                        minHeight: "36px",
                        maxWidth: "36px",
                        maxHeight: "36px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />

                    <div className="comment-input-wrapper">
                      <Form.Control
                        id={`comment-${post._id}`}
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

                      <button
                        type="submit"
                        className="comment-send-button"
                        title="Send comment"
                      >
                        ➤
                      </button>
                    </div>
                  </Form>

                  {/* EXISTING COMMENTS */}

                  {post.comments?.length > 0 && (
                    <div className="premium-comment-list">
                      {post.comments.map(
                        (comment) => (
                          <div
                            key={comment._id}
                            className="premium-comment-item"
                          >
                            <div className="comment-letter">
                              {comment.user?.username
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                "U"}
                            </div>

                            <div className="comment-bubble">
                              <strong>
                                {comment.user
                                  ?.username ||
                                  "User"}
                              </strong>

                              <p>
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

export default PostList;