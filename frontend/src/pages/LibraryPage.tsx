import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Material } from "../types/Material";
import { getMaterials } from "../services/materialService";
import "../styles/LibraryPage.css";

function LibraryPage() {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadMaterials() {
            try {
                const data = await getMaterials();
                setMaterials(data);
            } catch {
                setError("Došlo je do greške pri učitavanju materijala.");
            } finally {
                setLoading(false);
            }
        }

        loadMaterials();
    }, []);

    const filteredMaterials = materials.filter((material) => {
        const searchValue = search.toLowerCase();

        return (
            material.title.toLowerCase().includes(searchValue) ||
            material.subject.toLowerCase().includes(searchValue)
        );
    });
    if (loading) {
        return (
            <main className="library-page">
                <section className="library-content">
                    <p>Učitavanje materijala...</p>
                </section>
            </main>
        );
    }

    if (error) {
        return (
            <main className="library-page">
                <section className="library-content">
                    <p>{error}</p>
                </section>
            </main>
        );
    }

    return (
        <main className="library-page">
         

            <section className="library-content">
                <div className="library-title-row">
                    <h1>Biblioteka</h1>

                    <Link
                        to="/dodaj-materijal"
                        className="add-material-link"
                    >
                        Dodaj materijal
                    </Link>
                </div>
                <div className="library-controls">
                    <input
                        type="search"
                        placeholder="Pretraži materijale..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
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
                                    <span>
                                        {material.files?.length === 1
                                            ? "1 fajl"
                                            : `${material.files?.length ?? 0} fajlova`}
                                    </span>
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