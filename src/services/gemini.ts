import { GoogleGenerativeAI } from '@google/generative-ai';
import { PlaceResult, Location, SearchFilters } from '../types';

const genAI = new GoogleGenerativeAI('AIzaSyBH-YtVxUUNkcRj3155qMGPj4eABl8W_NQ');

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  async processLocationQuery(
    query: string, 
    userLocation: Location,
    conversationHistory: ChatMessage[] = []
  ): Promise<{ response: string; results: PlaceResult[]; suggestions: string[] }> {
    
    // Build conversation context
    const contextualInfo = this.buildConversationContext(conversationHistory);
    
    const prompt = `
      You are a helpful, conversational location-based assistant. The user is at coordinates (${userLocation.latitude}, ${userLocation.longitude}).
      
      ${contextualInfo.length > 0 ? `CONVERSATION CONTEXT:\n${contextualInfo}\n` : ''}
      
      User query: "${query}"
      
      IMPORTANT INSTRUCTIONS:
      - Be conversational and natural, like talking to a friend
      - If the user is asking follow-up questions about previous results, reference them specifically
      - Consider budget, party size, time constraints, and personal preferences mentioned
      - If filtering previous results, explain what you're doing
      - Use casual, friendly language while being helpful
      
      Please respond in this exact JSON format:
      {
        "response": "A natural, conversational response that acknowledges context and feels personal",
        "searchParams": {
          "category": "category type (restaurant, coffee, park, etc.)",
          "radius": number in meters (500-5000),
          "keywords": ["keyword1", "keyword2"],
          "filters": {
            "openNow": boolean,
            "priceLevel": number 1-4 or null,
            "budget": number or null,
            "partySize": number or null,
            "specificRequirements": ["requirement1", "requirement2"]
          }
        },
        "suggestions": ["Natural follow-up 1", "Personal follow-up 2", "Contextual follow-up 3"],
        "isFollowUp": boolean (true if this is a follow-up to previous results)
      }
      
      Make responses feel like a knowledgeable local friend helping out. Reference previous searches when relevant.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const parsed = JSON.parse(text);
      
      // Generate results based on context and search parameters
      const mockResults = this.generateContextualResults(
        parsed.searchParams, 
        userLocation, 
        conversationHistory,
        parsed.isFollowUp
      );
      
      return {
        response: parsed.response,
        results: mockResults,
        suggestions: parsed.suggestions
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      
      // Fallback response
      return {
        response: "I'm having trouble processing your request right now. Let me try to help you find some nearby places.",
        results: this.generateContextualResults({ category: 'general', radius: 1000, keywords: [] }, userLocation, conversationHistory, false),
        suggestions: ['What restaurants are nearby?', 'Find me some coffee shops', 'Show me parks in the area']
      };
    }
  }

  private buildConversationContext(history: ChatMessage[]): string {
    if (history.length === 0) return '';
    
    const recentMessages = history.slice(-4); // Last 4 messages for context
    let context = '';
    
    recentMessages.forEach((message, index) => {
      if (message.type === 'user') {
        context += `User asked: "${message.content}"\n`;
      } else if (message.type === 'ai' && message.results && message.results.length > 0) {
        context += `I found ${message.results.length} ${message.results[0].category} places: ${message.results.slice(0, 3).map(r => r.name).join(', ')}${message.results.length > 3 ? '...' : ''}\n`;
      }
    });
    
    return context;
  }

  private generateContextualResults(
    searchParams: any, 
    userLocation: Location, 
    conversationHistory: ChatMessage[],
    isFollowUp: boolean
  ): PlaceResult[] {
    // If it's a follow-up, try to filter previous results first
    if (isFollowUp && conversationHistory.length > 0) {
      const lastAiMessage = conversationHistory.slice().reverse().find(m => m.type === 'ai' && m.results);
      if (lastAiMessage && lastAiMessage.results) {
        return this.filterExistingResults(lastAiMessage.results, searchParams);
      }
    }
    
    // Generate new results
    const categories = {
      restaurant: [
        'Mama Rosa\'s Italian', 'Tokyo Sushi Bar', 'The Local Diner', 'Mediterranean Delight',
        'Burger Junction', 'Taco Libre', 'Thai Garden', 'Pizza Corner'
      ],
      coffee: [
        'The Daily Grind', 'Artisan Coffee Co.', 'Corner Café', 'Roasters & Co.',
        'Bubble Tea Paradise', 'Steam Coffee House', 'Bean There', 'Café Luna'
      ],
      park: ['Central Park', 'Riverside Gardens', 'Community Green', 'Oak Tree Park'],
      shopping: ['Fashion Plaza', 'Local Market', 'Boutique Store', 'Department Store'],
      general: ['Popular Spot', 'Local Favorite', 'Community Hub', 'City Center']
    };

    const category = searchParams.category || 'general';
    const names = categories[category as keyof typeof categories] || categories.general;
    const budget = searchParams.filters?.budget;
    const partySize = searchParams.filters?.partySize || 1;
    const requirements = searchParams.filters?.specificRequirements || [];
    
    return names.slice(0, Math.min(6, names.length)).map((name, index) => {
      const basePrice = Math.floor(Math.random() * 25) + 10; // $10-35 per person
      const totalPrice = basePrice * partySize;
      const isWithinBudget = !budget || totalPrice <= budget;
      const rating = isWithinBudget ? 4.0 + Math.random() * 1.0 : 3.5 + Math.random() * 0.8;
      
      // Determine if place meets specific requirements
      const hasBubbleTea = requirements.includes('bubble tea') && (name.includes('Bubble') || Math.random() > 0.7);
      const closingHour = Math.random() > 0.4 ? (21 + Math.floor(Math.random() * 3)) : (20 + Math.floor(Math.random() * 2)); // Some close after 9pm
      const isOpenLate = closingHour > 21;
      
      return {
      id: `place_${index}`,
      name,
      rating: Math.round(rating * 10) / 10,
      address: `${100 + index * 50} Main Street, New York, NY`,
      status: Math.random() > 0.3 ? 'open' : (Math.random() > 0.5 ? 'closed' : 'closing_soon') as 'open' | 'closed' | 'closing_soon',
      category: category,
      position: {
        latitude: userLocation.latitude + (Math.random() - 0.5) * 0.01,
        longitude: userLocation.longitude + (Math.random() - 0.5) * 0.01
      },
      distance: Math.round(Math.random() * 1000 + 100),
      description: this.generateContextualDescription(name, category, hasBubbleTea, isOpenLate, isWithinBudget, partySize),
      priceLevel: Math.ceil(totalPrice / partySize / 10), // Convert to 1-4 scale
      hours: `Open until ${closingHour}:00 ${closingHour >= 12 ? 'PM' : 'AM'}`
      };
    }).filter(place => {
      // Filter based on requirements
      if (budget && (place.priceLevel || 1) * 10 * partySize > budget) return false;
      if (requirements.includes('bubble tea') && !place.description.toLowerCase().includes('bubble tea')) return false;
      if (requirements.includes('open late') && !place.hours.includes('2') && !place.hours.includes('1')) return false;
      return true;
    });
  }

  private filterExistingResults(existingResults: PlaceResult[], searchParams: any): PlaceResult[] {
    const budget = searchParams.filters?.budget;
    const partySize = searchParams.filters?.partySize || 1;
    const requirements = searchParams.filters?.specificRequirements || [];
    
    return existingResults.filter(place => {
      // Budget filter
      if (budget) {
        const estimatedCost = (place.priceLevel || 2) * 10 * partySize;
        if (estimatedCost > budget) return false;
      }
      
      // Specific requirements
      if (requirements.includes('bubble tea') && !place.description.toLowerCase().includes('bubble tea')) {
        return false;
      }
      
      if (requirements.includes('open late')) {
        const hour = parseInt(place.hours.match(/\d+/)?.[0] || '20');
        if (hour <= 21) return false;
      }
      
      return true;
    });
  }

  private generateContextualDescription(
    name: string, 
    category: string, 
    hasBubbleTea: boolean, 
    isOpenLate: boolean, 
    isWithinBudget: boolean,
    partySize: number
  ): string {
    let description = `A ${isWithinBudget ? 'great value' : 'premium'} ${category} spot`;
    
    if (partySize > 1) {
      description += ` perfect for groups`;
    }
    
    if (hasBubbleTea) {
      description += ` with amazing bubble tea options`;
    }
    
    if (isOpenLate) {
      description += ` that stays open late`;
    }
    
    description += '. Highly rated by locals!';
    
    return description;
  }
}

export const geminiService = new GeminiService();