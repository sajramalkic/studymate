using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using StudyMate.Api.Dtos;
using StudyMate.Api.Models;
using StudyMate.Api.Services;

namespace StudyMate.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IEmailService _emailService;
    private readonly ILogger<AuthController> _logger;
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
        var username = request.Username.Trim();
        var email = request.Email.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(username))
        {
            return BadRequest(new
            {
                message = "Korisničko ime je obavezno."
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
                message = "Email je obavezan."
            });
        }

        var emailValidator = new EmailAddressAttribute();

        if (!emailValidator.IsValid(email))
        {
            return BadRequest(new
            {
                message = "Unesi ispravan email."
            });
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new
            {
                message = "Lozinka je obavezna."
            });
        }

        var existingUsername =
            await _userManager.FindByNameAsync(username);

        if (existingUsername != null)
        {
            return Conflict(new
            {
                message =
                    "Ovo korisničko ime je već zauzeto."
            });
        }

        var existingEmail =
            await _userManager.FindByEmailAsync(email);

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
            Email = email
        };

        var result =
            await _userManager.CreateAsync(
                user,
                request.Password
            );

        if (!result.Succeeded)
        {
            var errors = result.Errors
                .Select(error => TranslateIdentityError(error.Code))
                .Distinct()
                .ToArray();

            return BadRequest(new
            {
                errors
            });
        }

        return Ok(new
        {
            message = "Registracija je uspješna."
        });
    }

    // POST: api/auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login(
        LoginRequest request)
    {
        var email =
            request.Email.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new
            {
                message = "Unesi email i lozinku."
            });
        }

        var user =
            await _userManager.FindByEmailAsync(email);

        if (user == null)
        {
            return Unauthorized(new
            {
                message =
                    "Email ili lozinka nisu ispravni."
            });
        }

        var result =
            await _signInManager.PasswordSignInAsync(
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
        if (!string.IsNullOrWhiteSpace(user.Email))
        {
            try
            {
                await _emailService
                    .SendLoginNotificationAsync(
                        user.Email,
                        user.UserName,
                        HttpContext.RequestAborted
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
            username = user.UserName,
            email = user.Email
        });
    }

    // GET: api/auth/me
    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var user =
            await _userManager.GetUserAsync(User);

        if (user == null)
        {
            return Unauthorized();
        }

        return Ok(new
        {
            username = user.UserName,
            email = user.Email
        });
    }

    // POST: api/auth/logout
    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await _signInManager.SignOutAsync();

        return Ok(new
        {
            message = "Odjava je uspješna."
        });
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