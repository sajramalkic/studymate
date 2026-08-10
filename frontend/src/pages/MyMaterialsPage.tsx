import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Material } from "../types/Material";
import {
    deleteMaterial,
    getMyMaterials,
} from "../services/materialService";
import "../styles/MyMaterialsPage.css";

function MyMaterialsPage() {
    const [materials, setMaterials] =
        useState<Material[]>([]);

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
                if (error instanceof Error) {
                    setError(error.message);
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

    async function handleDelete(
        material: Material
    ) {
        const confirmed = window.confirm(
            `Želiš li sigurno obrisati materijal "${material.title}"?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeletingId(material.id);
            setError("");

            await deleteMaterial(material.id);

            setMaterials((currentMaterials) =>
                currentMaterials.filter(
                    (item) =>
                        item.id !== material.id
                )
            );
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
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
                                Još nemaš objavljenih
                                materijala.
                            </h2>

                            <p>
                                Dodaj prvi materijal i
                                pojavit će se ovdje.
                            </p>

                            <Link
                                to="/dodaj-materijal"
                                className="empty-add-material-link"
                            >
                                Dodaj materijal
                            </Link>
                        </div>
                    )}

                {materials.length > 0 && (
                    <div className="my-materials-list">
                        {materials.map(
                            (material) => (
                                <article
                                    className="my-material-row"
                                    key={material.id}
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

                                                <span>·</span>

                                                <span>
                                                    {
                                                        material.pages
                                                    }{" "}
                                                    stranica
                                                </span>

                                                <span>·</span>

                                                <span>
                                                    {material
                                                        .files
                                                        ?.length ===
                                                        1
                                                        ? "1 fajl"
                                                        : `${material.files?.length ?? 0} fajlova`}
                                                </span>
                                            </div>
                                        </Link>

                                        <div className="my-material-actions">
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
                )}
            </div>
        </main>
    );
}

export default MyMaterialsPage;