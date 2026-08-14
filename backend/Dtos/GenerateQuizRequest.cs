namespace StudyMate.Api.Dtos;

public class GenerateQuizRequest
    : StudySourceRequest
{
    public int QuestionCount { get; set; } = 10;
}