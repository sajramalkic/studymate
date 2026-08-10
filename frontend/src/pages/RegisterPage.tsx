import { useState } from "react";
import {
    Link,
    useNavigate,
} from "react-router-dom";
import { register } from "../services/authService";
import "../styles/Auth.css";

function RegisterPage() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [error, setError] = useState("");
    const [submitting, setSubmitting] =
        useState(false);

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        const cleanUsername = username.trim();
        const cleanEmail =
            email.trim().toLowerCase();

        if (
            !cleanUsername ||
            !cleanEmail ||
            !password ||
            !confirmPassword
        ) {
            setError("Sva polja su obavezna.");
            return;
        }

        const usernameRegex =
            /^[A-Za-z0-9._]{3,30}$/;

        if (!usernameRegex.test(cleanUsername)) {
            setError(
                "Korisničko ime mora imati između 3 i 30 znakova " +
                "i može sadržavati samo slova, brojeve, tačku i donju crtu."
            );
            return;
        }

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(cleanEmail)) {
            setError("Unesi ispravan email.");
            return;
        }

        if (password.length < 8) {
            setError(
                "Lozinka mora imati najmanje 8 znakova."
            );
            return;
        }

        if (!/[A-Z]/.test(password)) {
            setError(
                "Lozinka mora sadržavati najmanje jedno veliko slovo."
            );
            return;
        }

        if (!/[a-z]/.test(password)) {
            setError(
                "Lozinka mora sadržavati najmanje jedno malo slovo."
            );
            return;
        }

        if (!/[0-9]/.test(password)) {
            setError(
                "Lozinka mora sadržavati najmanje jedan broj."
            );
            return;
        }

        if (password !== confirmPassword) {
            setError(
                "Lozinke se ne podudaraju."
            );
            return;
        }

        try {
            setSubmitting(true);
            setError("");

            await register({
                username: cleanUsername,
                email: cleanEmail,
                password,
            });

            navigate("/prijava");
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError(
                    "Registracija nije uspjela."
                );
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="auth-page">
            <div className="auth-container">
                <div className="auth-heading">
                    <h1>Kreiraj račun</h1>
                </div>

                <form
                    className="auth-form"
                    onSubmit={handleSubmit}
                    noValidate
                >
                    <div className="form-field">
                        <label htmlFor="username">
                            Korisničko ime
                        </label>

                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(event) =>
                                setUsername(
                                    event.target.value
                                )
                            }
                            autoComplete="username"
                            maxLength={30}
                        />

                        <span className="field-help">
                            3–30 znakova · slova,
                            brojevi, . i _
                        </span>
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
                                setEmail(
                                    event.target.value
                                )
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
                                setPassword(
                                    event.target.value
                                )
                            }
                            autoComplete="new-password"
                        />

                        <span className="field-help">
                            Najmanje 8 znakova,
                            veliko i malo slovo te broj
                        </span>
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
                                setConfirmPassword(
                                    event.target.value
                                )
                            }
                            autoComplete="new-password"
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
                        disabled={submitting}
                    >
                        {submitting
                            ? "Registracija..."
                            : "Registruj se"}
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