namespace StudyMate.Api.Dtos;

public class GenerateQuizResponse
{
    public List<QuizQuestion> Questions { get; set; }
        = new();
}