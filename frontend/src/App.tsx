import TicketDashboard from './components/TicketDashboard';
import AgentChat from './components/AgentChat';

function App() {
  return (
    <div className="app-container">
      <main className="glass-panel dashboard-section">
        <TicketDashboard />
      </main>
      <aside className="glass-panel chat-section">
        <AgentChat />
      </aside>
    </div>
  );
}

export default App;
