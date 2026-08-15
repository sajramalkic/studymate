namespace StudyMate.Api.Dtos;

public class UpdateMaterialRequest
{
    public string Title { get; set; } = string.Empty;

    public string Subject { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;

    public int? Pages { get; set; }

    public string? Author { get; set; }

    public string? Description { get; set; }
}