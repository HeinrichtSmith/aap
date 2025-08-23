import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  Copy, 
  Check, 
  User, 
  Bot, 
  Code, 
  FileText, 
  Search,
  Sparkles,
  Clock
} from 'lucide-react';
import { playSound } from '../../utils/audio';
import { formatDistanceToNow } from 'date-fns';

const MessageBubble = ({ 
  message, 
  isUser = false, 
  timestamp, 
  type = 'text',
  isTyping = false,
  onCopy
}) => {
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      playSound('success');
      onCopy?.(text);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const getTypeIcon = (msgType) => {
    switch (msgType) {
      case 'code_creation':
        return <Code size={14} className="text-green-400" />;
      case 'code_edit':
        return <FileText size={14} className="text-blue-400" />;
      case 'search_results':
        return <Search size={14} className="text-purple-400" />;
      case 'general_help':
        return <Sparkles size={14} className="text-yellow-400" />;
      default:
        return null;
    }
  };

  const renderCodeBlock = (content) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, match.index)
        });
      }

      // Add code block
      parts.push({
        type: 'code',
        language: match[1] || 'javascript',
        content: match[2].trim()
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex)
      });
    }

    return parts.length > 0 ? parts : [{ type: 'text', content }];
  };

  const renderContent = () => {
    if (isTyping) {
      return (
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <motion.div
              className="w-2 h-2 bg-gray-400 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className="w-2 h-2 bg-gray-400 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div
              className="w-2 h-2 bg-gray-400 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
            />
          </div>
          <span className="text-sm text-gray-400">Claude is thinking...</span>
        </div>
      );
    }

    const parts = renderCodeBlock(message);

    return parts.map((part, index) => {
      if (part.type === 'code') {
        return (
          <div key={index} className="relative group my-3">
            <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                <span className="text-xs text-gray-400 font-mono">
                  {part.language}
                </span>
                <button
                  onClick={() => handleCopy(part.content)}
                  className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors rounded"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <SyntaxHighlighter
                  language={part.language}
                  style={oneDark}
                  customStyle={{
                    margin: 0,
                    padding: '1rem',
                    background: 'transparent',
                    fontSize: '0.875rem'
                  }}
                >
                  {part.content}
                </SyntaxHighlighter>
              </div>
            </div>
          </div>
        );
      } else {
        return (
          <div key={index} className="whitespace-pre-wrap">
            {part.content}
          </div>
        );
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ 
        opacity: isVisible ? 1 : 0, 
        y: isVisible ? 0 : 20,
        scale: isVisible ? 1 : 0.95
      }}
      transition={{ 
        type: "spring",
        stiffness: 400,
        damping: 25,
        duration: 0.4
      }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 group`}
    >
      <div className={`flex items-start space-x-3 max-w-[85%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser 
              ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
              : 'bg-gradient-to-br from-green-500 to-teal-600'
          }`}
        >
          {isUser ? (
            <User size={16} className="text-white" />
          ) : (
            <Bot size={16} className="text-white" />
          )}
        </motion.div>

        {/* Message Content */}
        <div className="flex flex-col">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`relative px-4 py-3 rounded-2xl backdrop-blur-md border ${
              isUser
                ? 'bg-gradient-to-br from-blue-500/90 to-purple-600/90 text-white border-blue-400/30 rounded-br-md'
                : 'bg-gray-900/90 text-gray-100 border-gray-700/50 rounded-bl-md'
            }`}
          >
            {/* Message Type Indicator */}
            {!isUser && type !== 'text' && (
              <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-gray-700/50">
                {getTypeIcon(type)}
                <span className="text-xs text-gray-400 font-medium">
                  {type.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            )}

            {/* Message Content */}
            <div className={`text-sm leading-relaxed ${isUser ? 'text-white' : 'text-gray-100'}`}>
              {renderContent()}
            </div>

            {/* Timestamp */}
            {timestamp && (
              <div className={`flex items-center space-x-1 mt-2 pt-2 border-t ${
                isUser ? 'border-white/20' : 'border-gray-700/50'
              }`}>
                <Clock size={10} className={isUser ? 'text-white/60' : 'text-gray-400'} />
                <span className={`text-xs ${isUser ? 'text-white/60' : 'text-gray-400'}`}>
                  {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
                </span>
              </div>
            )}

            {/* Copy Button for Non-User Messages */}
            {!isUser && !isTyping && (
              <button
                onClick={() => handleCopy(message)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
              </button>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble; 