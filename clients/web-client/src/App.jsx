import { useState } from 'react';
import AuthPage from './pages/AuthPage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import './styles/App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('auth'); // 'auth', 'lobby', 'game'
  const [user, setUser] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentPage('lobby');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentRoom(null);
    setCurrentPage('auth');
  };

  const handleCreateRoom = (room) => {
    setCurrentRoom(room);
    setCurrentPage('game');
  };

  const handleJoinRoom = (room) => {
    setCurrentRoom(room);
    setCurrentPage('game');
  };

  const handleLeaveGame = () => {
    setCurrentRoom(null);
    setCurrentPage('lobby');
  };

  return (
    <div className="app-container">
      {currentPage === 'auth' && <AuthPage onLogin={handleLogin} />}
      
      {currentPage === 'lobby' && (
        <LobbyPage
          user={user}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onLogout={handleLogout}
        />
      )}
      
      {currentPage === 'game' && (
        <GamePage
          user={user}
          room={currentRoom}
          onLeaveGame={handleLeaveGame}
        />
      )}
    </div>
  );
}

export default App;
