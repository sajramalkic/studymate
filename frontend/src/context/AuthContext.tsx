import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import {
    getCurrentUser,
    logout,
} from "../services/authService";

import type {
    CurrentUser,
} from "../services/authService";

type AuthContextType = {
    user: CurrentUser | null;
    loading: boolean;
    refreshUser: () => Promise<void>;
    signOut: () => Promise<void>;
};

const AuthContext =
    createContext<AuthContextType | undefined>(
        undefined
    );

type AuthProviderProps = {
    children: React.ReactNode;
};

export function AuthProvider({
    children,
}: AuthProviderProps) {
    const [user, setUser] =
        useState<CurrentUser | null>(null);

    const [loading, setLoading] =
        useState(true);

    async function refreshUser() {
        try {
            const currentUser =
                await getCurrentUser();

            setUser(currentUser);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    async function signOut() {
        await logout();
        setUser(null);
    }

    useEffect(() => {
        refreshUser();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                refreshUser,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth mora biti korišten unutar AuthProvider-a."
        );
    }

    return context;
}