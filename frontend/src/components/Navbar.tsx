import { Link } from "react-router-dom";
import "../styles/Navbar.css";

function Navbar() {
    return (
        <header className="navbar">
            <Link to="/" className="navbar-logo">
                StudyMate
            </Link>

            <nav className="navbar-navigation">
                <Link to="/biblioteka">Biblioteka</Link>
                <Link to="/o-projektu">O projektu</Link>
                <Link to="/prijava" className="login-link">
                    Prijava
                </Link>
            </nav>
        </header>
    );
}

export default Navbar;