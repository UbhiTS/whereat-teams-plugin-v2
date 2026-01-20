import React, { useState, useRef, useEffect } from 'react';
import { User, ChatMessage } from '../types';
import { 
  Text, 
  Button,
  Input,
  Avatar
} from '@fluentui/react-components';
import { 
  ChatRegular,
  SendRegular,
  DismissRegular,
  ChevronDownRegular
} from '@fluentui/react-icons';
import { apiService } from '../services/api';

interface ChatPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  currentUser: User | null;
  managementChainWidth?: number;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  isOpen,
  onToggle,
  currentUser,
  managementChainWidth = 320
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await apiService.sendChatMessage(
        inputValue,
        currentUser?.userPrincipalName
      );

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessageContent = (content: string) => {
    // Simple markdown-like rendering
    const lines = content.split('\n');
    return lines.map((line, index) => {
      // Bold text
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Bullet points
      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <div key={index} className="message-bullet" dangerouslySetInnerHTML={{ __html: line }} />
        );
      }
      
      // Numbered lists
      if (/^\d+\.\s/.test(line)) {
        return (
          <div key={index} className="message-numbered" dangerouslySetInnerHTML={{ __html: line }} />
        );
      }

      return (
        <div key={index} dangerouslySetInnerHTML={{ __html: line || '<br/>' }} />
      );
    });
  };

  if (!isOpen) {
    // Position button 16px from the panel edge (or screen edge if panel is closed)
    const buttonRight = managementChainWidth + 16;
    return (
      <button 
        className="chat-toggle-button" 
        onClick={onToggle} 
        title="Open Chat"
        style={{ right: buttonRight }}
      >
        <ChatRegular fontSize={24} />
        <span className="chat-toggle-label">Team Insights AI Assistant</span>
      </button>
    );
  }

  return (
    <div className="chat-panel" style={{ right: managementChainWidth }}>
      <div className="chat-header">
        <div className="chat-header-left">
          <ChatRegular fontSize={20} />
          <Text size={400} weight="semibold">Team Insights AI Assistant</Text>
        </div>
        <div className="chat-header-right">
          <Button
            appearance="subtle"
            icon={<ChevronDownRegular />}
            onClick={onToggle}
            title="Minimize"
          />
        </div>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-welcome">
            <Text size={300}>
              Ask anything about employee locations or team structure...
            </Text>
            <div className="suggested-questions">
              <button 
                className="suggested-question"
                onClick={() => setInputValue("How many engineers are in the London office?")}
              >
                How many engineers are in the London office?
              </button>
              <button 
                className="suggested-question"
                onClick={() => setInputValue("Show me the time zone overlap for my team")}
              >
                Show me the time zone overlap for my team
              </button>
              <button 
                className="suggested-question"
                onClick={() => setInputValue("Who are my direct reports?")}
              >
                Who are my direct reports?
              </button>
            </div>
          </div>
        )}

        {messages.map(message => (
          <div key={message.id} className={`chat-message ${message.role}`}>
            <div className="message-avatar">
              {message.role === 'user' ? (
                <Avatar
                  image={{ src: currentUser?.photo }}
                  name={currentUser?.displayName || 'You'}
                  size={28}
                />
              ) : (
                <div className="ai-avatar">AI</div>
              )}
            </div>
            <div className="message-content">
              {renderMessageContent(message.content)}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="chat-message assistant">
            <div className="message-avatar">
              <div className="ai-avatar">AI</div>
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <Input
          className="chat-input"
          placeholder="Ask anything about employee locations or team structure..."
          value={inputValue}
          onChange={(e, data) => setInputValue(data.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
        />
        <Button
          appearance="primary"
          icon={<SendRegular />}
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isLoading}
          title="Send"
        />
      </div>
    </div>
  );
};

export default ChatPanel;
