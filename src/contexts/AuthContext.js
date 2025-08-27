import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, database } from '../utils/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { ref, set, get, onValue } from 'firebase/database';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userCoins, setUserCoins] = useState(0);
  const [userTheme, setUserTheme] = useState('standard');
  const [userBackgroundTheme, setUserBackgroundTheme] = useState('standard');
  const [userUpgrades, setUserUpgrades] = useState({});
  const [userCollectibles, setUserCollectibles] = useState([]);

  // Load user data from localStorage and Firebase
  useEffect(() => {
    if (currentUser) {
      // Load from localStorage first for immediate display
      const savedCoins = localStorage.getItem(`coins_${currentUser.uid}`);
      const savedTheme = localStorage.getItem(`theme_${currentUser.uid}`);
      const savedBackgroundTheme = localStorage.getItem(`backgroundTheme_${currentUser.uid}`);
      const savedUpgrades = localStorage.getItem(`upgrades_${currentUser.uid}`);
      const savedCollectibles = localStorage.getItem(`collectibles_${currentUser.uid}`);
      
      if (savedCoins) {
        setUserCoins(parseInt(savedCoins));
      }
      if (savedTheme) {
        setUserTheme(savedTheme);
      }
      if (savedBackgroundTheme) {
        setUserBackgroundTheme(savedBackgroundTheme);
      }
      if (savedUpgrades) {
        setUserUpgrades(JSON.parse(savedUpgrades));
      }
      if (savedCollectibles) {
        setUserCollectibles(JSON.parse(savedCollectibles));
      }

      // Then sync with Firebase
      const userRef = ref(database, `users/${currentUser.uid}`);
      onValue(userRef, (snapshot) => {
        const userData = snapshot.val() || {};
        setUserCoins(userData.coins || 0);
        setUserTheme(userData.theme || 'standard');
        setUserBackgroundTheme(userData.backgroundTheme || 'standard');
        setUserUpgrades(userData.upgrades || {});
        setUserCollectibles(userData.collectibles || []);
        
        // Update localStorage
        localStorage.setItem(`coins_${currentUser.uid}`, (userData.coins || 0).toString());
        localStorage.setItem(`theme_${currentUser.uid}`, userData.theme || 'standard');
        localStorage.setItem(`backgroundTheme_${currentUser.uid}`, userData.backgroundTheme || 'standard');
        localStorage.setItem(`upgrades_${currentUser.uid}`, JSON.stringify(userData.upgrades || {}));
        localStorage.setItem(`collectibles_${currentUser.uid}`, JSON.stringify(userData.collectibles || []));
      });
    }
  }, [currentUser]);

  // Function to add coins
  const addCoins = async (amount) => {
    if (!currentUser) return;
    
    const newTotal = userCoins + amount;
    setUserCoins(newTotal);
    localStorage.setItem(`coins_${currentUser.uid}`, newTotal.toString());
    
    // Update Firebase
    try {
      const coinsRef = ref(database, `users/${currentUser.uid}/coins`);
      await set(coinsRef, newTotal);
    } catch (error) {
      console.error('Failed to update coins in Firebase:', error);
    }
  };

  // Function to set theme
  const setTheme = async (theme) => {
    if (!currentUser) return;
    
    setUserTheme(theme);
    localStorage.setItem(`theme_${currentUser.uid}`, theme);
    
    // Update Firebase
    try {
      const themeRef = ref(database, `users/${currentUser.uid}/theme`);
      await set(themeRef, theme);
    } catch (error) {
      console.error('Failed to update theme in Firebase:', error);
    }
  };

  // Function to set background theme
  const setBackgroundTheme = async (backgroundTheme) => {
    if (!currentUser) return;
    
    setUserBackgroundTheme(backgroundTheme);
    localStorage.setItem(`backgroundTheme_${currentUser.uid}`, backgroundTheme);
    
    // Update Firebase
    try {
      const backgroundThemeRef = ref(database, `users/${currentUser.uid}/backgroundTheme`);
      await set(backgroundThemeRef, backgroundTheme);
    } catch (error) {
      console.error('Failed to update background theme in Firebase:', error);
    }
  };

  // Function to add upgrade
  const addUpgrade = async (upgradeId, value) => {
    if (!currentUser) return;
    
    const newUpgrades = { ...userUpgrades, [upgradeId]: value };
    setUserUpgrades(newUpgrades);
    localStorage.setItem(`upgrades_${currentUser.uid}`, JSON.stringify(newUpgrades));
    
    // Update Firebase
    try {
      const upgradesRef = ref(database, `users/${currentUser.uid}/upgrades`);
      await set(upgradesRef, newUpgrades);
    } catch (error) {
      console.error('Failed to update upgrades in Firebase:', error);
    }
  };

  // Function to add collectible
  const addCollectible = async (collectibleId) => {
    if (!currentUser) return;
    
    if (!userCollectibles.includes(collectibleId)) {
      const newCollectibles = [...userCollectibles, collectibleId];
      setUserCollectibles(newCollectibles);
      localStorage.setItem(`collectibles_${currentUser.uid}`, JSON.stringify(newCollectibles));
      
      // Update Firebase
      try {
        const collectiblesRef = ref(database, `users/${currentUser.uid}/collectibles`);
        await set(collectiblesRef, newCollectibles);
      } catch (error) {
        console.error('Failed to update collectibles in Firebase:', error);
      }
    }
  };

  // Function to get coins
  const getCoins = () => userCoins;

  // Function to get current theme
  const getCurrentTheme = () => userTheme;

  // Function to get upgrades
  const getUpgrades = () => userUpgrades;

  // Function to get collectibles
  const getCollectibles = () => userCollectibles;

  async function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Create user profile in database if it doesn't exist
        const userRef = ref(database, `users/${user.uid}`);
        const snapshot = await get(userRef);
        
        if (!snapshot.exists()) {
          await set(userRef, {
            email: user.email,
            coins: 0,
            theme: 'standard',
            backgroundTheme: 'standard',
            upgrades: {},
            collectibles: [],
            createdAt: new Date().toISOString()
          });
        }
      }
      
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userCoins,
    userTheme,
    userBackgroundTheme,
    userUpgrades,
    userCollectibles,
    addCoins,
    setTheme,
    setBackgroundTheme,
    addUpgrade,
    addCollectible,
    getCoins,
    getCurrentTheme,
    getUpgrades,
    getCollectibles,
    signup,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
