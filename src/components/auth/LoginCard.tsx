import { FC, FormEvent, useState } from 'react';

import './LoginCard.css';
import { login } from '../../api/client';

type LoginCardProps = {
  onAuthenticated: (token: string) => void;
};

const LoginCard: FC<LoginCardProps> = ({ onAuthenticated }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || !username || !password) {
      return;
    }

    setSubmitting(true);
    setError('');

    login(username, password)
      .then((token) => {
        setPassword('');
        onAuthenticated(token);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Login failed.');
        setSubmitting(false);
      });
  };

  return (
    <form id="loginCard" onSubmit={handleSubmit}>
      sign in ↓
      <input
        type="text"
        placeholder="username"
        value={username}
        autoFocus
        autoComplete="username"
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="password"
        value={password}
        autoComplete="current-password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit" disabled={submitting || !username || !password}>
        {submitting ? 'signing in…' : 'weee!'}
      </button>
      {error && <div className="loginError">{error}</div>}
    </form>
  );
};

export default LoginCard;
