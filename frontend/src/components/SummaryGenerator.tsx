import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";

import type { Material } from "../types/Material";

import {
    generateSummary,
} from "../services/studyService";

import type {
    StudySourceType,
    SummaryLength,
} from "../services/studyService";

import "../styles/SummaryGenerator.css";

type SummaryGeneratorProps = {
    material: Material;
};

function SummaryGenerator({
    material,
}: SummaryGeneratorProps) {
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

    const [length, setLength] =
        useState<SummaryLength>("medium");

    const [summary, setSummary] =
        useState("");

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
        setSummary("");

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

            const result =
                await generateSummary({
                    materialId: material.id,
                    sourceType,
                    length,

                    ...(sourceType === "chapter" && {
                        chapter: chapter.trim(),
                    }),

                    ...(sourceType === "pages" && {
                        fileId: Number(fileId),
                        startPage:
                            Number(startPage),
                        endPage:
                            Number(endPage),
                    }),
                });

            setSummary(result.summary);
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError(
                    "Nije moguće generisati sažetak."
                );
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="summary-generator">
           

            <div className="source-options">
                <label className="source-option">
                    <input
                        type="radio"
                        name="summary-source"
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
                        name="summary-source"
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
                        <label htmlFor="summary-chapter">
                            Naziv poglavlja
                        </label>

                        <input
                            id="summary-chapter"
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
                        name="summary-source"
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
                                <label htmlFor="summary-pdf">
                                    PDF fajl
                                </label>

                                <select
                                    id="summary-pdf"
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
                                        <label htmlFor="summary-start-page">
                                            Od
                                        </label>

                                        <input
                                            id="summary-start-page"
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
                                        <label htmlFor="summary-end-page">
                                            Do
                                        </label>

                                        <input
                                            id="summary-end-page"
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

            <div className="summary-length">
                <span>Dužina sažetka</span>

                <div className="summary-length-options">
                    <label>
                        <input
                            type="radio"
                            name="summary-length"
                            checked={length === "short"}
                            onChange={() =>
                                setLength("short")
                            }
                        />
                        Kratak
                    </label>

                    <label>
                        <input
                            type="radio"
                            name="summary-length"
                            checked={length === "medium"}
                            onChange={() =>
                                setLength("medium")
                            }
                        />
                        Srednji
                    </label>

                    <label>
                        <input
                            type="radio"
                            name="summary-length"
                            checked={length === "detailed"}
                            onChange={() =>
                                setLength("detailed")
                            }
                        />
                        Detaljan
                    </label>
                </div>
            </div>

            {error && (
                <p className="summary-generator-error">
                    {error}
                </p>
            )}

            <button
                type="button"
                className="generate-summary-button"
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
                    : summary
                        ? "Generiši ponovo"
                        : "Generiši sažetak"}
            </button>

            {summary && (
                <div className="generated-summary">
                    <div className="generated-summary-heading">
                        <h4>Sažetak</h4>
                    </div>

                    <div className="generated-summary-text">
                        <ReactMarkdown>
                            {summary}
                        </ReactMarkdown>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SummaryGenerator;
