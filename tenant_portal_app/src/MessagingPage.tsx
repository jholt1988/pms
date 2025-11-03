
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
    <div className="container mx-auto p-4 flex">
      <div className="w-1/3 border-r">
        <h2 className="text-xl font-semibold mb-2">Conversations</h2>
        <ul>
          {conversations.map((conversation) => (
            <li key={conversation.id} onClick={() => handleConversationClick(conversation)} className="p-2 cursor-pointer hover:bg-gray-200">
              {conversation.participants.map((p: any) => p.user.username).join(', ')}
            </li>
          ))}
        </ul>
      </div>
      <div className="w-2/3 p-4">
        {selectedConversation ? (
          <div>
            <h2 className="text-xl font-semibold mb-2">Messages</h2>
            <div className="border rounded p-4 h-96 overflow-y-auto">
              {messages.map((message) => (
                <div key={message.id} className="mb-2">
                  <strong>{message.sender.username}:</strong> {message.content}
                </div>
              ))}
            </div>
            <div className="mt-4 flex">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="border rounded w-full p-2"
              />
              <button onClick={handleSendMessage} className="bg-blue-500 text-white p-2 ml-2 rounded">
                Send
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500">Select a conversation to start messaging</div>
        )}
      </div>
    </div>
  );
};

export default MessagingPage;
