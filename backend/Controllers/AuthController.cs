using System.ComponentModel.DataAnnotations;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using StudyMate.Api.Dtos;
using StudyMate.Api.Models;
using StudyMate.Api.Services;

namespace StudyMate.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser>
        _userManager;

    private readonly SignInManager<ApplicationUser>
        _signInManager;

    private readonly IEmailService
        _emailService;

    private readonly ILogger<AuthController>
        _logger;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IEmailService emailService,
        ILogger<AuthController> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _emailService = emailService;
        _logger = logger;
    }

    // POST: api/auth/register
    [HttpPost("register")]
    public async Task<IActionResult> Register(
        RegisterRequest request)
    {
        var username =
            request.Username?.Trim() ?? "";

        var email =
            request.Email?
                .Trim()
                .ToLowerInvariant()
            ?? "";

        if (string.IsNullOrWhiteSpace(username))
        {
            return BadRequest(new
            {
                message =
                    "Korisničko ime je obavezno."
            });
        }

        if (!Regex.IsMatch(
                username,
                @"^[A-Za-z0-9._]{3,30}$"))
        {
            return BadRequest(new
            {
                message =
                    "Korisničko ime mora imati između 3 i 30 znakova " +
                    "i može sadržavati samo slova, brojeve, tačku i donju crtu."
            });
        }

        if (string.IsNullOrWhiteSpace(email))
        {
            return BadRequest(new
            {
                message =
                    "Email je obavezan."
            });
        }

        var emailValidator =
            new EmailAddressAttribute();

        if (!emailValidator.IsValid(email))
        {
            return BadRequest(new
            {
                message =
                    "Unesi ispravan email."
            });
        }

        if (string.IsNullOrWhiteSpace(
                request.Password))
        {
            return BadRequest(new
            {
                message =
                    "Lozinka je obavezna."
            });
        }

        var existingUsername =
            await _userManager
                .FindByNameAsync(username);

        if (existingUsername != null)
        {
            return Conflict(new
            {
                message =
                    "Ovo korisničko ime je već zauzeto."
            });
        }

        var existingEmail =
            await _userManager
                .FindByEmailAsync(email);

        if (existingEmail != null)
        {
            return Conflict(new
            {
                message =
                    "Račun sa ovim emailom već postoji."
            });
        }

        var user = new ApplicationUser
        {
            UserName = username,
            Email = email,

            EmailConfirmed = false
        };

        var result =
            await _userManager.CreateAsync(
                user,
                request.Password
            );

        if (!result.Succeeded)
        {
            var errors =
                result.Errors
                    .Select(
                        error =>
                            TranslateIdentityError(
                                error.Code
                            )
                    )
                    .Distinct()
                    .ToArray();

            return BadRequest(new
            {
                errors
            });
        }

        try
        {
            await SendConfirmationEmailAsync(
                user,
                HttpContext.RequestAborted
            );
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                "Nije moguće poslati email potvrde za korisnika {UserId}.",
                user.Id
            );

            return StatusCode(
                StatusCodes
                    .Status500InternalServerError,
                new
                {
                    message =
                        "Račun je kreiran, ali email za potvrdu nije moguće poslati. Pokušaj ponovo poslati potvrdu."
                }
            );
        }

        return Ok(new
        {
            message =
                "Registracija je uspješna. Provjeri svoj email i potvrdi račun prije prijave."
        });
    }

    // GET: api/auth/confirm-email
    [HttpGet("confirm-email")]
    public async Task<IActionResult> ConfirmEmail(
        [FromQuery] string userId,
        [FromQuery] string token)
    {
        if (
            string.IsNullOrWhiteSpace(userId) ||
            string.IsNullOrWhiteSpace(token)
        )
        {
            return BadRequest(
                "Link za potvrdu nije ispravan."
            );
        }

        var user =
            await _userManager
                .FindByIdAsync(userId);

        if (user == null)
        {
            return BadRequest(
                "Korisnik nije pronađen."
            );
        }

        if (user.EmailConfirmed)
        {
            return Content(
                CreateConfirmationPage(
                    "Email je već potvrđen.",
                    true
                ),
                "text/html"
            );
        }

        string decodedToken;

        try
        {
            var tokenBytes =
                WebEncoders
                    .Base64UrlDecode(token);

            decodedToken =
                Encoding.UTF8
                    .GetString(tokenBytes);
        }
        catch
        {
            return Content(
                CreateConfirmationPage(
                    "Link za potvrdu nije ispravan.",
                    false
                ),
                "text/html"
            );
        }

        var result =
            await _userManager
                .ConfirmEmailAsync(
                    user,
                    decodedToken
                );

        if (!result.Succeeded)
        {
            return Content(
                CreateConfirmationPage(
                    "Potvrda emaila nije uspjela. Link je možda istekao ili nije ispravan.",
                    false
                ),
                "text/html"
            );
        }

        return Content(
            CreateConfirmationPage(
                "Email je uspješno potvrđen. Sada se možeš prijaviti na StudyMate.",
                true
            ),
            "text/html"
        );
    }

    // POST: api/auth/resend-confirmation
    [HttpPost("resend-confirmation")]
    public async Task<IActionResult>
        ResendConfirmation(
            ResendConfirmationRequest request)
    {
        var email =
            request.Email?
                .Trim()
                .ToLowerInvariant()
            ?? "";

        if (string.IsNullOrWhiteSpace(email))
        {
            return BadRequest(new
            {
                message =
                    "Email je obavezan."
            });
        }

        var user =
            await _userManager
                .FindByEmailAsync(email);

        /*
         * Ne otkrivamo da li račun
         * postoji zbog sigurnosti.
         */
        if (user == null)
        {
            return Ok(new
            {
                message =
                    "Ako račun postoji, email za potvrdu je poslan."
            });
        }

        if (user.EmailConfirmed)
        {
            return Ok(new
            {
                message =
                    "Ovaj email je već potvrđen."
            });
        }

        try
        {
            await SendConfirmationEmailAsync(
                user,
                HttpContext.RequestAborted
            );
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                "Nije moguće ponovo poslati email potvrde za korisnika {UserId}.",
                user.Id
            );

            return StatusCode(
                StatusCodes
                    .Status500InternalServerError,
                new
                {
                    message =
                        "Email za potvrdu trenutno nije moguće poslati."
                }
            );
        }

        return Ok(new
        {
            message =
                "Email za potvrdu je ponovo poslan."
        });
    }

    // POST: api/auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login(
        LoginRequest request)
    {
        var email =
            request.Email?
                .Trim()
                .ToLowerInvariant()
            ?? "";

        if (
            string.IsNullOrWhiteSpace(email) ||
            string.IsNullOrWhiteSpace(
                request.Password
            )
        )
        {
            return BadRequest(new
            {
                message =
                    "Unesi email i lozinku."
            });
        }

        var user =
            await _userManager
                .FindByEmailAsync(email);

        if (user == null)
        {
            return Unauthorized(new
            {
                message =
                    "Email ili lozinka nisu ispravni."
            });
        }

        /*
         * NOVO:
         * korisnik se ne smije prijaviti
         * dok ne potvrdi email.
         */
        if (!user.EmailConfirmed)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    message =
                        "Email adresa nije potvrđena. Provjeri svoj email."
                }
            );
        }

        var result =
            await _signInManager
                .PasswordSignInAsync(
                    user,
                    request.Password,
                    isPersistent: false,
                    lockoutOnFailure: false
                );

        if (!result.Succeeded)
        {
            return Unauthorized(new
            {
                message =
                    "Email ili lozinka nisu ispravni."
            });
        }

        /*
         * Postojeća email obavijest
         * o uspješnom loginu ostaje.
         */
        if (!string.IsNullOrWhiteSpace(
                user.Email))
        {
            try
            {
                await _emailService
                    .SendLoginNotificationAsync(
                        user.Email,
                        user.UserName,
                        HttpContext
                            .RequestAborted
                    );
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    "Nije poslana obavijest o prijavi za korisnika {UserId}.",
                    user.Id
                );
            }
        }

        return Ok(new
        {
            username =
                user.UserName,

            email =
                user.Email,

            emailConfirmed =
                user.EmailConfirmed
        });
    }

    // GET: api/auth/me
    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var user =
            await _userManager
                .GetUserAsync(User);

        if (user == null)
        {
            return Unauthorized();
        }

        return Ok(new
        {
            username =
                user.UserName,

            email =
                user.Email,

            emailConfirmed =
                user.EmailConfirmed
        });
    }

    // POST: api/auth/logout
    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await _signInManager
            .SignOutAsync();

        return Ok(new
        {
            message =
                "Odjava je uspješna."
        });
    }

    private async Task
        SendConfirmationEmailAsync(
            ApplicationUser user,
            CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(
                user.Email))
        {
            throw new InvalidOperationException(
                "Korisnik nema email adresu."
            );
        }

        var token =
            await _userManager
                .GenerateEmailConfirmationTokenAsync(
                    user
                );

        var encodedToken =
            WebEncoders.Base64UrlEncode(
                Encoding.UTF8
                    .GetBytes(token)
            );

        var confirmationLink =
            $"{Request.Scheme}://" +
            $"{Request.Host}" +
            "/api/auth/confirm-email" +
            $"?userId={Uri.EscapeDataString(user.Id)}" +
            $"&token={Uri.EscapeDataString(encodedToken)}";

        await _emailService
            .SendEmailConfirmationAsync(
                user.Email,
                user.UserName,
                confirmationLink,
                cancellationToken
            );
    }

    private static string CreateConfirmationPage(
        string message,
        bool success)
    {
        var title =
            success
                ? "Email potvrđen"
                : "Potvrda nije uspjela";

        var symbol =
            success
                ? "✓"
                : "!";

        return $"""
            <!DOCTYPE html>
            <html lang="bs">
            <head>
                <meta charset="UTF-8" />

                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                />

                <title>{title}</title>
            </head>

            <body
                style="
                    font-family: Arial, sans-serif;
                    background: #f7f7f5;
                    margin: 0;
                    padding: 40px 20px;
                "
            >
                <div
                    style="
                        max-width: 520px;
                        margin: 80px auto;
                        background: white;
                        padding: 40px;
                        border-radius: 12px;
                        text-align: center;
                    "
                >
                    <div
                        style="
                            font-size: 42px;
                            margin-bottom: 20px;
                        "
                    >
                        {symbol}
                    </div>

                    <h1>
                        {title}
                    </h1>

                    <p
                        style="
                            line-height: 1.6;
                            color: #555;
                        "
                    >
                        {message}
                    </p>

                    <a
                        href="http://localhost:5173"
                        style="
                            display: inline-block;
                            margin-top: 20px;
                            padding: 12px 20px;
                            background: #285f4d;
                            color: white;
                            text-decoration: none;
                            border-radius: 6px;
                        "
                    >
                        Otvori StudyMate
                    </a>
                </div>
            </body>
            </html>
            """;
    }

    private static string TranslateIdentityError(
        string code)
    {
        return code switch
        {
            "PasswordTooShort" =>
                "Lozinka mora imati najmanje 8 znakova.",

            "PasswordRequiresDigit" =>
                "Lozinka mora sadržavati najmanje jedan broj.",

            "PasswordRequiresLower" =>
                "Lozinka mora sadržavati najmanje jedno malo slovo.",

            "PasswordRequiresUpper" =>
                "Lozinka mora sadržavati najmanje jedno veliko slovo.",

            "DuplicateUserName" =>
                "Ovo korisničko ime je već zauzeto.",

            "DuplicateEmail" =>
                "Račun sa ovim emailom već postoji.",

            "InvalidEmail" =>
                "Unesi ispravan email.",

            "InvalidUserName" =>
                "Korisničko ime nije ispravno.",

            _ =>
                "Registracija nije uspjela."
        };
    }
}