import { Link, useParams } from "react-router-dom";
import { materials } from "../data/materials";
import "../styles/MaterialDetailsPage.css";

function MaterialDetailsPage() {
    const { id } = useParams();

    const material = materials.find(
        (item) => item.id === Number(id)
    );

    if (!material) {
        return (
            <main className="material-details-page">
                <div className="material-not-found">
                    <h1>Materijal nije pronađen.</h1>
                    <Link to="/biblioteka">Nazad na biblioteku</Link>
                </div>
            </main>
        );
    }

    return (
        <main className="material-details-page">
            <div className="material-details-container">
                <Link
                    to="/biblioteka"
                    className="back-link"
                >
                    ← Biblioteka
                </Link>

                <section className="material-heading">
                    <p className="material-details-subject">
                        {material.subject}
                    </p>

                    <h1>{material.title}</h1>

                    <div className="material-details-meta">
                        <span>{material.type}</span>
                        <span>·</span>
                        <span>{material.pages} stranica</span>
                        <span>·</span>
                        <span>{material.author}</span>
                    </div>
                </section>

                <section className="material-description">
                    <h2>O materijalu</h2>
                    <p>{material.description}</p>
                </section>

                <section className="study-tools">
                    <div className="study-tools-heading">
                        <h2>Alati za učenje</h2>
                        <p>
                            Odaberi način na koji želiš raditi sa ovim
                            materijalom.
                        </p>
                    </div>

                    <div className="study-tool-list">
                        <div className="study-tool">
                            <div>
                                <h3>Sažetak</h3>
                                <p>
                                    Izdvoji najvažnije informacije iz materijala.
                                </p>
                            </div>

                            <button disabled>Generiši</button>
                        </div>

                        <div className="study-tool">
                            <div>
                                <h3>Pitanja</h3>
                                <p>
                                    Kreiraj pitanja za ponavljanje gradiva.
                                </p>
                            </div>

                            <button disabled>Generiši</button>
                        </div>

                        <div className="study-tool">
                            <div>
                                <h3>Flashcards</h3>
                                <p>
                                    Napravi kartice za ponavljanje pojmova.
                                </p>
                            </div>

                            <button disabled>Generiši</button>
                        </div>

                        <div className="study-tool">
                            <div>
                                <h3>Kviz</h3>
                                <p>
                                    Provjeri svoje znanje iz ovog materijala.
                                </p>
                            </div>

                            <button disabled>Generiši</button>
                        </div>
                    </div>

                    <p className="tools-note">
                        Generisanje ćemo omogućiti nakon povezivanja korisničkih
                        računa i backenda.
                    </p>
                </section>
            </div>
        </main>
    );
}

export default MaterialDetailsPage;