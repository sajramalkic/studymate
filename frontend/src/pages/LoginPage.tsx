import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import "../styles/Auth.css";

function LoginPage() {
    const navigate = useNavigate();

    const { refreshUser } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (!email.trim() || !password) {
            setError("Unesi email i lozinku.");
            return;
        }

        try {
            setSubmitting(true);
            setError("");

            await login({
                email: email.trim(),
                password,
            });

            // Nakon uspješne prijave ponovo učitavamo
            // trenutno prijavljenog korisnika.
            await refreshUser();

            navigate("/");
        } catch {
            setError("Email ili lozinka nisu ispravni.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="auth-page">
            <div className="auth-container">
                <div className="auth-heading">
                    <h1>Prijava</h1>
                </div>

                <form
                    className="auth-form"
                    onSubmit={handleSubmit}
                    noValidate
                >
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
                            autoComplete="email"
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
                            autoComplete="current-password"
                        />
                    </div>

                    {error && (
                        <div className="form-error">
                            <p>{error}</p>

                            <p>
                                Ako nemaš račun,{" "}
                                <Link to="/registracija">
                                    registruj se
                                </Link>
                                .
                            </p>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="auth-submit-button"
                        disabled={submitting}
                    >
                        {submitting
                            ? "Prijava..."
                            : "Prijavi se"}
                    </button>
                </form>

                <p className="auth-switch">
                    Nemaš račun?{" "}
                    <Link to="/registracija">
                        Registruj se
                    </Link>
                </p>
            </div>
        </main>
    );
}

export default LoginPage;