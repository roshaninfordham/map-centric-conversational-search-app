export interface Location {
  latitude: number;
  longitude: number;
}

export interface PlaceResult {
  id: string;
  name: string;
  rating: number;
  address: string;
  status: 'open' | 'closed' | 'closing_soon';
  category: string;
  position: Location;
  distance: number;
  description: string;
  priceLevel?: number;
  hours?: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  results?: PlaceResult[];
  suggestions?: string[];
  context?: {
    searchQuery?: string;
    filters?: SearchFilters;
    resultCount?: number;
  };
}

export interface SearchFilters {
  radius: number;
  category?: string;
  priceLevel?: number;
  openNow?: boolean;
  budget?: number;
  partySize?: number;
  specificRequirements?: string[];
}