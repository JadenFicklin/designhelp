import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemsApi, categoriesApi, flashcardsApi } from '../utils/api';
import { ref, remove } from 'firebase/database';
import { database } from '../utils/firebase';
import { useAuth } from '../contexts/AuthContext';
import CoinAnimation from '../components/CoinAnimation';

const Flashcards = () => {
  const { addCoins, userTheme } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [sessionItems, setSessionItems] = useState([]);
  const [progress, setProgress] = useState({});
  const [studyMode, setStudyMode] = useState('all'); // 'all', 'difficult', 'new', 'review'
  const [selectedCategory, setSelectedCategory] = useState('all'); // 'all' or specific category ID
  const [sessionStats, setSessionStats] = useState({ again: 0, good: 0, easy: 0 });

  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [keyboardEnabled, setKeyboardEnabled] = useState(true);
  
  // Coin animation state
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [sessionCoins, setSessionCoins] = useState(0);
  const [goldenCards, setGoldenCards] = useState(new Set()); // Track golden cards

  const queryClient = useQueryClient();

  // Get all items
  const { data: allItems = [] } = useQuery({
    queryKey: ['items'],
    queryFn: () => itemsApi.getItems(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Debug: Log items and categories to see the data structure
  useEffect(() => {
    if (allItems.length > 0) {
      console.log('All items:', allItems.slice(0, 3)); // Log first 3 items
      console.log('Sample item structure:', allItems[0]);
    }
    if (categories.length > 0) {
      console.log('All categories:', categories);
      console.log('Sample category structure:', categories[0]);
    }
  }, [allItems, categories]);

  // Get overall session statistics
  const { data: overallStats } = useQuery({
    queryKey: ['sessionStats'],
    queryFn: () => flashcardsApi.getSessionStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
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
    console.log('initializeSession called - resetting stats');
    let filteredItems = allItems.filter(item => item.assets && item.assets.length > 0);
    
    // Filter by category if one is selected
    if (selectedCategory !== 'all') {
      filteredItems = filteredItems.filter(item => {
        // Handle both possible data structures:
        // 1. item.categoryId (single value)
        // 2. item.categories (array of category IDs)
        if (item.categoryId === selectedCategory) {
          return true;
        }
        if (item.categories && Array.isArray(item.categories) && item.categories.includes(selectedCategory)) {
          return true;
        }
        return false;
      });
    }

    // Apply study mode filtering
    switch (studyMode) {
      case 'difficult':
        filteredItems = filteredItems.filter(item => {
          const itemProgress = progress[item.id];
          if (!itemProgress) return false;
          const total = (itemProgress.again || 0) + (itemProgress.good || 0) + (itemProgress.easy || 0);
          const againRate = total > 0 ? (itemProgress.again || 0) / total : 0;
          return againRate > 0.3; // Items with >30% "again" rate
        });
        break;
      case 'new':
        filteredItems = filteredItems.filter(item => !progress[item.id]);
        break;
      case 'review':
        filteredItems = filteredItems.filter(item => progress[item.id]);
        break;
      default: // 'all'
        break;
    }

    // Shuffle the filtered items
    const shuffledItems = [...filteredItems].sort(() => Math.random() - 0.5);
    
    setSessionItems(shuffledItems);
    setCurrentIndex(0);
    setIsRevealed(false);
    setIsSessionComplete(false);
    // Only reset session stats when starting a completely new session
    setSessionStats({ again: 0, good: 0, easy: 0 });
    setSessionStartTime(new Date());
    // Reset coin counters
    setSessionCoins(0);
  }, [allItems, studyMode, progress, selectedCategory]);

  const currentItem = sessionItems[currentIndex];
  const isLastCard = currentIndex === sessionItems.length - 1;

  // Check if current card should be golden when it's displayed
  useEffect(() => {
    if (currentItem && !goldenCards.has(currentItem.id)) {
      // 10% chance for golden cards (can be upgraded to 20% with Golden Card Magnet)
              const shouldBeGolden = Math.random() < 0.1;
      if (shouldBeGolden) {
        setGoldenCards(prev => new Set([...prev, currentItem.id]));
      }
    }
  }, [currentItem, goldenCards]);

  // Get theme styling for cards
  const getThemeStyling = () => {
    switch (userTheme) {
      case 'dark':
        return {
          cardBg: 'bg-gray-800',
          cardBorder: 'border-gray-600',
          cardText: 'text-gray-100',
          cardShadow: 'shadow-gray-800'
        };
      case 'nature':
        return {
          cardBg: 'bg-green-50',
          cardBorder: 'border-green-200',
          cardText: 'text-green-900',
          cardShadow: 'shadow-green-200'
        };
      case 'space':
        return {
          cardBg: 'bg-purple-50',
          cardBorder: 'border-purple-200',
          cardText: 'text-purple-900',
          cardShadow: 'shadow-purple-200'
        };
      case 'retro':
        return {
          cardBg: 'bg-pink-50',
          cardBorder: 'border-pink-200',
          cardText: 'text-pink-900',
          cardShadow: 'shadow-pink-200'
        };
      default: // standard
        return {
          cardBg: 'bg-white',
          cardBorder: 'border-gray-200',
          cardText: 'text-gray-900',
          cardShadow: 'shadow-gray-200'
        };
    }
  };

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

    // Check if this card is already golden
    const isGoldenCard = goldenCards.has(currentItem.id);

    // Calculate coins earned for this grade
    let coinsEarned = 0;
    switch (grade) {
      case 'again':
        coinsEarned = 0;
        break;
      case 'good':
        coinsEarned = 5;
        break;
      case 'easy':
        coinsEarned = 10;
        break;
      default:
        coinsEarned = 0;
    }

    // Apply golden card bonus if applicable
    if (isGoldenCard && coinsEarned > 0) {
      coinsEarned *= 3;
      // Show immediate coin animation for golden card
      setEarnedCoins(coinsEarned);
      setShowCoinAnimation(true);
    }

    // Add coins to session total
    setSessionCoins(prev => prev + coinsEarned);

    // Don't show individual coin animations - only show celebration at end
    // Coins are still tracked and added to session total

    // Update session stats
    setSessionStats(prev => {
      const newStats = {
        ...prev,
        [grade]: prev[grade] + 1
      };
      console.log('Session stats updated:', newStats);
      return newStats;
    });

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
      
      // Calculate bonus coins for high accuracy (70% or higher easy answers)
      const finalSessionStats = {
        ...sessionStats,
        [grade]: sessionStats[grade] + 1
      };
      
      const easyPercentage = (finalSessionStats.easy / sessionItems.length) * 100;
      let bonusCoins = 0;
      
      if (easyPercentage >= 70) {
        bonusCoins = Math.round(sessionCoins * 0.3); // 30% bonus
      }
      
      // Add all coins to user's account
      const totalCoins = sessionCoins + bonusCoins;
      if (totalCoins > 0) {
        await addCoins(totalCoins);
        
        // Show celebration animation with total coins earned
        setEarnedCoins(totalCoins);
        setShowCoinAnimation(true);
      }
      
      // Save session statistics when session is completed
      try {
        const sessionData = {
          studyMode,
          totalCards: sessionItems.length,
          again: finalSessionStats.again,
          good: finalSessionStats.good,
          easy: finalSessionStats.easy,
          accuracy: Math.round(((finalSessionStats.good + finalSessionStats.easy) / sessionItems.length) * 100),
          duration: sessionStartTime ? Math.round((new Date() - sessionStartTime) / 1000) : 0, // Duration in seconds
          coinsEarned: totalCoins,
          bonusCoins,
          timestamp: new Date().toISOString()
        };
        
        await flashcardsApi.saveSessionStats(sessionData);
        
        // Invalidate the session stats query to refresh the data
        queryClient.invalidateQueries(['sessionStats']);
      } catch (error) {
        console.error('Failed to save session stats:', error);
      }
    } else {
      setCurrentIndex(currentIndex + 1);
      setIsRevealed(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentItem, progress, saveProgress, gradeMutation, isLastCard, currentIndex, sessionStats, studyMode, sessionItems, sessionStartTime, sessionCoins, addCoins]);

  // Only initialize session when study mode changes or when manually called
  // Reset session when category changes
  useEffect(() => {
    if (allItems.length > 0) {
      setSessionItems([]);
      setCurrentIndex(0);
      setIsRevealed(false);
      setIsSessionComplete(false);
      setSessionStats({ again: 0, good: 0, easy: 0 });
      setSessionStartTime(null);
      setSessionCoins(0);
      setShowCoinAnimation(false); // Reset coin animation state
      setGoldenCards(new Set()); // Reset golden cards
    }
  }, [selectedCategory, allItems.length]);

  // Only initialize session when explicitly requested (not on component mount)
  useEffect(() => {
    console.log('Session init effect - allItems.length:', allItems.length, 'sessionItems.length:', sessionItems.length, 'studyMode:', studyMode);
    // Don't auto-initialize on component mount, only when explicitly starting a session
  }, [allItems, studyMode, sessionItems.length, initializeSession]);

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
        case 'ArrowUp':
        case 'ArrowDown':
          if (isRevealed) {
            handleGrade('good');
          } else {
            // Allow grading from front of card
            handleGrade('good');
          }
          break;
        case 'ArrowLeft':
          if (isRevealed) {
            handleGrade('again');
          } else {
            // Allow grading from front of card
            handleGrade('again');
          }
          break;
        case 'ArrowRight':
          if (isRevealed) {
            handleGrade('easy');
          } else {
            // Allow grading from front of card
            handleGrade('easy');
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isRevealed, isSessionComplete, keyboardEnabled, handleGrade, handleReveal]);

  const handleRestart = useCallback(() => {
    // Reset everything and start a new session
    setSessionItems([]);
    setCurrentIndex(0);
    setIsRevealed(false);
    setIsSessionComplete(false);
    setSessionStats({ again: 0, good: 0, easy: 0 });
    setSessionStartTime(null);
    setSessionCoins(0);
    setShowCoinAnimation(false); // Reset coin animation state
    setGoldenCards(new Set()); // Reset golden cards
    // Force a new initialization
    setTimeout(() => {
      if (allItems.length > 0) {
        initializeSession();
      }
    }, 0);
  }, [allItems.length, initializeSession]);

  // Space key for session complete screen
  useEffect(() => {
    if (!isSessionComplete) return;

    const handleSessionCompleteKeyPress = (e) => {
      if (e.key === ' ') {
        e.preventDefault();
        handleRestart();
      }
    };

    window.addEventListener('keydown', handleSessionCompleteKeyPress);
    return () => window.removeEventListener('keydown', handleSessionCompleteKeyPress);
  }, [isSessionComplete, handleRestart]);

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
        {/* Category Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Category</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                selectedCategory === 'all'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="text-center">
                <div className="font-medium">All Categories</div>
                <div className="text-xs opacity-75">
                  {allItems.filter(item => item.assets && item.assets.length > 0).length} items
                </div>
              </div>
            </button>
            {categories.map(category => {
              const categoryItemCount = allItems.filter(item => 
                item.assets && item.assets.length > 0 && (
                  item.categoryId === category.id || 
                  (item.categories && Array.isArray(item.categories) && item.categories.includes(category.id))
                )
              ).length;
              
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    selectedCategory === category.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-medium">{category.name}</div>
                    <div className="text-xs opacity-75">
                      {categoryItemCount} items
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Study Mode Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Flashcards</h2>
          <p className="text-gray-600 mb-6">Choose your study mode to begin</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { mode: 'all', title: 'All Items', icon: '📚', count: allItems.filter(item => 
                item.assets?.length > 0 && (selectedCategory === 'all' || 
                  item.categoryId === selectedCategory || 
                  (item.categories && Array.isArray(item.categories) && item.categories.includes(selectedCategory)))
              ).length },
              { mode: 'new', title: 'New Items', icon: '🆕', count: allItems.filter(item => 
                item.assets?.length > 0 && !progress[item.id] && (selectedCategory === 'all' || 
                  item.categoryId === selectedCategory || 
                  (item.categories && Array.isArray(item.categories) && item.categories.includes(selectedCategory)))
              ).length },
              { mode: 'review', title: 'Review', icon: '🔄', count: allItems.filter(item => 
                item.assets?.length > 0 && progress[item.id] && (selectedCategory === 'all' || 
                  item.categoryId === selectedCategory || 
                  (item.categories && Array.isArray(item.categories) && item.categories.includes(selectedCategory)))
              ).length },
              { mode: 'difficult', title: 'Difficult', icon: '⚠️', count: allItems.filter(item => {
                const itemProgress = progress[item.id];
                return item.assets?.length > 0 && itemProgress && (itemProgress.again || 0) > (itemProgress.easy || 0) && (selectedCategory === 'all' || 
                  item.categoryId === selectedCategory || 
                  (item.categories && Array.isArray(item.categories) && item.categories.includes(selectedCategory)));
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Your Study Statistics {selectedCategory !== 'all' && categories.find(c => c.id === selectedCategory)?.name && `- ${categories.find(c => c.id === selectedCategory).name}`}
            </h3>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to reset your study progress? This will clear all your progress data and cannot be undone.')) {
                  setProgress({});
                  localStorage.removeItem('flashcards-progress');
                  alert('Study progress has been reset successfully!');
                }
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Reset Progress
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {Object.keys(progress).filter(itemId => {
                  const item = allItems.find(i => i.id === itemId);
                  return selectedCategory === 'all' || 
                    item?.categoryId === selectedCategory ||
                    (item?.categories && Array.isArray(item.categories) && item.categories.includes(selectedCategory));
                }).length}
              </div>
              <div className="text-sm text-gray-600">Items Studied</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {Object.entries(progress).reduce((sum, [itemId, item]) => {
                  const itemData = allItems.find(i => i.id === itemId);
                  if (selectedCategory === 'all' || 
                      itemData?.categoryId === selectedCategory ||
                      (itemData?.categories && Array.isArray(itemData.categories) && itemData.categories.includes(selectedCategory))) {
                    return sum + (item.again || 0);
                  }
                  return sum;
                }, 0)}
              </div>
              <div className="text-sm text-gray-600">Again</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {Object.entries(progress).reduce((sum, [itemId, item]) => {
                  const itemData = allItems.find(i => i.id === itemId);
                  if (selectedCategory === 'all' || 
                      itemData?.categoryId === selectedCategory ||
                      (itemData?.categories && Array.isArray(itemData.categories) && itemData.categories.includes(selectedCategory))) {
                    return sum + (item.good || 0);
                  }
                  return sum;
                }, 0)}
              </div>
              <div className="text-sm text-gray-600">Good</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {Object.entries(progress).reduce((sum, [itemId, item]) => {
                  const itemData = allItems.find(i => i.id === itemId);
                  if (selectedCategory === 'all' || 
                      itemData?.categoryId === selectedCategory ||
                      (itemData?.categories && Array.isArray(itemData.categories) && itemData.categories.includes(selectedCategory))) {
                    return sum + (item.easy || 0);
                  }
                  return sum;
                }, 0)}
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
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center mb-6">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Session Complete!</h2>
          <p className="text-gray-600 mb-6">Great job! You've reviewed all {totalCards} items.</p>
          
          {/* Coins Earned Display */}
          <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-200">
            <div className="text-center">
              <div className="text-3xl mb-2">💰</div>
              <h3 className="text-xl font-bold text-yellow-800 mb-2">Coins Earned This Session!</h3>
              <div className="text-2xl font-bold text-yellow-600 mb-2">
                +{sessionCoins} coins
              </div>
              {sessionStats.easy >= Math.ceil(sessionItems.length * 0.7) && (
                <div className="text-lg text-green-600 font-semibold animate-pulse">
                  🎯 +30% Bonus for High Accuracy! (+{Math.round(sessionCoins * 0.3)} coins)
                </div>
              )}
              <div className="text-lg font-bold text-yellow-700 mt-2">
                Total: +{sessionCoins + (sessionStats.easy >= Math.ceil(sessionItems.length * 0.7) ? Math.round(sessionCoins * 0.3) : 0)} coins
              </div>
            </div>
          </div>
          
          {/* Celebratory Coin Animation */}
          <CoinAnimation 
            coins={sessionCoins + (sessionStats.easy >= Math.ceil(sessionItems.length * 0.7) ? Math.round(sessionCoins * 0.3) : 0)}
            isVisible={showCoinAnimation}
            onComplete={() => setShowCoinAnimation(false)}
            isCelebration={true}
          />
          

          
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
                onClick={() => {
                  setSessionItems([]);
                  setCurrentIndex(0);
                  setIsRevealed(false);
                  setIsSessionComplete(false);
                  setSessionStats({ again: 0, good: 0, easy: 0 });
                  setSessionStartTime(null);
                  setSessionCoins(0);
                  setShowCoinAnimation(false); // Reset coin animation state
                  setGoldenCards(new Set()); // Reset golden cards
                }}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Change Mode
              </button>
          </div>
          
          <div className="text-sm text-gray-500 mt-4">
            Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Space</kbd> to study again
          </div>
        </div>

        {/* Overall Statistics */}
        {overallStats && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">Your Overall Study Statistics</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{overallStats.aggregated?.totalSessions || 0}</div>
                <div className="text-sm text-gray-600">Total Sessions</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{overallStats.aggregated?.totalCards || 0}</div>
                <div className="text-sm text-gray-600">Total Cards</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{overallStats.aggregated?.averageAccuracy || 0}%</div>
                <div className="text-sm text-gray-600">Avg. Accuracy</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{overallStats.aggregated?.totalAccuracy || 0}%</div>
                <div className="text-sm text-gray-600">Total Accuracy</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{overallStats.aggregated?.totalAgain || 0}</div>
                <div className="text-sm text-gray-600">Total Again</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{overallStats.aggregated?.totalGood || 0}</div>
                <div className="text-sm text-gray-600">Total Good</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{overallStats.aggregated?.totalEasy || 0}</div>
                <div className="text-sm text-gray-600">Total Easy</div>
              </div>
            </div>

            {/* Reset Statistics Button */}
            <div className="flex justify-center mt-6">
              <button
                onClick={async () => {
                  if (window.confirm('Are you sure you want to reset all study statistics? This action cannot be undone.')) {
                    try {
                      // Delete all sessions from Firebase
                      const sessionsRef = ref(database, 'sessions');
                      await remove(sessionsRef);
                      
                      // Invalidate the session stats query to refresh the data
                      queryClient.invalidateQueries(['sessionStats']);
                      
                      alert('All study statistics have been reset successfully!');
                    } catch (error) {
                      console.error('Failed to reset statistics:', error);
                      alert('Failed to reset statistics. Please try again.');
                    }
                  }
                }}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Reset All Statistics
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6">

      
      {/* Compact Progress Header - Mobile Responsive */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mb-3 sm:mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 mb-3 sm:mb-0">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Flashcards</h2>
              <p className="text-xs sm:text-sm text-gray-600">{getStudyModeDescription()}</p>
              <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                <span>Theme:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  userTheme === 'standard' ? 'bg-gray-200 text-gray-700' :
                  userTheme === 'dark' ? 'bg-gray-800 text-white' :
                  userTheme === 'nature' ? 'bg-green-200 text-green-700' :
                  userTheme === 'space' ? 'bg-purple-200 text-purple-700' :
                  'bg-pink-200 text-pink-700'
                }`}>
                  {userTheme.charAt(0).toUpperCase() + userTheme.slice(1)}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className="text-center">
                <div className="text-xs text-gray-500">Progress</div>
                <div className="text-sm sm:text-lg font-semibold text-blue-600">
                  {currentIndex} / {sessionItems.length}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Accuracy</div>
                <div className="text-sm sm:text-lg font-semibold text-green-600">{getAccuracy()}%</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Time</div>
                <div className="text-sm sm:text-lg font-semibold text-purple-600">{getSessionDuration()}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Coins</div>
                <div className="text-sm sm:text-lg font-semibold text-yellow-600 flex items-center space-x-1">
                  <span className="animate-pulse">💰</span>
                  <span>+{sessionCoins}</span>
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => {
              setSessionItems([]);
              setCurrentIndex(0);
              setIsRevealed(false);
              setIsSessionComplete(false);
              setSessionStats({ again: 0, good: 0, easy: 0 });
              setSessionStartTime(null);
              setSessionCoins(0);
              setShowCoinAnimation(false); // Reset coin animation state
              setGoldenCards(new Set()); // Reset golden cards
            }}
            className="bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-xs sm:text-sm self-start sm:self-auto"
          >
            Change Mode
          </button>
        </div>
        
        {/* Compact Progress bar */}
        <div className="bg-gray-200 rounded-full h-2 mb-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentIndex / sessionItems.length) * 100}%` }}
          ></div>
        </div>

        {/* Compact Session Stats */}
        <div className="flex justify-center space-x-4 sm:space-x-6 text-xs sm:text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-600">Again: {sessionStats.again}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-600">Good: {sessionStats.good}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Easy: {sessionStats.easy}</span>
          </div>
        </div>
      </div>

      {/* Coin Animation for Golden Cards */}
      <CoinAnimation 
        coins={earnedCoins}
        isVisible={showCoinAnimation}
        onComplete={() => setShowCoinAnimation(false)}
        isCelebration={false}
      />
      
      {/* Enhanced Flashcard - Mobile Responsive */}
      <div className={`rounded-lg shadow-lg border overflow-hidden transition-all duration-500 ${
        goldenCards.has(currentItem?.id) 
          ? 'bg-gradient-to-br from-yellow-100 via-yellow-50 to-amber-100 border-yellow-300 shadow-yellow-200' 
          : `${getThemeStyling().cardBg} ${getThemeStyling().cardBorder} ${getThemeStyling().cardShadow}`
      }`}>
        {currentItem && (
          <>
            {/* Front of card */}
            {!isRevealed && (
              <div className="p-4 sm:p-6">
                <div className="text-center">
                  <div className="mb-3 sm:mb-4 relative">
                    <img
                      src={currentItem.assets[0].url}
                      alt={currentItem.assets[0].alt || currentItem.name}
                      className="w-full max-h-48 sm:max-h-80 object-cover rounded-lg mx-auto shadow-lg"
                    />
                    <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-black bg-opacity-50 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                      {currentItem.kind}
                    </div>
                    {goldenCards.has(currentItem.id) && (
                      <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold animate-pulse">
                        ✨ GOLDEN
                      </div>
                    )}
                  </div>
                  
                  <h3 className={`text-lg sm:text-2xl font-bold mb-3 sm:mb-4 ${getThemeStyling().cardText}`}>
                    {currentItem.name}
                  </h3>
                  
                  <button
                    onClick={handleReveal}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 font-semibold text-sm sm:text-base w-full sm:w-auto"
                  >
                    Reveal Answer (Space)
                  </button>
                  
                  <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3">
                    Press <kbd className="px-1 sm:px-2 py-1 bg-gray-100 rounded text-xs">Space</kbd> to reveal, or use arrow keys to grade directly
                  </p>
                </div>
              </div>
            )}

            {/* Back of card */}
            {isRevealed && (
              <div className={`p-4 sm:p-6 ${
                goldenCards.has(currentItem.id) 
                  ? 'bg-gradient-to-br from-yellow-50 to-amber-50' 
                  : ''
              }`}>
                <div className="space-y-3 sm:space-y-4">
                  <div className="text-center">
                                      <h3 className={`text-lg sm:text-2xl font-bold mb-2 sm:mb-3 ${getThemeStyling().cardText}`}>
                    {currentItem.name}
                  </h3>
                    
                    {currentItem.description && (
                      <p className="text-gray-600 mb-3 sm:mb-4 max-w-3xl mx-auto text-sm sm:text-base leading-relaxed">{currentItem.description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-2 sm:p-3 rounded-lg border border-green-200">
                      <div className="text-xs sm:text-sm font-medium text-green-700 mb-1">Cost</div>
                      <div className="text-sm sm:text-base font-semibold text-green-800">
                        {formatCost(currentItem.cost, currentItem.currency)}
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-2 sm:p-3 rounded-lg border border-blue-200">
                      <div className="text-xs sm:text-sm font-medium text-blue-700 mb-1">Dimensions</div>
                      <div className="text-xs sm:text-sm text-blue-800">
                        {formatDimensions(currentItem.dimensions)}
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Grading buttons with coin rewards - Mobile Responsive */}
                  <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <button
                      onClick={() => handleGrade('again')}
                      className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:from-red-600 hover:to-red-700 transition-all transform hover:scale-105 font-semibold text-xs sm:text-sm relative group w-full sm:w-auto"
                    >
                      Again (←)
                      <div className="absolute -top-6 sm:-top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        0 coins
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleGrade('good')}
                      className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all transform hover:scale-105 font-semibold text-xs sm:text-sm relative group w-full sm:w-auto"
                    >
                      Good (↓)
                      <div className="absolute -top-6 sm:-top-8 left-1/2 transform -translate-x-1/2 bg-yellow-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        +5 coins
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleGrade('easy')}
                      className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 font-semibold text-xs sm:text-sm relative group w-full sm:w-auto"
                    >
                      Easy (→)
                      <div className="absolute -top-6 sm:-top-8 left-1/2 transform -translate-x-1/2 bg-green-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        +10 coins
                      </div>
                    </button>
                  </div>

                  <div className="text-center text-xs sm:text-sm text-gray-500">
                    Use arrow keys <kbd className="px-1 sm:px-2 py-1 bg-gray-100 rounded text-xs">←</kbd> <kbd className="px-1 sm:px-2 py-1 bg-gray-100 rounded text-xs">↓</kbd> <kbd className="px-1 sm:px-2 py-1 bg-gray-100 rounded text-xs">→</kbd> or click buttons. <kbd className="px-1 sm:px-2 py-1 bg-gray-100 rounded text-xs">↑</kbd> grades as Good, <kbd className="px-1 sm:px-2 py-1 bg-gray-100 rounded text-xs">Space</kbd> to reveal.
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Keyboard Shortcuts Help - Mobile Responsive */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-3 mt-3 sm:mt-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-0">
            <span className="font-medium">Keyboard shortcuts:</span> Space to reveal, Arrow keys to grade (works on front and back)
          </div>
          <button
            onClick={() => setKeyboardEnabled(!keyboardEnabled)}
            className={`px-2 sm:px-3 py-1 rounded text-xs self-start sm:self-auto ${
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
