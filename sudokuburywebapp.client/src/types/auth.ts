export interface User {
    id: string;
    email: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    token?: string;
    tokenExpiration?: string;
    user?: User;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    confirmPassword: string;
}

export interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean, message?: string }>;
    register: (email: string, password: string, confirmPassword: string) => Promise<{ success: boolean, message?: string }>
    logout: () => void;
    isAuthenticated: boolean;
}