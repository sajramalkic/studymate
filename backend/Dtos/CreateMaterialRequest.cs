namespace StudyMate.Api.Dtos;

public class CreateMaterialRequest
{
    public string Title { get; set; } = string.Empty;

    public string Subject { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;

    public string? Author { get; set; }

    public int? Pages { get; set; }

    public string? Description { get; set; }

    public List<IFormFile> Files { get; set; } = new();
}