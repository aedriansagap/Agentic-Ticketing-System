import TicketDashboard from './components/TicketDashboard';
import AgentChat from './components/AgentChat';
import AuthScreen from './components/AuthScreen';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LogOut } from 'lucide-react';

function AppContent() {
  const { token, logout } = useAuth();

  if (!token) {
    return <AuthScreen />;
  }

  return (
    <>
      <button 
        onClick={logout} 
        style={{ position: 'absolute', top: 16, right: 24, zIndex: 10, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <LogOut size={16} /> Logout
      </button>
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
