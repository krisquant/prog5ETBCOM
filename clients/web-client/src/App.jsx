import { useState } from 'react';
import AuthPage from './pages/AuthPage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [roomId, setRoomId] = useState(null);

  const handleLogin = (userData) => {
    console.log('User logged in:', userData);
    setUser(userData);
  };

  const handleLogout = () => {
    console.log('User logged out');
    setUser(null);
    setRoomId(null);
  };

  const handleJoinRoom = (id) => {
    console.log('Joining room:', id);
    setRoomId(id);
  };

  const handleLeaveGame = () => {
    console.log('Leaving game');
    setRoomId(null);
  };

  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  if (roomId) {
    return <GamePage user={user} roomId={roomId} onLeaveGame={handleLeaveGame} />;
  }

  return <LobbyPage user={user} onJoinRoom={handleJoinRoom} onLogout={handleLogout} />;
}