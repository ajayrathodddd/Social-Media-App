import React, { useState, useEffect, useRef } from "react";
import { Form, Button, ListGroup } from "react-bootstrap";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";
import Loader from "../Loader";
import Message from "../Message";

const ENDPOINT = "https://social-media-backend-fwgu.onrender.com";

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
      setError("Real-time chat connection failed. Please refresh and try again.");
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
        { content: messageContent.trim() },
        config
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
    <div className="mt-3">
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <ListGroup>
          {messages?.map((message, index) => (
            <ListGroup.Item key={message._id || `${message.content}-${index}`}>
              <strong>{message?.sender?.username || "User"}</strong> : {message?.content}
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}

      <Form onSubmit={submitMessageHandler}>
        <Form.Group>
          <Form.Control
            type="text"
            placeholder="Type a message..."
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
          />
        </Form.Group>
        <Button type="submit" variant="primary" className="mt-2">
          Send
        </Button>
      </Form>
    </div>
  );
}

export default Chat;
