import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Ticket } from 'lucide-react';
import styles from './TicketDashboard.module.css';

interface TicketData {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
}

export default function TicketDashboard() {
  const [tickets, setTickets] = useState<TicketData[]>([]);

  useEffect(() => {
    // Poll for new tickets since agent might create them
    const fetchTickets = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/tickets/');
        if (res.ok) {
          const data = await res.json();
          setTickets(data);
        }
      } catch (e) {
        console.error('Failed to fetch tickets', e);
      }
    };
    fetchTickets();
    const interval = setInterval(fetchTickets, 3000);
    return () => clearInterval(interval);
  }, []);

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
              <span className={`${styles.status} ${styles[ticket.status]}`}>
                {ticket.status.replace('_', ' ')}
              </span>
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
