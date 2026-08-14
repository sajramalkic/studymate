using System.Text;
using System.Text.Json;
using StudyMate.Api.Dtos;

namespace StudyMate.Api.Services;

public class GeminiQuizService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly TextChunkingService _textChunkingService;

    public GeminiQuizService(
        HttpClient httpClient,
        IConfiguration configuration,
        TextChunkingService textChunkingService)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _textChunkingService = textChunkingService;
    }

    public async Task<GenerateQuizResponse> GenerateQuizAsync(
        string sourceText,
        int questionCount)
    {
        if (string.IsNullOrWhiteSpace(sourceText))
        {
            throw new ArgumentException(
                "Gradivo je prazno."
            );
        }

        if (
            questionCount < 1 ||
            questionCount > 30
        )
        {
            throw new ArgumentException(
                "Broj pitanja mora biti između 1 i 30."
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

        var text =
            string.Join(
                Environment.NewLine +
                Environment.NewLine,
                chunks
            );

        /*
         * Generišemo više kandidata nego što
         * korisnik traži, kako bismo mogli uzeti
         * pitanja iz važnijeg gradiva.
         */
        var candidateCount =
            Math.Min(
                questionCount * 2,
                30
            );

        var result =
            await GenerateAsync(
                text,
                candidateCount
            );

        var selectedQuestions =
            result.Questions
                .Where(IsValidQuestion)
                .OrderByDescending(
                    question =>
                        question.Importance
                )
                .Take(questionCount)
                .ToList();

        if (
            selectedQuestions.Count <
            questionCount
        )
        {
            throw new InvalidOperationException(
                "AI nije uspio generisati dovoljan broj ispravnih pitanja. Pokušaj ponovo."
            );
        }

        return new GenerateQuizResponse
        {
            Questions =
                selectedQuestions
        };
    }

    private async Task<GenerateQuizResponse> GenerateAsync(
        string sourceText,
        int questionCount)
    {
        var apiKey =
            _configuration["Gemini:ApiKey"];

        var model =
            _configuration["Gemini:Model"];

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException(
                "Gemini API ključ nije podešen."
            );
        }

        if (string.IsNullOrWhiteSpace(model))
        {
            throw new InvalidOperationException(
                "Gemini model nije podešen."
            );
        }

        var prompt =
            $"""
            Kreiraj TAČNO {questionCount} kandidata
            za kviz na osnovu dostavljenog studentskog
            gradiva.

            Svako pitanje mora imati TAČNO četiri
            ponuđena odgovora.

            Tačno jedan odgovor mora biti ispravan.

            Za svako pitanje vrati:

            question:
            jasno pitanje.

            options:
            četiri ponuđena odgovora.

            correctOptionIndex:
            indeks tačnog odgovora od 0 do 3.

            explanation:
            kratko objašnjenje zašto je dati odgovor
            tačan.

            importance:
            važnost pitanja od 1 do 5.

            5 = ključno gradivo
            4 = veoma važno
            3 = srednje važno
            2 = manje važno
            1 = sporedan detalj

            PRAVILA:

            - Koristi isključivo informacije iz gradiva.
            - Nemoj dodavati činjenice iz vlastitog znanja.
            - Prednost daj ključnim definicijama,
              konceptima, pravilima, procesima,
              formulama i važnim odnosima.
            - Nemoj praviti trivijalna pitanja ako
              postoje važnije informacije.
            - Nemoj ponavljati isto znanje kroz više
              pitanja.
            - Netočni odgovori trebaju biti uvjerljivi,
              ali nedvosmisleno netačni prema gradivu.
            - Nemoj koristiti odgovore poput
              "Sve navedeno" ili "Ništa navedeno".
            - Nemoj uvijek stavljati tačan odgovor
              na isto mjesto.
            - Koristi različite nivoe težine.
            - Pitanja trebaju biti korisna za stvarno
              ponavljanje i pripremu ispita.
            - Piši na istom jeziku kao gradivo.

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
                                        questions =
                                            new
                                            {
                                                type = "array",

                                                minItems =
                                                    questionCount,

                                                maxItems =
                                                    questionCount,

                                                items =
                                                    new
                                                    {
                                                        type =
                                                            "object",

                                                        properties =
                                                            new
                                                            {
                                                                question =
                                                                    new
                                                                    {
                                                                        type =
                                                                            "string"
                                                                    },

                                                                options =
                                                                    new
                                                                    {
                                                                        type =
                                                                            "array",

                                                                        minItems =
                                                                            4,

                                                                        maxItems =
                                                                            4,

                                                                        items =
                                                                            new
                                                                            {
                                                                                type =
                                                                                    "string"
                                                                            }
                                                                    },

                                                                correctOptionIndex =
                                                                    new
                                                                    {
                                                                        type =
                                                                            "integer",

                                                                        minimum =
                                                                            0,

                                                                        maximum =
                                                                            3
                                                                    },

                                                                explanation =
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
                                                                "question",
                                                                "options",
                                                                "correctOptionIndex",
                                                                "explanation",
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
                                        "questions"
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
            await _httpClient.SendAsync(
                request
            );

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
            JsonDocument.Parse(
                responseText
            );

        var generatedJson =
            GetOutputText(
                json.RootElement
            );

        if (string.IsNullOrWhiteSpace(
            generatedJson))
        {
            throw new InvalidOperationException(
                "Gemini nije vratio kviz."
            );
        }

        var result =
            JsonSerializer.Deserialize
                <GenerateQuizResponse>(
                    generatedJson,
                    new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive =
                            true
                    }
                );

        if (
            result == null ||
            result.Questions.Count == 0
        )
        {
            throw new InvalidOperationException(
                "Gemini nije generisao kviz."
            );
        }

        return result;
    }

    private static bool IsValidQuestion(
        QuizQuestion question)
    {
        return
            !string.IsNullOrWhiteSpace(
                question.Question
            ) &&
            question.Options != null &&
            question.Options.Count == 4 &&
            question.Options.All(
                option =>
                    !string.IsNullOrWhiteSpace(option)
            ) &&
            question.CorrectOptionIndex >= 0 &&
            question.CorrectOptionIndex <= 3;
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
                stepType.GetString() !=
                    "model_output"
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