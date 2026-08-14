using System.Text;

namespace StudyMate.Api.Services;

public class TextChunkingService
{
    private const int DefaultMaxChunkLength = 12000;

    public List<string> SplitIntoChunks(
        string text,
        int maxChunkLength = DefaultMaxChunkLength)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return new List<string>();
        }

        if (maxChunkLength <= 0)
        {
            throw new ArgumentException(
                "Maksimalna veličina dijela mora biti veća od 0."
            );
        }

        var normalizedText = text
            .Replace("\r\n", "\n")
            .Replace('\r', '\n')
            .Trim();

        if (normalizedText.Length <= maxChunkLength)
        {
            return new List<string>
            {
                normalizedText
            };
        }

        var paragraphs = normalizedText
            .Split(
                "\n\n",
                StringSplitOptions.RemoveEmptyEntries
            )
            .Select(paragraph => paragraph.Trim())
            .Where(paragraph =>
                !string.IsNullOrWhiteSpace(paragraph))
            .ToList();

        var chunks = new List<string>();
        var currentChunk = new StringBuilder();

        foreach (var paragraph in paragraphs)
        {
            if (paragraph.Length > maxChunkLength)
            {
                AddCurrentChunk(
                    chunks,
                    currentChunk
                );

                AddLargeParagraph(
                    chunks,
                    paragraph,
                    maxChunkLength
                );

                continue;
            }

            var additionalLength =
                currentChunk.Length == 0
                    ? paragraph.Length
                    : paragraph.Length + 2;

            if (
                currentChunk.Length +
                additionalLength >
                maxChunkLength
            )
            {
                AddCurrentChunk(
                    chunks,
                    currentChunk
                );
            }

            if (currentChunk.Length > 0)
            {
                currentChunk.AppendLine();
                currentChunk.AppendLine();
            }

            currentChunk.Append(paragraph);
        }

        AddCurrentChunk(
            chunks,
            currentChunk
        );

        return chunks;
    }

    private static void AddCurrentChunk(
        List<string> chunks,
        StringBuilder currentChunk)
    {
        if (currentChunk.Length == 0)
        {
            return;
        }

        chunks.Add(
            currentChunk
                .ToString()
                .Trim()
        );

        currentChunk.Clear();
    }

    private static void AddLargeParagraph(
        List<string> chunks,
        string paragraph,
        int maxChunkLength)
    {
        var sentences =
            SplitIntoSentences(paragraph);

        var currentChunk =
            new StringBuilder();

        foreach (var sentence in sentences)
        {
            if (sentence.Length > maxChunkLength)
            {
                AddCurrentChunk(
                    chunks,
                    currentChunk
                );

                SplitLongText(
                    chunks,
                    sentence,
                    maxChunkLength
                );

                continue;
            }

            var additionalLength =
                currentChunk.Length == 0
                    ? sentence.Length
                    : sentence.Length + 1;

            if (
                currentChunk.Length +
                additionalLength >
                maxChunkLength
            )
            {
                AddCurrentChunk(
                    chunks,
                    currentChunk
                );
            }

            if (currentChunk.Length > 0)
            {
                currentChunk.Append(' ');
            }

            currentChunk.Append(sentence);
        }

        AddCurrentChunk(
            chunks,
            currentChunk
        );
    }

    private static List<string> SplitIntoSentences(
        string text)
    {
        var sentences =
            new List<string>();

        var currentSentence =
            new StringBuilder();

        foreach (var character in text)
        {
            currentSentence.Append(character);

            if (
                character == '.' ||
                character == '!' ||
                character == '?'
            )
            {
                var sentence =
                    currentSentence
                        .ToString()
                        .Trim();

                if (!string.IsNullOrWhiteSpace(sentence))
                {
                    sentences.Add(sentence);
                }

                currentSentence.Clear();
            }
        }

        if (currentSentence.Length > 0)
        {
            var remaining =
                currentSentence
                    .ToString()
                    .Trim();

            if (!string.IsNullOrWhiteSpace(remaining))
            {
                sentences.Add(remaining);
            }
        }

        return sentences;
    }

    private static void SplitLongText(
        List<string> chunks,
        string text,
        int maxChunkLength)
    {
        var start = 0;

        while (start < text.Length)
        {
            var length = Math.Min(
                maxChunkLength,
                text.Length - start
            );

            var part = text
                .Substring(start, length)
                .Trim();

            if (!string.IsNullOrWhiteSpace(part))
            {
                chunks.Add(part);
            }

            start += length;
        }
    }
}