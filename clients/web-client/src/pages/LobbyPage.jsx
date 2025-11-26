import { useState, useEffect } from 'react';
import api from '../services/api';

export default function LobbyPage({ user, onCreateRoom, onJoinRoom, onLogout }) {
  const [availableRooms, setAvailableRooms] = useState([]);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [roomIdInput, setRoomIdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAvailableRooms();
    const interval = setInterval(loadAvailableRooms, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadAvailableRooms = async () => {
    try {
      const data = await api.getAvailableRooms();
      setAvailableRooms(data.rooms);
    } catch (err) {
      console.error('Failed to load rooms:', err);
    }
  };

  const handleCreateRoom = async () => {
    setLoading(true);
    setError('');
    try {
      const room = await api.createRoom(user.userId);
      onCreateRoom(room);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (roomId) => {
    setLoading(true);
    setError('');
    try {
      const room = await api.joinRoom(roomId, user.userId);
      onJoinRoom(room);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    await handleJoinRoom(roomIdInput);
    setShowJoinModal(false);
    setRoomIdInput('');
  };

  return (
    <div className="lobby-container">
      <div className="lobby-header">
        <h1>Game Lobby</h1>
        <div className="user-info">
          <div>
            <div className="username">👤 {user.username}</div>
            <div className="stats">
              Games: {user.gamesPlayed} | Wins: {user.gamesWon}
            </div>
          </div>
          <button className="btn btn-secondary" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="lobby-actions">
        <div className="action-card" onClick={handleCreateRoom}>
          <h3>🎮 Create Room</h3>
          <p>Start a new game and wait for opponent</p>
        </div>
        <div className="action-card" onClick={() => setShowJoinModal(true)}>
          <h3>🚪 Join by Code</h3>
          <p>Enter room code to join a game</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="rooms-list">
        <h2>Available Rooms ({availableRooms.length})</h2>
        {availableRooms.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            No available rooms. Create one to start playing!
          </p>
        ) : (
          availableRooms.map((room) => (
            <div key={room.id} className="room-item">
              <div className="room-info">
                <div className="room-id">Room ID: {room.id.substring(0, 8)}...</div>
                <div className="room-status">
                  Players: {room.players.length}/2
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => handleJoinRoom(room.id)}
                disabled={loading}
              >
                Join
              </button>
            </div>
          ))
        )}
      </div>

      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Join Room by Code</h2>
            <form onSubmit={handleJoinByCode}>
              <div className="input-group">
                <label htmlFor="roomId">Room ID</label>
                <input
                  type="text"
                  id="roomId"
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value)}
                  placeholder="Paste room ID here"
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  Join
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowJoinModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
