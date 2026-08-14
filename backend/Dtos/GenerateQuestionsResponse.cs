namespace StudyMate.Api.Dtos;

public class GenerateQuestionsResponse
{
    public List<GeneratedQuestion> Questions
    { get; set; } = new();
}