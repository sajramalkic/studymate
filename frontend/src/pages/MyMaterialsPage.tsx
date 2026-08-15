import {
    useEffect,
    useMemo,
    useState,
} from "react";

import { Link } from "react-router-dom";

import type { Material } from "../types/Material";

import {
    deleteMaterial,
    getMyMaterials,
} from "../services/materialService";

import "../styles/MyMaterialsPage.css";
import "../styles/MaterialFilters.css";

function MyMaterialsPage() {
    const [materials, setMaterials] =
        useState<Material[]>([]);

    const [search, setSearch] =
        useState("");

    const [selectedType, setSelectedType] =
        useState("");

    const [
        selectedSubject,
        setSelectedSubject,
    ] = useState("");

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [deletingId, setDeletingId] =
        useState<number | null>(null);

    useEffect(() => {
        async function loadMaterials() {
            try {
                const data =
                    await getMyMaterials();

                setMaterials(data);
            } catch (error) {
                if (
                    error instanceof Error
                ) {
                    setError(
                        error.message
                    );
                } else {
                    setError(
                        "Nije moguće učitati tvoje materijale."
                    );
                }
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

    const filteredMaterials =
        useMemo(() => {
            const searchValue =
                search
                    .trim()
                    .toLowerCase();

            return materials.filter(
                (material) => {
                    const matchesSearch =
                        !searchValue ||
                        material.title
                            .toLowerCase()
                            .includes(
                                searchValue
                            ) ||
                        material.subject
                            .toLowerCase()
                            .includes(
                                searchValue
                            ) ||
                        material.author
                            ?.toLowerCase()
                            .includes(
                                searchValue
                            );

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

    async function handleDelete(
        material: Material
    ) {
        const confirmed =
            window.confirm(
                `Želiš li sigurno obrisati materijal "${material.title}"?`
            );

        if (!confirmed) {
            return;
        }

        try {
            setDeletingId(
                material.id
            );

            setError("");

            await deleteMaterial(
                material.id
            );

            setMaterials(
                (currentMaterials) =>
                    currentMaterials.filter(
                        (item) =>
                            item.id !==
                            material.id
                    )
            );
        } catch (error) {
            if (
                error instanceof Error
            ) {
                setError(
                    error.message
                );
            } else {
                setError(
                    "Nije moguće obrisati materijal."
                );
            }
        } finally {
            setDeletingId(null);
        }
    }

    if (loading) {
        return (
            <main className="my-materials-page">
                <div className="my-materials-container">
                    <p>
                        Učitavanje materijala...
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="my-materials-page">
            <div className="my-materials-container">
                <div className="my-materials-heading">
                    <div>
                        <p className="my-materials-label">
                            Moj račun
                        </p>

                        <h1>
                            Moji materijali
                        </h1>
                    </div>

                    <Link
                        to="/dodaj-materijal"
                        className="add-my-material-button"
                    >
                        Dodaj materijal
                    </Link>
                </div>

                {error && (
                    <p className="my-materials-error">
                        {error}
                    </p>
                )}

                {materials.length === 0 &&
                    !error && (
                        <div className="my-materials-empty">
                            <h2>
                                Još nemaš
                                objavljenih
                                materijala.
                            </h2>

                            <p>
                                Dodaj prvi
                                materijal i
                                pojavit će se
                                ovdje.
                            </p>
                        </div>
                    )}

                {materials.length > 0 && (
                    <>
                        <div className="material-filters">
                            <div className="material-search">
                                <label
                                    htmlFor="my-materials-search"
                                    className="material-filter-label"
                                >
                                    Pretraga
                                </label>

                                <input
                                    id="my-materials-search"
                                    type="search"
                                    placeholder="Pretraži svoje materijale..."
                                    value={
                                        search
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setSearch(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                />
                            </div>

                            <div className="material-filter-field">
                                <label
                                    htmlFor="my-materials-type"
                                    className="material-filter-label"
                                >
                                    Vrsta
                                </label>

                                <select
                                    id="my-materials-type"
                                    value={
                                        selectedType
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setSelectedType(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                >
                                    <option value="">
                                        Sve vrste
                                    </option>

                                    {types.map(
                                        (
                                            type
                                        ) => (
                                            <option
                                                key={
                                                    type
                                                }
                                                value={
                                                    type
                                                }
                                            >
                                                {
                                                    type
                                                }
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            <div className="material-filter-field">
                                <label
                                    htmlFor="my-materials-subject"
                                    className="material-filter-label"
                                >
                                    Predmet
                                </label>

                                <select
                                    id="my-materials-subject"
                                    value={
                                        selectedSubject
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setSelectedSubject(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                >
                                    <option value="">
                                        Svi predmeti
                                    </option>

                                    {subjects.map(
                                        (
                                            subject
                                        ) => (
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
                                {
                                    filteredMaterials.length
                                }{" "}
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
                                    Očisti
                                    filtere
                                </button>
                            )}
                        </div>

                        {filteredMaterials.length >
                            0 ? (
                            <div className="my-materials-list">
                                {filteredMaterials.map(
                                    (
                                        material
                                    ) => (
                                        <article
                                            className="my-material-row"
                                            key={
                                                material.id
                                            }
                                        >
                                            <div className="my-material-content">
                                                <Link
                                                    to={`/materijal/${material.id}`}
                                                    className="my-material-main"
                                                >
                                                    <div className="my-material-title">
                                                        <p>
                                                            {
                                                                material.subject
                                                            }
                                                        </p>

                                                        <h2>
                                                            {
                                                                material.title
                                                            }
                                                        </h2>
                                                    </div>

                                                    <div className="my-material-meta">
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
                                                </Link>

                                                <div className="my-material-actions">
                                                    <Link
                                                        to={`/uredi-materijal/${material.id}`}
                                                        className="edit-material-button"
                                                    >
                                                        Uredi
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        className="delete-material-button"
                                                        disabled={
                                                            deletingId ===
                                                            material.id
                                                        }
                                                        onClick={() =>
                                                            handleDelete(
                                                                material
                                                            )
                                                        }
                                                    >
                                                        {deletingId ===
                                                            material.id
                                                            ? "Brisanje..."
                                                            : "Obriši"}
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    )
                                )}
                            </div>
                        ) : (
                            <div className="my-materials-empty filtered-empty">
                                <h2>
                                    Nema
                                    pronađenih
                                    materijala.
                                </h2>

                                <p>
                                    Pokušaj
                                    promijeniti
                                    pretragu ili
                                    filtere.
                                </p>

                                <button
                                    type="button"
                                    className="clear-filters-button"
                                    onClick={
                                        clearFilters
                                    }
                                >
                                    Očisti
                                    filtere
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}

export default MyMaterialsPage;