import React, { useEffect, useState } from "react";
import { Button, Card, Form, InputGroup, ListGroup } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function UserSearch({ compact = false }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");
    setFollowing((userInfo?.following || []).map((id) => id.toString()));
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setUsers([]);
      return undefined;
    }

    const timer = setTimeout(async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");
        const { data } = await axios.get(
          `/api/users/search?q=${encodeURIComponent(query.trim())}`,
          { headers: { Authorization: `Bearer ${userInfo.token}` } }
        );
        setUsers(data);
        setError("");
      } catch (requestError) {
        setError(requestError.response?.data?.message || requestError.message);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const toggleFollow = async (userId) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const isFollowing = following.includes(userId);

      if (isFollowing) {
        await axios.delete(`/api/users/${userId}/follow`, config);
        setFollowing((current) => current.filter((id) => id !== userId));
      } else {
        await axios.post(`/api/users/${userId}/follow`, {}, config);
        setFollowing((current) => [...current, userId]);
      }
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message);
    }
  };

  const startChat = async (userId) => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");
    const { data } = await axios.post(
      "/api/chat",
      { userId },
      { headers: { Authorization: `Bearer ${userInfo.token}` } }
    );
    navigate(`/chat/${data._id}`);
  };

  return (
    <Card className={compact ? "user-search user-search-compact" : "user-search mt-2"}>
      <Card.Body>
        {!compact && <Card.Title>Find Users</Card.Title>}
        <InputGroup size={compact ? "sm" : undefined}>
          <Form.Control
            value={query}
            placeholder={compact ? "Find users..." : "Search username or email"}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search users"
          />
          <Button variant="outline-secondary" onClick={() => setQuery("")} title="Clear search">
            Clear
          </Button>
        </InputGroup>
        {error && <small className="text-danger d-block mt-2">{error}</small>}
      </Card.Body>
      {users.length > 0 && (
        <ListGroup variant="flush">
          {users.map((user) => {
            const userId = user._id.toString();
            const isFollowing = following.includes(userId);
            return (
              <ListGroup.Item key={userId} className="d-flex align-items-center justify-content-between gap-2">
                <Button variant="link" className="text-truncate p-0 text-start" onClick={() => navigate(`/profile/${userId}`)}>
                  {user.username}
                </Button>
                <div className="d-flex gap-1">
                  <Button size="sm" variant="outline-primary" onClick={() => startChat(userId)}>Chat</Button>
                  <Button size="sm" variant={isFollowing ? "outline-secondary" : "primary"} onClick={() => toggleFollow(userId)}>
                    {isFollowing ? "Unfollow" : "Follow"}
                  </Button>
                </div>
              </ListGroup.Item>
            );
          })}
        </ListGroup>
      )}
    </Card>
  );
}

export default UserSearch;
