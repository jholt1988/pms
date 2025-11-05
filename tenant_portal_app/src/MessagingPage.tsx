
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

/**
 * The messaging page.
 * It allows tenants and property managers to communicate with each other.
 */
const MessagingPage = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch('/api/messaging/conversations', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          throw new Error('Failed to fetch conversations');
        }
        const data = await res.json();
        setConversations(data);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchConversations();
    }
  }, [token]);

  const fetchMessages = async (conversationId: number) => {
    try {
      const res = await fetch(`/api/messaging/conversations/${conversationId}` , {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error('Failed to fetch messages');
      }
      const data = await res.json();
      setMessages(data);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleConversationClick = (conversation: any) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.id);
  };

  const handleSendMessage = async () => {
    try {
      const res = await fetch('/api/messaging/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ conversationId: selectedConversation.id, content: newMessage }),
      });
      if (!res.ok) {
        throw new Error('Failed to send message');
      }
      setNewMessage('');
      fetchMessages(selectedConversation.id);
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <img 
        src="/wireframes/MessagingInbox.svg" 
        alt="Messaging Inbox Wireframe" 
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default MessagingPage;
