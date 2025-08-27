import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ref, onValue } from 'firebase/database';
import { database } from '../utils/firebase';
// import { 
//   Coins, 
//   Star, 
//   Zap, 
//   Shield, 
//   Sword, 
//   Crown, 
//   Gem,
//   Sparkles,
//   Trophy,
//   Heart,
//   Bolt
// } from 'lucide-react';

const Shop = () => {
  const { currentUser, userCoins, addCoins, addUpgrade, addCollectible, setBackgroundTheme } = useAuth();
  const [userItems, setUserItems] = useState([]);
  const [userUpgrades, setUserUpgrades] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('upgrades');

  // Shop items data
  const shopItems = {
    upgrades: [
      {
        id: 'golden_magnet',
        name: 'Golden Card Magnet',
        description: 'Increases golden card chance from 10% to 20%',
        price: 100,
        icon: <div className="w-8 h-8 text-yellow-500">⭐</div>,
        type: 'upgrade',
        effect: 'golden_chance',
        value: 0.2
      },
      {
        id: 'streak_multiplier',
        name: 'Study Streak Multiplier',
        description: '2x coins for maintaining daily study streaks',
        price: 200,
        icon: <div className="w-8 h-8 text-blue-500">⚡</div>,
        type: 'upgrade',
        effect: 'streak_multiplier',
        value: 2
      },
      {
        id: 'accuracy_booster',
        name: 'Accuracy Booster',
        description: '+15% bonus coins when accuracy is above 80%',
        price: 150,
        icon: <div className="w-8 h-8 text-green-500">🏆</div>,
        type: 'upgrade',
        effect: 'accuracy_bonus',
        value: 0.15
      },
      {
        id: 'session_extender',
        name: 'Session Extender',
        description: 'Allows longer study sessions with more cards',
        price: 300,
        icon: <div className="w-8 h-8 text-red-500">❤️</div>,
        type: 'upgrade',
        effect: 'session_length',
        value: 1.5
      }
    ],
    collectibles: [
      {
        id: 'sword_legendary',
        name: 'Legendary Sword',
        description: 'A mighty blade that grants +5% coin bonus',
        price: 500,
        icon: <div className="w-8 h-8 text-purple-600">⚔️</div>,
        type: 'collectible',
        rarity: 'legendary',
        effect: 'coin_bonus',
        value: 0.05
      },
      {
        id: 'shield_epic',
        name: 'Epic Shield',
        description: 'Protects against losing coins on wrong answers',
        price: 400,
        icon: <div className="w-8 h-8 text-blue-600">🛡️</div>,
        type: 'collectible',
        rarity: 'epic',
        effect: 'coin_protection',
        value: 1
      },
      {
        id: 'crown_mythic',
        name: 'Mythic Crown',
        description: 'The ultimate status symbol, +10% to all bonuses',
        price: 1000,
        icon: <div className="w-8 h-8 text-yellow-600">👑</div>,
        type: 'collectible',
        rarity: 'mythic',
        effect: 'all_bonus',
        value: 0.1
      },
      {
        id: 'gem_rare',
        name: 'Rare Gem',
        description: 'A sparkling gem that increases golden card rewards',
        price: 250,
        icon: <div className="w-8 h-8 text-green-600">💎</div>,
        type: 'collectible',
        rarity: 'rare',
        effect: 'golden_reward',
        value: 1.5
      },
      {
        id: 'sparkles_common',
        name: 'Sparkle Charm',
        description: 'Adds beautiful sparkles to your coin animations',
        price: 75,
        icon: <div className="w-8 h-8 text-pink-500">✨</div>,
        type: 'collectible',
        rarity: 'common',
        effect: 'animation_sparkles',
        value: 1
      },
      {
        id: 'lightning_rare',
        name: 'Lightning Bolt',
        description: 'Speeds up study sessions and animations',
        price: 180,
        icon: <div className="w-8 h-8 text-yellow-500">⚡</div>,
        type: 'collectible',
        rarity: 'rare',
        effect: 'speed_boost',
        value: 1.3
      }
    ],
    cardThemes: [
      {
        id: 'theme_dark',
        name: 'Dark Mode Theme',
        description: 'Sleek dark theme for night studying',
        price: 120,
        icon: <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">🌙</div>,
        type: 'theme',
        effect: 'card_theme',
        value: 'dark'
      },
      {
        id: 'theme_nature',
        name: 'Nature Theme',
        description: 'Peaceful nature-inspired card design',
        price: 100,
        icon: <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">🌿</div>,
        type: 'theme',
        effect: 'card_theme',
        value: 'nature'
      },
      {
        id: 'theme_space',
        name: 'Space Theme',
        description: 'Out-of-this-world cosmic design',
        price: 150,
        icon: <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">🚀</div>,
        type: 'theme',
        effect: 'card_theme',
        value: 'space'
      },
      {
        id: 'theme_retro',
        name: 'Retro Theme',
        description: 'Vintage 80s arcade style',
        price: 80,
        icon: <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center">🎮</div>,
        type: 'theme',
        effect: 'card_theme',
        value: 'retro'
      }
    ],
    backgroundThemes: [
      {
        id: 'bg_standard',
        name: 'Standard Background',
        description: 'Clean, professional light background',
        price: 0,
        icon: <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-300">🏠</div>,
        type: 'background_theme',
        effect: 'background_theme',
        value: 'standard'
      },
      {
        id: 'bg_dark',
        name: 'Dark Background',
        description: 'Elegant dark theme for the entire app',
        price: 200,
        icon: <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">🌑</div>,
        type: 'background_theme',
        effect: 'background_theme',
        value: 'dark'
      },
      {
        id: 'bg_nature',
        name: 'Nature Background',
        description: 'Peaceful forest and nature vibes',
        price: 150,
        icon: <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center">🌲</div>,
        type: 'background_theme',
        effect: 'background_theme',
        value: 'nature'
      },
      {
        id: 'bg_space',
        name: 'Space Background',
        description: 'Cosmic space exploration theme',
        price: 250,
        icon: <div className="w-8 h-8 bg-indigo-900 rounded-lg flex items-center justify-center">🌌</div>,
        type: 'background_theme',
        effect: 'background_theme',
        value: 'space'
      },
      {
        id: 'bg_ocean',
        name: 'Ocean Background',
        description: 'Calming deep sea atmosphere',
        price: 180,
        icon: <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">🌊</div>,
        type: 'background_theme',
        effect: 'background_theme',
        value: 'ocean'
      },
      {
        id: 'bg_sunset',
        name: 'Sunset Background',
        description: 'Warm, romantic sunset vibes',
        price: 120,
        icon: <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">🌅</div>,
        type: 'background_theme',
        effect: 'background_theme',
        value: 'sunset'
      },
      {
        id: 'bg_cyberpunk',
        name: 'Cyberpunk Background',
        description: 'Futuristic neon city vibes',
        price: 300,
        icon: <div className="w-8 h-8 bg-purple-800 rounded-lg flex items-center justify-center">🤖</div>,
        type: 'background_theme',
        effect: 'background_theme',
        value: 'cyberpunk'
      },
      {
        id: 'bg_candy',
        name: 'Candy Background',
        description: 'Sweet and colorful candy theme',
        price: 100,
        icon: <div className="w-8 h-8 bg-pink-400 rounded-lg flex items-center justify-center">🍬</div>,
        type: 'background_theme',
        effect: 'background_theme',
        value: 'candy'
      }
    ]
  };

  // Load user's purchased items and upgrades
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

  const handlePurchase = async (item) => {
    if (userCoins < item.price) {
      alert('Not enough coins! Keep studying to earn more!');
      return;
    }

    if (currentUser) {
      try {
        // Deduct coins
        await addCoins(-item.price);

        // Add item to user's collection based on type
        if (item.type === 'collectible' || item.type === 'theme') {
          await addCollectible(item.id);
          setUserItems(prev => [...prev, item.id]);
        } else if (item.type === 'background_theme') {
          await addCollectible(item.id);
          await setBackgroundTheme(item.value);
          setUserItems(prev => [...prev, item.id]);
        } else if (item.type === 'upgrade') {
          await addUpgrade(item.id, item.value);
          setUserUpgrades(prev => ({ ...prev, [item.id]: item.value }));
        }

        alert(`Congratulations! You purchased ${item.name}!`);
      } catch (error) {
        console.error('Failed to purchase item:', error);
        alert('Purchase failed. Please try again.');
      }
    }
  };

  const isOwned = (itemId) => {
    if (shopItems.upgrades.find(item => item.id === itemId)) {
      return userUpgrades[itemId];
    }
    // Standard background theme is always available
    if (itemId === 'bg_standard') {
      return true;
    }
    return userItems.includes(itemId);
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100';
      case 'rare': return 'text-blue-600 bg-blue-100';
      case 'epic': return 'text-purple-600 bg-purple-100';
      case 'legendary': return 'text-orange-600 bg-orange-100';
      case 'mythic': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6">
      {/* Merchant Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="text-4xl sm:text-6xl mb-4">🏪</div>
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2">Merchant's Shop</h1>
        <p className="text-lg sm:text-xl text-gray-600 mb-4 px-4">Welcome, brave learner! What treasures shall we trade today?</p>
        
        {/* Coin Display */}
        <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-yellow-400 to-orange-500 px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-lg">
          <div className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-800">🪙</div>
          <span className="text-lg sm:text-xl font-bold text-white">
            {userCoins.toLocaleString()} coins
          </span>
        </div>
      </div>

      {/* Category Tabs - Mobile Responsive */}
      <div className="flex justify-center mb-6 sm:mb-8">
        <div className="bg-white rounded-lg shadow-lg p-1 sm:p-2 flex flex-wrap justify-center gap-1 sm:gap-2 w-full max-w-4xl">
          {Object.keys(shopItems).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all text-sm sm:text-base flex-1 min-w-0 ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white shadow-lg transform scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="hidden sm:inline">
                {category === 'upgrades' && '⚡ Upgrades'}
                {category === 'collectibles' && '🗡️ Collectibles'}
                {category === 'cardThemes' && '🎨 Card Themes'}
                {category === 'backgroundThemes' && '🌍 Background Themes'}
              </span>
              <span className="sm:hidden">
                {category === 'upgrades' && '⚡'}
                {category === 'collectibles' && '🗡️'}
                {category === 'cardThemes' && '🎨'}
                {category === 'backgroundThemes' && '🌍'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Shop Items Grid - Mobile Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        {shopItems[selectedCategory].map((item) => (
          <div
            key={item.id}
            className={`bg-white rounded-xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl hover:scale-105 ${
              isOwned(item.id) 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            {/* Item Header */}
            <div className="p-4 sm:p-6 text-center">
              <div className="flex justify-center mb-3 sm:mb-4">
                {item.icon}
              </div>
              
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{item.name}</h3>
              
              {item.rarity && (
                <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-semibold mb-3 ${getRarityColor(item.rarity)}`}>
                  {item.rarity.toUpperCase()}
                </span>
              )}
              
              <p className="text-gray-600 mb-3 sm:mb-4 text-sm leading-relaxed">{item.description}</p>
              
              {/* Price */}
              <div className="flex items-center justify-center space-x-2 mb-3 sm:mb-4">
                <div className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500">🪙</div>
                <span className="text-base sm:text-lg font-bold text-gray-900">{item.price}</span>
              </div>
              
              {/* Action Button */}
              {isOwned(item.id) ? (
                <div className="bg-green-100 text-green-700 px-3 sm:px-4 py-2 rounded-lg font-semibold text-sm sm:text-base">
                  ✓ Owned
                </div>
              ) : (
                <button
                  onClick={() => handlePurchase(item)}
                  disabled={userCoins < item.price}
                  className={`w-full px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all text-sm sm:text-base ${
                    userCoins >= item.price
                      ? 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {userCoins >= item.price ? 'Purchase' : 'Not Enough Coins'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Merchant Footer */}
      <div className="text-center mt-8 sm:mt-12 p-4 sm:p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-200">
        <div className="text-3xl sm:text-4xl mb-4">🎭</div>
        <h3 className="text-lg sm:text-xl font-bold text-yellow-800 mb-2">Merchant's Wisdom</h3>
        <p className="text-yellow-700 text-sm sm:text-base px-2">
          "The best investment you can make is in yourself. Keep studying, keep growing, and the coins will follow!"
        </p>
      </div>
    </div>
  );
};

export default Shop;
