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

    public EmailService(
        IOptions<EmailSettings> settings)
    {
        _settings = settings.Value;
    }

    public async Task SendEmailConfirmationAsync(
        string recipientEmail,
        string? username,
        string confirmationLink,
        CancellationToken cancellationToken = default)
    {
        var safeUsername =
            WebUtility.HtmlEncode(
                username ?? "korisniče"
            );

        var safeConfirmationLink =
            WebUtility.HtmlEncode(
                confirmationLink
            );

        var message = new MimeMessage();

        message.From.Add(
            new MailboxAddress(
                _settings.SenderName,
                _settings.SenderEmail
            )
        );

        message.To.Add(
            MailboxAddress.Parse(
                recipientEmail
            )
        );

        message.Subject =
            "Potvrdi svoj StudyMate račun";

        var body = new BodyBuilder
        {
            HtmlBody = $"""
                <div
                    style="
                        font-family: Arial, sans-serif;
                        max-width: 600px;
                        margin: 0 auto;
                        line-height: 1.6;
                    "
                >
                    <h2>
                        Dobrodošli na StudyMate!
                    </h2>

                    <p>
                        Zdravo {safeUsername},
                    </p>

                    <p>
                        Vaš StudyMate račun je
                        uspješno kreiran.
                    </p>

                    <p>
                        Potvrdite svoju email adresu
                        klikom na dugme ispod.
                    </p>

                    <p style="margin: 30px 0;">
                        <a
                            href="{safeConfirmationLink}"
                            style="
                                display: inline-block;
                                padding: 12px 20px;
                                background-color: #285f4d;
                                color: white;
                                text-decoration: none;
                                border-radius: 6px;
                                font-weight: bold;
                            "
                        >
                            Potvrdi email
                        </a>
                    </p>

                    <p>
                        Ako niste kreirali ovaj račun,
                        možete zanemariti ovu poruku.
                    </p>
                </div>
                """
        };

        message.Body =
            body.ToMessageBody();

        await SendMessageAsync(
            message,
            cancellationToken
        );
    }

    public async Task SendLoginNotificationAsync(
        string recipientEmail,
        string? username,
        CancellationToken cancellationToken = default)
    {
        var safeUsername =
            WebUtility.HtmlEncode(
                username ?? "korisniče"
            );

        var message = new MimeMessage();

        message.From.Add(
            new MailboxAddress(
                _settings.SenderName,
                _settings.SenderEmail
            )
        );

        message.To.Add(
            MailboxAddress.Parse(
                recipientEmail
            )
        );

        message.Subject =
            "Uspješna prijava na StudyMate";

        var body = new BodyBuilder
        {
            HtmlBody = $"""
                <h2>Uspješna prijava</h2>

                <p>
                    Zdravo {safeUsername},
                </p>

                <p>
                    Uspješno ste se prijavili
                    na svoj StudyMate račun.
                </p>

                <p>
                    Vrijeme prijave:
                    {DateTimeOffset.UtcNow:dd.MM.yyyy. HH:mm}
                    UTC
                </p>

                <p>
                    Ako ovo niste bili vi,
                    preporučujemo da promijenite
                    lozinku.
                </p>
                """
        };

        message.Body =
            body.ToMessageBody();

        await SendMessageAsync(
            message,
            cancellationToken
        );
    }

    private async Task SendMessageAsync(
        MimeMessage message,
        CancellationToken cancellationToken)
    {
        using var client =
            new SmtpClient();

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