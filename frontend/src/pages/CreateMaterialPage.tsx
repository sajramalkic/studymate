import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createMaterial } from "../services/materialService";
import "../styles/CreateMaterialPage.css";

function CreateMaterialPage() {
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [subject, setSubject] = useState("");
    const [type, setType] = useState("");
    const [author, setAuthor] = useState("");
    const [pages, setPages] = useState("");
    const [description, setDescription] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (
            !title.trim() ||
            !subject.trim() ||
            !type.trim() 
           
        ) {
            setError("Popuni sva obavezna polja.");
            return;
        }

        const pageCount = Number(pages);

        if (!Number.isInteger(pageCount) || pageCount <= 0) {
            setError(
                "Broj stranica mora biti pozitivan cijeli broj."
            );
            return;
        }

        if (files.length === 0) {
            setError("Odaberi najmanje jedan fajl.");
            return;
        }

        try {
            setSubmitting(true);
            setError("");

            const createdMaterial = await createMaterial({
                title: title.trim(),
                subject: subject.trim(),
                type,
                author: author.trim(),
                pages: pageCount,
                description: description.trim(),
                files,
            });

            navigate(`/materijal/${createdMaterial.id}`);
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError(
                    "Došlo je do greške pri dodavanju materijala."
                );
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="create-material-page">
            <div className="create-material-container">
                <div className="create-material-heading">
                    <h1>Dodaj materijal</h1>
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
                                setTitle(event.target.value)
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
                                setSubject(event.target.value)
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
                                    setType(event.target.value)
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

                                <option value={"Bilje\u0161ke"}>
                                    {"Bilje\u0161ke"}
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
                                    setPages(event.target.value)
                                }
                            />
                        </div>
                    </div>

                    <div className="form-field">
                        <label htmlFor="author">
                            Autor <span className="optional-label">(opcionalno)</span>
                        </label>

                        <input
                            id="author"
                            type="text"
                            value={author}
                            onChange={(event) =>
                                setAuthor(event.target.value)
                            }
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="description">
                            Kratak opis
                        </label>

                        <textarea
                            id="description"
                            rows={5}
                            value={description}
                            onChange={(event) =>
                                setDescription(event.target.value)
                            }
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="files">
                            Fajlovi
                        </label>

                        <input
                            id="files"
                            type="file"
                            multiple
                            accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp"
                            onChange={(event) => {
                                const selectedFiles =
                                    Array.from(
                                        event.target.files ?? []
                                    );

                                const maxSize =
                                    20 * 1024 * 1024;

                                const oversizedFile =
                                    selectedFiles.find(
                                        (file) =>
                                            file.size > maxSize
                                    );

                                if (oversizedFile) {
                                    setError(
                                        `${oversizedFile.name} je veći od 20 MB.`
                                    );

                                    event.target.value = "";
                                    return;
                                }

                                setFiles((currentFiles) => {
                                    const newFiles =
                                        selectedFiles.filter(
                                            (newFile) =>
                                                !currentFiles.some(
                                                    (
                                                        existingFile
                                                    ) =>
                                                        existingFile.name ===
                                                        newFile.name &&
                                                        existingFile.size ===
                                                        newFile.size
                                                )
                                        );

                                    return [
                                        ...currentFiles,
                                        ...newFiles,
                                    ];
                                });

                                setError("");

                                event.target.value = "";
                            }}
                        />

                        <span className="file-help">
                            PDF, DOCX, TXT, JPG, PNG ili WEBP ·
                            maksimalno 20 MB po fajlu
                        </span>

                        {files.length > 0 && (
                            <div className="selected-files">
                                {files.map((file, index) => (
                                    <div
                                        className="selected-file-row"
                                        key={`${file.name}-${file.size}-${index}`}
                                    >
                                        <span>
                                            {file.name}
                                        </span>

                                        <button
                                            type="button"
                                            className="remove-file-button"
                                            onClick={() => {
                                                setFiles(
                                                    (
                                                        currentFiles
                                                    ) =>
                                                        currentFiles.filter(
                                                            (
                                                                _,
                                                                fileIndex
                                                            ) =>
                                                                fileIndex !==
                                                                index
                                                        )
                                                );
                                            }}
                                        >
                                            Ukloni
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
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
                                navigate("/biblioteka")
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
                                ? "Dodavanje..."
                                : "Dodaj materijal"}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}

export default CreateMaterialPage;