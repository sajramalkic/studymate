export type MaterialComment = {
    id: number;
    content: string;
    createdAt: string;
    updatedAt: string | null;
    username: string;
    canModify: boolean;
    parentCommentId: number | null;
    replies: MaterialComment[];
    replyToUsername: string | null;
    isDeleted: boolean;
};