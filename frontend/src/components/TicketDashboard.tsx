import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, CheckCircle, Trash2, MessageSquare, Send } from 'lucide-react';
import styles from './TicketDashboard.module.css';
import { useAuth } from '../context/AuthContext';

interface TicketData {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
}

interface CommentData {
  id: number;
  content: string;
  author_username: string;
  created_at: string;
}

export default function TicketDashboard() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [expandedTicketId, setExpandedTicketId] = useState<number | null>(null);
  const [comments, setComments] = useState<Record<number, CommentData[]>>({});
  const [newComment, setNewComment] = useState('');
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

  const fetchComments = async (ticketId: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/tickets/${ticketId}/comments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setComments(prev => ({ ...prev, [ticketId]: data }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleExpand = (ticketId: number) => {
    if (expandedTicketId === ticketId) {
      setExpandedTicketId(null);
    } else {
      setExpandedTicketId(ticketId);
      fetchComments(ticketId);
    }
  };

  const handleAddComment = async (ticketId: number) => {
    if (!newComment.trim()) return;
    try {
      await fetch(`http://localhost:8000/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ content: newComment })
      });
      setNewComment('');
      fetchComments(ticketId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolve = async (e: React.MouseEvent, id: number, currentTicket: TicketData) => {
    e.stopPropagation();
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

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
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
            className={`${styles.ticketCard} ${expandedTicketId === ticket.id ? styles.expanded : ''}`}
            onClick={() => handleToggleExpand(ticket.id)}
          >
            <div className={styles.cardHeader}>
              <h3>#{ticket.id} {ticket.title}</h3>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className={`${styles.status} ${styles[ticket.status]}`}>
                  {ticket.status.replace('_', ' ')}
                </span>
                <button 
                  onClick={(e) => handleResolve(e, ticket.id, ticket)} 
                  className={styles.actionBtn}
                  style={{ color: '#10b981' }}
                  title="Mark Resolved"
                >
                  <CheckCircle size={18} />
                </button>
                <button 
                  onClick={(e) => handleDelete(e, ticket.id)} 
                  className={styles.actionBtn}
                  style={{ color: '#ef4444' }}
                  title="Delete Ticket"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <p className={styles.description}>{ticket.description}</p>
            
            <div className={styles.footerRow}>
              <span className={styles.priority}>Priority: {ticket.priority}</span>
              <span className={styles.commentCount}>
                <MessageSquare size={14} /> View Comments
              </span>
            </div>

            <AnimatePresence>
              {expandedTicketId === ticket.id && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className={styles.commentsSection}
                  onClick={e => e.stopPropagation()}
                >
                  <div className={styles.commentsList}>
                    {comments[ticket.id]?.length === 0 && (
                      <p className={styles.noComments}>No comments yet.</p>
                    )}
                    {comments[ticket.id]?.map(comment => (
                      <div key={comment.id} className={styles.commentBubble}>
                        <strong>{comment.author_username}</strong>
                        <p>{comment.content}</p>
                        <span className={styles.commentTime}>
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className={styles.addComment}>
                    <input 
                      type="text" 
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddComment(ticket.id)}
                      placeholder="Add a reply..."
                    />
                    <button onClick={() => handleAddComment(ticket.id)}>
                      <Send size={16} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
        {tickets.length === 0 && (
          <p className={styles.emptyState}>No tickets found. Ask the agent to create one!</p>
        )}
      </div>
    </div>
  );
}
