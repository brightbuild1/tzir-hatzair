import { useState, useEffect } from 'react';
import {
  
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type AuthError,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

interface AuthState {
  user:    User | null;
  loading: boolean;
  error:   string | null;
}

interface AuthActions {
  loginWithEmail:    (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle:   () => Promise<void>;
  logout:            () => Promise<void>;
  clearError:        () => void;
}

export function useAuth(): AuthState & AuthActions {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  function formatError(err: unknown): string {
    const code = (err as AuthError)?.code ?? '';
    const messages: Record<string, string> = {
      'auth/user-not-found':       'משתמש לא נמצא. אנא בדוק את כתובת האימייל.',
      'auth/wrong-password':       'סיסמה שגויה. נסה שוב.',
      'auth/email-already-in-use': 'כתובת האימייל כבר בשימוש.',
      'auth/weak-password':        'הסיסמה חלשה מדי. לפחות 6 תווים.',
      'auth/invalid-email':        'כתובת אימייל לא תקינה.',
      'auth/popup-closed-by-user': 'החלון נסגר. אנא נסה שוב.',
      'auth/too-many-requests':    'יותר מדי ניסיונות. נסה שוב מאוחר יותר.',
    };
    return messages[code] ?? 'אירעה שגיאה. אנא נסה שוב.';
  }

  async function loginWithEmail(email: string, password: string) {
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  }

  async function registerWithEmail(email: string, password: string) {
    setError(null);
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  }

  async function loginWithGoogle() {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setError(null);
    await signOut(auth);
  }

  function clearError() {
    setError(null);
  }

  return { user, loading, error, loginWithEmail, registerWithEmail, loginWithGoogle, logout, clearError };
}
