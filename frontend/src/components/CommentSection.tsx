import {
    useCallback,
    useEffect,
    useState
} from "react";

import type { FormEvent } from "react";

import type {
    MaterialComment
} from "../types/MaterialComment";

import {
    checkAuthentication,
    createComment,
    deleteComment,
    getComments,
    updateComment,
} from "../services/commentService";

type CommentSectionProps = {
    materialId: number;
};

type CommentItemProps = {
    comment: MaterialComment;
    depth: number;

    onReply: (
        parentCommentId: number,
        content: string
    ) => Promise<boolean>;

    onUpdate: (
        commentId: number,
        content: string
    ) => Promise<boolean>;

    onDelete: (
        commentId: number
    ) => Promise<boolean>;
};

function CommentSection({
    materialId,
}: CommentSectionProps) {
    const [comments, setComments] =
        useState<MaterialComment[]>([]);

    const [content, setContent] =
        useState("");

    const [
        isAuthenticated,
        setIsAuthenticated,
    ] = useState<boolean | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState("");

    const refreshComments =
        useCallback(async () => {
            const loadedComments =
                await getComments(materialId);

            setComments(loadedComments);
        }, [materialId]);

    useEffect(() => {
        let cancelled = false;

        async function initialize() {
            setLoading(true);
            setError("");

            try {
                const authenticated =
                    await checkAuthentication();

                if (cancelled) {
                    return;
                }

                setIsAuthenticated(authenticated);

                if (!authenticated) {
                    setComments([]);
                    return;
                }

                const loadedComments =
                    await getComments(materialId);

                if (!cancelled) {
                    setComments(loadedComments);
                }
            } catch (loadError) {
                if (!cancelled) {
                    setError(
                        getMessage(
                            loadError,
                            "Nije moguće učitati komentare."
                        )
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        initialize();

        return () => {
            cancelled = true;
        };
    }, [materialId]);

    async function handleSubmit(
        event: FormEvent
    ) {
        event.preventDefault();

        const trimmedContent =
            content.trim();

        if (!trimmedContent) {
            setError(
                "Komentar ne može biti prazan."
            );
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            await createComment(
                materialId,
                trimmedContent,
                null
            );

            setContent("");

            await refreshComments();
        } catch (submitError) {
            setError(
                getMessage(
                    submitError,
                    "Nije moguće objaviti komentar."
                )
            );
        } finally {
            setSubmitting(false);
        }
    }

    async function handleReply(
        parentCommentId: number,
        replyContent: string
    ): Promise<boolean> {
        setError("");

        try {
            await createComment(
                materialId,
                replyContent,
                parentCommentId
            );

            await refreshComments();

            return true;
        } catch (replyError) {
            setError(
                getMessage(
                    replyError,
                    "Nije moguće objaviti odgovor."
                )
            );

            return false;
        }
    }

    async function handleUpdate(
        commentId: number,
        updatedContent: string
    ): Promise<boolean> {
        setError("");

        try {
            await updateComment(
                commentId,
                updatedContent
            );

            await refreshComments();

            return true;
        } catch (updateError) {
            setError(
                getMessage(
                    updateError,
                    "Nije moguće urediti komentar."
                )
            );

            return false;
        }
    }

    async function handleDelete(
        commentId: number
    ): Promise<boolean> {
        setError("");

        try {
            await deleteComment(commentId);

            await refreshComments();

            return true;
        } catch (deleteError) {
            setError(
                getMessage(
                    deleteError,
                    "Nije moguće obrisati komentar."
                )
            );

            return false;
        }
    }

    const totalComments =
        countComments(comments);

    return (
        <section className="comment-section">
            <div className="comment-heading">
                <h2>Komentari</h2>

                {isAuthenticated && (
                    <span>
                        {totalComments}
                    </span>
                )}
            </div>

            {isAuthenticated === null ? (
                <p>
                    Provjera prijave...
                </p>
            ) : !isAuthenticated ? (
                <p className="comment-login-message">
                    Prijavi se da bi ostavio/la komentar.
                </p>
            ) : (
                <>
                    <form
                        className="comment-form"
                        onSubmit={handleSubmit}
                    >
                        <textarea
                            value={content}
                            maxLength={1000}
                            placeholder="Napiši komentar..."
                            onChange={event =>
                                setContent(
                                    event.target.value
                                )
                            }
                        />

                        <div className="comment-form-footer">
                            <span>
                                {content.length}/1000
                            </span>

                            <button
                                type="submit"
                                disabled={submitting}
                            >
                                {submitting
                                    ? "Objavljivanje..."
                                    : "Objavi"}
                            </button>
                        </div>
                    </form>

                    {error && (
                        <p className="comment-error">
                            {error}
                        </p>
                    )}

                    {loading ? (
                        <p>
                            Učitavanje komentara...
                        </p>
                    ) : comments.length === 0 ? (
                        !error && (
                            <p className="no-comments">
                                Još nema komentara.
                            </p>
                        )
                    ) : (
                        <div className="comment-list">
                            {comments.map(comment => (
                                <CommentItem
                                    key={comment.id}
                                    comment={comment}
                                    depth={0}
                                    onReply={handleReply}
                                    onUpdate={handleUpdate}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </section>
    );
}

function CommentItem({
    comment,
    depth,
    onReply,
    onUpdate,
    onDelete,
}: CommentItemProps) {
    const [replying, setReplying] =
        useState(false);

    const [replyContent, setReplyContent] =
        useState("");

    const [
        submittingReply,
        setSubmittingReply,
    ] = useState(false);

    const [editing, setEditing] =
        useState(false);

    const [
        editingContent,
        setEditingContent,
    ] = useState(comment.content);

    const [savingEdit, setSavingEdit] =
        useState(false);

    const [deleting, setDeleting] =
        useState(false);

    async function submitReply(
        event: FormEvent
    ) {
        event.preventDefault();

        const trimmedContent =
            replyContent.trim();

        if (!trimmedContent) {
            return;
        }

        setSubmittingReply(true);

        const successful =
            await onReply(
                comment.id,
                trimmedContent
            );

        setSubmittingReply(false);

        if (successful) {
            setReplyContent("");
            setReplying(false);
        }
    }

    async function saveEdit() {
        const trimmedContent =
            editingContent.trim();

        if (!trimmedContent) {
            return;
        }

        setSavingEdit(true);

        const successful =
            await onUpdate(
                comment.id,
                trimmedContent
            );

        setSavingEdit(false);

        if (successful) {
            setEditing(false);
        }
    }

    async function removeComment() {
        const confirmed =
            window.confirm(
                "Želiš li obrisati ovaj komentar?"
            );

        if (!confirmed) {
            return;
        }

        setDeleting(true);

        await onDelete(comment.id);

        setDeleting(false);
    }

    const replies =
        comment.replies ?? [];

    return (
        <div className="comment-thread">
            <article className="comment-item">
                <div className="comment-meta">
                    <strong>
                        {comment.username}
                    </strong>

                    <span className="comment-date">
                        {formatDate(
                            comment.createdAt
                        )}

                        {comment.updatedAt &&
                            " · uređeno"}
                    </span>
                </div>

                {comment.isDeleted ? (
                    <p className="comment-deleted">
                        Komentar je obrisan.
                    </p>
                ) : (
                    <>
                        {comment.replyToUsername && (
                            <p className="comment-replying-to">
                                Odgovor korisniku{" "}
                                <strong>
                                    @{comment.replyToUsername}
                                </strong>
                            </p>
                        )}

                        {editing ? (
                            <div className="comment-edit-form">
                                <textarea
                                    value={editingContent}
                                    maxLength={1000}
                                    onChange={event =>
                                        setEditingContent(
                                            event.target.value
                                        )
                                    }
                                />

                                <div className="comment-actions">
                                    <button
                                        type="button"
                                        disabled={savingEdit}
                                        onClick={saveEdit}
                                    >
                                        {savingEdit
                                            ? "Čuvanje..."
                                            : "Sačuvaj"}
                                    </button>

                                    <button
                                        type="button"
                                        disabled={savingEdit}
                                        onClick={() => {
                                            setEditing(false);

                                            setEditingContent(
                                                comment.content
                                            );
                                        }}
                                    >
                                        Odustani
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="comment-content">
                                {comment.content}
                            </p>
                        )}

                        {!editing && (
                            <div className="comment-actions">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setReplying(
                                            current =>
                                                !current
                                        )
                                    }
                                >
                                    {replying
                                        ? "Zatvori odgovor"
                                        : "Odgovori"}
                                </button>

                                {comment.canModify && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditing(true);
                                                setReplying(false);

                                                setEditingContent(
                                                    comment.content
                                                );
                                            }}
                                        >
                                            Uredi
                                        </button>

                                        <button
                                            type="button"
                                            disabled={deleting}
                                            onClick={removeComment}
                                        >
                                            {deleting
                                                ? "Brisanje..."
                                                : "Obriši"}
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {replying && !editing && (
                            <form
                                className="comment-reply-form"
                                onSubmit={submitReply}
                            >
                                <textarea
                                    value={replyContent}
                                    maxLength={1000}
                                    placeholder={
                                        `Odgovori korisniku ${comment.username}...`
                                    }
                                    onChange={event =>
                                        setReplyContent(
                                            event.target.value
                                        )
                                    }
                                />

                                <div className="comment-reply-footer">
                                    <span>
                                        {replyContent.length}/1000
                                    </span>

                                    <button
                                        type="submit"
                                        disabled={submittingReply}
                                    >
                                        {submittingReply
                                            ? "Objavljivanje..."
                                            : "Objavi odgovor"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </>
                )}
            </article>

            {replies.length > 0 && (
                <div
                    className={
                        depth >= 4
                            ? "comment-replies comment-replies-capped"
                            : "comment-replies"
                    }
                >
                    {replies.map(reply => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            depth={depth + 1}
                            onReply={onReply}
                            onUpdate={onUpdate}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function countComments(
    comments: MaterialComment[]
): number {
    return comments.reduce(
        (total, comment) =>
            total +
            1 +
            countComments(
                comment.replies ?? []
            ),
        0
    );
}

function formatDate(
    value: string
): string {
    const date = new Date(value);

    const day =
        date.getDate();

    const month =
        date.getMonth() + 1;

    const year =
        date.getFullYear();

    const hours =
        String(date.getHours())
            .padStart(2, "0");

    const minutes =
        String(date.getMinutes())
            .padStart(2, "0");

    return (
        `${day}.${month}.${year}. ` +
        `${hours}:${minutes}`
    );
}

function getMessage(
    error: unknown,
    fallback: string
): string {
    return error instanceof Error
        ? error.message
        : fallback;
}

export default CommentSection;