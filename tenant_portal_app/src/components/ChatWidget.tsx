/**
 * AI Chat Widget Component
 * A floating chat widget for tenant inquiries
 * 
 * Features:
 * - Collapsible chat window
 * - Message history
 * - Suggested actions as clickable buttons
 * - Related questions
 * - Confidence indicators
 * - Quick FAQ access
 * 
 * @domain Shared Components
 */

import React, { useState, useRef, useEffect } from 'react';
import { chatbotService } from '../domains/shared/ai-services/chatbot';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  confidence?: number;
  suggestedActions?: Array<{
    label: string;
    action: string;
    params?: Record<string, any>;
  }>;
  relatedQuestions?: string[];
}

interface ChatWidgetProps {
  userId: string;
  className?: string;
}

export function ChatWidget({ userId, className = '' }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load popular FAQs on open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Show welcome message with popular FAQs
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: 'Hi! I\'m your AI assistant. How can I help you today?',
        timestamp: new Date().toISOString(),
        relatedQuestions: chatbotService.getPopularFAQs(5).map((faq: any) => faq.question),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { response, sessionId: newSessionId, messageId } = await chatbotService.sendMessage(
        userId,
        input,
        sessionId
      );

      setSessionId(newSessionId);

      const assistantMessage: Message = {
        id: messageId,
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString(),
        confidence: response.confidence,
        suggestedActions: response.suggestedActions,
        relatedQuestions: response.relatedQuestions,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again or contact property management.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = async (question: string) => {
    setInput(question);
    // Trigger send after setting input
    setTimeout(() => handleSend(), 100);
  };

  const handleAction = (action: string, params?: Record<string, any>) => {
    switch (action) {
      case 'navigate':
        if (params?.page) {
          window.location.href = params.page;
        }
        break;
      case 'call':
        if (params?.phone) {
          window.location.href = `tel:${params.phone}`;
        }
        break;
      default:
        console.log('Unknown action:', action, params);
    }
  };

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';

    return (
      <div
        key={message.id}
        className={`message ${isUser ? 'message-user' : 'message-assistant'}`}
        style={{
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          marginBottom: '12px',
        }}
      >
        <div
          style={{
            maxWidth: '80%',
            padding: '12px 16px',
            borderRadius: '12px',
            backgroundColor: isUser ? '#007bff' : '#f0f0f0',
            color: isUser ? 'white' : 'black',
          }}
        >
          <div>{message.content}</div>

          {/* Confidence indicator */}
          {!isUser && message.confidence && (
            <div style={{ fontSize: '11px', marginTop: '6px', opacity: 0.7 }}>
              Confidence: {(message.confidence * 100).toFixed(0)}%
            </div>
          )}

          {/* Suggested actions */}
          {!isUser && message.suggestedActions && message.suggestedActions.length > 0 && (
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {message.suggestedActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAction(action.action, action.params)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    border: '1px solid #007bff',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    color: '#007bff',
                    cursor: 'pointer',
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* Related questions */}
          {!isUser && message.relatedQuestions && message.relatedQuestions.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '12px', marginBottom: '6px', fontWeight: 'bold' }}>
                Related questions:
              </div>
              {message.relatedQuestions.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickQuestion(question)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 0',
                    fontSize: '13px',
                    background: 'none',
                    border: 'none',
                    color: '#007bff',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  {question}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!isOpen) {
    // Floating button
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`chat-widget-button ${className}`}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          cursor: 'pointer',
          fontSize: '24px',
          zIndex: 1000,
        }}
        aria-label="Open chat"
      >
        💬
      </button>
    );
  }

  return (
    <div
      className={`chat-widget ${className}`}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '380px',
        height: '600px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          backgroundColor: '#007bff',
          color: 'white',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>🤖</span>
          <div>
            <div style={{ fontWeight: 'bold' }}>AI Assistant</div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>Always here to help</div>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '0',
            lineHeight: '1',
          }}
          aria-label="Close chat"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          backgroundColor: '#fafafa',
        }}
      >
        {messages.map(renderMessage)}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: '#f0f0f0',
              }}
            >
              <span className="typing-indicator">●●●</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid #e0e0e0',
          display: 'flex',
          gap: '8px',
        }}
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask a question..."
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '10px 14px',
            border: '1px solid #d0d0d0',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
          }}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
            opacity: isLoading || !input.trim() ? 0.5 : 1,
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatWidget;
