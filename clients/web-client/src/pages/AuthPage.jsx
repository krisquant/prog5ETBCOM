import { useState } from 'react';
import api from '../services/api';

export default function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let userData;
      if (isLogin) {
        userData = await api.login(username);
      } else {
        userData = await api.register(username);
        userData = await api.login(username);
      }

      onLogin(userData);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h1>21 Stones</h1>
      <p className="subtitle">Strategic Two-Player Game</p>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="input-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
            minLength={3}
            maxLength={20}
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
        </button>

        {error && <div className="error-message">{error}</div>}
      </form>

      <div className="auth-toggle">
        {isLogin ? "Don't have an account?" : "Already have an account?"}
        {' '}
        <button onClick={() => {
          setIsLogin(!isLogin);
          setError('');
        }}>
          {isLogin ? 'Register' : 'Login'}
        </button>
      </div>

      <div style={{ marginTop: '40px', color: '#666', fontSize: '14px' }}>
        <p><strong>Game Rules:</strong></p>
        <p>• Start with 21 stones</p>
        <p>• Take 1, 2, or 3 stones per turn</p>
        <p>• Player who takes the LAST stone LOSES!</p>
      </div>
    </div>
  );
}
