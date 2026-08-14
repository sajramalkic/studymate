using System.Text;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using StudyMate.Api.Models;
using UglyToad.PdfPig;
using UglyToad.PdfPig.DocumentLayoutAnalysis.TextExtractor;

namespace StudyMate.Api.Services;

public class TextExtractionService
{
    private readonly IWebHostEnvironment _environment;

    public TextExtractionService(
        IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    public async Task<string> ExtractTextAsync(
        MaterialFile file)
    {
        var filePath = GetFilePath(file);

        if (!File.Exists(filePath))
        {
            throw new FileNotFoundException(
                "Fajl nije pronađen.",
                filePath
            );
        }

        var extension = GetExtension(file);

        return extension switch
        {
            ".txt" =>
                await ExtractTxtAsync(filePath),

            ".docx" =>
                ExtractDocx(filePath),

            ".pdf" =>
                ExtractPdf(filePath),

            _ =>
                string.Empty
        };
    }

    public async Task<string> ExtractMaterialTextAsync(
        Material material)
    {
        var builder = new StringBuilder();

        foreach (var file in material.Files)
        {
            var text =
                await ExtractTextAsync(file);

            if (string.IsNullOrWhiteSpace(text))
            {
                continue;
            }

            if (builder.Length > 0)
            {
                builder.AppendLine();
                builder.AppendLine();
            }

            builder.AppendLine(
                $"--- {file.OriginalFileName} ---"
            );

            builder.AppendLine(text);
        }

        return builder
            .ToString()
            .Trim();
    }

    public List<ExtractedPage> ExtractPdfPages(
        MaterialFile file)
    {
        var extension = GetExtension(file);

        if (extension != ".pdf")
        {
            throw new InvalidOperationException(
                "Odabir stranica je podržan samo za PDF fajlove."
            );
        }

        var filePath = GetFilePath(file);

        if (!File.Exists(filePath))
        {
            throw new FileNotFoundException(
                "PDF fajl nije pronađen.",
                filePath
            );
        }

        var pages =
            new List<ExtractedPage>();

        using var document =
            PdfDocument.Open(filePath);

        foreach (var page in document.GetPages())
        {
            var text =
                ContentOrderTextExtractor
                    .GetText(page);

            pages.Add(
                new ExtractedPage
                {
                    PageNumber =
                        page.Number,

                    Text =
                        text?.Trim()
                        ?? string.Empty
                }
            );
        }

        return pages;
    }

    public string ExtractPdfPageRange(
        MaterialFile file,
        int startPage,
        int endPage)
    {
        if (startPage <= 0)
        {
            throw new ArgumentException(
                "Početna stranica mora biti veća od 0."
            );
        }

        if (endPage < startPage)
        {
            throw new ArgumentException(
                "Krajnja stranica ne može biti manja od početne."
            );
        }

        var pages =
            ExtractPdfPages(file);

        if (pages.Count == 0)
        {
            return string.Empty;
        }

        if (startPage > pages.Count)
        {
            throw new ArgumentException(
                $"PDF ima ukupno {pages.Count} stranica."
            );
        }

        if (endPage > pages.Count)
        {
            throw new ArgumentException(
                $"PDF ima ukupno {pages.Count} stranica."
            );
        }

        var selectedPages =
            pages.Where(
                page =>
                    page.PageNumber >= startPage &&
                    page.PageNumber <= endPage
            );

        var builder =
            new StringBuilder();

        foreach (var page in selectedPages)
        {
            if (string.IsNullOrWhiteSpace(page.Text))
            {
                continue;
            }

            builder.AppendLine(
                $"--- Stranica {page.PageNumber} ---"
            );

            builder.AppendLine(
                page.Text
            );

            builder.AppendLine();
        }

        return builder
            .ToString()
            .Trim();
    }

    public int GetPdfPageCount(
        MaterialFile file)
    {
        var extension = GetExtension(file);

        if (extension != ".pdf")
        {
            throw new InvalidOperationException(
                "Broj stranica moguće je dobiti samo za PDF fajl."
            );
        }

        var filePath = GetFilePath(file);

        if (!File.Exists(filePath))
        {
            throw new FileNotFoundException(
                "PDF fajl nije pronađen.",
                filePath
            );
        }

        using var document =
            PdfDocument.Open(filePath);

        return document.NumberOfPages;
    }

    private string GetFilePath(
        MaterialFile file)
    {
        return Path.Combine(
            _environment.ContentRootPath,
            "Uploads",
            file.StoredFileName
        );
    }

    private static string GetExtension(
        MaterialFile file)
    {
        return Path
            .GetExtension(
                file.OriginalFileName
            )
            .ToLowerInvariant();
    }

    private static async Task<string>
        ExtractTxtAsync(
            string filePath)
    {
        return await File.ReadAllTextAsync(
            filePath
        );
    }

    private static string ExtractDocx(
        string filePath)
    {
        using var document =
            WordprocessingDocument.Open(
                filePath,
                false
            );

        var body =
            document.MainDocumentPart?
                .Document
                .Body;

        if (body == null)
        {
            return string.Empty;
        }

        var paragraphs =
            body
                .Descendants<Paragraph>()
                .Select(
                    paragraph =>
                        paragraph.InnerText
                )
                .Where(
                    text =>
                        !string.IsNullOrWhiteSpace(
                            text
                        )
                );

        return string.Join(
            Environment.NewLine,
            paragraphs
        );
    }

    private static string ExtractPdf(
        string filePath)
    {
        var builder =
            new StringBuilder();

        using var document =
            PdfDocument.Open(filePath);

        foreach (var page in document.GetPages())
        {
            var text =
                ContentOrderTextExtractor
                    .GetText(page);

            if (string.IsNullOrWhiteSpace(text))
            {
                continue;
            }

            builder.AppendLine(
                $"--- Stranica {page.Number} ---"
            );

            builder.AppendLine(text);

            builder.AppendLine();
        }

        return builder
            .ToString()
            .Trim();
    }
}