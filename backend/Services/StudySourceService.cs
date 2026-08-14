using System.Text;
using Microsoft.EntityFrameworkCore;
using StudyMate.Api.Data;
using StudyMate.Api.Dtos;
using StudyMate.Api.Models;

namespace StudyMate.Api.Services;

public class StudySourceService
{
    private readonly ApplicationDbContext _context;
    private readonly TextExtractionService _textExtractionService;

    public StudySourceService(
        ApplicationDbContext context,
        TextExtractionService textExtractionService)
    {
        _context = context;
        _textExtractionService = textExtractionService;
    }
    public async Task<string> GetSourceTextAsync(
        StudySourceRequest request)
    {
        var material = await _context.Materials
            .Include(material => material.Files)
            .FirstOrDefaultAsync(
                material =>
                    material.Id == request.MaterialId
            );

        if (material == null)
        {
            throw new InvalidOperationException(
                "Materijal nije pronađen."
            );
        }

       

        var sourceType = request.SourceType
            .Trim()
            .ToLowerInvariant();

        return sourceType switch
        {
            "whole" =>
                await GetWholeMaterialAsync(material),

            "chapter" =>
                await GetChapterAsync(
                    material,
                    request.Chapter
                ),

            "pages" =>
                GetPages(
                    material,
                    request.FileId,
                    request.StartPage,
                    request.EndPage
                ),

            _ => throw new ArgumentException(
                "Nepoznat način odabira gradiva."
            )
        };
    }

    private async Task<string> GetWholeMaterialAsync(
        Material material)
    {
        var text =
            await _textExtractionService
                .ExtractMaterialTextAsync(material);

        if (string.IsNullOrWhiteSpace(text))
        {
            throw new InvalidOperationException(
                "Iz materijala nije moguće izdvojiti tekst."
            );
        }

        return text;
    }

    private async Task<string> GetChapterAsync(
        Material material,
        string? chapter)
    {
        if (string.IsNullOrWhiteSpace(chapter))
        {
            throw new ArgumentException(
                "Unesi naziv poglavlja."
            );
        }

        var text =
            await _textExtractionService
                .ExtractMaterialTextAsync(material);

        if (string.IsNullOrWhiteSpace(text))
        {
            throw new InvalidOperationException(
                "Iz materijala nije moguće izdvojiti tekst."
            );
        }

        return ExtractChapter(
            text,
            chapter.Trim()
        );
    }

    private string GetPages(
        Material material,
        int? fileId,
        int? startPage,
        int? endPage)
    {
        if (fileId == null)
        {
            throw new ArgumentException(
                "Odaberi PDF fajl."
            );
        }

        if (startPage == null ||
            endPage == null)
        {
            throw new ArgumentException(
                "Unesi početnu i krajnju stranicu."
            );
        }

        var file = material.Files
            .FirstOrDefault(
                file => file.Id == fileId.Value
            );

        if (file == null)
        {
            throw new ArgumentException(
                "Odabrani fajl nije pronađen."
            );
        }

        return _textExtractionService
            .ExtractPdfPageRange(
                file,
                startPage.Value,
                endPage.Value
            );
    }

    private static string ExtractChapter(
        string text,
        string chapter)
    {
        var normalizedText =
            text.Replace("\r\n", "\n");

        var lines = normalizedText
            .Split('\n')
            .Select(line => line.Trim())
            .ToList();

        var startIndex =
            lines.FindIndex(
                line =>
                    line.Contains(
                        chapter,
                        StringComparison
                            .OrdinalIgnoreCase
                    )
            );

        if (startIndex == -1)
        {
            throw new ArgumentException(
                $"Poglavlje \"{chapter}\" nije pronađeno."
            );
        }

        var builder = new StringBuilder();

        builder.AppendLine(
            lines[startIndex]
        );

        for (
            var i = startIndex + 1;
            i < lines.Count;
            i++
        )
        {
            var currentLine =
                lines[i];

            if (
                i > startIndex + 1 &&
                LooksLikeHeading(
                    currentLine,
                    chapter
                )
            )
            {
                break;
            }

            builder.AppendLine(
                currentLine
            );
        }

        var result =
            builder.ToString().Trim();

        if (string.IsNullOrWhiteSpace(result))
        {
            throw new InvalidOperationException(
                "Iz odabranog poglavlja nije pronađen tekst."
            );
        }

        return result;
    }

    private static bool LooksLikeHeading(
        string line,
        string selectedChapter)
    {
        if (string.IsNullOrWhiteSpace(line))
        {
            return false;
        }

        if (line.Contains(
            selectedChapter,
            StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (line.Length > 100)
        {
            return false;
        }

     
        var startsWithNumber =
            char.IsDigit(line[0]) &&
            line.Any(char.IsWhiteSpace);

        return startsWithNumber;
    }
}