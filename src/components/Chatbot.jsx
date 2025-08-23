import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  User,
  Loader,
  Terminal,
  Sparkles,
  Command
} from 'lucide-react';
import { 
  connectToTerminal, 
  sendTerminalMessage, 
  executeTerminalCommand,
  onTerminalMessage, 
  onTerminalStatusChange,
  getTerminalStatus 
} from '../services/terminalConnector';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: 'Hello! I\'m the Arrowhead Polaris assistant. I can help you with warehouse operations, answer questions, and connect to the terminal system. How can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Connect to terminal system (WebSocket or API)
  useEffect(() => {
    if (isOpen && !isConnected) {
      // Connect to actual terminal system
      connectToTerminal();
      
      // Set up message handler
      onTerminalMessage((data) => {
        const botResponse = {
          id: Date.now(),
          type: 'bot',
          text: data.message || JSON.stringify(data),
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botResponse]);
        setIsTyping(false);
      });
      
      // Set up status change handler
      onTerminalStatusChange((status) => {
        setIsConnected(status);
      });
    }
  }, [isOpen, isConnected]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Send to terminal system or handle locally
    if (inputValue.startsWith('/')) {
      // Execute terminal command
      const result = await executeTerminalCommand(inputValue);
      
      // Show immediate feedback
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        text: result.message,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
      
      // If it's not a local command, wait for terminal response
      if (result.type === 'command') {
        // Terminal will respond via onTerminalMessage callback
      } else {
        setIsTyping(false);
      }
    } else {
      // Regular message - check if connected to terminal
      if (isConnected) {
        // Send to terminal system
        sendTerminalMessage(inputValue);
        // Response will come via onTerminalMessage callback
      } else {
        // Fallback to local response
        setTimeout(() => {
          const botResponse = {
            id: Date.now() + 1,
            type: 'bot',
            text: generateResponse(inputValue),
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
          setIsTyping(false);
        }, 1000 + Math.random() * 1000);
      }
    }
  };

  // Simulate intelligent responses based on keywords
  const generateResponse = (input) => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('pick') || lowerInput.includes('order')) {
      return 'I can help you with picking orders. You currently have 12 orders pending. Would you like to see the priority orders or start picking?';
    } else if (lowerInput.includes('stock') || lowerInput.includes('inventory')) {
      return 'For stock control, I can check current inventory levels, low stock alerts, or help with stock adjustments. What specific information do you need?';
    } else if (lowerInput.includes('help')) {
      return 'I can assist with:\n• Order picking and packing\n• Stock control and inventory\n• Inwards goods processing\n• System navigation\n• Terminal commands\n\nWhat would you like help with?';
    } else if (lowerInput.includes('terminal') || lowerInput.includes('command')) {
      return 'Terminal access enabled. You can use commands like:\n• /status - Check system status\n• /orders - View pending orders\n• /stock [SKU] - Check stock levels\n• /help - Show all commands';
    } else {
      return `I understand you're asking about "${input}". Let me connect to the terminal system to get that information for you...`;
    }
  };

  const quickActions = [
    { icon: MessageSquare, label: 'Check Orders', action: 'Show me pending orders' },
    { icon: Terminal, label: 'Terminal', action: '/help' },
    { icon: Command, label: 'Commands', action: 'Show available commands' }
  ];

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full shadow-lg shadow-blue-500/25 flex items-center justify-center text-white hover:shadow-xl hover:shadow-blue-500/30 transition-shadow"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <MessageSquare size={24} />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-96 h-[600px] bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Polaris Assistant</h3>
                  <p className="text-white/80 text-xs flex items-center">
                    {isConnected ? (
                      <>
                        <span className="w-2 h-2 bg-green-400 rounded-full mr-1" />
                        Connected to Terminal
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 bg-yellow-400 rounded-full mr-1 animate-pulse" />
                        Connecting...
                      </>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-[80%] ${
                    message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'user' 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                        : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                    }`}>
                      {message.type === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
                    </div>
                    <div className={`rounded-2xl px-4 py-2 ${
                      message.type === 'user' 
                        ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white' 
                        : 'bg-gray-800 text-gray-200'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center space-x-2"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Bot size={16} className="text-white" />
                  </div>
                  <div className="bg-gray-800 rounded-2xl px-4 py-2">
                    <motion.div className="flex space-x-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.5, delay: i * 0.1, repeat: Infinity }}
                          className="w-2 h-2 bg-gray-500 rounded-full"
                        />
                      ))}
                    </motion.div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-2 flex space-x-2 overflow-x-auto">
              {quickActions.map((action, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setInputValue(action.action);
                    inputRef.current?.focus();
                  }}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-full text-xs text-gray-300 whitespace-nowrap transition-colors"
                >
                  <action.icon size={14} />
                  <span>{action.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-gray-800">
              <div className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;