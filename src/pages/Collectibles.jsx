import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ref, onValue } from 'firebase/database';
import { database } from '../utils/firebase';
// import { 
//   Sword, 
//   Shield, 
//   Crown, 
//   Gem,
//   Sparkles,
//   Bolt,
//   Trophy,
//   Star,
//   Zap,
//   Heart
// } from 'lucide-react';

const Collectibles = () => {
  const { currentUser, userTheme, userBackgroundTheme, setTheme, setBackgroundTheme } = useAuth();
  const [userItems, setUserItems] = useState([]);
  const [userUpgrades, setUserUpgrades] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Collectibles data (same as shop)
  const collectiblesData = {
    upgrades: [
      {
        id: 'golden_magnet',
        name: 'Golden Card Magnet',
        description: 'Increases golden card chance from 10% to 20%',
        icon: <div className="w-12 h-12 text-yellow-500">⭐</div>,
        type: 'upgrade',
        rarity: 'upgrade'
      },
      {
        id: 'streak_multiplier',
        name: 'Study Streak Multiplier',
        description: '2x coins for maintaining daily study streaks',
        icon: <div className="w-12 h-12 text-blue-500">⚡</div>,
        type: 'upgrade',
        rarity: 'upgrade'
      },
      {
        id: 'accuracy_booster',
        name: 'Accuracy Booster',
        description: '+15% bonus coins when accuracy is above 80%',
        icon: <div className="w-12 h-12 text-green-500">🏆</div>,
        type: 'upgrade',
        rarity: 'upgrade'
      },
      {
        id: 'session_extender',
        name: 'Session Extender',
        description: 'Allows longer study sessions with more cards',
        icon: <div className="w-12 h-12 text-red-500">❤️</div>,
        type: 'upgrade',
        rarity: 'upgrade'
      }
    ],
    collectibles: [
      {
        id: 'sword_legendary',
        name: 'Legendary Sword',
        description: 'A mighty blade that grants +5% coin bonus',
        icon: <div className="w-12 h-12 text-purple-600">⚔️</div>,
        type: 'collectible',
        rarity: 'legendary'
      },
      {
        id: 'shield_epic',
        name: 'Epic Shield',
        description: 'Protects against losing coins on wrong answers',
        icon: <div className="w-12 h-12 text-blue-600">🛡️</div>,
        type: 'collectible',
        rarity: 'epic'
      },
      {
        id: 'crown_mythic',
        name: 'Mythic Crown',
        description: 'The ultimate status symbol, +10% to all bonuses',
        icon: <div className="w-12 h-12 text-yellow-600">👑</div>,
        type: 'collectible',
        rarity: 'mythic'
      },
      {
        id: 'gem_rare',
        name: 'Rare Gem',
        description: 'A sparkling gem that increases golden card rewards',
        icon: <div className="w-12 h-12 text-green-600">💎</div>,
        type: 'collectible',
        rarity: 'rare'
      },
      {
        id: 'sparkles_common',
        name: 'Sparkle Charm',
        description: 'Adds beautiful sparkles to your coin animations',
        icon: <div className="w-12 h-12 text-pink-500">✨</div>,
        type: 'collectible',
        rarity: 'common'
      },
      {
        id: 'lightning_rare',
        name: 'Lightning Bolt',
        description: 'Speeds up study sessions and animations',
        icon: <div className="w-12 h-12 text-yellow-500">⚡</div>,
        type: 'collectible',
        rarity: 'rare'
      }
    ],
    themes: [
      {
        id: 'theme_standard',
        name: 'Standard Theme',
        description: 'Default clean theme for studying',
        icon: <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center text-white text-2xl">📚</div>,
        type: 'theme',
        rarity: 'theme',
        value: 'standard'
      },
      {
        id: 'theme_dark',
        name: 'Dark Mode Theme',
        description: 'Sleek dark theme for night studying',
        icon: <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center text-white text-2xl">🌙</div>,
        type: 'theme',
        rarity: 'theme',
        value: 'dark'
      },
      {
        id: 'theme_nature',
        name: 'Nature Theme',
        description: 'Peaceful nature-inspired card design',
        icon: <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center text-white text-2xl">🌿</div>,
        type: 'theme',
        rarity: 'theme',
        value: 'nature'
      },
      {
        id: 'theme_space',
        name: 'Space Theme',
        description: 'Out-of-this-world cosmic design',
        icon: <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center text-white text-2xl">🚀</div>,
        type: 'theme',
        rarity: 'theme',
        value: 'space'
      },
      {
        id: 'theme_retro',
        name: 'Retro Theme',
        description: 'Vintage 80s arcade style',
        icon: <div className="w-12 h-12 bg-pink-500 rounded-lg flex items-center justify-center text-white text-2xl">🎮</div>,
        type: 'theme',
        rarity: 'theme',
        value: 'retro'
      }
    ],
    backgroundThemes: [
      {
        id: 'bg_standard',
        name: 'Standard Background',
        description: 'Clean, professional light background',
        icon: <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-300 text-2xl">🏠</div>,
        type: 'background_theme',
        rarity: 'background_theme',
        value: 'standard'
      },
      {
        id: 'bg_dark',
        name: 'Dark Background',
        description: 'Elegant dark theme for the entire app',
        icon: <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center text-white text-2xl">🌑</div>,
        type: 'background_theme',
        rarity: 'background_theme',
        value: 'dark'
      },
      {
        id: 'bg_nature',
        name: 'Nature Background',
        description: 'Peaceful forest and nature vibes',
        icon: <div className="w-12 h-12 bg-green-700 rounded-lg flex items-center justify-center text-white text-2xl">🌲</div>,
        type: 'background_theme',
        rarity: 'background_theme',
        value: 'nature'
      },
      {
        id: 'bg_space',
        name: 'Space Background',
        description: 'Cosmic space exploration theme',
        icon: <div className="w-12 h-12 bg-indigo-900 rounded-lg flex items-center justify-center text-white text-2xl">🌌</div>,
        type: 'background_theme',
        rarity: 'background_theme',
        value: 'space'
      },
      {
        id: 'bg_ocean',
        name: 'Ocean Background',
        description: 'Calming deep sea atmosphere',
        icon: <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white text-2xl">🌊</div>,
        type: 'background_theme',
        rarity: 'background_theme',
        value: 'ocean'
      },
      {
        id: 'bg_sunset',
        name: 'Sunset Background',
        description: 'Warm, romantic sunset vibes',
        icon: <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center text-white text-2xl">🌅</div>,
        type: 'background_theme',
        rarity: 'background_theme',
        value: 'sunset'
      },
      {
        id: 'bg_cyberpunk',
        name: 'Cyberpunk Background',
        description: 'Futuristic neon city vibes',
        icon: <div className="w-12 h-12 bg-purple-800 rounded-lg flex items-center justify-center text-white text-2xl">🤖</div>,
        type: 'background_theme',
        rarity: 'background_theme',
        value: 'cyberpunk'
      },
      {
        id: 'bg_candy',
        name: 'Candy Background',
        description: 'Sweet and colorful candy theme',
        icon: <div className="w-12 h-12 bg-pink-400 rounded-lg flex items-center justify-center text-white text-2xl">🍬</div>,
        type: 'background_theme',
        rarity: 'background_theme',
        value: 'candy'
      }
    ]
  };

  // Load user's collected items and upgrades
  useEffect(() => {
    if (currentUser) {
      const userRef = ref(database, `users/${currentUser.uid}`);
      onValue(userRef, (snapshot) => {
        const userData = snapshot.val() || {};
        setUserItems(userData.collectibles || []);
        setUserUpgrades(userData.upgrades || {});
      });
    }
  }, [currentUser]);

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100 border-gray-300';
      case 'rare': return 'text-blue-600 bg-blue-100 border-blue-300';
      case 'epic': return 'text-purple-600 bg-purple-100 border-purple-300';
      case 'legendary': return 'text-orange-600 bg-orange-100 border-orange-300';
      case 'mythic': return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      case 'upgrade': return 'text-green-600 bg-green-100 border-green-300';
      case 'theme': return 'text-indigo-600 bg-indigo-100 border-indigo-300';
      case 'background_theme': return 'text-purple-600 bg-purple-100 border-purple-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const getRarityBorder = (rarity) => {
    switch (rarity) {
      case 'common': return 'border-gray-300';
      case 'rare': return 'border-blue-300';
      case 'epic': return 'border-purple-300';
      case 'legendary': return 'border-orange-300';
      case 'mythic': return 'border-yellow-300';
      case 'upgrade': return 'border-green-300';
      case 'theme': return 'border-indigo-300';
      case 'background_theme': return 'border-purple-300';
      default: return 'border-gray-300';
    }
  };

  const getAllItems = () => {
    const allItems = [];
    
    // Add upgrades
    collectiblesData.upgrades.forEach(item => {
      if (userUpgrades[item.id]) {
        allItems.push({ ...item, owned: true });
      }
    });
    
    // Add collectibles
    collectiblesData.collectibles.forEach(item => {
      if (userItems.includes(item.id)) {
        allItems.push({ ...item, owned: true });
      }
    });
    
    // Add themes (including standard theme which is always available)
    collectiblesData.themes.forEach(item => {
      if (item.id === 'theme_standard' || userItems.includes(item.id)) {
        allItems.push({ ...item, owned: true });
      }
    });
    
    // Add background themes (including standard background theme which is always available)
    collectiblesData.backgroundThemes.forEach(item => {
      if (item.id === 'bg_standard' || userItems.includes(item.id)) {
        allItems.push({ ...item, owned: true });
      }
    });
    
    return allItems;
  };

  const getFilteredItems = () => {
    const allItems = getAllItems();
    
    if (selectedCategory === 'all') {
      return allItems;
    }
    
    return allItems.filter(item => item.type === selectedCategory);
  };

  const getCollectionStats = () => {
    const allItems = getAllItems();
    const totalItems = allItems.length;
    const upgrades = allItems.filter(item => item.type === 'upgrade').length;
    const collectibles = allItems.filter(item => item.type === 'collectible').length;
    const themes = allItems.filter(item => item.type === 'theme').length;
    const backgroundThemes = allItems.filter(item => item.type === 'background_theme').length;
    
    return { totalItems, upgrades, collectibles, themes, backgroundThemes };
  };

  const handleThemeSelect = async (themeValue) => {
    await setTheme(themeValue);
  };

  const handleBackgroundThemeSelect = async (backgroundThemeValue) => {
    await setBackgroundTheme(backgroundThemeValue);
  };

  const stats = getCollectionStats();

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6">
      {/* Collection Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="text-4xl sm:text-6xl mb-4">🏆</div>
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2">Your Collection</h1>
        <p className="text-lg sm:text-xl text-gray-600 mb-4 px-4">Show off your hard-earned treasures and upgrades!</p>
      </div>

      {/* Collection Stats - Mobile Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 sm:p-4 rounded-xl border-2 border-blue-200 text-center">
          <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.totalItems}</div>
          <div className="text-xs sm:text-sm text-blue-700">Total Items</div>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 sm:p-4 rounded-xl border-2 border-green-200 text-center">
          <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.upgrades}</div>
          <div className="text-xs sm:text-sm text-green-700">Upgrades</div>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-3 sm:p-4 rounded-xl border-2 border-purple-200 text-center">
          <div className="text-xl sm:text-2xl font-bold text-purple-600">{stats.collectibles}</div>
          <div className="text-xs sm:text-sm text-purple-700">Collectibles</div>
        </div>
        <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-3 sm:p-4 rounded-xl border-2 border-indigo-200 text-center">
          <div className="text-xl sm:text-2xl font-bold text-indigo-600">{stats.themes}</div>
          <div className="text-xs sm:text-sm text-indigo-700">Card Themes</div>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-3 sm:p-4 rounded-xl border-2 border-purple-200 text-center col-span-2 sm:col-span-1">
          <div className="text-xl sm:text-2xl font-bold text-purple-600">{stats.backgroundThemes}</div>
          <div className="text-xs sm:text-sm text-purple-700">Background Themes</div>
        </div>
      </div>

      {/* Category Filter - Mobile Responsive */}
      <div className="flex justify-center mb-6 sm:mb-8">
        <div className="bg-white rounded-lg shadow-lg p-1 sm:p-2 flex flex-wrap justify-center gap-1 sm:gap-2 w-full max-w-4xl">
          {[
            { key: 'all', label: '🌟 All Items', emoji: '🌟', shortLabel: '🌟 All' },
            { key: 'upgrades', label: '⚡ Upgrades', emoji: '⚡', shortLabel: '⚡' },
            { key: 'collectibles', label: '🗡️ Collectibles', emoji: '🗡️', shortLabel: '🗡️' },
            { key: 'themes', label: '🎨 Card Themes', emoji: '🎨', shortLabel: '🎨' },
            { key: 'background_theme', label: '🌍 Background Themes', emoji: '🌍', shortLabel: '🌍' }
          ].map((category) => (
            <button
              key={category.key}
              onClick={() => setSelectedCategory(category.key)}
              className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all text-sm sm:text-base flex-1 min-w-0 ${
                selectedCategory === category.key
                  ? 'bg-blue-500 text-white shadow-lg transform scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="hidden sm:inline">{category.label}</span>
              <span className="sm:hidden">{category.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid - Mobile Responsive */}
      {getFilteredItems().length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {getFilteredItems().map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl hover:scale-105 ${getRarityBorder(item.rarity)}`}
            >
              <div className="p-4 sm:p-6 text-center">
                <div className="flex justify-center mb-3 sm:mb-4">
                  {item.icon}
                </div>
                
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{item.name}</h3>
                
                <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-semibold mb-3 ${getRarityColor(item.rarity)}`}>
                  {item.rarity.toUpperCase()}
                </span>
                
                <p className="text-gray-600 mb-3 sm:mb-4 text-sm leading-relaxed">{item.description}</p>
                
                {/* Theme Selection for Themes */}
                {item.type === 'theme' && (
                  <div className="mb-3 sm:mb-4">
                    <button
                      onClick={() => handleThemeSelect(item.value)}
                      className={`w-full px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all text-sm sm:text-base ${
                        userTheme === item.value
                          ? 'bg-green-500 text-white'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {userTheme === item.value ? '✓ Active' : 'Apply Theme'}
                    </button>
                  </div>
                )}
                
                {/* Background Theme Selection for Background Themes */}
                {item.type === 'background_theme' && (
                  <div className="mb-3 sm:mb-4">
                    <button
                      onClick={() => handleBackgroundThemeSelect(item.value)}
                      className={`w-full px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all text-sm sm:text-base ${
                        userBackgroundTheme === item.value
                          ? 'bg-green-500 text-white'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {userBackgroundTheme === item.value ? '✓ Active' : 'Apply Background Theme'}
                    </button>
                  </div>
                )}
                
                <div className="bg-green-100 text-green-700 px-3 sm:px-4 py-2 rounded-lg font-semibold text-sm sm:text-base">
                  ✓ Collected
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 sm:py-12 px-4">
          <div className="text-4xl sm:text-6xl mb-4">📦</div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-700 mb-2">No Items Yet</h3>
          <p className="text-gray-600 mb-6 text-sm sm:text-base px-4">
            {selectedCategory === 'all' 
              ? "You haven't collected any items yet. Visit the shop to start building your collection!"
              : `You haven't collected any ${selectedCategory} yet. Visit the shop to find some!`
            }
          </p>
          <div className="text-3xl sm:text-4xl">🛍️</div>
        </div>
      )}

      {/* Collection Footer */}
      <div className="text-center mt-8 sm:mt-12 p-4 sm:p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
        <div className="text-3xl sm:text-4xl mb-4">🎊</div>
        <h3 className="text-lg sm:text-xl font-bold text-purple-800 mb-2">Collection Complete!</h3>
        <p className="text-purple-700 text-sm sm:text-base px-2">
          Keep studying to unlock more amazing items and upgrades. Every coin earned brings you closer to completing your collection!
        </p>
      </div>
    </div>
  );
};

export default Collectibles;
