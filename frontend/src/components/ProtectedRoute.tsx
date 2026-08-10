import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type ProtectedRouteProps = {
    children: React.ReactNode;
};

function ProtectedRoute({
    children,
}: ProtectedRouteProps) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <main className="auth-page">
                <div className="auth-container">
                    <p>Učitavanje...</p>
                </div>
            </main>
        );
    }

    if (!user) {
        return (
            <Navigate
                to="/prijava"
                replace
            />
        );
    }

    return children;
}

export default ProtectedRoute;