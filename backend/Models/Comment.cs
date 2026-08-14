using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace StudyMate.Api.Models;

public class Comment
{
    public bool IsDeleted { get; set; }

    public DateTime? DeletedAt { get; set; }

    public int Id { get; set; }

    [Required]
    [MaxLength(1000)]
    public string Content { get; set; }
        = string.Empty;

    public DateTime CreatedAt { get; set; }
        = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public int MaterialId { get; set; }

    [JsonIgnore]
    public Material Material { get; set; }
        = null!;

    public string UserId { get; set; }
        = string.Empty;

    [JsonIgnore]
    public ApplicationUser User { get; set; }
        = null!;

    public int? ParentCommentId { get; set; }

    [JsonIgnore]
    public Comment? ParentComment { get; set; }

    [JsonIgnore]
    public ICollection<Comment> Replies { get; set; }
        = new List<Comment>();
}