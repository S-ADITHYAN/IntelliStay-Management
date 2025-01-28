import React, { useState, useRef, useEffect } from 'react';
import { FaRobot, FaTimes, FaPaperPlane, FaHotel, FaUtensils, FaPhoneAlt } from 'react-icons/fa';
import { MdRoomService } from 'react-icons/md';
import { generateResponse } from '../../services/chatService';
import './Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(true);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      content: 'Welcome to IntelliStay! 👋 I\'m your virtual concierge. How may I assist you today?',
      options: [
        { text: 'Room Booking', icon: <FaHotel /> },
        { text: 'Restaurant', icon: <FaUtensils /> },
        { text: 'Services', icon: <MdRoomService /> },
        { text: 'Contact Us', icon: <FaPhoneAlt /> }
      ]
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Hide welcome popup after 5 seconds or when clicked
  useEffect(() => {
    if (showWelcomePopup) {
      const timer = setTimeout(() => {
        setShowWelcomePopup(false);
      }, 100000);
      return () => clearTimeout(timer);
    }
  }, [showWelcomePopup]);

  const handleSendMessage = async (userMessage) => {
    if (!userMessage.trim()) return;
    
    setError(null);
    const newUserMessage = {
      type: 'user',
      content: userMessage
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Simulate natural typing delay
      const typingDelay = Math.min(1000, userMessage.length * 50);
      await new Promise(resolve => setTimeout(resolve, typingDelay));
      
      // Use OpenAI to generate response
      const botResponse = await generateResponse(userMessage);
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setError('Oops! Something went wrong. Please try again.');
      setMessages(prev => [...prev, {
        type: 'bot',
        content: 'I apologize, but I encountered an error. Please try selecting one of these options:',
        options: [
          { text: 'Room Booking', icon: <FaHotel /> },
          { text: 'Restaurant', icon: <FaUtensils /> },
          { text: 'Services', icon: <MdRoomService /> },
          { text: 'Contact Us', icon: <FaPhoneAlt /> }
        ]
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleOptionClick = (option) => {
    handleSendMessage(option.text);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && inputMessage.trim()) {
      e.preventDefault();
      handleSendMessage(inputMessage);
    }
  };

  return (
    <div className="chatbot-container">
      {showWelcomePopup && !isOpen && (
        <div className="welcome-popup">
          <div className="welcome-content">
            <FaRobot className="welcome-icon" />
            <p>I am IntelliBot! How may I help you?</p>
            <button 
              className="close-welcome" 
              onClick={() => setShowWelcomePopup(false)}
              aria-label="Close welcome message"
            >
              <FaTimes />
            </button>
          </div>
          <div className="welcome-arrow"></div>
        </div>
      )}

      <button 
        className={`chatbot-toggle ${isOpen ? 'open' : ''} ${isTyping ? 'typing' : ''}`}
        onClick={() => {
          setIsOpen(!isOpen);
          setShowWelcomePopup(false);
        }}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? <FaTimes /> : <FaRobot />}
      </button>

      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <FaRobot className="chatbot-icon pulse" />
            <div className="header-text">
              <h3>IntelliBot Assistant</h3>
              <span className="status">Online</span>
            </div>
          </div>

          <div className="chatbot-messages" role="log">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`message ${message.type}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="message-content">
                  {message.type === 'bot' && <FaRobot className="message-icon" />}
                  <p>{message.content}</p>
                </div>
                {message.options && (
                  <div className="message-options">
                    {message.options.map((option, optIndex) => (
                      <button 
                        key={optIndex}
                        onClick={() => handleOptionClick(option)}
                        className="option-button"
                      >
                        {option.icon}
                        <span>{option.text}</span>
                      </button>
                    ))}
                  </div>
                )}
                {message.formattedData && (
                  <div className="formatted-data">
                    {Array.isArray(message.formattedData) ? (
                      message.formattedData.map((section, idx) => (
                        <div key={idx} className="data-section">
                          <h4>{section.title}</h4>
                          <ul>
                            {section.points.map((point, i) => (
                              <li key={i}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      ))
                    ) : message.formattedData.restaurantInfo ? (
                      <div className="restaurant-data">
                        <div className="restaurant-info">
                          {message.formattedData.restaurantInfo.map((info, idx) => (
                            <p key={idx}>{info}</p>
                          ))}
                        </div>
                        <div className="menu-sections">
                          {message.formattedData.menu.map((section, idx) => (
                            <div key={idx} className="menu-section">
                              <h4>{section.category}</h4>
                              <ul>
                                {section.items.map((item, i) => (
                                  <li key={i}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="message bot typing">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              aria-label="Chat input"
              disabled={isTyping}
            />
            <button 
              onClick={() => handleSendMessage(inputMessage)}
              className="send-button"
              disabled={!inputMessage.trim() || isTyping}
              aria-label="Send message"
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot; 