using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using StudyMate.Api.Models;

namespace StudyMate.Api.Data;

public class ApplicationDbContext
    : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options
    ) : base(options)
    {
    }

    public DbSet<Material> Materials { get; set; }
        = null!;

    public DbSet<MaterialFile> MaterialFiles { get; set; }
        = null!;

    public DbSet<Comment> Comments { get; set; }
        = null!;

    protected override void OnModelCreating(
        ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Comment>()
            .HasOne(comment => comment.Material)
            .WithMany(material => material.Comments)
            .HasForeignKey(comment => comment.MaterialId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Comment>()
            .HasOne(comment => comment.User)
            .WithMany(user => user.Comments)
            .HasForeignKey(comment => comment.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Comment>()
            .HasOne(comment => comment.ParentComment)
            .WithMany(comment => comment.Replies)
            .HasForeignKey(comment => comment.ParentCommentId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<Comment>()
            .HasIndex(comment => comment.MaterialId);

        builder.Entity<Comment>()
            .HasIndex(comment => comment.ParentCommentId);
    }
}