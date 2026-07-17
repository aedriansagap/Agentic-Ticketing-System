import { useState, useEffect } from 'react';
import TicketDashboard from './components/TicketDashboard';
import AgentChat from './components/AgentChat';
import AuthScreen from './components/AuthScreen';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LogOut, Palette, Sparkles } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { jwtDecode } from 'jwt-decode';
import Avatar from './components/Avatar';

const THEMES = [
  { id: 'indigo', color: '#6366f1', hover: '#4f46e5', gradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', mesh1: 'rgba(99, 102, 241, 0.15)', mesh2: 'rgba(168, 85, 247, 0.15)' },
  { id: 'emerald', color: '#10b981', hover: '#059669', gradient: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', mesh1: 'rgba(16, 185, 129, 0.15)', mesh2: 'rgba(59, 130, 246, 0.15)' },
  { id: 'rose', color: '#f43f5e', hover: '#e11d48', gradient: 'linear-gradient(135deg, #f43f5e 0%, #f97316 100%)', mesh1: 'rgba(244, 63, 94, 0.15)', mesh2: 'rgba(249, 115, 22, 0.15)' },
  { id: 'amber', color: '#f59e0b', hover: '#d97706', gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', mesh1: 'rgba(245, 158, 11, 0.15)', mesh2: 'rgba(239, 68, 68, 0.15)' },
];

function AppContent() {
  const { token, logout } = useAuth();
  const [themeId, setThemeId] = useState(localStorage.getItem('resolveTheme') || 'indigo');
  const [showThemes, setShowThemes] = useState(false);

  useEffect(() => {
    const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
    document.documentElement.style.setProperty('--accent-color', theme.color);
    document.documentElement.style.setProperty('--accent-hover', theme.hover);
    document.documentElement.style.setProperty('--accent-gradient', theme.gradient);
    document.documentElement.style.setProperty('--mesh-color-1', theme.mesh1);
    document.documentElement.style.setProperty('--mesh-color-2', theme.mesh2);
    localStorage.setItem('resolveTheme', themeId);
  }, [themeId]);

  if (!token) {
    return <AuthScreen />;
  }

  let username = 'User';
  try {
    const decoded: any = jwtDecode(token);
    username = decoded.sub || 'User';
  } catch (e) {}

  return (
    <>
      <Toaster 
        position="top-right" 
        toastOptions={{ 
          style: { background: '#1e293b', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.1)' }
        }} 
      />
      
      {/* Top Navigation Bar */}
      <nav className="topbar">
        <div className="topbar-logo">
          <Sparkles className="logo-icon" size={24} />
          <h1>Resolve<span>AI</span></h1>
        </div>
        
        <div className="topbar-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '8px', fontWeight: 500 }}>
            <Avatar username={username} size={32} />
            <span style={{ fontSize: '0.95rem' }}>{username}</span>
          </div>

          <div className="theme-picker-container">
            <button 
              className="action-btn" 
              onClick={() => setShowThemes(!showThemes)}
              title="Change Theme"
            >
              <Palette size={18} />
            </button>
            <AnimatePresence>
              {showThemes && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="theme-dropdown glass-panel"
                >
                  {THEMES.map(t => (
                    <button 
                      key={t.id} 
                      className={`theme-option ${t.id === themeId ? 'active' : ''}`}
                      onClick={() => { setThemeId(t.id); setShowThemes(false); }}
                      style={{ background: t.gradient }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <button className="action-btn logout-btn" onClick={logout} title="Logout">
            <LogOut size={18} /> <span>Logout</span>
          </button>
        </div>
      </nav>

      <div className="app-container">
        <main className="glass-panel dashboard-section">
          <TicketDashboard />
        </main>
        <aside className="glass-panel chat-section">
          <AgentChat />
        </aside>
      </div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
