import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, ChevronUp, ChevronDown } from 'lucide-react';
import { ChatMessage } from '../types';
import { ResultsList } from './ResultsList';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  isExpanded: boolean;
  selectedResult: string | null;
  onSendMessage: (message: string) => void;
  onToggleExpanded: () => void;
  onResultSelect: (id: string | null) => void;
  onSuggestionClick: (suggestion: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isLoading,
  isExpanded,
  selectedResult,
  onSendMessage,
  onToggleExpanded,
  onResultSelect,
  onSuggestionClick
}) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const placeholders = [
    "Ask about places, routes, or areas...",
    "Find the best pizza near me",
    "Show me quiet coffee shops for work",
    "Where are the nearest parks?",
    "Find restaurants open late",
  ];
  
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [placeholders.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const latestMessage = messages[messages.length - 1];

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${
        isExpanded ? 'h-full' : 'h-auto max-h-[70vh]'
      }`}
    >
      <div className={`bg-white/95 backdrop-blur-lg rounded-t-3xl shadow-2xl border-t border-gray-200 ${
        isExpanded ? 'h-full' : 'h-auto'
      } flex flex-col`}>
        
        {/* Expand/Collapse Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleExpanded}
          className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-white rounded-full p-3 shadow-lg"
        >
          {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </motion.button>

        {/* Messages Area */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${
          isExpanded ? 'min-h-0' : 'max-h-96'
        }`}>
          {messages.length === 0 && (
            <div className="text-center py-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h2 className="text-2xl font-bold text-gray-800">
                  Ask me anything about places around you
                </h2>
                <p className="text-gray-600">
                  I can help you find restaurants, coffee shops, parks, and more!
                </p>
              </motion.div>
            </div>
          )}

          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.type === 'user' 
                    ? 'bg-blue-600 text-white ml-auto' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        className="w-2 h-2 bg-gray-400 rounded-full"
                      />
                    ))}
                  </div>
                  <span className="text-gray-600 text-sm">Searching the map...</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Results List */}
          {latestMessage && latestMessage.results && latestMessage.results.length > 0 && (
            <ResultsList
              results={latestMessage.results}
              selectedResult={selectedResult}
              onResultSelect={onResultSelect}
            />
          )}

          {/* Suggestions */}
          {latestMessage && latestMessage.suggestions && latestMessage.suggestions.length > 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <p className="text-sm text-gray-600 font-medium">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {latestMessage.suggestions.map((suggestion, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSuggestionClick(suggestion)}
                    className="px-3 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-100 transition-colors duration-200"
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200">
          <form onSubmit={handleSubmit} className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <motion.input
                key={currentPlaceholder}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholders[currentPlaceholder]}
                className="w-full px-4 py-3 rounded-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200 pr-12"
                disabled={isLoading}
              />
              
              <motion.button
                type="button"
                onClick={toggleVoiceInput}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full transition-colors duration-200 ${
                  isListening 
                    ? 'bg-red-500 text-white' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </motion.button>
            </div>
            
            <motion.button
              type="submit"
              disabled={!input.trim() || isLoading}
              whileHover={{ scale: input.trim() && !isLoading ? 1.05 : 1 }}
              whileTap={{ scale: input.trim() && !isLoading ? 0.95 : 1 }}
              className={`p-3 rounded-full transition-all duration-200 ${
                input.trim() && !isLoading
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send size={20} />
            </motion.button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};