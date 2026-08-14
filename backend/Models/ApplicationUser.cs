using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Identity;

namespace StudyMate.Api.Models;

public class ApplicationUser : IdentityUser
{
    [JsonIgnore]
    public ICollection<Comment> Comments { get; set; }
        = new List<Comment>();
}