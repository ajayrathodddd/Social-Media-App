import React, { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Message from "../Message";
import Loader from "../Loader";
import "./Chat.css";

const BACKEND_URL = "https://social-media-backend-fwgu.onrender.com";

const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Ccircle cx='25' cy='25' r='25' fill='%23dee2e6'/%3E%3Ccircle cx='25' cy='19' r='8' fill='%236c757d'/%3E%3Cpath d='M10 43c2-9 8-14 15-14s13 5 15 14' fill='%236c757d'/%3E%3C/svg%3E";

const getImageUrl = (image) => {
  if (!image) return DEFAULT_AVATAR;

  if (/^https?:\/\//i.test(image)) {
    if (
      image.includes(
        "social-media-app-frontend-tuie.onrender.com/uploads/"
      )
    ) {
      return image.replace(
        "https://social-media-app-frontend-tuie.onrender.com",
        BACKEND_URL
      );
    }

    return image;
  }

  const normalizedImage = image.replace(/\\/g, "/");

  const uploadsIndex = normalizedImage.indexOf("/uploads/");

  const uploadPath =
    uploadsIndex >= 0
      ? normalizedImage.slice(uploadsIndex)
      : `/${normalizedImage.replace(/^\/+/, "")}`;

  return `${BACKEND_URL}${uploadPath}`;
};

function ChatList() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        setError(null);

        const userInfo = JSON.parse(localStorage.getItem("userInfo"));

        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };

        const { data } = await axios.get("/api/chat", config);

        setChats(Array.isArray(data) ? data : []);
      } catch (error) {
        setError(
          error.response?.data?.message || error.message
        );
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  return (
    <div className="professional-chat-page">
      <div className="professional-chat-container">

        {/* Page Header */}
        <div className="professional-chat-header">
          <div>
            <span className="chat-header-label">
              MESSAGES
            </span>

            <h2>Chat Users</h2>

            <p>
              Connect with people and continue your conversations.
            </p>
          </div>

          <div className="chat-header-icon">
            💬
          </div>
        </div>

        {/* Users Card */}
        <div className="chat-users-card">

          {loading ? (
            <div className="chat-loading">
              <Loader />
            </div>
          ) : error ? (
            <div className="chat-list-error">
              <Message variant="danger">
                {error}
              </Message>
            </div>
          ) : chats.length === 0 ? (
            <div className="chat-users-empty">

              <div className="chat-empty-icon">
                💬
              </div>

              <h3>No conversations yet</h3>

              <p>
                Start a conversation with someone from your community.
              </p>

            </div>
          ) : (
            <div className="chat-users-list">

              {chats.map((chat) => (
                <div
                  className="chat-user-card"
                  key={chat._id}
                >

                  <div className="chat-user-info">

                    {chat.users.map((user) => (
                      <div
                        key={user._id}
                        className="chat-user"
                      >

                        <div className="chat-user-avatar-wrapper">

                          <img
                            src={getImageUrl(
                              user.profilePicture
                            )}
                            alt={
                              user.username || "User"
                            }
                            className="chat-user-avatar"
                            onError={(event) => {
                              event.currentTarget.src =
                                DEFAULT_AVATAR;
                            }}
                          />

                          <span className="chat-online-dot"></span>

                        </div>

                        <div className="chat-user-details">

                          <h4>
                            {user.username}
                          </h4>

                          <span>
                            Conversation
                          </span>

                        </div>

                      </div>
                    ))}

                  </div>

                  <Button
                    className="chat-open-button"
                    onClick={() =>
                      navigate(`/chat/${chat._id}`)
                    }
                  >
                    Open Chat
                    <i className="fa-solid fa-arrow-right"></i>
                  </Button>

                </div>
              ))}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default ChatList;