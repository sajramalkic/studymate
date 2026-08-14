using System.Text;
using System.Text.Json;
using StudyMate.Api.Dtos;

namespace StudyMate.Api.Services;

public class GeminiQuestionService
{
    private const int MaxBatchLength = 60000;

    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly TextChunkingService _textChunkingService;

    public GeminiQuestionService(
        HttpClient httpClient,
        IConfiguration configuration,
        TextChunkingService textChunkingService)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _textChunkingService = textChunkingService;
    }

    public async Task<GenerateQuestionsResponse>
        GenerateQuestionsAsync(
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

        /*
         * TextChunkingService pravi manje dijelove.
         *
         * Ovdje ih ponovo grupišemo u nešto veće
         * batch-eve kako ne bismo pravili nepotrebno
         * mnogo Gemini API poziva.
         */
        var batches =
            CreateBatches(chunks);

        /*
         * Ako imamo više dijelova nego što korisnik
         * želi pitanja, iz svakog dijela ćemo ipak
         * napraviti barem jedan kandidat.
         *
         * Primjer:
         *
         * 8 dijelova + korisnik želi 5 pitanja
         * -> generišemo najmanje 8 kandidata
         * -> na kraju izaberemo 5 raspoređenih kroz
         *    cijeli materijal.
         */
        var candidateTarget =
       Math.Max(
           questionCount * 2,
           batches.Count
       );

        var questionDistribution =
            DistributeQuestions(
                candidateTarget,
                batches.Count
            );

        var candidates =
            new List<GeneratedQuestion>();

        for (
            var i = 0;
            i < batches.Count;
            i++
        )
        {
            var count =
                questionDistribution[i];

            if (count <= 0)
            {
                continue;
            }

            var result =
                await GenerateFromTextAsync(
                    batches[i],
                    count
                );

            candidates.AddRange(
                result.Questions
            );
        }

        var uniqueQuestions =
            RemoveDuplicates(
                candidates
            );

        /*
         * Ako su se pitanja iz različitih dijelova
         * slučajno ponovila, pokušamo generisati
         * nekoliko dodatnih.
         */
        if (
            uniqueQuestions.Count <
            questionCount
        )
        {
            await FillMissingQuestionsAsync(
                batches,
                uniqueQuestions,
                questionCount
            );
        }

        if (
            uniqueQuestions.Count <
            questionCount
        )
        {
            throw new InvalidOperationException(
                "AI nije uspio generisati dovoljan broj različitih pitanja. Pokušaj ponovo."
            );
        }

        var selectedQuestions =
     SelectMostImportant(
         uniqueQuestions,
         questionCount
     );

        return new GenerateQuestionsResponse
        {
            Questions =
                selectedQuestions
        };
    }

    private async Task<GenerateQuestionsResponse>
        GenerateFromTextAsync(
            string sourceText,
            int questionCount,
            IEnumerable<string>?
                excludedQuestions = null)
    {
        var apiKey =
            _configuration[
                "Gemini:ApiKey"
            ];

        var model =
            _configuration[
                "Gemini:Model"
            ]
            ?? "gemini-3.5-flash-lite";

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException(
                "Gemini API ključ nije podešen."
            );
        }

        var excluded =
            excludedQuestions?
                .Where(question =>
                    !string.IsNullOrWhiteSpace(
                        question
                    ))
                .ToList()
            ?? new List<string>();

        var excludedText =
            excluded.Count == 0
                ? ""
                : $"""

                  VEĆ GENERISANA PITANJA:

                  {string.Join(
                      Environment.NewLine,
                      excluded.Select(
                          question =>
                              $"- {question}"
                      )
                  )}

                  Nemoj ponavljati niti preformulisati
                  ova pitanja.
                  """;

        var prompt =
      $"""
    Ti si edukativni asistent u aplikaciji StudyMate.

    Na osnovu dostavljenog gradiva prvo procijeni
    koji su pojmovi i dijelovi najvažniji za razumijevanje
    teme i učenje za ispit.

    Pri procjeni važnosti obrati posebnu pažnju na:
    - ključne definicije i pojmove,
    - koncepte koji se više puta pojavljuju,
    - glavne procese, metode i korake,
    - podjele i klasifikacije,
    - odnose između važnih pojmova,
    - formule, pravila i principe ako postoje,
    - dijelove kojima je u materijalu posvećeno više pažnje,
    - informacije bez kojih se ostatak gradiva teško razumije.

    Posebno važnim smatraj:

    - ključne definicije i osnovne pojmove,
    - glavne principe i pravila,
    - procese, metode i njihove korake,
    - formule i njihove primjene,
    - podjele i klasifikacije,
    - odnose između važnih pojmova,
    - koncepte koji se više puta pojavljuju,
    - dijelove kojima je u materijalu posvećeno
      više objašnjenja,
    - informacije bez kojih se ostatak teme teško
      može razumjeti.


    Zatim generiši TAČNO {questionCount} pitanja.

    Raspodijeli pitanja tako da:
    - većina pitanja provjerava najvažnije dijelove gradiva,
    - nekoliko pitanja provjerava detalje srednje važnosti,
    - ne troši pitanja na nebitne primjere, fusnote ili
      administrativne informacije,
    - ne ponavlja isto znanje kroz više sličnih pitanja.

    Koristi ISKLJUČIVO informacije koje postoje u
    dostavljenom gradivu.

    Nemoj dodavati činjenice iz vlastitog znanja.

    Pitanja trebaju biti različite težine i korisna
    za pripremu ispita i shvatanje materijala.

    Odgovori trebaju biti tačni, jasni i sažeti.

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
                                type =
                                    "object",

                                properties =
                                    new
                                    {
                                        questions =
                                            new
                                            {
                                                type =
                                                    "array",

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
                type = "string"
            },

        answer =
            new
            {
                type = "string"
            },

        importance =
            new
            {
                type = "integer",
                minimum = 1,
                maximum = 5
            }
    },

                                                        required =
                                                            new[]
                                                            {
                                                                "question",
                                                                "answer"
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
                "Gemini nije vratio pitanja."
            );
        }

        var result =
            JsonSerializer.Deserialize
                <GenerateQuestionsResponse>(
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
                "Gemini nije generisao pitanja."
            );
        }

        return result;
    }

    private async Task
        FillMissingQuestionsAsync(
            List<string> batches,
            List<GeneratedQuestion>
                currentQuestions,
            int requestedCount)
    {
        /*
         * Samo jedan dodatni prolaz kroz batch-eve,
         * da ne napravimo beskonačan broj API poziva.
         */
        foreach (var batch in batches)
        {
            if (
                currentQuestions.Count >=
                requestedCount
            )
            {
                break;
            }

            var missing =
                requestedCount -
                currentQuestions.Count;

            /*
             * Ne tražimo više od 3 dodatna pitanja
             * po pokušaju.
             */
            var count =
                Math.Min(
                    missing,
                    3
                );

            var excludedQuestions =
                currentQuestions
                    .Select(
                        question =>
                            question.Question
                    )
                    .ToList();

            var result =
                await GenerateFromTextAsync(
                    batch,
                    count,
                    excludedQuestions
                );

            foreach (
                var question
                in result.Questions
            )
            {
                if (
                    !ContainsQuestion(
                        currentQuestions,
                        question.Question
                    )
                )
                {
                    currentQuestions.Add(
                        question
                    );
                }

                if (
                    currentQuestions.Count >=
                    requestedCount
                )
                {
                    break;
                }
            }
        }
    }

    private static List<string>
        CreateBatches(
            List<string> chunks)
    {
        var batches =
            new List<string>();

        var current =
            new StringBuilder();

        foreach (var chunk in chunks)
        {
            var requiredLength =
                current.Length == 0
                    ? chunk.Length
                    : chunk.Length + 2;

            if (
                current.Length > 0 &&
                current.Length +
                    requiredLength >
                    MaxBatchLength
            )
            {
                batches.Add(
                    current
                        .ToString()
                        .Trim()
                );

                current.Clear();
            }

            if (current.Length > 0)
            {
                current.AppendLine();
                current.AppendLine();
            }

            current.Append(chunk);
        }

        if (current.Length > 0)
        {
            batches.Add(
                current
                    .ToString()
                    .Trim()
            );
        }

        return batches;
    }

    private static List<int>
        DistributeQuestions(
            int questionCount,
            int batchCount)
    {
        var result =
            new List<int>();

        var baseCount =
            questionCount /
            batchCount;

        var remainder =
            questionCount %
            batchCount;

        for (
            var i = 0;
            i < batchCount;
            i++
        )
        {
            var count =
                baseCount;

            if (i < remainder)
            {
                count++;
            }

            result.Add(count);
        }

        return result;
    }

    private static List<GeneratedQuestion>
        RemoveDuplicates(
            IEnumerable<GeneratedQuestion>
                questions)
    {
        var result =
            new List<GeneratedQuestion>();

        var seen =
            new HashSet<string>();

        foreach (var question in questions)
        {
            if (
                string.IsNullOrWhiteSpace(
                    question.Question
                )
            )
            {
                continue;
            }

            var normalized =
                NormalizeQuestion(
                    question.Question
                );

            if (seen.Add(normalized))
            {
                result.Add(question);
            }
        }

        return result;
    }

    private static bool ContainsQuestion(
        IEnumerable<GeneratedQuestion>
            questions,
        string question)
    {
        var normalized =
            NormalizeQuestion(question);

        return questions.Any(
            existing =>
                NormalizeQuestion(
                    existing.Question
                )
                == normalized
        );
    }

    private static string NormalizeQuestion(
        string question)
    {
        return new string(
            question
                .ToLowerInvariant()
                .Where(
                    character =>
                        char.IsLetterOrDigit(
                            character
                        )
                )
                .ToArray()
        );
    }

    private static List<GeneratedQuestion>
    SelectMostImportant(
        List<GeneratedQuestion> questions,
        int count)
    {
        return questions
            .OrderByDescending(
                question =>
                    question.Importance
            )
            .Take(count)
            .ToList();
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
                    itemType.GetString()
                        == "text" &&
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

