namespace StudyMate.Api.Dtos;

public class GenerateQuestionsRequest
    : StudySourceRequest
{
    public int QuestionCount { get; set; } = 10;
}