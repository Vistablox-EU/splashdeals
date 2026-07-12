-- CreateTable: CartSession (sales schema)
CREATE TABLE "sales"."cart_session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sales"."cart_session_userId_idx" ON "sales"."cart_session"("userId");

-- AddForeignKey
ALTER TABLE "sales"."cart_session" ADD CONSTRAINT "cart_session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "admin"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
