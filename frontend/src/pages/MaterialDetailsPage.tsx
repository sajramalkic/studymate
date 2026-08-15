import { useEffect, useState } from "react";
import {
Link,
    useLocation,
    useParams,
} from "react-router-dom"; 

import type { Material } from "../types/Material";

import { getMaterialById } from "../services/materialService";

import QuestionGenerator from "../components/QuestionGenerator";

import "../styles/MaterialDetailsPage.css";
import SummaryGenerator from "../components/SummaryGenerator";
import FlashcardGenerator from "../components/FlashcardGenerator";
import QuizGenerator from "../components/QuizGenerator";
import CommentSection
    from "../components/CommentSection";


function MaterialDetailsPage() {
    const { id } = useParams();

    const location = useLocation();

    const fromMyMaterials =
        location.state?.from ===
        "moji-materijali";

    const backPath = fromMyMaterials
        ? "/moji-materijali"
        : "/biblioteka";

    const backLabel = fromMyMaterials
        ? "Moji materijali"
        : "Biblioteka";

    const [material, setMaterial] =
        useState<Material | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [
        showQuestionGenerator,
        setShowQuestionGenerator,
    ] = useState(false);

    const [showSummaryGenerator, setShowSummaryGenerator] =
        useState(false);

    const [
        showFlashcardGenerator,
        setShowFlashcardGenerator,
    ] = useState(false);

    const [
        showQuizGenerator,
        setShowQuizGenerator,
    ] = useState(false);

    useEffect(() => {
        if (!id) {
            setError(
                "Materijal nije pronađen."
            );

            setLoading(false);
            return;
        }

        async function loadMaterial() {
            try {
                const data =
                    await getMaterialById(
                        Number(id)
                    );

                setMaterial(data);
            } catch {
                setError(
                    "Materijal nije pronađen."
                );
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
                    <p>
                        Učitavanje materijala...
                    </p>
                </div>
            </main>
        );
    }

    if (error || !material) {
        return (
            <main className="material-details-page">
                <div className="material-not-found">
                    <h1>
                        Materijal nije pronađen.
                    </h1>

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
             

                <section className="material-heading">
                    <p className="material-details-subject">
                        {material.subject}
                    </p>

                    <h1>
                        {material.title}
                    </h1>

                    <p className="material-uploader">
                        {material.uploaderUsername}
                    </p>

                    <div className="material-details-meta">
                        <span>
                            {material.type}
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

                        {material.author && (
                            <>
                                <span>·</span>

                                <span>
                                    {material.author}
                                </span>
                            </>
                        )}
                    </div>
                </section>

                {material.description && (
                    <section className="material-description">
                        <h2>
                            O materijalu
                        </h2>

                        <p>
                            {material.description}
                        </p>
                    </section>
                )}

                {material.files &&
                    material.files.length > 0 && (
                        <section className="material-file-section">
                            <div className="material-files-heading">
                                <h2>
                                    Fajlovi
                                </h2>

                                <p>
                                    {material.files.length === 1
                                        ? "1 fajl"
                                        : `${material.files.length} fajlova`}
                                </p>
                            </div>

                            <div className="material-files-list">
                                {material.files.map(
                                    (file) => {
                                        const fileUrl =
                                            `http://localhost:5132/api/materials/${material.id}/files/${file.id}`;

                                        const downloadUrl =
                                            `http://localhost:5132/api/materials/${material.id}/files/${file.id}/download`;

                                        const isImage =
                                            file.contentType
                                                ?.startsWith(
                                                    "image/"
                                                );

                                        const isPdf =
                                            file.contentType ===
                                            "application/pdf";

                                        return (
                                            <article
                                                className="material-file-item"
                                                key={file.id}
                                            >
                                                <div className="material-file-heading">
                                                    <div>
                                                        <h3>
                                                            {
                                                                file.originalFileName
                                                            }
                                                        </h3>

                                                        <p>
                                                            {formatFileSize(
                                                                file.fileSize
                                                            )}
                                                        </p>
                                                    </div>

                                                    <div className="material-file-actions">
                                                        <a
                                                            href={
                                                                fileUrl
                                                            }
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="file-action-button"
                                                        >
                                                            Otvori
                                                        </a>

                                                        <a
                                                            href={
                                                                downloadUrl
                                                            }
                                                            className="file-action-button"
                                                        >
                                                            Preuzmi
                                                        </a>
                                                    </div>
                                                </div>

                                                {isImage && (
                                                    <div className="file-preview">
                                                        <img
                                                            src={
                                                                fileUrl
                                                            }
                                                            alt={
                                                                file.originalFileName
                                                            }
                                                        />
                                                    </div>
                                                )}

                                                {isPdf && (
                                                    <div className="pdf-preview">
                                                        <iframe
                                                            src={
                                                                fileUrl
                                                            }
                                                            title={
                                                                file.originalFileName
                                                            }
                                                        />
                                                    </div>
                                                )}
                                            </article>
                                        );
                                    }
                                )}
                            </div>
                        </section>
                    )}

                <section className="study-tools">
                    <div className="study-tools-heading">
                        <h2>
                            Alati za učenje
                        </h2>

                       
                    </div>

                    <div className="study-tool-list">
                        {/* SAŽETAK */}
                        <div
                            className={`study-tool study-tool-expandable ${showSummaryGenerator ? "open" : ""
                                }`}
                        >
                            <div className="study-tool-row">
                                <div>
                                    <h3>Sažetak</h3>

                                    <p>
                                        Izdvoji najvažnije informacije iz
                                        materijala.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowSummaryGenerator(
                                            (current) => !current
                                        )
                                    }
                                >
                                    {showSummaryGenerator
                                        ? "Zatvori"
                                        : "Generiši"}
                                </button>
                            </div>

                            {showSummaryGenerator && (
                                <SummaryGenerator material={material} />
                            )}
                        </div>

                        {/* PITANJA */}
                        <div
                            className={`study-tool study-tool-expandable ${showQuestionGenerator
                                    ? "open"
                                    : ""
                                }`}
                        >
                            <div className="study-tool-row">
                                <div>
                                    <h3>
                                        Pitanja
                                    </h3>

                                    <p>
                                        Kreiraj pitanja
                                        za ponavljanje
                                        gradiva.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowQuestionGenerator(
                                            (
                                                current
                                            ) =>
                                                !current
                                        )
                                    }
                                >
                                    {showQuestionGenerator
                                        ? "Zatvori"
                                        : "Generiši"}
                                </button>
                            </div>

                            {showQuestionGenerator && (
                                <QuestionGenerator
                                    material={
                                        material
                                    }
                                />
                            )}
                        </div>

                        {/* FLASHCARDS */}
                        <div
                            className={`study-tool study-tool-expandable ${showFlashcardGenerator ? "open" : ""
                                }`}
                        >
                            <div className="study-tool-row">
                                <div>
                                    <h3>Flashcards</h3>

                                    <p>
                                        Napravi kartice za brzo i aktivno
                                        ponavljanje gradiva.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowFlashcardGenerator(
                                            (current) => !current
                                        )
                                    }
                                >
                                    {showFlashcardGenerator
                                        ? "Zatvori"
                                        : "Generiši"}
                                </button>
                            </div>

                            {showFlashcardGenerator && (
                                <FlashcardGenerator material={material} />
                            )}
                        </div>

                        <div
                            className={`study-tool study-tool-expandable ${showQuizGenerator ? "open" : ""
                                }`}
                        >
                            <div className="study-tool-row">
                                <div>
                                    <h3>Kviz</h3>

                                    <p>
                                        Provjeri svoje znanje iz ovog materijala.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowQuizGenerator(
                                            (current) => !current
                                        )
                                    }
                                >
                                    {showQuizGenerator
                                        ? "Zatvori"
                                        : "Generiši"}
                                </button>
                            </div>

                            {showQuizGenerator && (
                                <QuizGenerator material={material} />
                            )}
                        </div>
                    </div>
                </section>
                <CommentSection materialId={material.id} />
            </div>
        </main>
    );
}

function formatFileSize(
    bytes: number
) {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(
            bytes / 1024
        ).toFixed(1)} KB`;
    }

    return `${(
        bytes /
        (1024 * 1024)
    ).toFixed(1)} MB`;
}

export default MaterialDetailsPage;