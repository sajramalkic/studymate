using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StudyMate.Api.Migrations
{
    public partial class RepairCommentSoftDeleteColumns
        : Migration
    {
        protected override void Up(
            MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE "Comments"
                ADD COLUMN IF NOT EXISTS "DeletedAt"
                timestamp with time zone NULL;
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE "Comments"
                ADD COLUMN IF NOT EXISTS "IsDeleted"
                boolean NOT NULL DEFAULT FALSE;
                """
            );
        }

        protected override void Down(
            MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE "Comments"
                DROP COLUMN IF EXISTS "DeletedAt";
                """
            );

            migrationBuilder.Sql(
                """
                ALTER TABLE "Comments"
                DROP COLUMN IF EXISTS "IsDeleted";
                """
            );
        }
    }
}