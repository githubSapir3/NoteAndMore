import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(userData);
          
          // Verify token is still valid by calling /auth/me
          apiClient.get('/auth/me')
            .then(() => {
              // Token is valid, do nothing
            })
            .catch(() => {
              // Token is invalid, clear auth
              logout();
            })
            .finally(() => {
              setLoading(false);
            });
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          logout();
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      
      const { token: authToken, user: userData } = response;
      
      // Store in localStorage
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Update state
      setToken(authToken);
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (error) {
      throw error;
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      
      const { token: authToken, user: newUser } = response;
      
      // Store in localStorage
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      // Update state
      setToken(authToken);
      setUser(newUser);
      
      return { success: true, user: newUser };
    } catch (error) {
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Clear state
    setToken(null);
    setUser(null);
    
    // Call logout endpoint (optional)
    if (token) {
      apiClient.post('/auth/logout').catch(console.error);
    }
  };

  // Update user profile
  const updateProfile = async (updates) => {
    try {
      const response = await apiClient.put('/users/profile', updates);
      const updatedUser = response.data.user;
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update state
      setUser(updatedUser);
      
      return updatedUser;
    } catch (error) {
      throw error;
    }
  };

  // Update user preferences
  const updatePreferences = async (preferences) => {
    try {
      const response = await apiClient.put('/users/preferences', preferences);
      const updatedUser = { ...user, preferences: response.data.preferences };
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update state
      setUser(updatedUser);
      
      return response.data.preferences;
    } catch (error) {
      throw error;
    }
  };

  // Change password
  const changePassword = async (passwordData) => {
    try {
      await apiClient.put('/users/change-password', passwordData);
      return { success: true };
    } catch (error) {
      throw error;
    }
  };

  // Deactivate account
  const deactivateAccount = async (deactivationData) => {
    try {
      await apiClient.delete('/users/account', { data: deactivationData });
      logout();
      return { success: true };
    } catch (error) {
      throw error;
    }
  };

  // Check if user is admin
  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    updatePreferences,
    changePassword,
    deactivateAccount,
    isAdmin,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
