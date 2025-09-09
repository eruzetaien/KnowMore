using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Fact.Migrations
{
    /// <inheritdoc />
    public partial class AddSharedFactTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SharedFacts",
                columns: table => new
                {
                    FactId = table.Column<long>(type: "bigint", nullable: false),
                    UserId = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SharedFacts", x => new { x.FactId, x.UserId });
                    table.ForeignKey(
                        name: "FK_SharedFacts_Facts_FactId",
                        column: x => x.FactId,
                        principalTable: "Facts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SharedFacts");
        }
    }
}
