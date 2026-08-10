using System.Text.Json.Serialization;

namespace StudyMate.Api.Models;

public class MaterialFile
{
	public int Id { get; set; }

	public string OriginalFileName { get; set; } = string.Empty;

	public string StoredFileName { get; set; } = string.Empty;

	public string ContentType { get; set; } = string.Empty;

	public long FileSize { get; set; }

	public int MaterialId { get; set; }

	[JsonIgnore]
	public Material Material { get; set; } = null!;
}