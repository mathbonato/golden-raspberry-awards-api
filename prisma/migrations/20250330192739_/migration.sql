-- CreateTable
CREATE TABLE "Movie" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "year" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "studios" TEXT NOT NULL,
    "producers" TEXT NOT NULL,
    "winner" BOOLEAN NOT NULL DEFAULT false
);
