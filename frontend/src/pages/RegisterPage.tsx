import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Auth.css";

function RegisterPage() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!username || !email || !password || !confirmPassword) {
            setError("Sva polja su obavezna.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Lozinke se ne podudaraju.");
            return;
        }

        setError("");

        console.log({
            username,
            email,
            password,
        });
    }

    return (
        <main className="auth-page">
            <div className="auth-container">
                <div className="auth-heading">
                    <h1>Kreiraj račun</h1>
                   
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-field">
                        <label htmlFor="username">
                            Korisničko ime
                        </label>

                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(event) =>
                                setUsername(event.target.value)
                            }
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="email">
                            Email
                        </label>

                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="password">
                            Lozinka
                        </label>

                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="confirm-password">
                            Potvrdi lozinku
                        </label>

                        <input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(event) =>
                                setConfirmPassword(event.target.value)
                            }
                        />
                    </div>

                    {error && (
                        <p className="form-error">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="auth-submit-button"
                    >
                        Registruj se
                    </button>
                </form>

                <p className="auth-switch">
                    Već imaš račun?{" "}
                    <Link to="/prijava">
                        Prijavi se
                    </Link>
                </p>
            </div>
        </main>
    );
}

export default RegisterPage;