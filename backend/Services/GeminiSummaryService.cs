using System.Text;
using System.Text.Json;
using StudyMate.Api.Dtos;

namespace StudyMate.Api.Services;

public class GeminiSummaryService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly TextChunkingService _textChunkingService;

    public GeminiSummaryService(
        HttpClient httpClient,
        IConfiguration configuration,
        TextChunkingService textChunkingService)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _textChunkingService = textChunkingService;
    }

    public async Task<GenerateSummaryResponse> GenerateSummaryAsync(
        string sourceText,
        string length)
    {
        if (string.IsNullOrWhiteSpace(sourceText))
        {
            throw new ArgumentException(
                "Gradivo je prazno."
            );
        }

        var normalizedLength =
            length.Trim().ToLowerInvariant();

        if (
            normalizedLength != "short" &&
            normalizedLength != "medium" &&
            normalizedLength != "detailed"
        )
        {
            throw new ArgumentException(
                "Dužina sažetka nije ispravna."
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

        var partialSummaries =
            new List<string>();

        foreach (var chunk in chunks)
        {
            var summary =
                await GenerateChunkSummaryAsync(
                    chunk
                );

            if (!string.IsNullOrWhiteSpace(summary))
            {
                partialSummaries.Add(summary);
            }
        }

        if (partialSummaries.Count == 0)
        {
            throw new InvalidOperationException(
                "Nije moguće generisati sažetak."
            );
        }

        var combinedText =
            string.Join(
                Environment.NewLine +
                Environment.NewLine,
                partialSummaries
            );

        var finalSummary =
            await GenerateFinalSummaryAsync(
                combinedText,
                normalizedLength
            );

        return new GenerateSummaryResponse
        {
            Summary = finalSummary
        };
    }

    private async Task<string> GenerateChunkSummaryAsync(
        string text)
    {
        var prompt =
            $"""
            Analiziraj ovaj dio studentskog gradiva i
            izdvoji informacije potrebne za konačni sažetak.

            Fokusiraj se na:
            - ključne pojmove i definicije,
            - glavne ideje i principe,
            - procese i njihove korake,
            - formule i pravila ako postoje,
            - podjele i klasifikacije,
            - odnose između važnih pojmova.

            Zanemari:
            - ponavljanja,
            - nebitne primjere,
            - administrativne informacije,
            - sporedne detalje koji nisu važni za
              razumijevanje teme.

            Nemoj dodavati informacije kojih nema u gradivu.

            Piši na istom jeziku kao gradivo.

            GRADIVO:

            {text}
            """;

        return await SendPromptAsync(prompt);
    }

    private async Task<string> GenerateFinalSummaryAsync(
        string partialSummaries,
        string length)
    {
        var lengthInstruction =
            length switch
            {
                "short" =>
                    "Napravi kratak sažetak samo najvažnijih informacija.",

                "detailed" =>
                    "Napravi detaljan i dobro strukturiran sažetak pogodan za ozbiljno učenje i pripremu ispita.",

                _ =>
                    "Napravi sažetak srednje dužine sa ključnim informacijama potrebnim za učenje."
            };

        var prompt =
            $"""
            Na osnovu dostavljenih bilješki napiši kvalitetan
            i pregledan sažetak za učenje.

            {lengthInstruction}

            VAŽNA PRAVILA:

            - Počni odmah sadržajem.
            - Nemoj pisati "Evo sažetka".
            - Nemoj pisati "Naravno".
            - Nemoj pisati "U nastavku je sažetak".
            - Nemoj objašnjavati šta ćeš uraditi.
            - Nemoj se obraćati korisniku.
            - Nemoj spominjati AI.
            - Nemoj spominjati StudyMate.
            - Nemoj na kraju pisati komentare poput
              "Nadam se da će pomoći".
            - Nemoj pisati naslov "Sažetak", jer ga
              aplikacija već prikazuje.

            FORMATIRANJE:

            - Koristi ## za glavne cjeline.
            - Koristi ### za podcjeline kada je potrebno.
            - Koristi kratke i pregledne odlomke.
            - Koristi liste sa - kada postoji više
              povezanih stavki.
            - Ključne pojmove označi sa **podebljano**.
            - Ne pravi veoma duge odlomke.
            - Grupiraj povezane informacije.
            - Izbjegavaj ponavljanja.
            - Prvi naslov treba biti stvarna tema iz
              gradiva, a ne riječ "Sažetak".

            Na kraju, ako odgovara sadržaju, dodaj:

            ## Važno za zapamtiti

            Tu navedi nekoliko najvažnijih činjenica za
            brzo ponavljanje gradiva.

            SADRŽAJNA PRAVILA:

            - Koristi samo informacije iz dostavljenih bilješki.
            - Nemoj dodavati činjenice iz vlastitog znanja.
            - Sačuvaj stručne termine korištene u materijalu.
            - Prednost daj definicijama, glavnim konceptima,
              procesima, pravilima, formulama i važnim odnosima.
            - Sporedne primjere uključi samo ako pomažu
              razumijevanju.
            - Piši na istom jeziku kao sadržaj.

            BILJEŠKE:

            {partialSummaries}
            """;

        return await SendPromptAsync(prompt);
    }

    private async Task<string> SendPromptAsync(
        string prompt)
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

        var requestBody =
            new
            {
                model,
                input = prompt,
                store = false
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
            JsonDocument.Parse(responseText);

        var text =
            GetOutputText(
                json.RootElement
            );

        if (string.IsNullOrWhiteSpace(text))
        {
            throw new InvalidOperationException(
                "Gemini nije vratio sažetak."
            );
        }

        return text;
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