namespace StudyMate.Api.Dtos;

public class GenerateFlashcardsResponse
{
    public List<Flashcard> Flashcards { get; set; }
        = new();
}