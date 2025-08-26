import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { itemsApi, flashcardsApi } from '../utils/api';

const Flashcards = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [sessionItems, setSessionItems] = useState([]);
  const [progress, setProgress] = useState({});

  // Get all items with images
  const { data: allItems = [] } = useQuery({
    queryKey: ['items'],
    queryFn: () => itemsApi.getItems(),
  });

  // Grade mutation
  const gradeMutation = useMutation({
    mutationFn: flashcardsApi.grade,
  });

  // Initialize session with items that have images
  useEffect(() => {
    const itemsWithImages = allItems.filter(item => 
      item.assets && item.assets.length > 0
    );
    
    // Shuffle the items
    const shuffled = [...itemsWithImages].sort(() => Math.random() - 0.5);
    setSessionItems(shuffled);
    setCurrentIndex(0);
    setIsRevealed(false);
  }, [allItems]);

  // Load progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem('flashcards-progress');
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
    }
  }, []);

  // Save progress to localStorage
  const saveProgress = (newProgress) => {
    setProgress(newProgress);
    localStorage.setItem('flashcards-progress', JSON.stringify(newProgress));
  };

  const currentItem = sessionItems[currentIndex];
  const isLastCard = currentIndex === sessionItems.length - 1;

  const formatCost = (cost, currency) => {
    if (cost === null || cost === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(cost);
  };

  const formatDimensions = (dimensions) => {
    if (!dimensions || Object.keys(dimensions).length === 0) return 'N/A';
    
    const parts = [];
    if (dimensions.width) parts.push(`${dimensions.width}${dimensions.unit || ''}`);
    if (dimensions.height) parts.push(`${dimensions.height}${dimensions.unit || ''}`);
    if (dimensions.depth) parts.push(`${dimensions.depth}${dimensions.unit || ''}`);
    if (dimensions.thickness) parts.push(`${dimensions.thickness}${dimensions.unit || ''}`);
    
    return parts.length > 0 ? parts.join(' × ') : 'N/A';
  };

  const handleReveal = () => {
    setIsRevealed(true);
  };

  const handleGrade = async (grade) => {
    if (!currentItem) return;

    // Update local progress
    const newProgress = {
      ...progress,
      [currentItem.id]: {
        ...progress[currentItem.id],
        [grade]: (progress[currentItem.id]?.[grade] || 0) + 1,
        lastSeen: new Date().toISOString(),
      },
    };
    saveProgress(newProgress);

    // Send grade to server
    try {
      await gradeMutation.mutateAsync({
        itemId: currentItem.id,
        grade,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to save grade:', error);
    }

    // Move to next card or end session
    if (isLastCard) {
      // End session
      alert('Session complete! You\'ve reviewed all items.');
      setCurrentIndex(0);
      setIsRevealed(false);
    } else {
      // Next card
      setCurrentIndex(currentIndex + 1);
      setIsRevealed(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsRevealed(false);
  };

  if (sessionItems.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-6xl mb-4">📚</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No items with images found
        </h3>
        <p className="text-gray-500 mb-4">
          Add some items with images to start studying with flashcards.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Flashcards</h2>
            <p className="text-sm text-gray-500">
              Card {currentIndex + 1} of {sessionItems.length}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Progress</div>
            <div className="text-lg font-semibold text-blue-600">
              {Math.round(((currentIndex + 1) / sessionItems.length) * 100)}%
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3 bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / sessionItems.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Flashcard */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        {currentItem && (
          <>
            {/* Front of card */}
            {!isRevealed && (
              <div className="text-center">
                <div className="mb-6">
                  <img
                    src={currentItem.assets[0].url}
                    alt={currentItem.assets[0].alt || currentItem.name}
                    className="w-full max-h-96 object-cover rounded-lg mx-auto"
                  />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {currentItem.name}
                </h3>
                
                <button
                  onClick={handleReveal}
                  className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Reveal Answer
                </button>
              </div>
            )}

            {/* Back of card */}
            {isRevealed && (
              <div className="space-y-6">
                <div className="text-center">
                  <img
                    src={currentItem.assets[0].url}
                    alt={currentItem.assets[0].alt || currentItem.name}
                    className="w-full max-h-64 object-cover rounded-lg mx-auto mb-4"
                  />
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {currentItem.name}
                  </h3>
                  
                  {currentItem.description && (
                    <p className="text-gray-600 mb-4">{currentItem.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-700 mb-1">Cost</div>
                    <div className="text-lg font-semibold text-green-600">
                      {formatCost(currentItem.cost, currentItem.currency)}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-700 mb-1">Dimensions</div>
                    <div className="text-sm text-gray-900">
                      {formatDimensions(currentItem.dimensions)}
                    </div>
                  </div>
                </div>

                {/* Grading buttons */}
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => handleGrade('again')}
                    className="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 transition-colors"
                  >
                    Again
                  </button>
                  
                  <button
                    onClick={() => handleGrade('good')}
                    className="bg-yellow-600 text-white px-6 py-3 rounded-md hover:bg-yellow-700 transition-colors"
                  >
                    Good
                  </button>
                  
                  <button
                    onClick={() => handleGrade('easy')}
                    className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Easy
                  </button>
                </div>

                {/* Session controls */}
                <div className="text-center">
                  <button
                    onClick={handleRestart}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Restart Session
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Progress Stats */}
      {Object.keys(progress).length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Your Progress</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-red-600">
                {Object.values(progress).reduce((sum, item) => sum + (item.again || 0), 0)}
              </div>
              <div className="text-xs text-gray-500">Again</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-yellow-600">
                {Object.values(progress).reduce((sum, item) => sum + (item.good || 0), 0)}
              </div>
              <div className="text-xs text-gray-500">Good</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-600">
                {Object.values(progress).reduce((sum, item) => sum + (item.easy || 0), 0)}
              </div>
              <div className="text-xs text-gray-500">Easy</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Flashcards;
