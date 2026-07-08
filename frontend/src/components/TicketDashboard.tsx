import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, CheckCircle, Trash2, MessageSquare, Send, Search, User as UserIcon, Tag, Hand } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-hot-toast';
import styles from './TicketDashboard.module.css';
import { useAuth } from '../context/AuthContext';

interface TicketData {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  assigned_username: string | null;
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

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  let userRole = 'user';
  if (token) {
    try {
      const decoded: any = jwtDecode(token);
      userRole = decoded.role;
    } catch (e) {}
  }

  const fetchTickets = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterStatus) params.append('status', filterStatus);
      if (filterCategory) params.append('category', filterCategory);

      const res = await fetch(`${API_URL}/api/tickets/?${params.toString()}`, {
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
    const interval = setInterval(fetchTickets, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [token, searchQuery, filterStatus, filterCategory]);

  const fetchComments = async (ticketId: number) => {
    try {
      const res = await fetch(`${API_URL}/api/tickets/${ticketId}/comments`, {
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
      await fetch(`${API_URL}/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ content: newComment })
      });
      setNewComment('');
      fetchComments(ticketId);
      toast.success('Reply sent');
    } catch (e) {
      console.error(e);
      toast.error('Failed to send reply');
    }
  };

  const handleResolve = async (e: React.MouseEvent, id: number, currentTicket: TicketData) => {
    e.stopPropagation();
    try {
      await fetch(`${API_URL}/api/tickets/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ ...currentTicket, status: 'resolved' })
      });
      fetchTickets();
      toast.success('Ticket marked as resolved');
    } catch (e) {
      console.error(e);
      toast.error('Failed to resolve ticket');
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await fetch(`${API_URL}/api/tickets/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchTickets();
      toast.success('Ticket deleted');
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete ticket');
    }
  };

  const handleClaim = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await fetch(`${API_URL}/api/tickets/${id}/assign`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchTickets();
      toast.success('Ticket claimed successfully');
    } catch (e) {
      console.error(e);
      toast.error('Failed to claim ticket');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Ticket className={styles.icon} />
          <h2>Support Tickets</h2>
        </div>
        
        {/* Search and Filters */}
        <div className={styles.filterBar}>
          <div className={styles.searchBox}>
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search tickets..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="">All Categories</option>
            <option value="general">General</option>
            <option value="technical">Technical</option>
            <option value="billing">Billing</option>
            <option value="account">Account</option>
          </select>
        </div>
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
            
            <div className={styles.metaRow}>
              <span className={styles.category}><Tag size={12}/> {ticket.category}</span>
              {ticket.assigned_username ? (
                <span className={styles.assigned}><UserIcon size={12}/> {ticket.assigned_username}</span>
              ) : (
                userRole === 'admin' ? (
                  <button onClick={(e) => handleClaim(e, ticket.id)} className={styles.claimBtn}>
                    <Hand size={12}/> Claim
                  </button>
                ) : (
                  <span className={styles.unassigned}>Unassigned</span>
                )
              )}
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
          <p className={styles.emptyState}>No tickets found.</p>
        )}
      </div>
    </div>
  );
}
