using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace StudyMate.Api.Models;

public class Material
{
    public int Id { get; set; }

    public string Title { get; set; }
        = string.Empty;

    public string Subject { get; set; }
        = string.Empty;

    public string Type { get; set; }
        = string.Empty;

    public string Author { get; set; }
        = string.Empty;

    public int Pages { get; set; }

    public string Description { get; set; }
        = string.Empty;

    public ICollection<MaterialFile> Files { get; set; }
        = new List<MaterialFile>();

    public string? UserId { get; set; }

    [JsonIgnore]
    public ApplicationUser? User { get; set; }

    [NotMapped]
    public string UploaderUsername { get; set; }
        = string.Empty;

    [JsonIgnore]
    public ICollection<Comment> Comments { get; set; }
        = new List<Comment>();
}