namespace StudyMate.Api.Services;

public interface IEmailService
{
    Task SendLoginNotificationAsync(
        string recipientEmail,
        string? username,
        CancellationToken cancellationToken = default
    );
}