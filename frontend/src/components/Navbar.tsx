import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Navbar.css";

function Navbar() {
    const navigate = useNavigate();

    const {
        user,
        loading,
        signOut,
    } = useAuth();

    async function handleLogout() {
        try {
            await signOut();
            navigate("/");
        } catch {
            console.error("Odjava nije uspjela.");
        }
    }

    return (
        <header className="navbar">
            <Link
                to="/"
                className="navbar-logo"
            >
                StudyMate
            </Link>

            <nav className="navbar-navigation">
                <Link to="/biblioteka">
                    Biblioteka
                </Link>

                <Link to="/o-projektu">
                    O projektu
                </Link>

                {!loading && !user && (
                    <Link
                        to="/prijava"
                        className="login-link"
                    >
                        Prijava
                    </Link>
                )}

                {!loading && user && (
                    <>
                        <Link to="/moji-materijali">
                            Moji materijali
                        </Link>

                        <Link
                            to="/profil"
                            className="profile-link"
                        >
                            Profil
                        </Link>

                        <button
                            type="button"
                            className="logout-button"
                            onClick={handleLogout}
                        >
                            Odjava
                        </button>
                    </>
                )}
            </nav>
        </header>
    );
}

export default Navbar;