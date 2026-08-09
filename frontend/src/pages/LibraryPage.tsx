import { useState } from "react";
import { Link } from "react-router-dom";
import { materials } from "../data/materials";
import "../styles/LibraryPage.css";

function LibraryPage() {
    const [search, setSearch] = useState("");
    const [subject, setSubject] = useState("Svi");

    const filteredMaterials = materials.filter((material) => {
        const matchesSearch =
            material.title.toLowerCase().includes(search.toLowerCase()) ||
            material.subject.toLowerCase().includes(search.toLowerCase());

        const matchesSubject =
            subject === "Svi" || material.subject === subject;

        return matchesSearch && matchesSubject;
    });

    return (
        <main className="library-page">
         

            <section className="library-content">
                <div className="library-title-row">
                    <h1>Biblioteka</h1>
                </div>
                <div className="library-controls">
                    <input
                        type="search"
                        placeholder="Pretraži materijale..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />

                    <select
                        value={subject}
                        onChange={(event) => setSubject(event.target.value)}
                    >
                        <option value="Svi">Svi predmeti</option>
                        <option value="Računarske mreže">
                            Računarske mreže
                        </option>
                        <option value="Matematika">Matematika</option>
                        <option value="Arhitektura računara">
                            Arhitektura računara
                        </option>
                        <option value="Baze podataka">
                            Baze podataka
                        </option>
                    </select>
                </div>

                <div className="library-result-header">
                    <span>
                        {filteredMaterials.length}{" "}
                        {filteredMaterials.length === 1
                            ? "materijal"
                            : "materijala"}
                    </span>
                </div>

                <div className="materials-list">
                    {filteredMaterials.map((material) => (
                        <article
                            className="material-row"
                            key={material.id}
                        >
                            <div className="material-main">
                                <span className="material-subject">
                                    {material.subject}
                                </span>

                                <h2>{material.title}</h2>

                                <div className="material-meta">
                                    <span>{material.type}</span>
                                    <span>·</span>
                                    <span>{material.pages} stranica</span>
                                    <span>·</span>
                                    <span>{material.author}</span>
                                </div>
                            </div>

                            <Link
                                to={`/materijal/${material.id}`}
                                className="material-open-button"
                            >
                                Otvori
                            </Link>
                        </article>
                    ))}
                </div>

                {filteredMaterials.length === 0 && (
                    <div className="empty-results">
                        <h2>Nema pronađenih materijala.</h2>
                        <p>
                            Pokušaj promijeniti pojam pretrage ili odabrani
                            predmet.
                        </p>
                    </div>
                )}
            </section>
        </main>
    );
}

export default LibraryPage;