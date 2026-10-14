import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const bootstrap = useCallback(async () => {
    try {
      const res = await authService.me();
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);   // ⚠️ EMPTY dependency array — runs once

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);   // ⚠️ bootstrap is stable (empty deps above)

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const res = await authService.login(email, password);
      setUser(res.data.user);
      return res.data.user;
    } catch (e) {
      const msg = e.response?.data?.message || 'Login failed';
      setError(msg);
      throw e;
    }
  }, []);

  const logout = useCallback(async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user, loading, error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isClient: user?.role === 'CLIENT',
    login, logout,
    refresh: bootstrap,
  }), [user, loading, error, login, logout, bootstrap]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
// import authService from '../services/authService';

// export const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [user, setUser]       = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError]     = useState(null);

//   /**
//    * On mount — check if a session already exists.
//    */
//   const bootstrap = useCallback(async () => {
//     try {
//       const res = await authService.me();
//       setUser(res.data);
//     } catch {
//       setUser(null);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     bootstrap();
//   }, [bootstrap]);

//   const login = useCallback(async (email, password) => {
//     setError(null);
//     try {
//       const res = await authService.login(email, password);
//       setUser(res.data.user);
//       return res.data.user;
//     } catch (e) {
//       const msg = e.response?.data?.message || 'Login failed';
//       setError(msg);
//       throw e;
//     }
//   }, []);

//   const logout = useCallback(async () => {
//     try { await authService.logout(); } catch { /* ignore */ }
//     setUser(null);
//   }, []);

//   const value = useMemo(() => ({
//     user,
//     loading,
//     error,
//     isAuthenticated: !!user,
//     isAdmin: user?.role === 'ADMIN',
//     isClient: user?.role === 'CLIENT',
//     login,
//     logout,
//     refresh: bootstrap,
//   }), [user, loading, error, login, logout, bootstrap]);

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// }