using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudyMate.Api.Data;
using StudyMate.Api.Dtos;
using StudyMate.Api.Models;
using StudyMate.Api.Services;

namespace StudyMate.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MaterialsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly TextExtractionService _textExtractionService;

    public MaterialsController(
        ApplicationDbContext context,
        IWebHostEnvironment environment,
        UserManager<ApplicationUser> userManager,
        TextExtractionService textExtractionService)
    {
        _context = context;
        _environment = environment;
        _userManager = userManager;
        _textExtractionService = textExtractionService;
    }

    // POST: api/materials/5/files
    [Authorize]
    [HttpPost("{id}/files")]
    public async Task<IActionResult> AddMaterialFiles(
        int id,
        [FromForm] AddMaterialFilesRequest request)
    {
        var currentUser =
            await _userManager.GetUserAsync(User);

        if (currentUser == null)
        {
            return Unauthorized();
        }

        var material = await _context.Materials
            .Include(material => material.Files)
            .FirstOrDefaultAsync(
                material => material.Id == id
            );

        if (material == null)
        {
            return NotFound();
        }

        if (material.UserId != currentUser.Id)
        {
            return Forbid();
        }

        if (request.Files.Count == 0)
        {
            return BadRequest(
                "Odaberi najmanje jedan fajl."
            );
        }

        var allowedExtensions = new[]
        {
        ".pdf",
        ".docx",
        ".txt",
        ".jpg",
        ".jpeg",
        ".png",
        ".webp"
    };

        const long maxFileSize =
            20 * 1024 * 1024;

        foreach (var file in request.Files)
        {
            var extension = Path
                .GetExtension(file.FileName)
                .ToLowerInvariant();

            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest(
                    $"Fajl '{Path.GetFileName(file.FileName)}' nije podržan."
                );
            }

            if (file.Length == 0)
            {
                return BadRequest(
                    $"Fajl '{Path.GetFileName(file.FileName)}' je prazan."
                );
            }

            if (file.Length > maxFileSize)
            {
                return BadRequest(
                    $"Fajl '{Path.GetFileName(file.FileName)}' je veći od 20 MB."
                );
            }
        }

        var uploadsFolder = Path.Combine(
            _environment.ContentRootPath,
            "Uploads"
        );

        Directory.CreateDirectory(uploadsFolder);

        var createdFiles =
            new List<string>();

        try
        {
            foreach (var file in request.Files)
            {
                var extension = Path
                    .GetExtension(file.FileName)
                    .ToLowerInvariant();

                var storedFileName =
                    $"{Guid.NewGuid():N}{extension}";

                var filePath = Path.Combine(
                    uploadsFolder,
                    storedFileName
                );

                await using (
                    var stream = new FileStream(
                        filePath,
                        FileMode.Create
                    )
                )
                {
                    await file.CopyToAsync(stream);
                }

                createdFiles.Add(filePath);

                material.Files.Add(
                    new MaterialFile
                    {
                        OriginalFileName =
                            Path.GetFileName(
                                file.FileName
                            ),

                        StoredFileName =
                            storedFileName,

                        ContentType =
                            file.ContentType,

                        FileSize =
                            file.Length
                    }
                );
            }

            await _context.SaveChangesAsync();
        }
        catch
        {
            foreach (var filePath in createdFiles)
            {
                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                }
            }

            throw;
        }

        return Ok(material);
    }

    // DELETE: api/materials/5/files/2
    [Authorize]
    [HttpDelete("{materialId}/files/{fileId}")]
    public async Task<IActionResult> DeleteMaterialFile(
        int materialId,
        int fileId)
    {
        var currentUser =
            await _userManager.GetUserAsync(User);

        if (currentUser == null)
        {
            return Unauthorized();
        }

        var material = await _context.Materials
            .Include(material => material.Files)
            .FirstOrDefaultAsync(
                material =>
                    material.Id == materialId
            );

        if (material == null)
        {
            return NotFound();
        }

        if (material.UserId != currentUser.Id)
        {
            return Forbid();
        }

        var materialFile =
            material.Files.FirstOrDefault(
                file => file.Id == fileId
            );

        if (materialFile == null)
        {
            return NotFound();
        }

        if (material.Files.Count <= 1)
        {
            return BadRequest(
                "Materijal mora sadržavati najmanje jedan fajl."
            );
        }

        var filePath = Path.Combine(
            _environment.ContentRootPath,
            "Uploads",
            materialFile.StoredFileName
        );

        _context.MaterialFiles.Remove(
            materialFile
        );

        await _context.SaveChangesAsync();

        if (System.IO.File.Exists(filePath))
        {
            System.IO.File.Delete(filePath);
        }

        return NoContent();
    }


    // GET: api/materials
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Material>>> GetMaterials()
    {
        var materials = await _context.Materials
    .Include(material => material.Files)
    .Include(material => material.User)
    .OrderByDescending(material => material.Id)
    .ToListAsync();

        foreach (var material in materials)
        {
            material.UploaderUsername =
                material.User?.UserName ?? "Nepoznat korisnik";
        }

        return Ok(materials);
    }

    // GET: api/materials/5
    [HttpGet("{id}")]
    public async Task<ActionResult<Material>> GetMaterialById(int id)
    {
        var material = await _context.Materials
      .Include(material => material.Files)
      .Include(material => material.User)
      .FirstOrDefaultAsync(
          material => material.Id == id
      );

        if (material == null)
        {
            return NotFound();
        }

        material.UploaderUsername =
            material.User?.UserName ?? "Nepoznat korisnik";

        return Ok(material);
    }

    // GET: api/materials/mine
    [Authorize]
    [HttpGet("mine")]
    public async Task<IActionResult> GetMyMaterials()
    {
        var currentUser =
            await _userManager.GetUserAsync(User);

        if (currentUser == null)
        {
            return Unauthorized();
        }

        var materials = await _context.Materials
            .Where(material =>
                material.UserId == currentUser.Id)
            .Include(material => material.Files)
            .OrderByDescending(material => material.Id)
            .ToListAsync();

        return Ok(materials);
    }

    // POST: api/materials
    [Authorize]
    [HttpPost]
    public async Task<ActionResult<Material>> CreateMaterial(
        [FromForm] CreateMaterialRequest request)
    {
        var currentUser =
            await _userManager.GetUserAsync(User);

        if (currentUser == null)
        {
            return Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest("Naziv materijala je obavezan.");
        }

        if (string.IsNullOrWhiteSpace(request.Subject))
        {
            return BadRequest("Predmet je obavezan.");
        }

        if (string.IsNullOrWhiteSpace(request.Type))
        {
            return BadRequest("Vrsta materijala je obavezna.");
        }

        if (
      request.Pages.HasValue &&
      request.Pages.Value <= 0
  )
        {
            return BadRequest(
                "Broj stranica mora biti pozitivan cijeli broj."
            );
        }

        if (request.Files.Count == 0)
        {
            return BadRequest(
                "Potrebno je odabrati najmanje jedan fajl."
            );
        }

        var allowedExtensions = new[]
        {
            ".pdf",
            ".docx",
            ".txt",
            ".jpg",
            ".jpeg",
            ".png",
            ".webp"
        };

        const long maxFileSize = 20 * 1024 * 1024;

        foreach (var file in request.Files)
        {
            var extension = Path
                .GetExtension(file.FileName)
                .ToLowerInvariant();

            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest(
                    $"Fajl '{Path.GetFileName(file.FileName)}' nije podržan."
                );
            }

            if (file.Length == 0)
            {
                return BadRequest(
                    $"Fajl '{Path.GetFileName(file.FileName)}' je prazan."
                );
            }

            if (file.Length > maxFileSize)
            {
                return BadRequest(
                    $"Fajl '{Path.GetFileName(file.FileName)}' je veći od 20 MB."
                );
            }
        }

        var material = new Material
        {
            Title = request.Title.Trim(),
            Subject = request.Subject.Trim(),
            Type = request.Type.Trim(),

            Author =
                request.Author?.Trim()
                ?? string.Empty,

            Description =
                request.Description?.Trim()
                ?? string.Empty,

            Pages = request.Pages,
            UserId = currentUser.Id
        };

        var uploadsFolder = Path.Combine(
            _environment.ContentRootPath,
            "Uploads"
        );

        Directory.CreateDirectory(uploadsFolder);

        foreach (var file in request.Files)
        {
            var extension = Path
                .GetExtension(file.FileName)
                .ToLowerInvariant();

            var storedFileName =
                $"{Guid.NewGuid():N}{extension}";

            var filePath = Path.Combine(
                uploadsFolder,
                storedFileName
            );

            await using (
                var stream =
                    new FileStream(
                        filePath,
                        FileMode.Create
                    )
            )
            {
                await file.CopyToAsync(stream);
            }

            material.Files.Add(
                new MaterialFile
                {
                    OriginalFileName =
                        Path.GetFileName(
                            file.FileName
                        ),

                    StoredFileName =
                        storedFileName,

                    ContentType =
                        file.ContentType,

                    FileSize =
                        file.Length
                }
            );
        }

        _context.Materials.Add(material);

        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetMaterialById),
            new { id = material.Id },
            material
        );
    }
    // PUT: api/materials/5
    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateMaterial(
        int id,
        [FromBody] UpdateMaterialRequest request)
    {
        var currentUser =
            await _userManager.GetUserAsync(User);

        if (currentUser == null)
        {
            return Unauthorized();
        }

        var material = await _context.Materials
            .Include(material => material.Files)
            .FirstOrDefaultAsync(
                material => material.Id == id
            );

        if (material == null)
        {
            return NotFound();
        }

        if (material.UserId != currentUser.Id)
        {
            return Forbid();
        }

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(
                "Naziv materijala je obavezan."
            );
        }

        if (string.IsNullOrWhiteSpace(request.Subject))
        {
            return BadRequest(
                "Predmet je obavezan."
            );
        }

        if (string.IsNullOrWhiteSpace(request.Type))
        {
            return BadRequest(
                "Vrsta materijala je obavezna."
            );
        }

        if (
        request.Pages.HasValue &&
        request.Pages.Value <= 0
    )
        {
            return BadRequest(
                "Broj stranica mora biti pozitivan cijeli broj."
            );
        }

        var allowedTypes = new[]
        {
        "Knjiga",
        "Skripta",
        "Bilješke"
    };

        if (!allowedTypes.Contains(request.Type))
        {
            return BadRequest(
                "Vrsta materijala nije ispravna."
            );
        }

        material.Title = request.Title.Trim();
        material.Subject = request.Subject.Trim();
        material.Type = request.Type.Trim();
        material.Pages = request.Pages;

        material.Author =
            request.Author?.Trim()
            ?? string.Empty;

        material.Description =
            request.Description?.Trim()
            ?? string.Empty;

        await _context.SaveChangesAsync();

        return Ok(material);
    }

    // DELETE: api/materials/5
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMaterial(int id)
    {
        var currentUser =
            await _userManager.GetUserAsync(User);

        if (currentUser == null)
        {
            return Unauthorized();
        }

        var material = await _context.Materials
            .Include(material => material.Files)
            .FirstOrDefaultAsync(
                material => material.Id == id
            );

        if (material == null)
        {
            return NotFound();
        }

        if (material.UserId != currentUser.Id)
        {
            return Forbid();
        }

        var storedFiles = material.Files
            .Select(file => file.StoredFileName)
            .ToList();

        _context.Materials.Remove(material);

        await _context.SaveChangesAsync();

        foreach (var storedFileName in storedFiles)
        {
            var filePath = Path.Combine(
                _environment.ContentRootPath,
                "Uploads",
                storedFileName
            );

            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }
        }

        return NoContent();
    }

    // GET: api/materials/5/files/2
    [HttpGet("{materialId}/files/{fileId}")]
    public async Task<IActionResult> GetMaterialFile(
        int materialId,
        int fileId)
    {
        var materialFile =
            await _context.MaterialFiles
                .FirstOrDefaultAsync(file =>
                    file.Id == fileId &&
                    file.MaterialId == materialId
                );

        if (materialFile == null)
        {
            return NotFound();
        }

        var filePath = Path.Combine(
            _environment.ContentRootPath,
            "Uploads",
            materialFile.StoredFileName
        );

        if (!System.IO.File.Exists(filePath))
        {
            return NotFound();
        }

        var fileStream =
            System.IO.File.OpenRead(filePath);

        return File(
            fileStream,
            materialFile.ContentType
        );
    }

    // GET: api/materials/5/files/2/download
    [HttpGet("{materialId}/files/{fileId}/download")]
    public async Task<IActionResult> DownloadMaterialFile(
        int materialId,
        int fileId)
    {
        var materialFile =
            await _context.MaterialFiles
                .FirstOrDefaultAsync(file =>
                    file.Id == fileId &&
                    file.MaterialId == materialId
                );

        if (materialFile == null)
        {
            return NotFound();
        }

        var filePath = Path.Combine(
            _environment.ContentRootPath,
            "Uploads",
            materialFile.StoredFileName
        );

        if (!System.IO.File.Exists(filePath))
        {
            return NotFound();
        }

        var fileStream =
            System.IO.File.OpenRead(filePath);

        return File(
            fileStream,
            materialFile.ContentType,
            materialFile.OriginalFileName
        );
    }

    [Authorize]
    [HttpGet("{id}/extracted-text")]
    public async Task<IActionResult>
        GetExtractedText(int id)
    {
        var currentUser =
            await _userManager.GetUserAsync(User);

        if (currentUser == null)
        {
            return Unauthorized();
        }

        var material =
            await _context.Materials
                .Include(
                    material =>
                        material.Files
                )
                .FirstOrDefaultAsync(
                    material =>
                        material.Id == id
                );

        if (material == null)
        {
            return NotFound();
        }

        if (material.UserId != currentUser.Id)
        {
            return Forbid();
        }

        try
        {
            var text =
                await _textExtractionService
                    .ExtractMaterialTextAsync(
                        material
                    );

            if (string.IsNullOrWhiteSpace(text))
            {
                return BadRequest(
                    "Iz ovog materijala nije moguće izdvojiti tekst."
                );
            }

            return Ok(
                new
                {
                    materialId = material.Id,
                    title = material.Title,
                    text
                }
            );
        }
        catch
        {
            return StatusCode(
                500,
                "Došlo je do greške pri čitanju materijala."
            );
        }
    }
    [Authorize]
    [HttpGet(
        "{materialId}/files/{fileId}/pages/{startPage}/{endPage}"
    )]
    public async Task<IActionResult>
        GetPdfPageRange(
            int materialId,
            int fileId,
            int startPage,
            int endPage)
    {
        var currentUser =
            await _userManager.GetUserAsync(User);

        if (currentUser == null)
        {
            return Unauthorized();
        }

        var material =
            await _context.Materials
                .Include(
                    material =>
                        material.Files
                )
                .FirstOrDefaultAsync(
                    material =>
                        material.Id ==
                        materialId
                );

        if (material == null)
        {
            return NotFound(
                "Materijal nije pronađen."
            );
        }

        if (material.UserId != currentUser.Id)
        {
            return Forbid();
        }

        var file =
            material.Files
                .FirstOrDefault(
                    file =>
                        file.Id == fileId
                );

        if (file == null)
        {
            return NotFound(
                "Fajl nije pronađen."
            );
        }

        try
        {
            var pageCount =
                _textExtractionService
                    .GetPdfPageCount(file);

            var text =
                _textExtractionService
                    .ExtractPdfPageRange(
                        file,
                        startPage,
                        endPage
                    );

            if (string.IsNullOrWhiteSpace(text))
            {
                return BadRequest(
                    "Na odabranim stranicama nije pronađen tekst."
                );
            }

            return Ok(
                new
                {
                    materialId,
                    fileId,

                    fileName =
                        file.OriginalFileName,

                    totalPages =
                        pageCount,

                    startPage,
                    endPage,

                    text
                }
            );
        }
        catch (ArgumentException exception)
        {
            return BadRequest(
                exception.Message
            );
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(
                exception.Message
            );
        }
    }
}