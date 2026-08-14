namespace StudyMate.Api.Dtos;

public class AddMaterialFilesRequest
{
    public List<IFormFile> Files { get; set; } = new();
}