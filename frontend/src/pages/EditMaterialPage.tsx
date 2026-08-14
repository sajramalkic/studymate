import {
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    getMaterialById,
    updateMaterial,
} from "../services/materialService";

import "../styles/CreateMaterialPage.css";

function EditMaterialPage() {
    const { id } = useParams();

    const navigate = useNavigate();

    const [title, setTitle] =
        useState("");

    const [subject, setSubject] =
        useState("");

    const [type, setType] =
        useState("");

    const [pages, setPages] =
        useState("");

    const [author, setAuthor] =
        useState("");

    const [description, setDescription] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState("");

    useEffect(() => {
        async function loadMaterial() {
            if (!id) {
                setError(
                    "Materijal nije pronađen."
                );

                setLoading(false);
                return;
            }

            try {
                const material =
                    await getMaterialById(
                        Number(id)
                    );

                setTitle(material.title);
                setSubject(material.subject);
                setType(material.type);

                setPages(
                    material.pages.toString()
                );

                setAuthor(
                    material.author ?? ""
                );

                setDescription(
                    material.description ?? ""
                );
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

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (!id) {
            return;
        }

        if (
            !title.trim() ||
            !subject.trim() ||
            !type.trim()
        ) {
            setError(
                "Popuni sva obavezna polja."
            );

            return;
        }

        const pageCount = Number(pages);

        if (
            !Number.isInteger(pageCount) ||
            pageCount <= 0
        ) {
            setError(
                "Broj stranica mora biti pozitivan cijeli broj."
            );

            return;
        }

        try {
            setSubmitting(true);
            setError("");

            const updatedMaterial =
                await updateMaterial(
                    Number(id),
                    {
                        title: title.trim(),
                        subject:
                            subject.trim(),
                        type,
                        pages: pageCount,
                        author:
                            author.trim(),
                        description:
                            description.trim(),
                    }
                );

            navigate(
                `/materijal/${updatedMaterial.id}`
            );
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError(
                    "Nije moguće urediti materijal."
                );
            }
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <main className="create-material-page">
                <div className="create-material-container">
                    <p>
                        Učitavanje materijala...
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="create-material-page">
            <div className="create-material-container">
                <div className="create-material-heading">
                    <h1>
                        Uredi materijal
                    </h1>
                </div>

                <form
                    className="create-material-form"
                    onSubmit={handleSubmit}
                >
                    <div className="form-field">
                        <label htmlFor="title">
                            Naziv
                        </label>

                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(event) =>
                                setTitle(
                                    event.target.value
                                )
                            }
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="subject">
                            Predmet
                        </label>

                        <input
                            id="subject"
                            type="text"
                            value={subject}
                            onChange={(event) =>
                                setSubject(
                                    event.target.value
                                )
                            }
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-field">
                            <label htmlFor="type">
                                Vrsta materijala
                            </label>

                            <select
                                id="type"
                                value={type}
                                onChange={(event) =>
                                    setType(
                                        event.target.value
                                    )
                                }
                            >
                                <option value="">
                                    Odaberi
                                </option>

                                <option value="Knjiga">
                                    Knjiga
                                </option>

                                <option value="Skripta">
                                    Skripta
                                </option>

                                <option value="Bilješke">
                                    Bilješke
                                </option>
                            </select>
                        </div>

                        <div className="form-field">
                            <label htmlFor="pages">
                                Broj stranica
                            </label>

                            <input
                                id="pages"
                                type="number"
                                min="1"
                                value={pages}
                                onChange={(event) =>
                                    setPages(
                                        event.target.value
                                    )
                                }
                            />
                        </div>
                    </div>

                    <div className="form-field">
                        <label htmlFor="author">
                            Autor{" "}
                            <span className="optional-label">
                                (opcionalno)
                            </span>
                        </label>

                        <input
                            id="author"
                            type="text"
                            value={author}
                            onChange={(event) =>
                                setAuthor(
                                    event.target.value
                                )
                            }
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="description">
                            Kratak opis{" "}
                            <span className="optional-label">
                                (opcionalno)
                            </span>
                        </label>

                        <textarea
                            id="description"
                            rows={5}
                            value={description}
                            onChange={(event) =>
                                setDescription(
                                    event.target.value
                                )
                            }
                        />
                    </div>

                    <div className="form-field">
                        <label>
                            Fajlovi
                        </label>

                        <span className="file-help">
                            Postojeći fajlovi ostaju
                            nepromijenjeni.
                        </span>
                    </div>

                    {error && (
                        <p className="form-error">
                            {error}
                        </p>
                    )}

                    <div className="create-material-actions">
                        <button
                            type="button"
                            className="cancel-button"
                            onClick={() =>
                                navigate(
                                    "/moji-materijali"
                                )
                            }
                        >
                            Odustani
                        </button>

                        <button
                            type="submit"
                            className="create-button"
                            disabled={submitting}
                        >
                            {submitting
                                ? "Čuvanje..."
                                : "Sačuvaj izmjene"}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}

export default EditMaterialPage;