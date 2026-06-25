import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Ticket, CheckCircle, Trash2 } from 'lucide-react';
import styles from './TicketDashboard.module.css';
import { useAuth } from '../context/AuthContext';

interface TicketData {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
}

export default function TicketDashboard() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const { token } = useAuth();

  const fetchTickets = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/tickets/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (e) {
      console.error('Failed to fetch tickets', e);
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 3000);
    return () => clearInterval(interval);
  }, [token]);

  const handleResolve = async (id: number, currentTicket: TicketData) => {
    try {
      await fetch(`http://localhost:8000/api/tickets/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ ...currentTicket, status: 'resolved' })
      });
      fetchTickets();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`http://localhost:8000/api/tickets/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchTickets();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Ticket className={styles.icon} />
        <h2>Support Tickets</h2>
      </div>
      <div className={styles.ticketList}>
        {tickets.map(ticket => (
          <motion.div 
            key={ticket.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.ticketCard}
          >
            <div className={styles.cardHeader}>
              <h3>#{ticket.id} {ticket.title}</h3>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className={`${styles.status} ${styles[ticket.status]}`}>
                  {ticket.status.replace('_', ' ')}
                </span>
                <button 
                  onClick={() => handleResolve(ticket.id, ticket)} 
                  style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: '4px' }}
                  title="Mark Resolved"
                >
                  <CheckCircle size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(ticket.id)} 
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                  title="Delete Ticket"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <p className={styles.description}>{ticket.description}</p>
            <span className={styles.priority}>Priority: {ticket.priority}</span>
          </motion.div>
        ))}
        {tickets.length === 0 && (
          <p className={styles.emptyState}>No tickets found. Ask the agent to create one!</p>
        )}
      </div>
    </div>
  );
}
