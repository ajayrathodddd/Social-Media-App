import React, { useEffect, useState } from "react";
import { ListGroup, Button } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Message from "../Message";
import Loader from "../Loader";

const BACKEND_URL = "https://social-media-backend-fwgu.onrender.com";
const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Ccircle cx='25' cy='25' r='25' fill='%23dee2e6'/%3E%3Ccircle cx='25' cy='19' r='8' fill='%236c757d'/%3E%3Cpath d='M10 43c2-9 8-14 15-14s13 5 15 14' fill='%236c757d'/%3E%3C/svg%3E";

const getImageUrl = (image) => {
  if (!image) return DEFAULT_AVATAR;
  if (/^https?:\/\//i.test(image)) {
    if (image.includes("social-media-app-frontend-tuie.onrender.com/uploads/")) {
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
      : `/${normalizedImage.replace(/^\//, "")}`;

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
    <>
      <br />
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <>
          <h5>Chat Users</h5>
          <hr />
          <ListGroup>
            {chats.map((chat) => (
              <ListGroup.Item key={chat._id}>
                <div className="d-flex align-items-center">
                  {chat.users.map((user) => (
                    <div
                      key={user._id}
                      className="d-flex align-items-center me-3"
                    >
                      <img
                        src={getImageUrl(user.profilePicture)}
                        alt={user.username || "User"}
                        className="rounded-circle me-2"
                        style={{
                          width: "40px",
                          height: "40px",
                          objectFit: "cover",
                        }}
                        onError={(event) => {
                          event.currentTarget.src = DEFAULT_AVATAR;
                        }}
                      />
                      <span>{user.username}</span>
                    </div>
                  ))}
                  <Button
                    variant="link"
                    className="ms-auto"
                    onClick={() => navigate(`/chat/${chat._id}`)}
                  >
                    Open <i className="fa-solid fa-comments"></i> Chat
                  </Button>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </>
      )}
    </>
  );
}

export default ChatList;
