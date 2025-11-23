import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUser(user);
        // Token is in httpOnly cookie, no need to store it
        setToken(null);
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = (_newToken: string, newUser: User) => {
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(null); // Token is in httpOnly cookie
    setUser(newUser);
  };

  const logout = async () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
      throw new Error('VITE_API_URL environment variable is not set');
    }

    await fetch(`${apiUrl}/api/v1/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
