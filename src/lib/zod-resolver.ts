import { zodResolver } from "@hookform/resolvers/zod";
import type { FieldValues, Resolver } from "react-hook-form";

export function typedZodResolver<TInput extends FieldValues>(
  schema: unknown
): Resolver<TInput> {
  return zodResolver(schema as never) as unknown as Resolver<TInput>;
}