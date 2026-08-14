using System.Text;
using System.Text.Json;
using StudyMate.Api.Dtos;

namespace StudyMate.Api.Services;

public class GeminiFlashcardService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly TextChunkingService _textChunkingService;

    public GeminiFlashcardService(
        HttpClient httpClient,
        IConfiguration configuration,
        TextChunkingService textChunkingService)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _textChunkingService = textChunkingService;
    }

    public async Task<GenerateFlashcardsResponse>
        GenerateFlashcardsAsync(
            string sourceText,
            int cardCount)
    {
        if (string.IsNullOrWhiteSpace(sourceText))
        {
            throw new ArgumentException(
                "Gradivo je prazno."
            );
        }

        if (cardCount < 1 || cardCount > 30)
        {
            throw new ArgumentException(
                "Broj kartica mora biti između 1 i 30."
            );
        }

        var chunks =
            _textChunkingService
                .SplitIntoChunks(sourceText);

        if (chunks.Count == 0)
        {
            throw new InvalidOperationException(
                "Gradivo nije moguće obraditi."
            );
        }

        /*
         * Za početak uzimamo tekst svih chunkova.
         * Ako je materijal jako velik, Gemini servis
         * ćemo kasnije dodatno optimizovati batchanjem.
         */
        var text =
            string.Join(
                Environment.NewLine +
                Environment.NewLine,
                chunks
            );

        var result =
            await GenerateAsync(
                text,
                Math.Min(cardCount * 2, 30)
            );

        var selected =
            result.Flashcards
                .Where(card =>
                    !string.IsNullOrWhiteSpace(
                        card.Front
                    ) &&
                    !string.IsNullOrWhiteSpace(
                        card.Back
                    )
                )
                .GroupBy(
                    card =>
                        card.Front
                            .Trim()
                            .ToLowerInvariant()
                )
                .Select(group =>
                    group.First()
                )
                .OrderByDescending(
                    card =>
                        card.Importance
                )
                .Take(cardCount)
                .ToList();

        if (selected.Count == 0)
        {
            throw new InvalidOperationException(
                "Gemini nije generisao kartice."
            );
        }

        return new GenerateFlashcardsResponse
        {
            Flashcards = selected
        };
    }

    private async Task<GenerateFlashcardsResponse>
        GenerateAsync(
            string sourceText,
            int candidateCount)
    {
        var apiKey =
            _configuration["Gemini:ApiKey"];

        var model =
            _configuration["Gemini:Model"]
            ?? "gemini-3.5-flash-lite";

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException(
                "Gemini API ključ nije podešen."
            );
        }

        var prompt =
            $"""
            Kreiraj TAČNO {candidateCount} kandidata
            za flashcards iz dostavljenog studentskog
            gradiva.

            Flashcards služe za aktivno ponavljanje.

            Za svaku karticu napravi:

            front:
            kratko pitanje, pojam ili zadatak koji
            student treba prepoznati ili objasniti.

            back:
            jasan i dovoljno kratak odgovor.

            importance:
            broj od 1 do 5 koji označava koliko je
            sadržaj važan za razumijevanje gradiva.

            5 = ključno gradivo
            4 = veoma važno
            3 = srednje važno
            2 = manje važno
            1 = sporedan detalj

            Prednost daj:

            - ključnim definicijama,
            - važnim pojmovima,
            - pravilima i principima,
            - formulama,
            - procesima i koracima,
            - podjelama i klasifikacijama,
            - odnosima između pojmova.

            Nemoj praviti kartice od nevažnih
            administrativnih informacija.

            Nemoj praviti više kartica koje provjeravaju
            potpuno istu činjenicu.

            Koristi ISKLJUČIVO informacije iz gradiva.

            Nemoj dodavati informacije iz vlastitog znanja.

            Piši na istom jeziku kao gradivo.

            GRADIVO:

            {sourceText}
            """;

        var requestBody =
            new
            {
                model,
                input = prompt,
                store = false,

                response_format =
                    new
                    {
                        type = "text",
                        mime_type =
                            "application/json",

                        schema =
                            new
                            {
                                type = "object",

                                properties =
                                    new
                                    {
                                        flashcards =
                                            new
                                            {
                                                type = "array",

                                                minItems =
                                                    candidateCount,

                                                maxItems =
                                                    candidateCount,

                                                items =
                                                    new
                                                    {
                                                        type =
                                                            "object",

                                                        properties =
                                                            new
                                                            {
                                                                front =
                                                                    new
                                                                    {
                                                                        type =
                                                                            "string"
                                                                    },

                                                                back =
                                                                    new
                                                                    {
                                                                        type =
                                                                            "string"
                                                                    },

                                                                importance =
                                                                    new
                                                                    {
                                                                        type =
                                                                            "integer",

                                                                        minimum =
                                                                            1,

                                                                        maximum =
                                                                            5
                                                                    }
                                                            },

                                                        required =
                                                            new[]
                                                            {
                                                                "front",
                                                                "back",
                                                                "importance"
                                                            },

                                                        additionalProperties =
                                                            false
                                                    }
                                            }
                                    },

                                required =
                                    new[]
                                    {
                                        "flashcards"
                                    },

                                additionalProperties =
                                    false
                            }
                    }
            };

        using var request =
            new HttpRequestMessage(
                HttpMethod.Post,
                "https://generativelanguage.googleapis.com/v1/interactions"
            );

        request.Headers.Add(
            "x-goog-api-key",
            apiKey
        );

        request.Content =
            new StringContent(
                JsonSerializer.Serialize(
                    requestBody
                ),
                Encoding.UTF8,
                "application/json"
            );

        using var response =
            await _httpClient.SendAsync(request);

        var responseText =
            await response.Content
                .ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(
                $"Gemini servis je vratio grešku {(int)response.StatusCode}."
            );
        }

        using var json =
            JsonDocument.Parse(responseText);

        var generatedJson =
            GetOutputText(
                json.RootElement
            );

        if (string.IsNullOrWhiteSpace(
            generatedJson))
        {
            throw new InvalidOperationException(
                "Gemini nije vratio kartice."
            );
        }

        var result =
            JsonSerializer.Deserialize
                <GenerateFlashcardsResponse>(
                    generatedJson,
                    new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive =
                            true
                    }
                );

        if (
            result == null ||
            result.Flashcards.Count == 0
        )
        {
            throw new InvalidOperationException(
                "Gemini nije generisao kartice."
            );
        }

        return result;
    }

    private static string GetOutputText(
        JsonElement root)
    {
        if (!root.TryGetProperty(
            "steps",
            out var steps))
        {
            return string.Empty;
        }

        var builder =
            new StringBuilder();

        foreach (
            var step
            in steps.EnumerateArray()
        )
        {
            if (
                !step.TryGetProperty(
                    "type",
                    out var stepType
                ) ||
                stepType.GetString()
                    != "model_output"
            )
            {
                continue;
            }

            if (!step.TryGetProperty(
                "content",
                out var content))
            {
                continue;
            }

            foreach (
                var item
                in content.EnumerateArray()
            )
            {
                if (
                    item.TryGetProperty(
                        "type",
                        out var itemType
                    ) &&
                    itemType.GetString() ==
                        "text" &&
                    item.TryGetProperty(
                        "text",
                        out var text
                    )
                )
                {
                    builder.Append(
                        text.GetString()
                    );
                }
            }
        }

        return builder
            .ToString()
            .Trim();
    }
}