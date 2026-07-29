import { z } from "zod";

export const leadSchema = z.object({
  name: z.string().min(2, "Введите имя (минимум 2 символа)"),
  phone: z
    .string()
    .min(10, "Введите корректный номер телефона")
    .regex(/^[\+\d\s\-\(\)]+$/, "Некорректный формат телефона"),
  telegram: z.string().optional(),
  product: z.string().min(3, "Опишите товар (минимум 3 символа)"),
  quantity: z.string().optional(),
  weight: z.string().optional(),
  country: z.enum(["Казахстан", "Россия", "Оба направления"]),
});

export type LeadFormData = z.infer<typeof leadSchema>;
