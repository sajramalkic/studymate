import "../styles/HomePage.css";
import { Link } from "react-router-dom";

function HomePage() {
    return (
        <main className="home-page">
            <section className="hero">
                <div className="hero-content">

                    <h1>Učenje počinje dobrim materijalom.</h1>

                    <p className="hero-description">
                        Kreiraj pitanja, sažetke i kartice ili pronađi ono što su podijelili drugi.
                    </p>

                    <div className="hero-actions">
                        <Link to="/prijava" className="primary-button">
                            Započni
                        </Link>

                        <Link to="/biblioteka" className="secondary-button">
                            Pregledaj biblioteku
                        </Link>
                    </div>
                </div>
            </section>

            <section className="features-section">
                <div className="section-heading">
                    <p className="section-label">Alati za učenje</p>
                    <h2>Jedan materijal, više načina za ponavljanje.</h2>
                </div>

                <div className="features-list">
                    <div className="feature-item">
                        <span className="feature-number">01</span>

                        <div>
                            <h3>Sažeci</h3>
                            <p>
                                Izdvoji najvažnije informacije iz svog materijala.
                            </p>
                        </div>
                    </div>

                    <div className="feature-item">
                        <span className="feature-number">02</span>

                        <div>
                            <h3>Pitanja</h3>
                            <p>
                                Uči pomoću pitanja kreiranih na osnovu gradiva.
                            </p>
                        </div>
                    </div>

                    <div className="feature-item">
                        <span className="feature-number">03</span>

                        <div>
                            <h3>Flashcards</h3>
                            <p>
                                Ponavljaj pojmove i definicije pomoću kartica.
                            </p>
                        </div>
                    </div>

                    <div className="feature-item">
                        <span className="feature-number">04</span>

                        <div>
                            <h3>Kvizovi</h3>
                            <p>
                                Provjeri koliko si gradiva zaista usvojio.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default HomePage;