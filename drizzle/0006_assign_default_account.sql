-- Give every existing account holder a Cash account and put their existing
-- transactions in it, so account_id can become required.
INSERT INTO "accounts" ("user_id", "name", "kind")
SELECT u."id", 'Cash', 'cash' FROM "users" u
WHERE NOT EXISTS (SELECT 1 FROM "accounts" a WHERE a."user_id" = u."id");
--> statement-breakpoint
UPDATE "transactions" t
SET "account_id" = (
  SELECT a."id" FROM "accounts" a WHERE a."user_id" = t."user_id" ORDER BY a."created_at" LIMIT 1
)
WHERE t."account_id" IS NULL;
