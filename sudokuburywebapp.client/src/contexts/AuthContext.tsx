import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import axios from 'axios';
import { type User, type AuthResponse, type AuthContextType } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  //setting up axios defaults
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    if (savedToken) {
      setToken(savedToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      //quick check to see if token is still valid
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (): Promise<void> => {
    try {
      const response = await axios.get<AuthResponse>('/api/auth/profile');
      if (response.data.user) {
        setUser(response.data.user);
      }
    } catch {
      //clear the token if invalid
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await axios.post<AuthResponse>('/api/auth/login', {
        email,
        password
      });

      if (response.data.success && response.data.token && response.data.user) {
        const { token: authToken, user: userData } = response.data;
        
        //set token and userData to state, set token to localStorage and to be used in request headers
        setToken(authToken);
        setUser(userData);
        localStorage.setItem('authToken', authToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
        
        return { success: true };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (email: string, password: string, confirmPassword: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await axios.post<AuthResponse>('/api/auth/register', {
        email,
        password,
        confirmPassword
      });

      if (response.data.success && response.data.token && response.data.user) {
        const { token: authToken, user: userData } = response.data;
        
        //set token and userData to state, set token to localStorage and to be used in request headers
        setToken(authToken);
        setUser(userData);
        localStorage.setItem('authToken', authToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
        
        return { success: true };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = (): void => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    delete axios.defaults.headers.common['Authorization'];
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};