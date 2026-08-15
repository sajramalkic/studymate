namespace StudyMate.Api.Services;

public interface IEmailService
{
    Task SendLoginNotificationAsync(
        string recipientEmail,
        string? username,
        CancellationToken cancellationToken = default
    );

    Task SendEmailConfirmationAsync(
        string recipientEmail,
        string? username,
        string confirmationLink,
        CancellationToken cancellationToken = default
    );
}