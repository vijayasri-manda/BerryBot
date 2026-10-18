import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  loginAsDemo: (role: 'candidate' | 'recruiter') => Promise<void>;
  register: (email: string, pass: string, name: string, role?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('berry_bot_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('berry_bot_token');
      if (storedToken) {
        try {
          const profile = await api.getCurrentUser();
          setUser(profile);
        } catch (e) {
          localStorage.removeItem('berry_bot_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const data = await api.login(email, pass);
      localStorage.setItem('berry_bot_token', data.access_token);
      setToken(data.access_token);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemo = async (role: 'candidate' | 'recruiter') => {
    if (role === 'candidate') {
      await login('candidate@example.com', 'password123');
    } else {
      await login('recruiter@example.com', 'password123');
    }
  };

  const register = async (email: string, pass: string, name: string, role?: string) => {
    setIsLoading(true);
    try {
      const data = await api.register({ email, password: pass, full_name: name, role });
      localStorage.setItem('berry_bot_token', data.access_token);
      setToken(data.access_token);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('berry_bot_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, loginAsDemo, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
