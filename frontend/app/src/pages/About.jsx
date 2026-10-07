
import React, { useEffect, useState } from "react";
import "./About.css";

function About() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userInfo = localStorage.getItem("userInfo");

    if (userInfo) {
      try {
        setUser(JSON.parse(userInfo));
      } catch (error) {
        console.error("Unable to load user information:", error);
      }
    }
  }, []);

  const getProfileImage = () => {
    if (!user?.profilePicture) {
      return "https://via.placeholder.com/100";
    }

    if (/^https?:\/\//i.test(user.profilePicture)) {
      return user.profilePicture;
    }

   return `https://social-media-backend-fwgu.onrender.com/${user.profilePicture.replace(/^\/+/, "")}`;
  };

  const handleProfileClick = () => {
    window.location.href = "/profile";
  };

  return (
    <div className="about-page">
      <div className="about-container">

        {/* HERO */}
        <section className="about-hero">
          <div className="about-hero-content">
            <span className="about-label">ABOUT US</span>

            <h1>
              Connect. Share.
              <br />
              <span>Stay Connected.</span>
            </h1>

            <p>
              Social Media App is a modern platform designed to help
              people connect, share their moments, discover users,
              and communicate through real-time conversations.
            </p>
          </div>

          <div className="about-hero-icon">
            💬
          </div>
        </section>

        {/* PROFILE */}
        {user && (
          <section className="about-profile-card">
            <div className="about-profile-image-wrapper">
              <img
                src={getProfileImage()}
                alt={user.username || "Profile"}
                className="about-profile-image"
                onError={(event) => {
                  event.currentTarget.src =
                    "https://via.placeholder.com/100";
                }}
              />
            </div>

            <div className="about-profile-info">
              <span className="about-profile-label">
                YOUR PROFILE
              </span>

              <h2>
                Welcome, {user.username || user.email}
              </h2>

              <p>
                Your profile is connected to the Social Media App.
                Share posts, connect with people and start conversations.
              </p>

              <button
                type="button"
                className="about-profile-button"
                onClick={handleProfileClick}
              >
                View Profile
              </button>
            </div>
          </section>
        )}

        {/* FEATURES */}
        <section className="about-features">
          <div className="about-section-heading">
            <span>WHAT YOU CAN DO</span>

            <h2>
              Everything you need to stay connected
            </h2>
          </div>

          <div className="about-feature-grid">

            <div className="about-feature-card">
              <div className="about-feature-icon">
                ✦
              </div>

              <h3>
                Share Posts
              </h3>

              <p>
                Share your thoughts, moments, and images
                with your community.
              </p>
            </div>

            <div className="about-feature-card">
              <div className="about-feature-icon">
                👥
              </div>

              <h3>
                Connect With People
              </h3>

              <p>
                Discover users, follow people, and build
                your social connections.
              </p>
            </div>

            <div className="about-feature-card">
              <div className="about-feature-icon">
                💬
              </div>

              <h3>
                Real-Time Chat
              </h3>

              <p>
                Start conversations and communicate with
                other users through chat.
              </p>
            </div>

            <div className="about-feature-card">
              <div className="about-feature-icon">
                🔒
              </div>

              <h3>
                Secure Accounts
              </h3>

              <p>
                Manage your profile and account securely
                while staying connected.
              </p>
            </div>

          </div>
        </section>

        {/* TECHNOLOGY */}
        <section className="about-technology">
          <div>
            <span className="about-section-label">
              BUILT FOR MODERN WEB
            </span>

            <h2>
              Simple, modern and community-focused.
            </h2>

            <p>
              The application combines a clean user experience
              with modern web technologies to provide a smooth
              social networking experience.
            </p>
          </div>

          <div className="about-tech-list">

            <div className="about-tech-item">
              <span>01</span>
              <strong>
                Modern Interface
              </strong>
            </div>

            <div className="about-tech-item">
              <span>02</span>
              <strong>
                Image Sharing
              </strong>
            </div>

            <div className="about-tech-item">
              <span>03</span>
              <strong>
                Real-Time Communication
              </strong>
            </div>

            <div className="about-tech-item">
              <span>04</span>
              <strong>
                User Profiles
              </strong>
            </div>

          </div>
        </section>

        {/* CTA */}
        <section className="about-cta">
          <div>
            <span>
              JOIN THE COMMUNITY
            </span>

            <h2>
              Share your moments and stay connected.
            </h2>

            <p>
              Explore the platform and start connecting
              with your community.
            </p>
          </div>

          <div className="about-cta-icon">
            🚀
          </div>
        </section>

      </div>
    </div>
  );
}

export default About;

