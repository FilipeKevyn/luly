import { z } from 'zod';

export const CastMemberSchema = z.object({
  name: z.string(),
  role: z.string(),
  avatar: z.string(),
});

export const MovieSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  tagline: z.string(),
  genre: z.string(),
  genres: z.array(z.string()).min(1),
  year: z.number().int(),
  durationMin: z.number().int().positive(),
  rating: z.number().min(0).max(10),
  maturity: z.string(),
  matchPercent: z.number().int().min(0).max(100),
  synopsis: z.string(),
  director: z.string(),
  cast: z.array(CastMemberSchema),
  poster: z.string(),
  hero: z.string(),
  videoUrl: z.string(),
  isOriginal: z.boolean(),
  isNew: z.boolean(),
  featured: z.boolean(),
});

export type CastMember = z.infer<typeof CastMemberSchema>;
export type Movie = z.infer<typeof MovieSchema>;
