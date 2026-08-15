import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import type { Material } from "../types/Material";
import { getMaterials } from "../services/materialService";

import "../styles/LibraryPage.css";
import "../styles/MaterialFilters.css";

function LibraryPage() {
    const [materials, setMaterials] =
        useState<Material[]>([]);

    const [search, setSearch] =
        useState("");

    const [selectedType, setSelectedType] =
        useState("");

    const [selectedSubject, setSelectedSubject] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {
        async function loadMaterials() {
            try {
                const data =
                    await getMaterials();

                setMaterials(data);
            } catch {
                setError(
                    "Došlo je do greške pri učitavanju materijala."
                );
            } finally {
                setLoading(false);
            }
        }

        loadMaterials();
    }, []);

    const subjects = useMemo(
        () =>
            Array.from(
                new Set(
                    materials
                        .map(
                            (material) =>
                                material.subject
                        )
                        .filter(Boolean)
                )
            ).sort((a, b) =>
                a.localeCompare(b)
            ),
        [materials]
    );

    const types = useMemo(
        () =>
            Array.from(
                new Set(
                    materials
                        .map(
                            (material) =>
                                material.type
                        )
                        .filter(Boolean)
                )
            ).sort((a, b) =>
                a.localeCompare(b)
            ),
        [materials]
    );

    const filteredMaterials = useMemo(() => {
        const searchValue =
            search.trim().toLowerCase();

        return materials.filter(
            (material) => {
                const matchesSearch =
                    !searchValue ||
                    material.title
                        .toLowerCase()
                        .includes(searchValue) ||
                    material.subject
                        .toLowerCase()
                        .includes(searchValue) ||
                    material.author
                        ?.toLowerCase()
                        .includes(searchValue) ||
                    material.uploaderUsername
                        ?.toLowerCase()
                        .includes(searchValue);

                const matchesType =
                    !selectedType ||
                    material.type ===
                    selectedType;

                const matchesSubject =
                    !selectedSubject ||
                    material.subject ===
                    selectedSubject;

                return (
                    matchesSearch &&
                    matchesType &&
                    matchesSubject
                );
            }
        );
    }, [
        materials,
        search,
        selectedType,
        selectedSubject,
    ]);

    const hasActiveFilters =
        search.trim() !== "" ||
        selectedType !== "" ||
        selectedSubject !== "";

    function clearFilters() {
        setSearch("");
        setSelectedType("");
        setSelectedSubject("");
    }

    if (loading) {
        return (
            <main className="library-page">
                <section className="library-content">
                    <p>
                        Učitavanje materijala...
                    </p>
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

                <div className="material-filters">
                    <div className="material-search">
                        <label
                            htmlFor="library-search"
                            className="material-filter-label"
                        >
                            Pretraga
                        </label>

                        <input
                            id="library-search"
                            type="search"
                            placeholder="Pretraživanje..."
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                        />
                    </div>

                    <div className="material-filter-field">
                        <label
                            htmlFor="library-type"
                            className="material-filter-label"
                        >
                            Vrsta
                        </label>

                        <select
                            id="library-type"
                            value={selectedType}
                            onChange={(event) =>
                                setSelectedType(
                                    event.target.value
                                )
                            }
                        >
                            <option value="">
                                Sve
                            </option>

                            {types.map((type) => (
                                <option
                                    key={type}
                                    value={type}
                                >
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="material-filter-field">
                        <label
                            htmlFor="library-subject"
                            className="material-filter-label"
                        >
                            Predmet
                        </label>

                        <select
                            id="library-subject"
                            value={
                                selectedSubject
                            }
                            onChange={(event) =>
                                setSelectedSubject(
                                    event.target.value
                                )
                            }
                        >
                            <option value="">
                                Svi predmeti
                            </option>

                            {subjects.map(
                                (subject) => (
                                    <option
                                        key={
                                            subject
                                        }
                                        value={
                                            subject
                                        }
                                    >
                                        {
                                            subject
                                        }
                                    </option>
                                )
                            )}
                        </select>
                    </div>
                </div>

                <div className="material-filter-summary">
                    <span>
                        {filteredMaterials.length}{" "}
                        {filteredMaterials.length ===
                            1
                            ? "materijal"
                            : "materijala"}
                    </span>

                    {hasActiveFilters && (
                        <button
                            type="button"
                            className="clear-filters-button"
                            onClick={
                                clearFilters
                            }
                        >
                            Očisti filtere
                        </button>
                    )}
                </div>

                {filteredMaterials.length >
                    0 && (
                        <div className="materials-list">
                            {filteredMaterials.map(
                                (material) => (
                                    <article
                                        className="material-row"
                                        key={
                                            material.id
                                        }
                                    >
                                        <div className="material-main">
                                            <span className="material-subject">
                                                {
                                                    material.subject
                                                }
                                            </span>

                                            <h2>
                                                {
                                                    material.title
                                                }
                                            </h2>

                                            <span className="material-uploader">
                                                {
                                                    material.uploaderUsername
                                                }
                                            </span>

                                            <div className="material-meta">
                                                <span>
                                                    {
                                                        material.type
                                                    }
                                                </span>

                                                {material.pages !== null &&
                                                    material.pages !== undefined && (
                                                        <>
                                                            <span>·</span>

                                                            <span>
                                                                {material.pages} stranica
                                                            </span>
                                                        </>
                                                    )}

                                                <span>
                                                    ·
                                                </span>

                                                <span>
                                                    {material
                                                        .files
                                                        ?.length ===
                                                        1
                                                        ? "1 fajl"
                                                        : `${material.files?.length ?? 0} fajlova`}
                                                </span>

                                                {material.author && (
                                                    <>
                                                        <span>
                                                            ·
                                                        </span>

                                                        <span>
                                                            {
                                                                material.author
                                                            }
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <Link
                                            to={`/materijal/${material.id}`}
                                            className="material-open-button"
                                        >
                                            Otvori
                                        </Link>
                                    </article>
                                )
                            )}
                        </div>
                    )}

                {filteredMaterials.length ===
                    0 && (
                        <div className="empty-results">
                            <h2>
                                Nema pronađenih
                                materijala.
                            </h2>

                            <p>
                                Pokušaj promijeniti
                                pretragu ili odabrane
                                filtere.
                            </p>

                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    className="clear-filters-button"
                                    onClick={
                                        clearFilters
                                    }
                                >
                                    Očisti filtere
                                </button>
                            )}
                        </div>
                    )}
            </section>
        </main>
    );
}

export default LibraryPage;