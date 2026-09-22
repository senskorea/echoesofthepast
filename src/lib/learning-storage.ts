import { z } from "zod";

const answersSchema = z.record(z.record(z.number().int().nonnegative()));

export function readQuizAnswers(): Record<string, Record<number, number>> {
  try {
    const result = answersSchema.safeParse(JSON.parse(localStorage.getItem("eop-quiz-answers") || "{}"));
    return result.success ? result.data : {};
  } catch {
    return {};
  }
}
