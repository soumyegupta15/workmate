import React, { useState, useRef, useEffect } from 'react';
import { processAndExecute } from '../../services/aiService';
import { useTheme } from '../../context/theme';
import PrimaryButton from '../buttons/PrimaryButton';
import Loader from '../ui/Loader';

const AIPrompt = ({ orgId, onSuccess, onError, compact = false }) => {
  const t = useTheme();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: "Hello! I'm your AI assistant. I can help you manage tasks, projects, and assignments using natural language. Try saying something like 'Create a task called Fix login bug and assign it to John' or 'Create a new project called Website Redesign'.",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationContext, setConversationContext] = useState({
    partialAction: null,
    providedFields: {},
    missingFields: [],
    actionType: null
  });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim() || loading) {
      return;
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Send conversation context along with the prompt
      const response = await processAndExecute(
        input.trim(), 
        orgId,
        conversationContext
      );
      
      // Check if response indicates a question (missing fields)
      const isQuestion = response?.data?.isQuestion || false;
      const responseMessage = response?.data?.message || '';
      const updatedContext = response?.data?.context || null;
      const action = response?.data?.action || null;
      
      // Update conversation context if provided
      if (updatedContext) {
        setConversationContext(updatedContext);
        
        // Show what information has been collected so far
        if (updatedContext.providedFields && Object.keys(updatedContext.providedFields).length > 0) {
          const collectedInfo = Object.entries(updatedContext.providedFields)
            .filter(([key, value]) => value !== null && value !== undefined && value !== '')
            .map(([key, value]) => {
              if (Array.isArray(value)) {
                return `${key}: ${value.join(', ')}`;
              }
              return `${key}: ${value}`;
            })
            .join(', ');
          
          if (collectedInfo) {
            responseMessage = `${responseMessage}\n\n(So far I have: ${collectedInfo})`;
          }
        }
      }
      
      // Handle different response formats
      let message = 'Action executed successfully!';
      let success = true;
      
      if (isQuestion) {
        // This is a question asking for more information - show as friendly message
        message = responseMessage || 'I need some more information to proceed.';
        success = 'question'; // Special state for questions
      } else if (response?.data?.message) {
        message = response.data.message;
        success = response.data.success !== false;
      } else if (response?.data?.result?.message) {
        message = response.data.result.message;
        success = true;
      } else if (response?.message) {
        message = response.message;
        success = true;
      } else if (response?.data?.result) {
        const result = response.data.result;
        const actionType = response.data?.action?.action || '';
        if (actionType) {
          const actionNames = {
            'create_project': 'Project created',
            'create_task': 'Task created',
            'update_project': 'Project updated',
            'update_task': 'Task updated',
            'assign': 'Task assigned',
            'comment': 'Comment added',
            'notify': 'Notification sent',
          };
          message = `${actionNames[actionType] || 'Action'} executed successfully!`;
        }
        success = true;
      }
      
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: message,
        timestamp: new Date(),
        success: success,
        isQuestion: isQuestion,
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // If successful, clear context and trigger refresh
      if (success === true) {
        // Clear conversation context on success
        setConversationContext({
          partialAction: null,
          providedFields: {},
          missingFields: [],
          actionType: null
        });
        
        if (onSuccess) {
          onSuccess(response.data || response);
        }
        
        // Trigger a refresh of the page data immediately
        // Use a more reliable refresh method
        setTimeout(() => {
          // Force a hard reload to ensure all data is fresh
          if (window.location) {
            window.location.reload();
          }
        }, 300);
      } else if (isQuestion) {
        // If it's a question, keep the context but don't refresh
        // The context will be used in the next message
      }
    } catch (err) {
      // Check if error response contains a question
      const errorData = err?.response?.data;
      const isQuestion = errorData?.isQuestion || false;
      const errorMessage = errorData?.message || err?.response?.data?.error || err?.message || 'Failed to process prompt. Please try again.';
      
      // If it's a question, show as friendly message, not error
      const errorMsg = {
        id: Date.now() + 1,
        type: 'assistant',
        content: isQuestion ? errorMessage : `I encountered an issue: ${errorMessage}. Could you please try again or provide more details?`,
        timestamp: new Date(),
        success: isQuestion ? 'question' : false,
        isQuestion: isQuestion,
      };

      setMessages(prev => [...prev, errorMsg]);
      
      if (onError && !isQuestion) {
        onError(err);
      }
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  if (compact) {
    // Compact mode: just input field with button
    return (
      <div
        style={{
          display: 'flex',
          gap: t.spacing(2),
          alignItems: 'flex-end',
          padding: t.spacing(2),
          backgroundColor: t.colors.secondary || '#f9fafb',
          borderRadius: '8px',
          border: `1px solid ${t.colors.border || '#e5e7eb'}`,
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Ask AI to manage tasks, projects, assignments..."
          disabled={loading}
          style={{
            flex: 1,
            padding: t.spacing(2),
            borderRadius: '8px',
            border: `1px solid ${t.colors.border || '#d1d5db'}`,
            fontFamily: t.font.family,
            fontSize: t.font.size.md,
            resize: 'none',
            minHeight: '50px',
            maxHeight: '100px',
            outline: 'none',
          }}
          rows={2}
        />
        <PrimaryButton
          type="button"
          onClick={handleSubmit}
          disabled={loading || !input.trim()}
        >
          {loading ? <Loader size={20} /> : 'Send'}
        </PrimaryButton>
      </div>
    );
  }

  // Full chat interface
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: compact ? 'auto' : 'calc(100vh - 300px)',
        maxHeight: '700px',
        backgroundColor: t.colors.secondary || '#ffffff',
        borderRadius: '12px',
        overflow: 'hidden',
        border: `1px solid ${t.colors.border || '#e5e7eb'}`,
      }}
    >
      {/* Messages Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: t.spacing(4),
          display: 'flex',
          flexDirection: 'column',
          gap: t.spacing(3),
        }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '75%',
                padding: t.spacing(3),
                borderRadius: '12px',
                backgroundColor: message.type === 'user' 
                  ? t.colors.buttonPrimary || '#3b82f6'
                  : message.success === false
                  ? '#fee2e2'
                  : message.success === 'question'
                  ? '#fef3c7'
                  : '#f3f4f6',
                color: message.type === 'user' 
                  ? '#ffffff'
                  : message.success === false
                  ? '#b91c1c'
                  : message.success === 'question'
                  ? '#92400e'
                  : '#111827',
                fontSize: t.font.size.md,
                lineHeight: 1.6,
                wordWrap: 'break-word',
              }}
            >
              {message.content}
              <div
                style={{
                  fontSize: t.font.size.xs,
                  opacity: 0.7,
                  marginTop: t.spacing(1),
                }}
              >
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
            }}
          >
            <div
              style={{
                padding: t.spacing(3),
                borderRadius: '12px',
                backgroundColor: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                gap: t.spacing(2),
              }}
            >
              <Loader size={20} />
              <span style={{ color: '#6b7280' }}>Processing your request...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        style={{
          borderTop: `1px solid ${t.colors.border || '#e5e7eb'}`,
          padding: t.spacing(3),
          backgroundColor: '#ffffff',
        }}
      >
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: 'flex',
              gap: t.spacing(2),
              alignItems: 'flex-end',
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Type your command here... (e.g., Create a task called 'Fix login bug' and assign it to John)"
              disabled={loading}
              style={{
                flex: 1,
                padding: t.spacing(3),
                borderRadius: '8px',
                border: `1px solid ${t.colors.border || '#d1d5db'}`,
                fontFamily: t.font.family,
                fontSize: t.font.size.md,
                resize: 'none',
                minHeight: '60px',
                maxHeight: '120px',
                outline: 'none',
              }}
              rows={2}
            />
            <PrimaryButton
              type="submit"
              disabled={loading || !input.trim()}
            >
              {loading ? 'Sending...' : 'Send'}
            </PrimaryButton>
          </div>
          <div
            style={{
              marginTop: t.spacing(1),
              fontSize: t.font.size.xs,
              color: '#6b7280',
            }}
          >
            Press Enter to send, Shift+Enter for new line
          </div>
        </form>
      </div>
    </div>
  );
};

export default AIPrompt;
