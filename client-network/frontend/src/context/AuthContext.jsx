import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    let logoutTimer;
    if (token) {
      localStorage.setItem('token', token);
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = decodedToken.exp * 1000;
        const currentTime = Date.now();

        // Extract unique user identifier from token (email is the 'sub' claim)
        setUserId(decodedToken.sub || null);

        if (expirationTime <= currentTime) {
          setToken(null);
          setUserId(null);
        } else {
          logoutTimer = setTimeout(() => {
            setToken(null);
            setUserId(null);
          }, expirationTime - currentTime);
        }
      } catch (error) {
        setToken(null);
        setUserId(null);
      }
    } else {
      localStorage.removeItem('token');
      setUserId(null);
    }

    return () => {
      if (logoutTimer) {
        clearTimeout(logoutTimer);
      }
    };
  }, [token]);

  const login = (newToken) => {
    setToken(newToken);
  };

  const logout = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, userId, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
