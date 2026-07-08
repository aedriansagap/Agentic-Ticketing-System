import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import styles from './AgentChat.module.css';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'agent';
}

export default function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hello! I'm your AI support agent powered by Gemma 4. I can help you create, manage, and query support tickets.", sender: 'agent' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);
  const { token } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTo({
        top: messageListRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { id: Date.now(), text: input, sender: 'user' as const };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/chat/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: input })
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: data.reply,
        sender: 'agent'
      }]);
    } catch (e) {
      toast.error('Agent is currently offline.');
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: 'Error connecting to the agent server. Is the backend running?',
        sender: 'agent'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Bot className={styles.icon} />
        <h2>Agent Chat</h2>
      </div>
      
      <div className={styles.messageList} ref={messageListRef}>
        {messages.map(msg => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${styles.messageWrapper} ${styles[msg.sender]}`}
          >
            <div className={styles.avatar}>
              {msg.sender === 'agent' ? <Bot size={20} /> : <User size={20} />}
            </div>
            <div className={styles.messageBubble}>
              {msg.text}
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className={`${styles.messageWrapper} ${styles.agent}`}>
            <div className={styles.avatar}><Bot size={20} /></div>
            <div className={styles.typingIndicator}>
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
      </div>

      <div className={styles.inputArea}>
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask me to create a ticket..."
          className={styles.input}
        />
        <button onClick={handleSend} disabled={isLoading} className={styles.sendButton}>
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
