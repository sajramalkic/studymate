import {
    useMemo,
    useState,
} from "react";

import type {
    Material,
} from "../types/Material";

import {
    generateQuestions,
} from "../services/studyService";

import type {
    GeneratedQuestion,
    StudySourceType,
} from "../services/studyService";

import "../styles/QuestionGenerator.css";

type QuestionGeneratorProps = {
    material: Material;
};

function QuestionGenerator({
    material,
}: QuestionGeneratorProps) {
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

    const [questionCount, setQuestionCount] =
        useState("10");

    const [questions, setQuestions] =
        useState<GeneratedQuestion[]>([]);

    const [
        visibleAnswers,
        setVisibleAnswers,
    ] = useState<Set<number>>(
        new Set()
    );

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
            Number(questionCount);

        if (
            !Number.isInteger(count) ||
            count < 1 ||
            count > 30
        ) {
            setError(
                "Broj pitanja mora biti između 1 i 30."
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
            setQuestions([]);
            setVisibleAnswers(
                new Set()
            );

            const result =
                await generateQuestions({
                    materialId:
                        material.id,

                    sourceType,

                    questionCount:
                        count,

                    ...(sourceType ===
                        "chapter" && {
                        chapter:
                            chapter.trim(),
                    }),

                    ...(sourceType ===
                        "pages" && {
                        fileId:
                            Number(fileId),

                        startPage:
                            Number(
                                startPage
                            ),

                        endPage:
                            Number(
                                endPage
                            ),
                    }),
                });

            setQuestions(
                result.questions
            );
        } catch (error) {
            if (error instanceof Error) {
                setError(
                    error.message
                );
            } else {
                setError(
                    "Došlo je do greške pri generisanju pitanja."
                );
            }
        } finally {
            setLoading(false);
        }
    }

    function toggleAnswer(
        index: number
    ) {
        setVisibleAnswers(
            (current) => {
                const updated =
                    new Set(current);

                if (
                    updated.has(index)
                ) {
                    updated.delete(
                        index
                    );
                } else {
                    updated.add(index);
                }

                return updated;
            }
        );
    }

    return (
        <div className="question-generator">
           

            <div className="source-options">
                <label className="source-option">
                    <input
                        type="radio"
                        name="question-source"
                        checked={
                            sourceType ===
                            "whole"
                        }
                        onChange={() =>
                            setSourceType(
                                "whole"
                            )
                        }
                    />

                    <span>
                        Cijeli materijal
                    </span>
                </label>

                <label className="source-option">
                    <input
                        type="radio"
                        name="question-source"
                        checked={
                            sourceType ===
                            "chapter"
                        }
                        onChange={() =>
                            setSourceType(
                                "chapter"
                            )
                        }
                    />

                    <span>
                        Odabrano poglavlje
                    </span>
                </label>

                {sourceType ===
                    "chapter" && (
                        <div className="source-fields">
                            <label
                                htmlFor="chapter"
                            >
                                Naziv poglavlja
                            </label>

                            <input
                                id="chapter"
                                type="text"
                                
                                value={chapter}
                                onChange={(
                                    event
                                ) =>
                                    setChapter(
                                        event
                                            .target
                                            .value
                                    )
                                }
                            />
                        </div>
                    )}

                <label className="source-option">
                    <input
                        type="radio"
                        name="question-source"
                        checked={
                            sourceType ===
                            "pages"
                        }
                        onChange={() =>
                            setSourceType(
                                "pages"
                            )
                        }
                    />

                    <span>
                        Određene stranice
                    </span>
                </label>

                {sourceType ===
                    "pages" && (
                        <div className="source-fields">
                            {pdfFiles.length ===
                                0 ? (
                                <p className="source-note">
                                    Ovaj materijal
                                    nema PDF fajl.
                                    Odabir stranica
                                    dostupan je samo
                                    za PDF.
                                </p>
                            ) : (
                                <>
                                    <label
                                        htmlFor="pdf-file"
                                    >
                                        PDF fajl
                                    </label>

                                    <select
                                        id="pdf-file"
                                        value={
                                            fileId
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setFileId(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                    >
                                        <option value="">
                                            Odaberi fajl
                                        </option>

                                        {pdfFiles.map(
                                            (
                                                file
                                            ) => (
                                                <option
                                                    key={
                                                        file.id
                                                    }
                                                    value={
                                                        file.id
                                                    }
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
                                            <label
                                                htmlFor="start-page"
                                            >
                                                Od
                                            </label>

                                            <input
                                                id="start-page"
                                                type="number"
                                                min="1"
                                                value={
                                                    startPage
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setStartPage(
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                            />
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="end-page"
                                            >
                                                Do
                                            </label>

                                            <input
                                                id="end-page"
                                                type="number"
                                                min="1"
                                                value={
                                                    endPage
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setEndPage(
                                                        event
                                                            .target
                                                            .value
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

            <div className="question-count-field">
                <label
                    htmlFor="question-count"
                >
                    Broj pitanja
                </label>

                <input
                    id="question-count"
                    type="number"
                    min="1"
                    max="30"
                    value={
                        questionCount
                    }
                    onChange={(event) =>
                        setQuestionCount(
                            event.target
                                .value
                        )
                    }
                />
            </div>

            {error && (
                <p className="question-generator-error">
                    {error}
                </p>
            )}

            <button
                type="button"
                className="generate-questions-button"
                disabled={
                    loading ||
                    (sourceType ===
                        "pages" &&
                        pdfFiles.length ===
                        0)
                }
                onClick={
                    handleGenerate
                }
            >
                {loading
                    ? "Generisanje..."
                    : questions.length > 0
                        ? "Generiši ponovo"
                        : "Generiši pitanja"}
            </button>

            {loading && (
                <p className="generation-status">
                    AI analizira odabrano
                    gradivo i priprema
                    pitanja...
                </p>
            )}

            {questions.length > 0 && (
                <div className="generated-questions">
                    <div className="generated-questions-heading">
                        <h4>
                            Generisana pitanja
                        </h4>

                        <span>
                            {questions.length}
                        </span>
                    </div>

                    {questions.map(
                        (
                            item,
                            index
                        ) => (
                            <article
                                className="generated-question"
                                key={index}
                            >
                                <div className="generated-question-title">
                                    <span>
                                        {index +
                                            1}.
                                    </span>

                                    <p>
                                        {
                                            item.question
                                        }
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="show-answer-button"
                                    onClick={() =>
                                        toggleAnswer(
                                            index
                                        )
                                    }
                                >
                                    {visibleAnswers.has(
                                        index
                                    )
                                        ? "Sakrij odgovor"
                                        : "Prikaži odgovor"}
                                </button>

                                {visibleAnswers.has(
                                    index
                                ) && (
                                        <div className="generated-answer">
                                            <span>
                                                Odgovor
                                            </span>

                                            <p>
                                                {
                                                    item.answer
                                                }
                                            </p>
                                        </div>
                                    )}
                            </article>
                        )
                    )}
                </div>
            )}
        </div>
    );
}

export default QuestionGenerator;