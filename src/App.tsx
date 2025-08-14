import React, { useState, useEffect, useCallback } from 'react';
import { MapView } from './components/MapView';
import { ChatInterface } from './components/ChatInterface';
import { OnboardingModal } from './components/OnboardingModal';
import { LocationService } from './services/location';
import { geminiService } from './services/gemini';
import { Location, ChatMessage, PlaceResult } from './types';

function App() {
  const [userLocation, setUserLocation] = useState<Location>({ latitude: 40.7589, longitude: -73.9851 });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [selectedResult, setSelectedResult] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    try {
      const location = await LocationService.getCurrentLocation();
      setUserLocation(location);
    } catch (error) {
      console.error('Failed to get location:', error);
    }
  };

  const handleSendMessage = useCallback(async (content: string) => {
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setSelectedResult(null);

    try {
      const response = await geminiService.processLocationQuery(content, userLocation, messages);
      
      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: response.response,
        timestamp: new Date(),
        results: response.results,
        suggestions: response.suggestions,
        context: {
          searchQuery: content,
          resultCount: response.results.length
        }
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to process message:', error);
      
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        type: 'ai',
        content: "Sorry, I'm having a bit of trouble right now. Could you try asking again?",
        timestamp: new Date(),
        suggestions: ['What restaurants are nearby?', 'Find me coffee shops', 'Show me some parks']
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [userLocation]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    handleSendMessage(suggestion);
  }, [handleSendMessage]);

  const handleRecenterMap = useCallback(() => {
    initializeLocation();
  }, []);

  const getCurrentResults = (): PlaceResult[] => {
    const latestMessage = messages[messages.length - 1];
    return latestMessage?.results || [];
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-100">
      <MapView
        center={userLocation}
        results={getCurrentResults()}
        selectedResult={selectedResult}
        onResultSelect={setSelectedResult}
        onRecenterClick={handleRecenterMap}
      />
      
      <ChatInterface
        messages={messages}
        isLoading={isLoading}
        isExpanded={isChatExpanded}
        selectedResult={selectedResult}
        onSendMessage={handleSendMessage}
        onToggleExpanded={() => setIsChatExpanded(!isChatExpanded)}
        onResultSelect={setSelectedResult}
        onSuggestionClick={handleSuggestionClick}
      />

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </div>
  );
}

export default App;