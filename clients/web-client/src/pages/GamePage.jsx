import { useState, useEffect } from 'react';
import { wsService } from '../services/websocket';

export default function GamePage({ user, roomId, onLeaveGame }) {
  const [game, setGame] = useState(null);
  const [stones, setStones] = useState(21);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [moves, setMoves] = useState([]);
  const [players, setPlayers] = useState({ player1: null, player2: null });
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [waiting, setWaiting] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const socket = wsService.connect();

    wsService.connectRoom(roomId, user.userId, user.token);

    wsService.on('player_joined', (data) => {
      console.log('Player joined:', data.payload);
      if (data.payload.playersCount === 2) {
        setWaiting(false);
      }
    });

    wsService.on('game_started', (data) => {
      console.log('Game started:', data.payload);
      setGame(data.payload.gameId);
      setStones(data.payload.stonesRemaining);
      setCurrentPlayer(data.payload.currentPlayerId);
      setPlayers({
        player1: data.payload.player1,
        player2: data.payload.player2
      });
      setWaiting(false);
    });

    wsService.on('move_made', (data) => {
      console.log('Move made:', data.payload);
      setStones(data.payload.stonesRemaining);
      setCurrentPlayer(data.payload.nextPlayerId);
      setMoves(prev => [...prev, {
        player: data.payload.username,
        stones: data.payload.stonesToTake
      }]);
    });

    wsService.on('game_over', (data) => {
      console.log('Game over:', data.payload);
      setGameOver(true);
      setWinner(data.payload.winnerId === user.userId ? 'You' : data.payload.winnerUsername);
    });

    wsService.on('player_disconnected', (data) => {
      console.log('Player disconnected:', data.payload);
      setError(`${data.payload.username} disconnected`);
      setTimeout(() => {
        handleLeave();
      }, 2000);
    });

    wsService.on('error', (data) => {
      console.error('Game error:', data.payload);
      setError(data.payload.message);
    });

    return () => {
      wsService.leaveRoom();
      wsService.disconnect();
    };
  }, [roomId, user]);

  const handleMove = (stonesToTake) => {
    if (currentPlayer !== user.userId) {
      setError("It's not your turn!");
      setTimeout(() => setError(''), 2000);
      return;
    }

    wsService.makeMove(game, user.userId, stonesToTake);
  };

  const handleLeave = () => {
    wsService.leaveRoom();
    wsService.disconnect();
    onLeaveGame();
  };

  if (waiting) {
    return (
      <div className="game-page">
        <div className="waiting-container">
          <h2>Waiting for opponent...</h2>
          <p>Room ID: {roomId.substring(0, 8)}...</p>
          <button onClick={handleLeave}>Leave Room</button>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="game-page">
        <div className="game-over-container">
          <h1>{winner === 'You' ? '🎉 You Win! 🎉' : '😞 You Lose!'}</h1>
          <p>{winner === 'You' ? 'Your opponent took the last stone!' : 'You took the last stone!'}</p>
          <button onClick={handleLeave}>Back to Lobby</button>
        </div>
      </div>
    );
  }

  const isMyTurn = currentPlayer === user.userId;
  const opponent = players.player1?.userId === user.userId ? players.player2 : players.player1;

  return (
    <div className="game-page">
      <div className="game-container">
        <div className="game-header">
          <div className="player-info">
            <span className={isMyTurn ? 'active' : ''}>
              {user.username} (You)
            </span>
          </div>
          <h2>21 Stones Game</h2>
          <div className="player-info">
            <span className={!isMyTurn ? 'active' : ''}>
              {opponent?.username}
            </span>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="stones-display">
          <h3>Stones Remaining: {stones}</h3>
          <div className="stones-grid">
            {Array.from({ length: stones }, (_, i) => (
              <div key={i} className="stone"></div>
            ))}
          </div>
        </div>

        <div className="turn-indicator">
          {isMyTurn ? (
            <p className="my-turn">🎯 Your Turn - Take 1, 2, or 3 stones</p>
          ) : (
            <p className="opponent-tur