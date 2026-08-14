import { useMemo, useState } from "react";

import type { Material } from "../types/Material";

import {
    generateQuiz,
} from "../services/studyService";

import type {
    QuizQuestion,
    StudySourceType,
} from "../services/studyService";

import "../styles/QuizGenerator.css";

type QuizGeneratorProps = {
    material: Material;
};

function QuizGenerator({
    material,
}: QuizGeneratorProps) {
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
        useState<QuizQuestion[]>([]);

    const [currentIndex, setCurrentIndex] =
        useState(0);

    const [selectedAnswer, setSelectedAnswer] =
        useState<number | null>(null);

    const [confirmed, setConfirmed] =
        useState(false);

    const [score, setScore] =
        useState(0);

    const [finished, setFinished] =
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
            setCurrentIndex(0);
            setSelectedAnswer(null);
            setConfirmed(false);
            setScore(0);
            setFinished(false);

            const result =
                await generateQuiz({
                    materialId: material.id,
                    sourceType,
                    questionCount: count,

                    ...(sourceType === "chapter" && {
                        chapter: chapter.trim(),
                    }),

                    ...(sourceType === "pages" && {
                        fileId: Number(fileId),
                        startPage: Number(startPage),
                        endPage: Number(endPage),
                    }),
                });

            if (
                !result.questions ||
                result.questions.length === 0
            ) {
                throw new Error(
                    "Kviz ne sadrži pitanja."
                );
            }

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
                    "Nije moguće generisati kviz."
                );
            }
        } finally {
            setLoading(false);
        }
    }

    function confirmAnswer() {
        if (
            selectedAnswer === null ||
            confirmed
        ) {
            return;
        }

        const question =
            questions[currentIndex];

        if (
            selectedAnswer ===
            question.correctOptionIndex
        ) {
            setScore(
                (current) => current + 1
            );
        }

        setConfirmed(true);
    }

    function nextQuestion() {
        if (
            currentIndex >=
            questions.length - 1
        ) {
            setFinished(true);
            return;
        }

        setCurrentIndex(
            (current) => current + 1
        );

        setSelectedAnswer(null);
        setConfirmed(false);
    }

    function newQuiz() {
        setQuestions([]);
        setCurrentIndex(0);
        setSelectedAnswer(null);
        setConfirmed(false);
        setScore(0);
        setFinished(false);
        setError("");
    }

    const currentQuestion =
        questions[currentIndex];

    const percentage =
        questions.length > 0
            ? Math.round(
                (score /
                    questions.length) *
                100
            )
            : 0;

    return (
        <div className="quiz-generator">
            {questions.length === 0 &&
                !finished && (
                    <>
                       

                        <div className="source-options">
                            <label className="source-option">
                                <input
                                    type="radio"
                                    name="quiz-source"
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
                                    name="quiz-source"
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

                            {sourceType === "chapter" && (
                                <div className="source-fields">
                                    <label htmlFor="quiz-chapter">
                                        Naziv poglavlja
                                    </label>

                                    <input
                                        id="quiz-chapter"
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
                                    name="quiz-source"
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

                            {sourceType === "pages" && (
                                <div className="source-fields">
                                    {pdfFiles.length === 0 ? (
                                        <p className="source-note">
                                            Odabir stranica
                                            dostupan je samo
                                            za PDF fajlove.
                                        </p>
                                    ) : (
                                        <>
                                            <label htmlFor="quiz-pdf">
                                                PDF fajl
                                            </label>

                                            <select
                                                id="quiz-pdf"
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
                                                    <label htmlFor="quiz-start">
                                                        Od
                                                    </label>

                                                    <input
                                                        id="quiz-start"
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
                                                    <label htmlFor="quiz-end">
                                                        Do
                                                    </label>

                                                    <input
                                                        id="quiz-end"
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

                        <div className="quiz-count-field">
                            <label htmlFor="quiz-count">
                                Broj pitanja
                            </label>

                            <input
                                id="quiz-count"
                                type="number"
                                min="1"
                                max="30"
                                value={questionCount}
                                onChange={(event) =>
                                    setQuestionCount(
                                        event.target.value
                                    )
                                }
                            />
                        </div>

                        {error && (
                            <p className="quiz-generator-error">
                                {error}
                            </p>
                        )}

                        <button
                            type="button"
                            className="generate-quiz-button"
                            disabled={loading}
                            onClick={handleGenerate}
                        >
                            {loading
                                ? "Generisanje..."
                                : "Generiši kviz"}
                        </button>
                    </>
                )}

            {currentQuestion &&
                !finished && (
                    <div className="quiz-session">
                        <div className="quiz-progress-header">
                            <span>
                                Pitanje{" "}
                                {currentIndex + 1} /{" "}
                                {questions.length}
                            </span>

                            <span>
                                Bodovi: {score}
                            </span>
                        </div>

                        <h4 className="quiz-question">
                            {
                                currentQuestion.question
                            }
                        </h4>

                        <div className="quiz-options">
                            {currentQuestion.options.map(
                                (option, index) => {
                                    let className =
                                        "quiz-option";

                                    if (
                                        !confirmed &&
                                        selectedAnswer === index
                                    ) {
                                        className +=
                                            " selected";
                                    }

                                    if (
                                        confirmed &&
                                        index ===
                                        currentQuestion.correctOptionIndex
                                    ) {
                                        className +=
                                            " correct";
                                    }

                                    if (
                                        confirmed &&
                                        index ===
                                        selectedAnswer &&
                                        index !==
                                        currentQuestion.correctOptionIndex
                                    ) {
                                        className +=
                                            " incorrect";
                                    }

                                    return (
                                        <button
                                            key={index}
                                            type="button"
                                            className={
                                                className
                                            }
                                            disabled={
                                                confirmed
                                            }
                                            onClick={() =>
                                                setSelectedAnswer(
                                                    index
                                                )
                                            }
                                        >
                                            <span className="quiz-option-letter">
                                                {String.fromCharCode(
                                                    65 +
                                                    index
                                                )}
                                            </span>

                                            <span>
                                                {option}
                                            </span>
                                        </button>
                                    );
                                }
                            )}
                        </div>

                        {!confirmed && (
                            <button
                                type="button"
                                className="quiz-confirm-button"
                                disabled={
                                    selectedAnswer === null
                                }
                                onClick={
                                    confirmAnswer
                                }
                            >
                                Potvrdi odgovor
                            </button>
                        )}

                        {confirmed && (
                            <div className="quiz-feedback">
                                <strong>
                                    {selectedAnswer ===
                                        currentQuestion.correctOptionIndex
                                        ? "Tačno!"
                                        : "Netačno."}
                                </strong>

                                {selectedAnswer !==
                                    currentQuestion.correctOptionIndex && (
                                        <p>
                                            Tačan odgovor:{" "}
                                            <strong>
                                                {
                                                    currentQuestion.options[
                                                    currentQuestion
                                                        .correctOptionIndex
                                                    ]
                                                }
                                            </strong>
                                        </p>
                                    )}

                                {currentQuestion.explanation && (
                                    <p>
                                        {
                                            currentQuestion.explanation
                                        }
                                    </p>
                                )}

                                <button
                                    type="button"
                                    className="quiz-next-button"
                                    onClick={
                                        nextQuestion
                                    }
                                >
                                    {currentIndex ===
                                        questions.length - 1
                                        ? "Prikaži rezultat"
                                        : "Sljedeće pitanje →"}
                                </button>
                            </div>
                        )}
                    </div>
                )}

            {finished && (
                <div className="quiz-results">
                    <h4>Rezultat</h4>

                    <p>
                        {score} /{" "}
                        {questions.length}
                    </p>

                    <strong>
                        {percentage}%
                    </strong>

                    <button
                        type="button"
                        className="quiz-new-button"
                        onClick={newQuiz}
                    >
                        Novi kviz
                    </button>
                </div>
            )}
        </div>
    );
}

export default QuizGenerator;