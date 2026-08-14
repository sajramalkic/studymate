namespace StudyMate.Api.Dtos;

public class Flashcard
{
    public string Front { get; set; } = string.Empty;

    public string Back { get; set; } = string.Empty;

    public int Importance { get; set; }
}