import { useState } from 'react';
import { api } from '../services/api';

export default function AuthPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await api.register(username);
      console.log('Registered:', user);
      onLogin(user);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await api.login(username);
      console.log('Logged in:', user);
      onLogin(user);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>21 Stones Game</h1>
        <p className="subtitle">Take turns removing stones. Don't take the last one!</p>

        <div className="auth-form">
          <input
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />

          {error && <div className="error">{error}</div>}

          <div className="button-group">
            <button onClick={handleLogin} disabled={loading || !username}>
              Login
            </button>
            <button onClick={handleRegister} disabled={loading || !username}>
              Register
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}