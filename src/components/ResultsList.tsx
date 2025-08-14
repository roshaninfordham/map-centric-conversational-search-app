import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Star, DollarSign, Navigation } from 'lucide-react';
import { PlaceResult } from '../types';

interface ResultsListProps {
  results: PlaceResult[];
  selectedResult: string | null;
  onResultSelect: (id: string | null) => void;
}

export const ResultsList: React.FC<ResultsListProps> = ({
  results,
  selectedResult,
  onResultSelect
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'text-green-600 bg-green-50';
      case 'closing_soon':
        return 'text-yellow-600 bg-yellow-50';
      case 'closed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'Open';
      case 'closing_soon':
        return 'Closing Soon';
      case 'closed':
        return 'Closed';
      default:
        return 'Unknown';
    }
  };

  const getPriceLevelDisplay = (level?: number) => {
    if (!level) return null;
    return '$'.repeat(level) + '○'.repeat(4 - level);
  };

  if (results.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
        <MapPin size={18} />
        Found {results.length} places
      </h3>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {results.map((result, index) => (
          <motion.div
            key={result.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onResultSelect(selectedResult === result.id ? null : result.id)}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
              selectedResult === result.id
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 mb-1">{result.name}</h4>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-yellow-400 fill-current" />
                    <span className="font-medium">{result.rating}</span>
                  </div>
                  
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                    {getStatusText(result.status)}
                  </span>
                  
                  {result.priceLevel && (
                    <div className="flex items-center gap-1 text-gray-500">
                      <span className="text-xs font-medium">
                        {getPriceLevelDisplay(result.priceLevel)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-right text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Navigation size={12} />
                  <span>{result.distance}m</span>
                </div>
                {result.hours && (
                  <div className="flex items-center gap-1 mt-1">
                    <Clock size={12} />
                    <span className="text-xs">{result.hours}</span>
                  </div>
                )}
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">{result.description}</p>
            
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">{result.address}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  // In a real app, this would open directions
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${result.position.latitude},${result.position.longitude}`,
                    '_blank'
                  );
                }}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors duration-200"
              >
                Directions
              </motion.button>
            </div>
            
            {selectedResult === result.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t border-gray-200"
              >
                <p className="text-sm text-gray-600">
                  Category: <span className="font-medium capitalize">{result.category}</span>
                </p>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};