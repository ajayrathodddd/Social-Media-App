import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import axios from 'axios';

import Header from './components/Header';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';

import Home from './pages/Home';
import Profile from './pages/Profile';
import About from './pages/About';

import Chat from './components/Chat/Chat';
import ChatList from './components/Chat/ChatList';

// Use the deployed Express backend for every relative /api request.
axios.defaults.baseURL = 'https://social-media-backend-fwgu.onrender.com';

function App() {
  return (
    <Router>
      <Header />

      <Container className="py-3">
        <Routes>
          {/* Home */}
          <Route path="/" element={<Home />} />

          {/* About */}
          <Route path="/about" element={<About />} />

          {/* Authentication */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Profile */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:userId" element={<Profile />} />

          {/* Chat */}
          <Route path="/chats" element={<ChatList />} />
          <Route path="/chat/:chatId" element={<Chat />} />

          {/* Catch-all for undefined routes */}
          <Route path="*" element={<Navigate to="/profile" replace />} />
        </Routes>
      </Container>
    </Router>
  );
}

export default App;