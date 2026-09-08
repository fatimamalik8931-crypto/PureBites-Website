-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MenuItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "tag" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_MenuItem" ("category", "code", "createdAt", "description", "id", "imageUrl", "isAvailable", "name", "price", "sortOrder", "tag", "updatedAt") SELECT "category", "code", "createdAt", "description", "id", "imageUrl", "isAvailable", "name", "price", "sortOrder", "tag", "updatedAt" FROM "MenuItem";
DROP TABLE "MenuItem";
ALTER TABLE "new_MenuItem" RENAME TO "MenuItem";
CREATE UNIQUE INDEX "MenuItem_code_key" ON "MenuItem"("code");
CREATE INDEX "MenuItem_category_sortOrder_idx" ON "MenuItem"("category", "sortOrder");
CREATE INDEX "MenuItem_isAvailable_sortOrder_idx" ON "MenuItem"("isAvailable", "sortOrder");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
