using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudyMate.Api.Data;
using StudyMate.Api.Dtos;
using StudyMate.Api.Models;

namespace StudyMate.Api.Controllers;

[ApiController]
[Route("api")]
public class CommentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public CommentsController(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    // GET: api/materials/5/comments
    [AllowAnonymous]
    [HttpGet("materials/{materialId:int}/comments")]
    public async Task<
        ActionResult<IEnumerable<CommentResponse>>>
        GetComments(int materialId)
    {
        var materialExists =
            await _context.Materials.AnyAsync(
                material => material.Id == materialId
            );

        if (!materialExists)
        {
            return NotFound(new
            {
                message = "Materijal nije pronađen."
            });
        }

        var currentUserId =
            User.Identity?.IsAuthenticated == true
                ? _userManager.GetUserId(User)
                : null;

        var comments =
            await _context.Comments
                .AsNoTracking()
                .Include(comment => comment.User)
                .Where(comment =>
                    comment.MaterialId == materialId)
                .OrderBy(comment => comment.CreatedAt)
                .ToListAsync();

        var responses =
            comments.ToDictionary(
                comment => comment.Id,
                comment => MapComment(
                    comment,
                    currentUserId
                )
            );

        var rootComments =
            new List<CommentResponse>();

        foreach (var comment in comments)
        {
            var response = responses[comment.Id];

            if (comment.ParentCommentId.HasValue &&
    responses.TryGetValue(
        comment.ParentCommentId.Value,
        out var parentResponse))
            {
                response.ReplyToUsername =
                    parentResponse.Username;

                parentResponse.Replies.Add(response);
            }
            else
            {
                rootComments.Add(response);
            }
        }

        return Ok(rootComments);
    }

    // POST: api/materials/5/comments
    [Authorize]
    [HttpPost("materials/{materialId:int}/comments")]
    public async Task<ActionResult<CommentResponse>>
        CreateComment(
            int materialId,
            CommentRequest request)
    {
        var user =
            await _userManager.GetUserAsync(User);

        if (user == null)
        {
            return Unauthorized(new
            {
                message =
                    "Moraš biti prijavljena da bi objavila komentar."
            });
        }

        var materialExists =
            await _context.Materials.AnyAsync(
                material => material.Id == materialId
            );

        if (!materialExists)
        {
            return NotFound(new
            {
                message = "Materijal nije pronađen."
            });
        }



        var content = request.Content.Trim();

        var validationResult =
            ValidateContent(content);

        if (validationResult != null)
        {
            return BadRequest(new
            {
                message = validationResult
            });
        }

        if (request.ParentCommentId.HasValue)
        {
            var parentComment =
                await _context.Comments
                    .AsNoTracking()
                    .FirstOrDefaultAsync(comment =>
                        comment.Id ==
                        request.ParentCommentId.Value
                    );

            if (parentComment == null)
            {
                return NotFound(new
                {
                    message =
                        "Komentar na koji odgovaraš nije pronađen."
                });
            }

            if (parentComment.MaterialId != materialId)
            {
                return BadRequest(new
                {
                    message =
                        "Odgovor mora pripadati istom materijalu."
                });
            }

            if (parentComment.IsDeleted)
            {
                return BadRequest(new
                {
                    message =
                        "Nije moguće odgovoriti na obrisani komentar."
                });
            }
        }

        var comment = new Comment
        {
            Content = content,
            MaterialId = materialId,
            UserId = user.Id,
            User = user,
            ParentCommentId =
                request.ParentCommentId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Comments.Add(comment);

        await _context.SaveChangesAsync();

        return Ok(
            MapComment(comment, user.Id)
        );
    }

    // PUT: api/comments/3
    [Authorize]
    [HttpPut("comments/{commentId:int}")]
    public async Task<ActionResult<CommentResponse>>
        UpdateComment(
            int commentId,
            CommentRequest request)
    {
        var user =
            await _userManager.GetUserAsync(User);

        if (user == null)
        {
            return Unauthorized();
        }

        var comment =
            await _context.Comments
                .Include(existing => existing.User)
                .FirstOrDefaultAsync(existing =>
                    existing.Id == commentId);

        if (comment == null)
        {
            return NotFound(new
            {
                message = "Komentar nije pronađen."
            });
        }
        if (comment.IsDeleted)
        {
            return BadRequest(new
            {
                message =
                    "Obrisani komentar nije moguće urediti."
            });
        }

        if (comment.UserId != user.Id)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    message =
                        "Možeš urediti samo svoj komentar."
                }
            );
        }

        var content = request.Content.Trim();

        var validationResult =
            ValidateContent(content);

        if (validationResult != null)
        {
            return BadRequest(new
            {
                message = validationResult
            });
        }

        comment.Content = content;
        comment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(
            MapComment(comment, user.Id)
        );
    }

    // DELETE: api/comments/3
    [Authorize]
    [HttpDelete("comments/{commentId:int}")]
    public async Task<IActionResult>
        DeleteComment(int commentId)
    {
        var user =
            await _userManager.GetUserAsync(User);

        if (user == null)
        {
            return Unauthorized(new
            {
                message =
                    "Moraš biti prijavljena da bi obrisala komentar."
            });
        }

        var comment =
            await _context.Comments
                .FirstOrDefaultAsync(existing =>
                    existing.Id == commentId);

        if (comment == null)
        {
            return NotFound(new
            {
                message = "Komentar nije pronađen."
            });
        }

        if (comment.UserId != user.Id)
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    message =
                        "Možeš obrisati samo svoj komentar."
                }
            );
        }

        if (comment.IsDeleted)
        {
            return BadRequest(new
            {
                message = "Komentar je već obrisan."
            });
        }

        comment.IsDeleted = true;
        comment.DeletedAt = DateTime.UtcNow;
        comment.Content = string.Empty;
        comment.UpdatedAt = null;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    private static string? ValidateContent(
        string content)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            return "Komentar ne može biti prazan.";
        }

        if (content.Length > 1000)
        {
            return
                "Komentar može imati najviše 1000 znakova.";
        }

        return null;
    }

    private static CommentResponse MapComment(
        Comment comment,
        string? currentUserId)
    {
        return new CommentResponse
        {
            Id = comment.Id,

            Content = comment.IsDeleted
                ? "Komentar je obrisan."
                : comment.Content,

            CreatedAt = comment.CreatedAt,
            UpdatedAt = comment.UpdatedAt,

            Username =
                comment.User.UserName ?? "Korisnik",

            CanModify =
                !comment.IsDeleted &&
                currentUserId == comment.UserId,

            IsDeleted = comment.IsDeleted,

            ParentCommentId =
                comment.ParentCommentId,

            Replies =
                new List<CommentResponse>()
        };
    }
}