namespace StudyMate.Api.Dtos;

public class GenerateSummaryRequest
    : StudySourceRequest
{
    // short | medium | detailed
    public string Length { get; set; } = "medium";
}