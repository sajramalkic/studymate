import type {
    MaterialComment
} from "../types/MaterialComment";

const API_URL =
    "http://localhost:5132/api";

export async function getComments(
    materialId: number
): Promise<MaterialComment[]> {
    const response = await fetch(
        `${API_URL}/materials/${materialId}/comments`,
        {
            credentials: "include",
        }
    );

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "Nije moguće učitati komentare."
            )
        );
    }

    return response.json();
}

export async function createComment(
    materialId: number,
    content: string,
    parentCommentId: number | null = null
): Promise<MaterialComment> {
    const response = await fetch(
        `${API_URL}/materials/${materialId}/comments`,
        {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                content,
                parentCommentId,
            }),
        }
    );

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "Nije moguće objaviti komentar."
            )
        );
    }

    return response.json();
}

export async function updateComment(
    commentId: number,
    content: string
): Promise<MaterialComment> {
    const response = await fetch(
        `${API_URL}/comments/${commentId}`,
        {
            method: "PUT",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                content,
            }),
        }
    );

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "Nije moguće urediti komentar."
            )
        );
    }

    return response.json();
}

export async function deleteComment(
    commentId: number
): Promise<void> {
    const response = await fetch(
        `${API_URL}/comments/${commentId}`,
        {
            method: "DELETE",
            credentials: "include",
        }
    );

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "Nije moguće obrisati komentar."
            )
        );
    }
}

export async function checkAuthentication():
    Promise<boolean> {
    const response = await fetch(
        `${API_URL}/auth/me`,
        {
            credentials: "include",
        }
    );

    return response.ok;
}

async function getErrorMessage(
    response: Response,
    fallback: string
): Promise<string> {
    try {
        const data =
            await response.json() as {
                message?: string;
                title?: string;
            };

        return (
            data.message ??
            data.title ??
            fallback
        );
    } catch {
        return fallback;
    }
}