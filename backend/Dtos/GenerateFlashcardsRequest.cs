namespace StudyMate.Api.Dtos;

public class GenerateFlashcardsRequest
    : StudySourceRequest
{
    public int CardCount { get; set; } = 10;
}
