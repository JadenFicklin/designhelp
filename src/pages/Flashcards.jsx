import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { itemsApi, flashcardsApi } from '../utils/api';

const Flashcards = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [sessionItems, setSessionItems] = useState([]);
  const [progress, setProgress] = useState({});
  const [studyMode, setStudyMode] = useState('all'); // 'all', 'difficult', 'new', 'review'
  const [sessionStats, setSessionStats] = useState({ again: 0, good: 0, easy: 0 });

  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [keyboardEnabled, setKeyboardEnabled] = useState(true);

  // Get all items
  const { data: allItems = [] } = useQuery({
    queryKey: ['items'],
    queryFn: () => itemsApi.getItems(),
  });

  // Grade mutation
  const gradeMutation = useMutation({
    mutationFn: flashcardsApi.grade,
  });

  // Load progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem('flashcards-progress');
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
    }
  }, []);

  // Save progress to localStorage
  const saveProgress = useCallback((newProgress) => {
    setProgress(newProgress);
    localStorage.setItem('flashcards-progress', JSON.stringify(newProgress));
  }, []);

  // Initialize session based on study mode
  const initializeSession = useCallback(() => {
    let filteredItems = allItems.filter(item => item.assets && item.assets.length > 0);
    
    switch (studyMode) {
      case 'difficult':
        filteredItems = filteredItems.filter(item => {
          const itemProgress = progress[item.id];
          return itemProgress && (itemProgress.again || 0) > (itemProgress.easy || 0);
        });
        break;
      case 'new':
        filteredItems = filteredItems.filter(item => !progress[item.id]);
        break;
      case 'review':
        filteredItems = filteredItems.filter(item => progress[item.id]);
        break;
      default:
        break;
    }

    if (filteredItems.length === 0) {
      setSessionItems([]);
      return;
    }

    // Shuffle the items
    const shuffled = [...filteredItems].sort(() => Math.random() - 0.5);
    setSessionItems(shuffled);
    setCurrentIndex(0);
    setIsRevealed(false);
    setIsSessionComplete(false);
    setSessionStats({ again: 0, good: 0, easy: 0 });
    setSessionStartTime(new Date());
  }, [allItems, studyMode, progress]);

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

  const handleReveal = useCallback(() => {
    setIsRevealed(!isRevealed);
  }, [isRevealed]);

  const handleGrade = useCallback(async (grade) => {
    if (!currentItem) return;

    // Update session stats
    setSessionStats(prev => ({
      ...prev,
      [grade]: prev[grade] + 1
    }));

    // Update local progress
    const newProgress = {
      ...progress,
      [currentItem.id]: {
        ...progress[currentItem.id],
        [grade]: (progress[currentItem.id]?.[grade] || 0) + 1,
        lastSeen: new Date().toISOString(),
        totalReviews: (progress[currentItem.id]?.totalReviews || 0) + 1,
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
      setIsSessionComplete(true);
    } else {
      setCurrentIndex(currentIndex + 1);
      setIsRevealed(false);
    }
  }, [currentItem, progress, saveProgress, gradeMutation, isLastCard, currentIndex]);

  // Only initialize session when study mode changes or when manually called
  useEffect(() => {
    if (allItems.length > 0) {
      initializeSession();
    }
  }, [allItems, studyMode, initializeSession]); // Added initializeSession dependency

  // Keyboard shortcuts
  useEffect(() => {
    if (!keyboardEnabled) return;

    const handleKeyPress = (e) => {
      if (isSessionComplete) return;
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          handleReveal();
          break;
        case 'ArrowLeft':
          if (isRevealed) handleGrade('again');
          break;
        case 'ArrowDown':
          if (isRevealed) handleGrade('good');
          break;
        case 'ArrowRight':
          if (isRevealed) handleGrade('easy');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isRevealed, isSessionComplete, keyboardEnabled, handleGrade, handleReveal]);

  const handleRestart = () => {
    initializeSession();
  };

  const getStudyModeDescription = () => {
    switch (studyMode) {
      case 'all': return 'Study all items with images';
      case 'difficult': return 'Focus on items you struggle with';
      case 'new': return 'Study items you haven\'t seen before';
      case 'review': return 'Review items you\'ve studied before';
      default: return '';
    }
  };

  const getSessionDuration = () => {
    if (!sessionStartTime) return '0:00';
    const duration = new Date() - sessionStartTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getAccuracy = () => {
    const total = sessionStats.again + sessionStats.good + sessionStats.easy;
    if (total === 0) return 0;
    return Math.round(((sessionStats.good + sessionStats.easy) / total) * 100);
  };

  if (sessionItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Study Mode Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Flashcards</h2>
          <p className="text-gray-600 mb-6">Choose your study mode to begin</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { mode: 'all', title: 'All Items', icon: '📚', count: allItems.filter(item => item.assets?.length > 0).length },
              { mode: 'new', title: 'New Items', icon: '🆕', count: allItems.filter(item => item.assets?.length > 0 && !progress[item.id]).length },
              { mode: 'review', title: 'Review', icon: '🔄', count: allItems.filter(item => item.assets?.length > 0 && progress[item.id]).length },
              { mode: 'difficult', title: 'Difficult', icon: '⚠️', count: allItems.filter(item => {
                const itemProgress = progress[item.id];
                return item.assets?.length > 0 && itemProgress && (itemProgress.again || 0) > (itemProgress.easy || 0);
              }).length }
            ].map(({ mode, title, icon, count }) => (
              <button
                key={mode}
                onClick={() => setStudyMode(mode)}
                className={`p-6 rounded-lg border-2 transition-all ${
                  studyMode === mode
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-2">{icon}</div>
                <div className="font-semibold text-gray-900">{title}</div>
                <div className="text-sm text-gray-500">{count} items</div>
              </button>
            ))}
          </div>

          {studyMode && (
            <div className="mt-6 text-center">
              <button
                onClick={initializeSession}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Start Studying
              </button>
            </div>
          )}
        </div>

        {/* Overall Stats */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Study Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {Object.keys(progress).length}
              </div>
              <div className="text-sm text-gray-600">Items Studied</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {Object.values(progress).reduce((sum, item) => sum + (item.again || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Again</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {Object.values(progress).reduce((sum, item) => sum + (item.good || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Good</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {Object.values(progress).reduce((sum, item) => sum + (item.easy || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Easy</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSessionComplete) {
    const totalCards = sessionItems.length;
    const totalGrades = sessionStats.again + sessionStats.good + sessionStats.easy;
    const accuracy = totalGrades > 0 ? Math.round(((sessionStats.good + sessionStats.easy) / totalGrades) * 100) : 0;
    const duration = getSessionDuration();



    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Session Complete!</h2>
          <p className="text-gray-600 mb-6">Great job! You've reviewed all {totalCards} items.</p>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{sessionStats.again}</div>
              <div className="text-sm text-gray-600">Again</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{sessionStats.good}</div>
              <div className="text-sm text-gray-600">Good</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{sessionStats.easy}</div>
              <div className="text-sm text-gray-600">Easy</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">{accuracy}%</div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-purple-600">{duration}</div>
              <div className="text-sm text-gray-600">Duration</div>
            </div>
          </div>

          <div className="space-x-4">
            <button
              onClick={handleRestart}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Study Again
            </button>
            <button
              onClick={() => setStudyMode('all')}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Change Mode
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Enhanced Progress Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Flashcards</h2>
            <p className="text-gray-600">{getStudyModeDescription()}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Session Time</div>
            <div className="text-lg font-semibold text-purple-600">{getSessionDuration()}</div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-gray-500">Progress</div>
            <div className="text-lg font-semibold text-blue-600">
              {currentIndex + 1} / {sessionItems.length}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Accuracy</div>
            <div className="text-lg font-semibold text-green-600">{getAccuracy()}%</div>
          </div>
        </div>
        
        {/* Enhanced Progress bar */}
        <div className="bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / sessionItems.length) * 100}%` }}
          ></div>
        </div>

        {/* Session Stats */}
        <div className="flex justify-center space-x-6 mt-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-600">Again: {sessionStats.again}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-600">Good: {sessionStats.good}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Easy: {sessionStats.easy}</span>
          </div>
        </div>
      </div>

      {/* Enhanced Flashcard */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {currentItem && (
          <>
            {/* Front of card */}
            {!isRevealed && (
              <div className="p-8">
                <div className="text-center">
                  <div className="mb-6 relative">
                    <img
                      src={currentItem.assets[0].url}
                      alt={currentItem.assets[0].alt || currentItem.name}
                      className="w-full max-h-96 object-cover rounded-lg mx-auto shadow-lg"
                    />
                    <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                      {currentItem.kind}
                    </div>
                  </div>
                  
                  <h3 className="text-3xl font-bold text-gray-900 mb-6">
                    {currentItem.name}
                  </h3>
                  
                  <button
                    onClick={handleReveal}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 font-semibold text-lg"
                  >
                    Reveal Answer (Space)
                  </button>
                  
                  <p className="text-sm text-gray-500 mt-4">
                    Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Space</kbd> to reveal
                  </p>
                </div>
              </div>
            )}

            {/* Back of card */}
            {isRevealed && (
              <div className="p-8">
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="mb-4 relative">
                      <img
                        src={currentItem.assets[0].url}
                        alt={currentItem.assets[0].alt || currentItem.name}
                        className="w-full max-h-64 object-cover rounded-lg mx-auto shadow-lg"
                      />
                      <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                        {currentItem.kind}
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {currentItem.name}
                    </h3>
                    
                    {currentItem.description && (
                      <p className="text-gray-600 mb-4 max-w-2xl mx-auto">{currentItem.description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                      <div className="text-sm font-medium text-green-700 mb-1">Cost</div>
                      <div className="text-lg font-semibold text-green-800">
                        {formatCost(currentItem.cost, currentItem.currency)}
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                      <div className="text-sm font-medium text-blue-700 mb-1">Dimensions</div>
                      <div className="text-sm text-blue-800">
                        {formatDimensions(currentItem.dimensions)}
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Grading buttons */}
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => handleGrade('again')}
                      className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-4 rounded-lg hover:from-red-600 hover:to-red-700 transition-all transform hover:scale-105 font-semibold"
                    >
                      Again (←)
                    </button>
                    
                    <button
                      onClick={() => handleGrade('good')}
                      className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-8 py-4 rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all transform hover:scale-105 font-semibold"
                    >
                      Good (↓)
                    </button>
                    
                    <button
                      onClick={() => handleGrade('easy')}
                      className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-lg hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 font-semibold"
                    >
                      Easy (→)
                    </button>
                  </div>

                  <div className="text-center text-sm text-gray-500">
                    Use arrow keys <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">←</kbd> <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">↓</kbd> <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">→</kbd> or click buttons
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Keyboard shortcuts:</span> Space to reveal/hide, Arrow keys to grade
          </div>
          <button
            onClick={() => setKeyboardEnabled(!keyboardEnabled)}
            className={`px-3 py-1 rounded text-xs ${
              keyboardEnabled 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}
          >
            {keyboardEnabled ? 'Keyboard ON' : 'Keyboard OFF'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Flashcards;
