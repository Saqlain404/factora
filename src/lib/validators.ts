import { z } from "zod";

export const gstinSchema = z
  .string()
  .regex(
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
    "Invalid GSTIN (expected 15-character Indian GSTIN format)"
  );

export const businessCodeSchema = z
  .string()
  .trim()
  .min(2, "Code must be at least 2 characters")
  .max(24, "Code is too long")
  .regex(
    /^[A-Z0-9][A-Z0-9._ -]*$/,
    "Use only uppercase letters, numbers, dots, dashes or underscores"
  );

export const nameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(120, "Name is too long");

export const notesSchema = z
  .string()
  .trim()
  .max(1000, "Notes are too long")
  .optional();

export function preprocessOptional(
  schema: z.ZodString,
  { maxLength = 240 }: { maxLength?: number } = {}
) {
  return z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }
    return value;
  }, schema.max(maxLength).optional());
}

export const optionalText = (maxLength = 240) =>
  preprocessOptional(z.string().trim(), { maxLength });

export const preprocessOptionalString = (maxLength = 240) =>
  z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }
    return value;
  }, z.string().max(maxLength).optional());

export const optionalNumber = (opts?: {
  min?: number;
  max?: number;
  precision?: number;
}) => {
  let schema = z.coerce
    .number({ message: "Enter a valid number" })
    .min(opts?.min ?? 0, `Minimum value is ${opts?.min ?? 0}`)
    .max(opts?.max ?? 1000000000, "Value is too large");
  if (opts?.precision !== undefined) {
    schema = schema.refine(
      (value) => Number.isFinite(value) && Math.round(value * 10 ** opts.precision!) === value * 10 ** opts.precision!,
      `Max ${opts.precision} decimal places`
    );
  }
  return z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    schema.optional()
  );
};

export const optionalGstin = preprocessOptional(gstinSchema);

export const optionalEmail = preprocessOptional(z.string().email("Invalid email address"));

export const optionalUuid = z
  .union([z.literal(""), z.null()])
  .optional()
  .or(z.string().uuid("Invalid reference id"))
  .transform((value) => (value ? value : undefined));

export const idSchema = z.string().uuid("Invalid id");