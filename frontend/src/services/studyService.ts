const STUDY_URL =
    "http://localhost:5132/api/study";

export type StudySourceType =
    | "whole"
    | "chapter"
    | "pages";

/* =========================
   PITANJA
========================= */

export type GenerateQuestionsRequest = {
    materialId: number;
    sourceType: StudySourceType;
    fileId?: number;
    chapter?: string;
    startPage?: number;
    endPage?: number;
    questionCount: number;
};

export type GeneratedQuestion = {
    question: string;
    answer: string;
};

export type GenerateQuestionsResponse = {
    questions: GeneratedQuestion[];
};

export async function generateQuestions(
    request: GenerateQuestionsRequest
): Promise<GenerateQuestionsResponse> {
    const response = await fetch(
        `${STUDY_URL}/questions/generate`,
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json",
            },
            credentials: "include",
            body: JSON.stringify(request),
        }
    );

    if (response.status === 401) {
        throw new Error(
            "Moraš biti prijavljena da bi generisala pitanja."
        );
    }

    if (response.status === 403) {
        throw new Error(
            "Nemaš dozvolu za ovu akciju."
        );
    }

    if (!response.ok) {
        const message =
            await getErrorMessage(response);

        throw new Error(
            message ||
            "Nije moguće generisati pitanja."
        );
    }

    return response.json();
}

/* =========================
   SAŽETAK
========================= */

export type SummaryLength =
    | "short"
    | "medium"
    | "detailed";

export type GenerateSummaryRequest = {
    materialId: number;
    sourceType: StudySourceType;
    fileId?: number;
    chapter?: string;
    startPage?: number;
    endPage?: number;
    length: SummaryLength;
};

export type GenerateSummaryResponse = {
    summary: string;
};

export async function generateSummary(
    request: GenerateSummaryRequest
): Promise<GenerateSummaryResponse> {
    const response = await fetch(
        `${STUDY_URL}/summary/generate`,
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json",
            },
            credentials: "include",
            body: JSON.stringify(request),
        }
    );

    if (response.status === 401) {
        throw new Error(
            "Moraš biti prijavljena da bi generisala sažetak."
        );
    }

    if (!response.ok) {
        const message =
            await getErrorMessage(response);

        throw new Error(
            message ||
            "Nije moguće generisati sažetak."
        );
    }

    return response.json();
}

/* =========================
   FLASHCARDS
========================= */

export type Flashcard = {
    front: string;
    back: string;
    importance: number;
};

export type GenerateFlashcardsRequest = {
    materialId: number;
    sourceType: StudySourceType;
    fileId?: number;
    chapter?: string;
    startPage?: number;
    endPage?: number;
    cardCount: number;
};

export type GenerateFlashcardsResponse = {
    flashcards: Flashcard[];
};

export async function generateFlashcards(
    request: GenerateFlashcardsRequest
): Promise<GenerateFlashcardsResponse> {
    const response = await fetch(
        `${STUDY_URL}/flashcards/generate`,
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json",
            },
            credentials: "include",
            body: JSON.stringify(request),
        }
    );

    if (response.status === 401) {
        throw new Error(
            "Moraš biti prijavljena da bi generisala flashcards."
        );
    }

    if (!response.ok) {
        const message =
            await getErrorMessage(response);

        throw new Error(
            message ||
            "Nije moguće generisati flashcards."
        );
    }

    return response.json();
}

/* =========================
   KVIZ
========================= */

export type QuizQuestion = {
    question: string;
    options: string[];
    correctOptionIndex: number;
    explanation: string;
    importance: number;
};

export type GenerateQuizRequest = {
    materialId: number;
    sourceType: StudySourceType;
    fileId?: number;
    chapter?: string;
    startPage?: number;
    endPage?: number;
    questionCount: number;
};

export type GenerateQuizResponse = {
    questions: QuizQuestion[];
};

export async function generateQuiz(
    request: GenerateQuizRequest
): Promise<GenerateQuizResponse> {
    const response = await fetch(
        `${STUDY_URL}/quiz/generate`,
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json",
            },
            credentials: "include",
            body: JSON.stringify(request),
        }
    );

    if (response.status === 401) {
        throw new Error(
            "Moraš biti prijavljena da bi generisala kviz."
        );
    }

    if (!response.ok) {
        const message =
            await getErrorMessage(response);

        throw new Error(
            message ||
            "Nije moguće generisati kviz."
        );
    }

    return response.json();
}

/* =========================
   ERROR HANDLING
========================= */

async function getErrorMessage(
    response: Response
): Promise<string> {
    const text =
        await response.text();

    if (!text) {
        return "";
    }

    try {
        const data =
            JSON.parse(text);

        if (
            typeof data === "string"
        ) {
            return data;
        }

        if (data.message) {
            return data.message;
        }

        if (data.detail) {
            return data.detail;
        }

        if (data.title) {
            return data.title;
        }
    } catch {
        return text;
    }

    return text;
}