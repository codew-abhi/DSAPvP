import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type User, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";

export interface UserData {
  uid: string;
  username: string;
  email: string | null;
  photoURL: string | null;
  displayName: string | null;
  matchesPlayed: number;
  wins: number;
  losses: number;
  rating: number;
  createdAt: string | number; // MongoDB returns ISODate string
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  token: string | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>; // Added to refresh after username claim
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  token: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  refreshUserData: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('dsapvp_token'));
  const [loading, setLoading] = useState(true);

  // Exchange or fetch JWT token for Firebase user
  const getOrFetchJwtToken = async (firebaseUser: User): Promise<string | null> => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          localStorage.setItem('dsapvp_token', data.token);
          setToken(data.token);
          return data.token;
        }
      }
    } catch (err) {
      console.error('Error obtaining JWT token from backend:', err);
    }
    return localStorage.getItem('dsapvp_token');
  };

  const fetchUserData = async (uid: string, jwtToken?: string | null) => {
    try {
      const activeToken = jwtToken || token || localStorage.getItem('dsapvp_token');
      const headers: Record<string, string> = {
        'x-user-uid': uid,
      };
      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }

      const response = await fetch('http://localhost:5000/api/users/me', {
        headers,
        cache: 'no-store', // Prevent browser from caching previous 404s
      });
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      } else {
        setUserData(null);
      }
    } catch (error) {
      console.error('Error fetching user data from backend:', error);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUserData = async () => {
    if (user) {
      const currentToken = await getOrFetchJwtToken(user);
      await fetchUserData(user.uid, currentToken);
    }
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribeAuth = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const currentToken = await getOrFetchJwtToken(firebaseUser);
        await fetchUserData(firebaseUser.uid, currentToken);
      } else {
        setUserData(null);
        setToken(null);
        localStorage.removeItem('dsapvp_token');
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const signInWithGoogle = async () => {
    if (!auth) {
      console.error('Firebase Auth is not initialized. Please check your .env configuration.');
      alert('Firebase configuration is missing! Check console.');
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in with Google', error);
    }
  };

  const signOut = async () => {
    if (!auth) return;
    try {
      localStorage.removeItem('dsapvp_token');
      setToken(null);
      setUserData(null);
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, token, loading, signInWithGoogle, signOut, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
};
