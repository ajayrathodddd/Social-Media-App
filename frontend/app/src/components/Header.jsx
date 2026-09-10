import React, { useState, useEffect } from "react";
import { LinkContainer } from "react-router-bootstrap";
import { Link, useNavigate } from "react-router-dom";

function Header() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
  }, []);

  const logoutHandler = () => {
    localStorage.removeItem("userInfo");
    setUser(null);
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-expand-lg bg-primary" data-bs-theme="dark">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          Social Media App
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarColor02"
          aria-controls="navbarColor02"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarColor02">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <LinkContainer to="/">
                <span className="nav-link cursor-pointer">Home</span>
              </LinkContainer>
            </li>
            <li className="nav-item">
              <LinkContainer to="/about">
                <span className="nav-link cursor-pointer">About</span>
              </LinkContainer>
            </li>
            {user && (
              <li className="nav-item">
                <LinkContainer to="/chats">
                  <span className="nav-link cursor-pointer">Chat</span>
                </LinkContainer>
              </li>
            )}
            <li className="nav-item dropdown">
              <span
                className="nav-link dropdown-toggle cursor-pointer"
                data-bs-toggle="dropdown"
                role="button"
                aria-haspopup="true"
                aria-expanded="false"
              >
                {user ? `Welcome ${user.username || user.email}` : "Signin"}
              </span>
              <div className="dropdown-menu">
                {!user ? (
                  <>
                    <LinkContainer to="/login">
                      <span className="dropdown-item cursor-pointer">Login</span>
                    </LinkContainer>
                    <LinkContainer to="/signup">
                      <span className="dropdown-item cursor-pointer">Signup</span>
                    </LinkContainer>
                  </>
                ) : (
                  <>
                    <LinkContainer to="/profile">
                      <span className="dropdown-item cursor-pointer">Profile</span>
                    </LinkContainer>
                    <div className="dropdown-divider"></div>
                    <button
                      className="dropdown-item border-0 bg-transparent text-start w-100"
                      onClick={logoutHandler}
                    >
                      Logout
                    </button>
                  </>
                )}
              </div>
            </li>
          </ul>
          {/* UserSearch yahan se hata diya gaya hai */}
        </div>
      </div>
    </nav>
  );
}

export default Header;