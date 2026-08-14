namespace StudyMate.Api.Dtos;

public class CommentRequest
{
    public string Content { get; set; } = string.Empty;

    public int? ParentCommentId { get; set; }
}

public class CommentResponse
{
    public int Id { get; set; }

    public bool IsDeleted { get; set; }

    public string Content { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public string Username { get; set; } = string.Empty;

    public bool CanModify { get; set; }

    public int? ParentCommentId { get; set; }

    public string? ReplyToUsername { get; set; }

    public List<CommentResponse> Replies { get; set; } = new();
}