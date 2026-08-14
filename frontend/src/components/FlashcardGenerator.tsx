import { useMemo, useState } from "react";

import type { Material } from "../types/Material";

import {
    generateFlashcards,
} from "../services/studyService";

import type {
    Flashcard,
    StudySourceType,
} from "../services/studyService";

import "../styles/FlashcardGenerator.css";

type FlashcardGeneratorProps = {
    material: Material;
};

function FlashcardGenerator({
    material,
}: FlashcardGeneratorProps) {
    const [sourceType, setSourceType] =
        useState<StudySourceType>("whole");

    const [chapter, setChapter] =
        useState("");

    const [fileId, setFileId] =
        useState("");

    const [startPage, setStartPage] =
        useState("");

    const [endPage, setEndPage] =
        useState("");

    const [cardCount, setCardCount] =
        useState("10");

    const [flashcards, setFlashcards] =
        useState<Flashcard[]>([]);

    const [currentIndex, setCurrentIndex] =
        useState(0);

    const [flipped, setFlipped] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const pdfFiles = useMemo(
        () =>
            material.files.filter(
                (file) =>
                    file.originalFileName
                        .toLowerCase()
                        .endsWith(".pdf")
            ),
        [material.files]
    );

    async function handleGenerate() {
        setError("");

        const count =
            Number(cardCount);

        if (
            !Number.isInteger(count) ||
            count < 1 ||
            count > 30
        ) {
            setError(
                "Broj kartica mora biti između 1 i 30."
            );

            return;
        }

        if (
            sourceType === "chapter" &&
            !chapter.trim()
        ) {
            setError(
                "Unesi naziv poglavlja."
            );

            return;
        }

        if (sourceType === "pages") {
            if (!fileId) {
                setError(
                    "Odaberi PDF fajl."
                );

                return;
            }

            const start =
                Number(startPage);

            const end =
                Number(endPage);

            if (
                !Number.isInteger(start) ||
                !Number.isInteger(end) ||
                start <= 0 ||
                end <= 0
            ) {
                setError(
                    "Unesi ispravan raspon stranica."
                );

                return;
            }

            if (end < start) {
                setError(
                    "Krajnja stranica ne može biti manja od početne."
                );

                return;
            }
        }

        try {
            setLoading(true);
            setFlashcards([]);
            setCurrentIndex(0);
            setFlipped(false);

            const result =
                await generateFlashcards({
                    materialId: material.id,
                    sourceType,
                    cardCount: count,

                    ...(sourceType === "chapter" && {
                        chapter: chapter.trim(),
                    }),

                    ...(sourceType === "pages" && {
                        fileId: Number(fileId),
                        startPage: Number(startPage),
                        endPage: Number(endPage),
                    }),
                });

            setFlashcards(
                result.flashcards
            );
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError(
                    "Nije moguće generisati flashcards."
                );
            }
        } finally {
            setLoading(false);
        }
    }

    function showPrevious() {
        if (currentIndex <= 0) {
            return;
        }

        setCurrentIndex(
            (current) => current - 1
        );

        setFlipped(false);
    }

    function showNext() {
        if (
            currentIndex >=
            flashcards.length - 1
        ) {
            return;
        }

        setCurrentIndex(
            (current) => current + 1
        );

        setFlipped(false);
    }

    const currentCard =
        flashcards[currentIndex];

    return (
        <div className="flashcard-generator">
            

            <div className="source-options">
                <label className="source-option">
                    <input
                        type="radio"
                        name="flashcard-source"
                        checked={
                            sourceType === "whole"
                        }
                        onChange={() =>
                            setSourceType("whole")
                        }
                    />

                    <span>
                        Cijeli materijal
                    </span>
                </label>

                <label className="source-option">
                    <input
                        type="radio"
                        name="flashcard-source"
                        checked={
                            sourceType === "chapter"
                        }
                        onChange={() =>
                            setSourceType("chapter")
                        }
                    />

                    <span>
                        Odabrano poglavlje
                    </span>
                </label>

                {sourceType === "chapter" && (
                    <div className="source-fields">
                        <label htmlFor="flashcard-chapter">
                            Naziv poglavlja
                        </label>

                        <input
                            id="flashcard-chapter"
                            type="text"
                            value={chapter}
                            onChange={(event) =>
                                setChapter(
                                    event.target.value
                                )
                            }
                        />
                    </div>
                )}

                <label className="source-option">
                    <input
                        type="radio"
                        name="flashcard-source"
                        checked={
                            sourceType === "pages"
                        }
                        onChange={() =>
                            setSourceType("pages")
                        }
                    />

                    <span>
                        Određene stranice
                    </span>
                </label>

                {sourceType === "pages" && (
                    <div className="source-fields">
                        {pdfFiles.length === 0 ? (
                            <p className="source-note">
                                Odabir stranica dostupan
                                je samo za PDF fajlove.
                            </p>
                        ) : (
                            <>
                                <label htmlFor="flashcard-pdf">
                                    PDF fajl
                                </label>

                                <select
                                    id="flashcard-pdf"
                                    value={fileId}
                                    onChange={(event) =>
                                        setFileId(
                                            event.target.value
                                        )
                                    }
                                >
                                    <option value="">
                                        Odaberi fajl
                                    </option>

                                    {pdfFiles.map(
                                        (file) => (
                                            <option
                                                key={file.id}
                                                value={file.id}
                                            >
                                                {
                                                    file.originalFileName
                                                }
                                            </option>
                                        )
                                    )}
                                </select>

                                <div className="page-range">
                                    <div>
                                        <label htmlFor="flashcard-start">
                                            Od
                                        </label>

                                        <input
                                            id="flashcard-start"
                                            type="number"
                                            min="1"
                                            value={startPage}
                                            onChange={(event) =>
                                                setStartPage(
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="flashcard-end">
                                            Do
                                        </label>

                                        <input
                                            id="flashcard-end"
                                            type="number"
                                            min="1"
                                            value={endPage}
                                            onChange={(event) =>
                                                setEndPage(
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="flashcard-count-field">
                <label htmlFor="flashcard-count">
                    Broj kartica
                </label>

                <input
                    id="flashcard-count"
                    type="number"
                    min="1"
                    max="30"
                    value={cardCount}
                    onChange={(event) =>
                        setCardCount(
                            event.target.value
                        )
                    }
                />
            </div>

            {error && (
                <p className="flashcard-generator-error">
                    {error}
                </p>
            )}

            <button
                type="button"
                className="generate-flashcards-button"
                disabled={
                    loading ||
                    (
                        sourceType === "pages" &&
                        pdfFiles.length === 0
                    )
                }
                onClick={handleGenerate}
            >
                {loading
                    ? "Generisanje..."
                    : flashcards.length > 0
                        ? "Generiši ponovo"
                        : "Generiši flashcards"}
            </button>

            {currentCard && (
                <div className="flashcard-study-area">
                    <button
                        type="button"
                        className={`flashcard ${flipped ? "flipped" : ""
                            }`}
                        onClick={() =>
                            setFlipped(
                                (current) => !current
                            )
                        }
                    >
                        <span className="flashcard-label">
                            {flipped
                                ? "Odgovor"
                                : "Pitanje"}
                        </span>

                        <span className="flashcard-content">
                            {flipped
                                ? currentCard.back
                                : currentCard.front}
                        </span>

                        <span className="flashcard-hint">
                            Klikni za{" "}
                            {flipped
                                ? "pitanje"
                                : "odgovor"}
                        </span>
                    </button>

                    <div className="flashcard-navigation">
                        <button
                            type="button"
                            onClick={showPrevious}
                            disabled={
                                currentIndex === 0
                            }
                        >
                            ← Prethodna
                        </button>

                        <span>
                            {currentIndex + 1} /{" "}
                            {flashcards.length}
                        </span>

                        <button
                            type="button"
                            onClick={showNext}
                            disabled={
                                currentIndex ===
                                flashcards.length - 1
                            }
                        >
                            Sljedeća →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default FlashcardGenerator;