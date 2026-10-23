import React, { useState } from 'react';
import { auth } from '../services/api';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const signInWith = async (loginEmail, loginPassword) => {
    setLoading(true);
    setError('');
    try {
      const res = await auth.login({ email: loginEmail, password: loginPassword });
      onLogin(res.data.user, res.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await signInWith(email, password);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-logo">
          <i className="fas fa-drone-front"></i>
          <i className="fas fa-helicopter" style={{ fontSize: 48 }}></i>
          <h1>AI Drone Operations</h1>
          <p>Autonomous Fleet Management Platform</p>
        </div>

        {error && <div className="error-msg"><i className="fas fa-exclamation-circle"></i> {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <button
            type="button"
            onClick={() => {
              const demoEmail = process.env.REACT_APP_DEMO_EMAIL || '';
              const demoPassword = process.env.REACT_APP_DEMO_PASSWORD || '';
              setEmail(demoEmail);
              setPassword(demoPassword);
              signInWith(demoEmail, demoPassword);
            }}
            disabled={loading || !process.env.REACT_APP_DEMO_EMAIL || !process.env.REACT_APP_DEMO_PASSWORD}
            aria-label="Fill demo credentials"
            style={{ width: '100%', marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', border: '1px solid currentColor', background: 'transparent', cursor: 'pointer' }}
          >
            Fill demo credentials
          </button>
          {(!process.env.REACT_APP_DEMO_EMAIL || !process.env.REACT_APP_DEMO_PASSWORD) && <p role="status">Demo credentials are not configured for this session.</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
