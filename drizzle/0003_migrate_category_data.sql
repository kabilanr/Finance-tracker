-- Seed default categories for existing accounts.
INSERT INTO "categories" ("user_id", "type", "name", "color")
SELECT u."id", d."type"::"transaction_type", d."name", d."color"
FROM "users" u
CROSS JOIN (VALUES
  ('expense', 'Food', '#f97316'),
  ('expense', 'Rent', '#6366f1'),
  ('expense', 'Transport', '#0ea5e9'),
  ('expense', 'Bills', '#eab308'),
  ('expense', 'Shopping', '#ec4899'),
  ('expense', 'Health', '#ef4444'),
  ('expense', 'Entertainment', '#a855f7'),
  ('expense', 'Other', '#64748b'),
  ('income', 'Salary', '#10b981'),
  ('income', 'Business', '#84cc16'),
  ('income', 'Gifts', '#ec4899'),
  ('income', 'Other', '#64748b')
) AS d("type", "name", "color")
ON CONFLICT DO NOTHING;
--> statement-breakpoint
-- Turn free-text categories already used on transactions into real categories.
INSERT INTO "categories" ("user_id", "type", "name", "color")
SELECT DISTINCT ON (t."user_id", t."type", lower(trim(t."category")))
  t."user_id", t."type", trim(t."category"), '#64748b'
FROM "transactions" t
WHERE t."category" IS NOT NULL AND trim(t."category") <> ''
ON CONFLICT DO NOTHING;
--> statement-breakpoint
UPDATE "transactions" t
SET "category_id" = c."id"
FROM "categories" c
WHERE c."user_id" = t."user_id"
  AND c."type" = t."type"
  AND lower(c."name") = lower(trim(t."category"));
