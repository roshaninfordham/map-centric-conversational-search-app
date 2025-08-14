import { GoogleGenerativeAI } from '@google/generative-ai';
import { PlaceResult, Location, SearchFilters } from '../types';

const genAI = new GoogleGenerativeAI('AIzaSyBH-YtVxUUNkcRj3155qMGPj4eABl8W_NQ');

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  async processLocationQuery(
    query: string, 
    userLocation: Location
  ): Promise<{ response: string; results: PlaceResult[]; suggestions: string[] }> {
    const prompt = `
      You are a helpful location-based assistant. The user is at coordinates (${userLocation.latitude}, ${userLocation.longitude}).
      
      User query: "${query}"
      
      Please respond in this exact JSON format:
      {
        "response": "A conversational response to the user",
        "searchParams": {
          "category": "category type (restaurant, coffee, park, etc.)",
          "radius": number in meters (500-5000),
          "keywords": ["keyword1", "keyword2"],
          "filters": {
            "openNow": boolean,
            "priceLevel": number 1-4 or null
          }
        },
        "suggestions": ["Follow-up question 1", "Follow-up question 2", "Follow-up question 3"]
      }
      
      Make the response conversational and helpful. Generate realistic follow-up suggestions.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const parsed = JSON.parse(text);
      
      // Simulate realistic place results based on the search parameters
      const mockResults = this.generateMockResults(parsed.searchParams, userLocation);
      
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
        results: this.generateMockResults({ category: 'general', radius: 1000, keywords: [] }, userLocation),
        suggestions: ['Show me restaurants nearby', 'Find coffee shops', 'Where are the parks?']
      };
    }
  }

  private generateMockResults(searchParams: any, userLocation: Location): PlaceResult[] {
    const categories = {
      restaurant: ['Italian Bistro', 'Sushi House', 'Local Diner', 'Mediterranean Grill'],
      coffee: ['The Daily Grind', 'Artisan Coffee Co.', 'Corner Café', 'Roasters & Co.'],
      park: ['Central Park', 'Riverside Gardens', 'Community Green', 'Oak Tree Park'],
      shopping: ['Fashion Plaza', 'Local Market', 'Boutique Store', 'Department Store'],
      general: ['Popular Spot', 'Local Favorite', 'Community Hub', 'City Center']
    };

    const category = searchParams.category || 'general';
    const names = categories[category as keyof typeof categories] || categories.general;
    
    return names.map((name, index) => ({
      id: `place_${index}`,
      name,
      rating: Math.round((4.0 + Math.random() * 1.0) * 10) / 10,
      address: `${100 + index * 50} Main Street, New York, NY`,
      status: Math.random() > 0.3 ? 'open' : (Math.random() > 0.5 ? 'closed' : 'closing_soon') as 'open' | 'closed' | 'closing_soon',
      category: category,
      position: {
        latitude: userLocation.latitude + (Math.random() - 0.5) * 0.01,
        longitude: userLocation.longitude + (Math.random() - 0.5) * 0.01
      },
      distance: Math.round(Math.random() * 1000 + 100),
      description: `A great ${category} spot in your area with excellent reviews.`,
      priceLevel: Math.floor(Math.random() * 4) + 1,
      hours: 'Open until 9:00 PM'
    }));
  }
}

export const geminiService = new GeminiService();