import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, CheckCircle, Trash2, MessageSquare, Send, Search, User as UserIcon, Tag, Hand, AlertTriangle, AlertCircle, ArrowDownCircle, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { jwtDecode } from 'jwt-decode';
import Avatar from './Avatar';
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
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
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

  const handleToggleExpand = (ticket: TicketData) => {
    setSelectedTicket(ticket);
    fetchComments(ticket.id);
  };

  const closeDrawer = () => {
    setSelectedTicket(null);
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

  const getPriorityBadge = (priority: string) => {
    const p = priority.toLowerCase();
    if (p === 'high') return <span className={`${styles.priorityBadge} ${styles.high}`}><AlertTriangle size={14}/> High</span>;
    if (p === 'medium') return <span className={`${styles.priorityBadge} ${styles.medium}`}><AlertCircle size={14}/> Medium</span>;
    return <span className={`${styles.priorityBadge} ${styles.low}`}><ArrowDownCircle size={14}/> Low</span>;
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

      <div className={styles.metricCards}>
        <div className={styles.metricCard}>
          <h4>Total Tickets</h4>
          <span className={styles.metricValue}>{tickets.length}</span>
        </div>
        <div className={styles.metricCard}>
          <h4>Open Tickets</h4>
          <span className={styles.metricValue}>{tickets.filter(t => t.status === 'open').length}</span>
        </div>
        <div className={styles.metricCard}>
          <h4>High Priority</h4>
          <span className={styles.metricValue}>{tickets.filter(t => t.priority === 'high').length}</span>
        </div>
      </div>

      <motion.div 
        className={styles.ticketList}
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.1 } }
        }}
        initial="hidden"
        animate="show"
      >
        <AnimatePresence mode="popLayout">
          {tickets.map(ticket => (
            <motion.div 
              key={ticket.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
              exit={{ opacity: 0, scale: 0.95 }}
              layout
              className={styles.ticketCard}
              onClick={() => handleToggleExpand(ticket)}
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
              {getPriorityBadge(ticket.priority)}
              <span className={styles.commentCount}>
                <MessageSquare size={14} /> View Comments
              </span>
            </div>

            </motion.div>
          ))}
        </AnimatePresence>
        {tickets.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={styles.emptyState}
          >
            <Ticket size={48} className={styles.emptyIcon} />
            <h3>No tickets found</h3>
            <p>You're all caught up! Enjoy the silence.</p>
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {selectedTicket && (
          <motion.div 
            className={styles.drawerOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
          >
            <motion.div 
              className={styles.drawer}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={e => e.stopPropagation()}
            >
              <div className={styles.drawerHeader}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'white' }}>
                    #{selectedTicket.id} {selectedTicket.title}
                  </h3>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span className={`${styles.status} ${styles[selectedTicket.status]}`}>
                      {selectedTicket.status.replace('_', ' ')}
                    </span>
                    {getPriorityBadge(selectedTicket.priority)}
                  </div>
                </div>
                <button className={styles.closeBtn} onClick={closeDrawer}>
                  <X size={20} />
                </button>
              </div>

              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
                {selectedTicket.description}
              </p>

              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ marginBottom: '16px', color: 'white' }}>Discussion</h4>
                
                <div className={styles.commentsList} style={{ maxHeight: 'none', flex: 1 }}>
                  {comments[selectedTicket.id]?.length === 0 && (
                    <p className={styles.noComments}>No comments yet.</p>
                  )}
                  {comments[selectedTicket.id]?.map(comment => (
                    <div key={comment.id} className={styles.commentBubble} style={{ display: 'flex', flexDirection: 'row', gap: '12px', alignItems: 'flex-start' }}>
                      <Avatar username={comment.author_username} size={32} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <strong>{comment.author_username}</strong>
                          <span className={styles.commentTime}>
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p>{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.addComment} style={{ marginTop: '16px' }}>
                  <input 
                    type="text" 
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddComment(selectedTicket.id)}
                    placeholder="Add a reply..."
                  />
                  <button onClick={() => handleAddComment(selectedTicket.id)}>
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
