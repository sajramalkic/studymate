using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using StudyMate.Api.Data;
using StudyMate.Api.Models;
using StudyMate.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

var connectionString =
    builder.Configuration.GetConnectionString("StudyMateConnection")
    ?? throw new InvalidOperationException(
        "Connection string 'StudyMateConnection' nije pronađen."
    );
Console.WriteLine(
    "DATABASE: " + connectionString.Split(';')[0]
);

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString)
);

builder.Services.AddAuthorization();

builder.Services
    .AddIdentityApiEndpoints<ApplicationUser>(options =>
    {
        // Email mora biti jedinstven.
        options.User.RequireUniqueEmail = true;

        // Dozvoljeni znakovi u korisničkom imenu.
        options.User.AllowedUserNameCharacters =
            "abcdefghijklmnopqrstuvwxyz" +
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
            "0123456789._";

        // Pravila za lozinku.
        options.Password.RequiredLength = 8;
        options.Password.RequireDigit = true;
        options.Password.RequireLowercase = true;
        options.Password.RequireUppercase = true;
        options.Password.RequireNonAlphanumeric = false;
    })
    .AddEntityFrameworkStores<ApplicationDbContext>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.Configure<EmailSettings>(
    builder.Configuration.GetSection("EmailSettings")
);

builder.Services.AddScoped<
    IEmailService,
    EmailService
>();

builder.Services.AddScoped<TextExtractionService>();

builder.Services.AddScoped<StudySourceService>();

builder.Services.AddHttpClient<GeminiQuestionService>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddScoped<TextChunkingService>();
builder.Services.AddHttpClient<GeminiSummaryService>();
builder.Services.AddHttpClient<GeminiFlashcardService>();
builder.Services.AddHttpClient<GeminiQuizService>();
builder.Services.AddControllers();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("FrontendPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();