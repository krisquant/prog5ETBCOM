import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function LobbyPage({ user, onJoinRoom, onLogout }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadRooms = async () => {
    try {
      const data = await api.getAvailableRooms();
      console.log('Available rooms:', data.rooms);
      setRooms(data.rooms);
    } catch (err) {
      console.error('Failed to load rooms:', err);
    }
  };

  useEffect(() => {
    loadRooms();
    const interval = setInterval(loadRooms, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateRoom = async () => {
    setLoading(true);
    setError('');

    try {
      const room = await api.createRoom(user.userId);
      console.log('Room created:', room);
      onJoinRoom(room.roomId);
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
      console.log('Joined room:', room);
      onJoinRoom(roomId);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join room');
      setLoading(false);
    }
  };

  return (
    <div className="lobby-page">
      <div className="lobby-header">
        <div>
          <h2>Welcome, {user.username}!</h2>
          <p>Games played: {user.gamesPlayed} | Games won: {user.gamesWon}</p>
        </div>
        <button onClick={onLogout} className="logout-btn">Logout</button>
      </div>

      <div className="lobby-content">
        <div className="create-room-section">
          <h3>Create New Room</h3>
          <button onClick={handleCreateRoom} disabled={loading}>
            Create Room
          </button>
        </div>

        <div className="rooms-section">
          <div className="section-header">
            <h3>Available Rooms</h3>
            <button onClick={loadRooms} className="refresh-btn">Refresh</button>
          </div>

          {error && <div className="error">{error}</div>}

          {rooms.length === 0 ? (
            <p className="no-rooms">No available rooms. Create one!</p>
          ) : (
            <div className="rooms-list">
              {rooms.map((room) => (
                <div key={room.id} className="room-card">
                  <div className="room-info">
                    <span className="room-id">Room: {room.id.substring(0, 8)}...</span>
                    <span className="room-players">Players: {room.players.length}/2</span>
                  </div>
                  <button
                    onClick={() => handleJoinRoom(room.id)}
                    disabled={loading}
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}