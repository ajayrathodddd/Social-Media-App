import React, { useState, useEffect, useRef } from "react";
import { Form, Button } from "react-bootstrap";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";
import Loader from "../Loader";
import Message from "../Message";
import "./Chat.css";

const ENDPOINT = "https://social-media-backend-fwgu.onrender.com";
const DEFAULT_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Ccircle cx='25' cy='25' r='25' fill='%23dee2e6'/%3E%3Ccircle cx='25' cy='19' r='8' fill='%236c757d'/%3E%3Cpath d='M10 43c2-9 8-14 15-14s13 5 15 14' fill='%236c757d'/%3E%3C/svg%3E";

const getImageUrl = (image) => {
  if (!image) return DEFAULT_AVATAR;

  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  return `${ENDPOINT}/${image.replace(/^\/+/, "")}`;
};

function Chat() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [messageContent, setMessageContent] = useState("");
  const socketRef = useRef(null);

  useEffect(() => {
    if (!chatId) return undefined;

    const socket = io(ENDPOINT, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      setError(null);
      socket.emit("joinChat", chatId);
    });

    socket.on("connect_error", (socketError) => {
      console.error("Socket connection error:", socketError.message);
      setError(
        "Real-time chat connection failed. Please refresh and try again.",
      );
    });

    socket.on("receiveMessage", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("receiveMessage");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [chatId]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);

        const userInfo = JSON.parse(localStorage.getItem("userInfo"));

        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };

        const { data } = await axios.get(`/api/chat/${chatId}`, config);

        setMessages(Array.isArray(data) ? data : []);
      } catch (error) {
        setError(error.response?.data?.message || error.message);
      } finally {
        setLoading(false);
      }
    };

    if (chatId) {
      fetchMessages();
    }
  }, [chatId]);

  const submitMessageHandler = async (e) => {
    e.preventDefault();

    if (!messageContent.trim()) return;

    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.post(
        `/api/chat/${chatId}/message`,
        {
          content: messageContent.trim(),
        },
        config,
      );

      const lastMessage = data.messages?.[data.messages.length - 1];

      const socket = socketRef.current;

      if (lastMessage && socket?.connected) {
        socket.emit("sendMessage", {
          chatId,
          content: lastMessage.content,
        });
      }

      setMessageContent("");
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    }
  };

  return (
    <div className="professional-chat-page">
      <div className="professional-chat-container">
        {/* Chat Header */}
        <div className="professional-chat-header">
          <div>
            <span className="chat-header-label">MESSAGES</span>

            <h2>Chat</h2>

            <p>Stay connected with your community.</p>
          </div>

          <div className="chat-header-icon">💬</div>
        </div>

        {/* Chat Card */}
        <div className="professional-chat-card">
          {/* Messages */}
          <div className="chat-messages-area">
            {loading ? (
              <div className="chat-loading">
                <Loader />
              </div>
            ) : error ? (
              <Message variant="danger">{error}</Message>
            ) : messages?.length > 0 ? (
              <div className="chat-message-list">
                {messages.map((message, index) => (
                  <div
                    className="chat-message-row"
                    key={message._id || `${message.content}-${index}`}
                  >
                    <div className="chat-message-avatar">
                      <img
                        src={getImageUrl(message?.sender?.profilePicture)}
                        alt={message?.sender?.username || "User"}
                        onError={(event) => {
                          event.currentTarget.src = DEFAULT_AVATAR;
                        }}
                      />
                    </div>

                    {/* Message */}
                    <div className="chat-message-content">
                      <strong>{message?.sender?.username || "User"}</strong>

                      <div className="chat-message-bubble">
                        {message?.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="chat-empty">
                <div className="chat-empty-icon">💬</div>

                <h3>No messages yet</h3>

                <p>Start the conversation by sending a message.</p>
              </div>
            )}
          </div>

          {/* Message Input */}
          <Form
            onSubmit={submitMessageHandler}
            className="professional-chat-form"
          >
            <Form.Group className="chat-input-group">
              <Form.Control
                type="text"
                placeholder="Type a message..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
              />

              <Button type="submit" className="chat-send-button">
                Send
              </Button>
            </Form.Group>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default Chat;
