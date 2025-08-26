import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../utils/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    console.log('AuthContext: login function called with email:', email);
    const result = await signInWithEmailAndPassword(auth, email, password);
    console.log('AuthContext: login result:', result);
    return result;
  };

  const logout = () => {
    return signOut(auth);
  };

  useEffect(() => {
    console.log('AuthContext: Setting up auth state listener...');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('AuthContext: User is signed in:', user.email);
        console.log('AuthContext: User UID:', user.uid);
        console.log('AuthContext: Auth persistence working - user restored from storage');
      } else {
        console.log('AuthContext: User is signed out');
      }
      
      setCurrentUser(user);
      setLoading(false);
      console.log('AuthContext: Loading set to false');
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    login,
    logout
  };

  console.log('AuthContext: Rendering with currentUser:', currentUser, 'loading:', loading);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
