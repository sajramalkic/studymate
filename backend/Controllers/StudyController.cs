using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using StudyMate.Api.Dtos;
using StudyMate.Api.Models;
using StudyMate.Api.Services;

namespace StudyMate.Api.Controllers;

[ApiController]
[Route("api/study")]
[Authorize]
public class StudyController : ControllerBase
{
    private readonly UserManager<ApplicationUser>
        _userManager;

    private readonly StudySourceService
        _studySourceService;

    private readonly GeminiQuestionService
    _geminiQuestionService;

    private readonly GeminiSummaryService
    _geminiSummaryService;

    private readonly GeminiFlashcardService
    _geminiFlashcardService;

    private readonly GeminiQuizService
    _geminiQuizService;

    public StudyController(
        UserManager<ApplicationUser> userManager,
        StudySourceService studySourceService,
        GeminiQuestionService geminiQuestionService,
        GeminiSummaryService geminiSummaryService,
        GeminiFlashcardService geminiFlashcardService,
         GeminiQuizService geminiQuizService)
    {
        _userManager =
            userManager;

        _studySourceService =
            studySourceService;

        _geminiQuestionService =
            geminiQuestionService;

        _geminiSummaryService =
    geminiSummaryService;

        _geminiFlashcardService = 
            geminiFlashcardService;

        _geminiQuizService = geminiQuizService;
    }

    [HttpPost("flashcards/generate")]
    public async Task<IActionResult> GenerateFlashcards(
        GenerateFlashcardsRequest request)
    {
        var currentUser =
            await _userManager.GetUserAsync(User);

        if (currentUser == null)
        {
            return Unauthorized();
        }

        if (request.MaterialId <= 0)
        {
            return BadRequest(
                "Materijal nije ispravan."
            );
        }

        if (
            request.CardCount < 1 ||
            request.CardCount > 30
        )
        {
            return BadRequest(
                "Broj kartica mora biti između 1 i 30."
            );
        }

        try
        {
            var sourceText =
                await _studySourceService
                    .GetSourceTextAsync(request);

            var result =
                await _geminiFlashcardService
                    .GenerateFlashcardsAsync(
                        sourceText,
                        request.CardCount
                    );

            return Ok(result);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(
                exception.Message
            );
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(
                exception.Message
            );
        }
    }
    [HttpPost("questions/generate")]
public async Task<IActionResult>
    GenerateQuestions(
        GenerateQuestionsRequest request)
{
    var currentUser =
        await _userManager.GetUserAsync(User);

    if (currentUser == null)
    {
        return Unauthorized();
    }

    if (request.MaterialId <= 0)
    {
        return BadRequest(
            "Materijal nije ispravan."
        );
    }

    if (
        request.QuestionCount < 1 ||
        request.QuestionCount > 30
    )
    {
        return BadRequest(
            "Broj pitanja mora biti između 1 i 30."
        );
    }

    try
    {
        var sourceText =
            await _studySourceService
                .GetSourceTextAsync(
                    request
                );

        var result =
            await _geminiQuestionService
                .GenerateQuestionsAsync(
                    sourceText,
                    request.QuestionCount
                );

        return Ok(result);
    }
    catch (
        ArgumentException exception)
    {
        return BadRequest(
            exception.Message
        );
    }
    catch (
        InvalidOperationException exception)
    {
        return BadRequest(
            exception.Message
        );
    }
}

[HttpPost("questions/source")]
    public async Task<IActionResult>
        PrepareQuestionSource(
            GenerateQuestionsRequest request)
    {
        var currentUser =
            await _userManager.GetUserAsync(User);

        if (currentUser == null)
        {
            return Unauthorized();
        }

        if (request.MaterialId <= 0)
        {
            return BadRequest(
                "Materijal nije ispravan."
            );
        }

        if (request.QuestionCount < 1 ||
            request.QuestionCount > 30)
        {
            return BadRequest(
                "Broj pitanja mora biti između 1 i 30."
            );
        }

        try
        {
            var text =
    await _studySourceService
        .GetSourceTextAsync(request);

            return Ok(
                new
                {
                    materialId =
                        request.MaterialId,

                    sourceType =
                        request.SourceType,

                    questionCount =
                        request.QuestionCount,

                    characterCount =
                        text.Length,

                    text
                }
            );
        }
       
        catch (
            ArgumentException exception)
        {
            return BadRequest(
                exception.Message
            );
        }
        catch (
            InvalidOperationException exception)
        {
            return BadRequest(
                exception.Message
            );
        }
    }

    [HttpPost("summary/generate")]
    public async Task<IActionResult>
    GenerateSummary(
        GenerateSummaryRequest request)
    {
        var currentUser =
            await _userManager.GetUserAsync(User);

        if (currentUser == null)
        {
            return Unauthorized();
        }

        if (request.MaterialId <= 0)
        {
            return BadRequest(
                "Materijal nije ispravan."
            );
        }

        try
        {
            var sourceText =
                await _studySourceService
                    .GetSourceTextAsync(request);

            var result =
                await _geminiSummaryService
                    .GenerateSummaryAsync(
                        sourceText,
                        request.Length
                    );

            return Ok(result);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(
                exception.Message
            );
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(
                exception.Message
            );
        }
    }

    [HttpPost("quiz/generate")]
    public async Task<IActionResult> GenerateQuiz(
    GenerateQuizRequest request)
    {
        var currentUser =
            await _userManager.GetUserAsync(User);

        if (currentUser == null)
        {
            return Unauthorized();
        }

        if (request.MaterialId <= 0)
        {
            return BadRequest(
                "Materijal nije ispravan."
            );
        }

        if (
            request.QuestionCount < 1 ||
            request.QuestionCount > 30
        )
        {
            return BadRequest(
                "Broj pitanja mora biti između 1 i 30."
            );
        }

        try
        {
            var sourceText =
                await _studySourceService
                    .GetSourceTextAsync(request);

            var result =
                await _geminiQuizService
                    .GenerateQuizAsync(
                        sourceText,
                        request.QuestionCount
                    );

            return Ok(result);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(
                exception.Message
            );
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(
                exception.Message
            );
        }
    }
}