import * as z from "zod";

export const TransactionSchema = z.object({
  type: z.enum(["income", "expense"], { error: "Choose income or expense." }),
  amount: z
    .string({ error: "Enter an amount." })
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, { error: "Enter a number with at most two decimal places." })
    .transform(Number)
    .refine((n) => n > 0, { error: "Amount must be more than zero." })
    .refine((n) => n < 1_000_000_000_000, { error: "Amount is too large." }),
  date: z.iso.date({ error: "Pick a valid date." }),
  description: z.string().trim().min(1, { error: "Add a short description." }).max(200),
  categoryId: z.uuid({ error: "Pick a category from the list." }).optional(),
  note: z.string().trim().max(1000).optional(),
});

export type TransactionFormState =
  | {
      errors?: Partial<Record<keyof z.infer<typeof TransactionSchema>, string[]>>;
      message?: string;
      values?: Record<string, string>;
    }
  | undefined;

export const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
