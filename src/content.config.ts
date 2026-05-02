import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const ingredient = z.object({
  qty: z.number().nullable(),
  unit: z.string().nullable(),
  item: z.string(),
  note: z.string().optional(),
});

const source = z.object({
  title: z.string(),
  url: z.string().url(),
});

const recipes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/recipes' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    image: z.string().optional(),
    servings: z.number().int().positive(),
    prepTime: z.string().optional(),
    cookTime: z.string().optional(),
    cuisine: z.string().optional(),
    mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'drink', 'side', 'sauce']).optional(),
    tags: z.array(z.string()).default([]),
    sources: z.array(source).optional(),
    ingredients: z.array(ingredient).min(1),
    instructions: z.array(z.string().min(1)).min(1),
    createdAt: z.coerce.date(),
  }),
});

export const collections = { recipes };
