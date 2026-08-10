import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Material } from "../types/Material";
import { getMaterialById } from "../services/materialService";
import "../styles/MaterialDetailsPage.css";

function MaterialDetailsPage() {
    const { id } = useParams();

    const [material, setMaterial] =
        useState<Material | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) {
            setError("Materijal nije pronađen.");
            setLoading(false);
            return;
        }

        async function loadMaterial() {
            try {
                const data = await getMaterialById(Number(id));
                setMaterial(data);
            } catch {
                setError("Materijal nije pronađen.");
            } finally {
                setLoading(false);
            }
        }

        loadMaterial();
    }, [id]);

    if (loading) {
        return (
            <main className="material-details-page">
                <div className="material-details-container">
                    <p>Učitavanje materijala...</p>
                </div>
            </main>
        );
    }

    if (error || !material) {
        return (
            <main className="material-details-page">
                <div className="material-not-found">
                    <h1>Materijal nije pronađen.</h1>

                    <Link to="/biblioteka">
                        Nazad na biblioteku
                    </Link>
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

                {material.files && material.files.length > 0 && (
                    <section className="material-file-section">
                        <div className="material-files-heading">
                            <h2>Fajlovi</h2>

                            <p>
                                {material.files.length === 1
                                    ? "1 fajl"
                                    : `${material.files.length} fajlova`}
                            </p>
                        </div>

                        <div className="material-files-list">
                            {material.files.map((file) => {
                                const fileUrl =
                                    `http://localhost:5132/api/materials/${material.id}/files/${file.id}`;

                                const downloadUrl =
                                    `http://localhost:5132/api/materials/${material.id}/files/${file.id}/download`;

                                const isImage =
                                    file.contentType?.startsWith("image/");

                                const isPdf =
                                    file.contentType === "application/pdf";

                                return (
                                    <article
                                        className="material-file-item"
                                        key={file.id}
                                    >
                                        <div className="material-file-heading">
                                            <div>
                                                <h3>
                                                    {file.originalFileName}
                                                </h3>

                                                <p>
                                                    {formatFileSize(
                                                        file.fileSize
                                                    )}
                                                </p>
                                            </div>

                                            <div className="material-file-actions">
                                                <a
                                                    href={fileUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="file-action-button"
                                                >
                                                    Otvori
                                                </a>

                                                <a
                                                    href={downloadUrl}
                                                    className="file-action-button"
                                                >
                                                    Preuzmi
                                                </a>
                                            </div>
                                        </div>

                                        {isImage && (
                                            <div className="file-preview">
                                                <img
                                                    src={fileUrl}
                                                    alt={
                                                        file.originalFileName
                                                    }
                                                />
                                            </div>
                                        )}

                                        {isPdf && (
                                            <div className="pdf-preview">
                                                <iframe
                                                    src={fileUrl}
                                                    title={
                                                        file.originalFileName
                                                    }
                                                />
                                            </div>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                )}

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
                                    Izdvoji najvažnije informacije iz
                                    materijala.
                                </p>
                            </div>

                            <button disabled>
                                Generiši
                            </button>
                        </div>

                        <div className="study-tool">
                            <div>
                                <h3>Pitanja</h3>

                                <p>
                                    Kreiraj pitanja za ponavljanje gradiva.
                                </p>
                            </div>

                            <button disabled>
                                Generiši
                            </button>
                        </div>

                        <div className="study-tool">
                            <div>
                                <h3>Flashcards</h3>

                                <p>
                                    Napravi kartice za ponavljanje pojmova.
                                </p>
                            </div>

                            <button disabled>
                                Generiši
                            </button>
                        </div>

                        <div className="study-tool">
                            <div>
                                <h3>Kviz</h3>

                                <p>
                                    Provjeri svoje znanje iz ovog materijala.
                                </p>
                            </div>

                            <button disabled>
                                Generiši
                            </button>
                        </div>
                    </div>

                    <p className="tools-note">
                        Generisanje ćemo omogućiti nakon povezivanja
                        korisničkih računa i backenda.
                    </p>
                </section>
            </div>
        </main>
    );
}

function formatFileSize(bytes: number) {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default MaterialDetailsPage;