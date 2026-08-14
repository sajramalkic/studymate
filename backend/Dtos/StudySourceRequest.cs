namespace StudyMate.Api.Dtos;

public class StudySourceRequest
{
    public int MaterialId { get; set; }

    // whole | chapter | pages
    public string SourceType { get; set; } = "whole";

    public int? FileId { get; set; }

    public string? Chapter { get; set; }

    public int? StartPage { get; set; }

    public int? EndPage { get; set; }
}