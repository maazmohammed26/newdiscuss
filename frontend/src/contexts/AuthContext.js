import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from '@/lib/firebase';
import { createUser, getUser, getUserByEmail, checkUsernameAvailable, updateUser } from '@/lib/db';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync Firebase Auth user with our database user
  const syncUser = useCallback(async (firebaseUser) => {
    if (!firebaseUser) {
      setUser(null);
      return null;
    }

    try {
      // Check if user exists in database
      let dbUser = await getUser(firebaseUser.uid);
      
      if (!dbUser) {
        // User doesn't exist, create them (for Google auth)
        const email = firebaseUser.email?.toLowerCase();
        let username = firebaseUser.displayName?.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase().slice(0, 15) 
          || email?.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').slice(0, 15) 
          || 'user';
        
        // Ensure unique username
        let isAvailable = await checkUsernameAvailable(username);
        let counter = 1;
        while (!isAvailable) {
          username = `${username.slice(0, 12)}${counter}`;
          isAvailable = await checkUsernameAvailable(username);
          counter++;
        }
        
        dbUser = await createUser(firebaseUser.uid, {
          username,
          email,
          photo_url: firebaseUser.photoURL || '',
          auth_provider: firebaseUser.providerData[0]?.providerId || 'email'
        });
      } else if (firebaseUser.photoURL && firebaseUser.photoURL !== dbUser.photo_url) {
        // Update photo if changed
        await updateUser(firebaseUser.uid, { photo_url: firebaseUser.photoURL });
        dbUser.photo_url = firebaseUser.photoURL;
      }
      
      const userData = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        email: dbUser.email || firebaseUser.email,
        username: dbUser.username,
        photo_url: dbUser.photo_url || firebaseUser.photoURL || '',
        created_at: dbUser.created_at
      };
      
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Error syncing user:', error);
      // Still set basic user info
      const basicUser = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        username: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
        photo_url: firebaseUser.photoURL || ''
      };
      setUser(basicUser);
      return basicUser;
    }
  }, []);

  useEffect(() => {
    // Check for redirect result first (for mobile Google auth)
    getRedirectResult(auth).then(async (result) => {
      if (result?.user) {
        await syncUser(result.user);
      }
    }).catch(console.error);

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      await syncUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, [syncUser]);

  const register = async (username, email, password) => {
    try {
      // Validate
      if (!username || username.length < 2) {
        return { success: false, error: 'Username must be at least 2 characters' };
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return { success: false, error: 'Username can only contain letters, numbers, and underscores' };
      }
      if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
        return { success: false, error: 'Please enter a valid email address' };
      }
      if (!password || password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
      }

      // Check username availability
      const isAvailable = await checkUsernameAvailable(username);
      if (!isAvailable) {
        return { success: false, error: `Username "${username}" is already taken` };
      }

      // Check if email exists
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        return { success: false, error: 'This email is already registered' };
      }

      // Create Firebase auth user
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create database user
      await createUser(credential.user.uid, {
        username: username.trim(),
        email: email.toLowerCase().trim(),
        photo_url: '',
        auth_provider: 'email'
      });

      await syncUser(credential.user);
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      if (error.code === 'auth/email-already-in-use') {
        return { success: false, error: 'This email is already registered' };
      }
      if (error.code === 'auth/weak-password') {
        return { success: false, error: 'Password is too weak' };
      }
      return { success: false, error: error.message || 'Registration failed' };
    }
  };

  const login = async (email, password) => {
    try {
      if (!email) {
        return { success: false, error: 'Email is required' };
      }
      if (!password) {
        return { success: false, error: 'Password is required' };
      }

      const credential = await signInWithEmailAndPassword(auth, email, password);
      await syncUser(credential.user);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found') {
        return { success: false, error: 'No account found with this email' };
      }
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        return { success: false, error: 'Incorrect password' };
      }
      if (error.code === 'auth/invalid-email') {
        return { success: false, error: 'Invalid email address' };
      }
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const loginWithGoogle = async () => {
    try {
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      
      try {
        const result = await signInWithPopup(auth, googleProvider);
        await syncUser(result.user);
        return { success: true };
      } catch (popupError) {
        const code = popupError.code || '';
        
        if (code === 'auth/popup-blocked' || code === 'auth/unauthorized-domain') {
          if (code === 'auth/unauthorized-domain') {
            return { 
              success: false, 
              error: `Please add "${window.location.hostname}" to Firebase Console > Authentication > Settings > Authorized domains` 
            };
          }
          // Fallback to redirect
          await signInWithRedirect(auth, googleProvider);
          return { success: false, error: '' };
        }
        
        if (code === 'auth/popup-closed-by-user') {
          return { success: false, error: 'Sign-in popup was closed' };
        }
        if (code === 'auth/cancelled-popup-request') {
          return { success: false, error: '' };
        }
        
        throw popupError;
      }
    } catch (error) {
      console.error('Google auth error:', error);
      return { success: false, error: error.message || 'Google sign-in failed' };
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
