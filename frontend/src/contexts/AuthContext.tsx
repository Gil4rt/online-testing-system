import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '../types';
import * as api from '../services/api';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
    user: User | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // Проверяем срок действия токена
                const decoded: any = jwtDecode(token);
                if (decoded.exp * 1000 > Date.now()) {
                    loadUser();
                } else {
                    localStorage.removeItem('token');
                    setIsLoading(false);
                }
            } catch {
                localStorage.removeItem('token');
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
        }
    }, []);

    const loadUser = async () => {
        try {
            const userData = await api.getCurrentUser();
            setUser(userData);
        } catch {
            localStorage.removeItem('token');
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (username: string, password: string) => {
        const response = await api.login(username, password);
        localStorage.setItem('token', response.access_token);
        await loadUser();
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
                isAuthenticated: !!user,
                isLoading
            }}
        >
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
