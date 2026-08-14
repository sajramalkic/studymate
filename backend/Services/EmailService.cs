using System.Net;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using StudyMate.Api.Models;

namespace StudyMate.Api.Services;

public class EmailService : IEmailService
{
    private readonly EmailSettings _settings;

    public EmailService(IOptions<EmailSettings> settings)
    {
        _settings = settings.Value;
    }

    public async Task SendLoginNotificationAsync(
        string recipientEmail,
        string? username,
        CancellationToken cancellationToken = default)
    {
        var safeUsername =
            WebUtility.HtmlEncode(username ?? "korisniče");

        var message = new MimeMessage();

        message.From.Add(
            new MailboxAddress(
                _settings.SenderName,
                _settings.SenderEmail
            )
        );

        message.To.Add(
            MailboxAddress.Parse(recipientEmail)
        );

        message.Subject =
            "Uspješna prijava na StudyMate";

        var body = new BodyBuilder
        {
            HtmlBody = $"""
                <h2>Uspješna prijava</h2>

                <p>Zdravo {safeUsername},</p>

                <p>
                    Uspješno ste se prijavili na svoj
                    StudyMate račun.
                </p>

                <p>
                    Vrijeme prijave:
                    {DateTimeOffset.UtcNow:dd.MM.yyyy. HH:mm} UTC
                </p>

                <p>
                    Ako ovo niste bili vi, preporučujemo
                    da promijenite lozinku.
                </p>
                """
        };

        message.Body = body.ToMessageBody();

        using var client = new SmtpClient();

        await client.ConnectAsync(
            _settings.SmtpServer,
            _settings.Port,
            SecureSocketOptions.StartTls,
            cancellationToken
        );

        await client.AuthenticateAsync(
            _settings.Username,
            _settings.Password,
            cancellationToken
        );

        await client.SendAsync(
            message,
            cancellationToken
        );

        await client.DisconnectAsync(
            true,
            cancellationToken
        );
    }
}