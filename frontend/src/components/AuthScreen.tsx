import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, UserPlus } from 'lucide-react';
import styles from './AuthScreen.module.css';
import { useAuth } from '../context/AuthContext';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isLogin) {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        
        const res = await fetch('http://localhost:8000/api/auth/token', {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) throw new Error('Invalid credentials');
        const data = await res.json();
        login(data.access_token);
      } else {
        const res = await fetch('http://localhost:8000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        if (!res.ok) throw new Error('Registration failed. Username may exist.');
        
        // Auto login after register
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        const loginRes = await fetch('http://localhost:8000/api/auth/token', {
          method: 'POST',
          body: formData,
        });
        const data = await loginRes.json();
        login(data.access_token);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.authContainer}>
      <motion.div 
        className={styles.authCard}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={styles.header}>
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p>{isLogin ? 'Sign in to access your tickets' : 'Join the Agentic Ticketing System'}</p>
        </div>
        
        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Username" 
              required 
            />
          </div>
          <div className={styles.inputGroup}>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password" 
              required 
            />
          </div>
          
          <button type="submit" className={styles.submitBtn}>
            {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
            <span>{isLogin ? 'Sign In' : 'Register'}</span>
          </button>
        </form>

        <p className={styles.toggleText}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} type="button">
            {isLogin ? 'Register' : 'Sign In'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
