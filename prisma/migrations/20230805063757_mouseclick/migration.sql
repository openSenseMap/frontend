-- CreateTable
CREATE TABLE "MouseClick" (
    "id" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "page" TEXT NOT NULL,
    "viewportWidth" INTEGER NOT NULL,
    "viewportHeight" INTEGER NOT NULL,

    CONSTRAINT "MouseClick_pkey" PRIMARY KEY ("id")
);
