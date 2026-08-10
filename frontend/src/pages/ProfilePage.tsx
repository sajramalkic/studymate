import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/ProfilePage.css";

function ProfilePage() {
    const navigate = useNavigate();

    const {
        user,
        signOut,
    } = useAuth();

    async function handleLogout() {
        try {
            await signOut();
            navigate("/");
        } catch {
            // Možemo kasnije dodati posebnu poruku u UI.
        }
    }

    if (!user) {
        return null;
    }

    return (
        <main className="profile-page">
            <div className="profile-container">
                <header className="profile-heading">
                    <p className="profile-label">
                        Moj profil
                    </p>

                    <h1>
                        @{user.username}
                    </h1>
                </header>

                <section className="profile-section">
                    <h2>Podaci o računu</h2>

                    <div className="profile-info-list">
                        <div className="profile-info-row">
                            <span className="profile-info-label">
                                Korisničko ime
                            </span>

                            <span className="profile-info-value">
                                @{user.username}
                            </span>
                        </div>

                        <div className="profile-info-row">
                            <span className="profile-info-label">
                                Email
                            </span>

                            <span className="profile-info-value">
                                {user.email}
                            </span>
                        </div>
                    </div>
                </section>

                <section className="profile-section">
                    <h2>Materijali</h2>

                    <p className="profile-section-description">
                        Ovdje ćeš moći pregledati materijale
                        koje si objavila.
                    </p>

                    <button
                        type="button"
                        className="profile-secondary-button"
                        onClick={() =>
                            navigate("/moji-materijali")
                        }
                    >
                        Moji materijali
                    </button>
                </section>

                <section className="profile-section profile-account-section">
                    <h2>Račun</h2>

                    <button
                        type="button"
                        className="profile-logout-button"
                        onClick={handleLogout}
                    >
                        Odjavi se
                    </button>
                </section>
            </div>
        </main>
    );
}

export default ProfilePage;