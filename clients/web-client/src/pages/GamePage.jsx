import { useState, useEffect } from 'react';
import websocket from '../services/websocket';

export default function GamePage({ user, room, onLeaveGame }) {
  const [gameState, setGameState] = useState({
    gameId: null,
    player1: null,
    player2: null,
    currentPlayerId: null,
    stonesRemaining: 21,
    status: 'waiting',
    moves: [],
    winnerId: null,
    loserId: null
  });
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  useEffect(() => {
    websocket.connect();
    websocket.connectToRoom(room.roomId, user.userId, user.token);
    setConnectionStatus('connected');
    const handlePlayerJoined = (data) => {
      console.log('Player joined:', data);
    };

    const handleGameStarted = (data) => {
      console.log('Game started:', data);
      setGameState(prev => ({
        ...prev,
        gameId: data.payload.gameId,
        player1: data.payload.player1,
        player2: data.payload.player2,
        currentPlayerId: data.payload.currentPlayerId,
        stonesRemaining: data.payload.stonesRemaining,
        status: 'in_progress'
      }));
    };

    const handleMoveMade = (data) => {
      console.log('Move made:', data);
      const { stonesToTake, stonesRemaining, nextPlayerId, playerId, username } = data.payload;
      
      setGameState(prev => ({
        ...prev,
        stonesRemaining,
        currentPlayerId: nextPlayerId,
        moves: [...prev.moves, { playerId, username, stonesToTake, stonesRemaining }]
      }));
    };

    const handleGameOver = (data) => {
      console.log('Game over:', data);
      const { winnerId, loserId } = data.payload;
      
      setGameState(prev => ({
        ...prev,
        status: 'finished',
        winnerId,
        loserId
      }));
    };

    const handleError = (data) => {
      console.error('Error:', data);
      alert(data.payload.message);
    };

    const handlePlayerDisconnected = (data) => {
      console.log('Player disconnected:', data);
      alert(`${data.payload.username} disconnected from the game`);
      setTimeout(() => {
        websocket.disconnect();
        onLeaveGame();
      }, 2000);
    };

    websocket.on('player_joined', handlePlayerJoined);
    websocket.on('game_started', handleGameStarted);
    websocket.on('move_made', handleMoveMade);
    websocket.on('game_over', handleGameOver);
    websocket.on('error', handleError);
    websocket.on('player_disconnected', handlePlayerDisconnected);

    return () => {
      websocket.off('player_joined', handlePlayerJoined);
      websocket.off('game_started', handleGameStarted);
      websocket.off('move_made', handleMoveMade);
      websocket.off('game_over', handleGameOver);
      websocket.off('error', handleError);
      websocket.off('player_disconnected', handlePlayerDisconnected);
    };
  }, [room.roomId, user.userId, user.token, onLeaveGame]);

  const handleMove = (stonesToTake) => {
    if (gameState.currentPlayerId !== user.userId) {
      alert("It's not your turn!");
      return;
    }

    if (stonesToTake > gameState.stonesRemaining) {
      alert(`Only ${gameState.stonesRemaining} stones remaining!`);
      return;
    }

    websocket.makeMove(gameState.gameId, user.userId, stonesToTake);
  };

  const handleLeave = () => {
    websocket.leaveRoom(room.roomId, user.userId);
    websocket.disconnect();
    onLeaveGame();
  };

  const isMyTurn = gameState.currentPlayerId === user.userId;
  const isWaiting = gameState.status === 'waiting';
  const isFinished = gameState.status === 'finished';
  const isWinner = gameState.winnerId === user.userId;

  return (
    <div className="game-container">
      <div className="game-header">
        <h1>21 Stones Game</h1>
        <p>Room ID: {room.roomId.substring(0, 8)}...</p>
      </div>

      {isWaiting && (
        <div className="game-status waiting">
          ⏳ Waiting for opponent to join...
        </div>
      )}

      {!isWaiting && gameState.player1 && gameState.player2 && (
        <>
          <div className="players-info">
            <div className={`player-card ${gameState.currentPlayerId === gameState.player1.userId ? 'active' : ''}`}>
              <div className="player-name">
                {gameState.player1.username}
                {gameState.player1.userId === user.userId && ' (You)'}
              </div>
              <div className="player-status">Player 1</div>
            </div>
            <div className={`player-card ${gameState.currentPlayerId === gameState.player2.userId ? 'active' : ''}`}>
              <div className="player-name">
                {gameState.player2.username}
                {gameState.player2.userId === user.userId && ' (You)'}
              </div>
              <div className="player-status">Player 2</div>
            </div>
          </div>

          <div className="game-board">
            <div className="stones-display">
              <div className="stones-count">{gameState.stonesRemaining}</div>
              <div className="stones-label">stones remaining</div>
            </div>

            <div className="stones-visual">
              {Array.from({ length: gameState.stonesRemaining }).map((_, i) => (
                <div key={i} className="stone"></div>
              ))}
            </div>

            {!isFinished && (
              <>
                <div className={`game-status ${isMyTurn ? 'your-turn' : 'opponent-turn'}`}>
                  {isMyTurn ? '🎯 Your Turn!' : "⏳ Opponent's Turn..."}
                </div>

                <div className="move-controls">
                  <h3>Take Stones:</h3>
                  <div className="move-buttons">
                    <button
                      className="move-btn"
                      onClick={() => handleMove(1)}
                      disabled={!isMyTurn || gameState.stonesRemaining < 1}
                    >
                      1
                    </button>
                    <button
                      className="move-btn"
                      onClick={() => handleMove(2)}
                      disabled={!isMyTurn || gameState.stonesRemaining < 2}
                    >
                      2
                    </button>
                    <button
                      className="move-btn"
                      onClick={() => handleMove(3)}
                      disabled={!isMyTurn || gameState.stonesRemaining < 3}
                    >
                      3
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {isFinished && (
            <div className={`game-over ${isWinner ? 'winner' : 'loser'}`}>
              <h2>{isWinner ? '🎉 YOU WIN!' : '😞 YOU LOSE!'}</h2>
              <p>
                {isWinner
                  ? 'Your opponent took the last stone!'
                  : 'You took the last stone!'}
              </p>
              <button className="btn btn-primary" onClick={handleLeave}>
                Back to Lobby
              </button>
            </div>
          )}

          {gameState.moves.length > 0 && (
            <div className="move-history">
              <h3>Move History</h3>
              {gameState.moves.map((move, i) => (
                <div key={i} className="move-item">
                  <span className="move-player">
                    {move.username}
                  </span>
                  <span className="move-details">
                    took {move.stonesToTake} stone{move.stonesToTake > 1 ? 's' : ''} 
                    {' → '}{move.stonesRemaining} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!isFinished && (
        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <button className="btn btn-secondary" onClick={handleLeave}>
            Leave Game
          </button>
        </div>
      )}
    </div>
  );
}