import { eq, or } from 'drizzle-orm';
import { pathToFileURL } from 'node:url';

import { hashPassword } from '@/services/auth';

import { db } from './client';
import { listItems, lists, movies, syncState, users, viewings } from './schema';

interface SampleMovie {
  title: string;
  originalTitle: string;
  overview: string;
  releaseYear: number;
  runtimeMin: number;
  rating: number;
  posterUrl: string;
  backdropUrl: string;
  genres: string[];
  driveFileId?: string;
}

const poster = (seed: string) => `https://picsum.photos/seed/${seed}/342/513`;
const backdrop = (seed: string) => `https://picsum.photos/seed/${seed}-wide/1280/720`;

const sampleMovies: SampleMovie[] = [
  {
    title: 'Clube da Luta',
    originalTitle: 'Fight Club',
    overview:
      'Um funcionário de escritório insone e um fabricante de sabão carismático formam um clube da luta subterrâneo que evolui para algo muito maior.',
    releaseYear: 1999,
    runtimeMin: 139,
    rating: 8.4,
    posterUrl: poster('clube-da-luta'),
    backdropUrl: backdrop('clube-da-luta'),
    genres: ['Drama', 'Suspense'],
  },
  {
    title: 'Pulp Fiction: Tempo de Violência',
    originalTitle: 'Pulp Fiction',
    overview:
      'As vidas de dois assassinos profissionais, um boxeador, a esposa de um gângster e um casal de assaltantes se entrelaçam em quatro histórias de violência e redenção.',
    releaseYear: 1994,
    runtimeMin: 154,
    rating: 8.9,
    posterUrl: poster('pulp-fiction'),
    backdropUrl: backdrop('pulp-fiction'),
    genres: ['Crime', 'Drama'],
  },
  {
    title: 'Forrest Gump: O Contador de Histórias',
    originalTitle: 'Forrest Gump',
    overview:
      'A história de um homem simples que, sem querer, influencia momentos decisivos da história americana nas décadas de 1950 a 1980.',
    releaseYear: 1994,
    runtimeMin: 142,
    rating: 8.8,
    posterUrl: poster('forrest-gump'),
    backdropUrl: backdrop('forrest-gump'),
    genres: ['Drama', 'Comédia'],
  },
  {
    title: 'Star Wars: Uma Nova Esperança',
    originalTitle: 'Star Wars',
    overview:
      'Luke Skywalker se junta a um cavaleiro Jedi, a uma princesa rebelde e a um contrabandista para resgatar a galáxia do domínio do Império.',
    releaseYear: 1977,
    runtimeMin: 121,
    rating: 8.6,
    posterUrl: poster('star-wars'),
    backdropUrl: backdrop('star-wars'),
    genres: ['Aventura', 'Ficção científica'],
    driveFileId: '1vZDRk35V-NbMKFXvH7ps5SsUKB3xJr48',
  },
];

async function seed() {
  console.log('🌱 Seeding database...');

  const hashedPassword = await hashPassword('test1234');

  const [existingUser] = await db.select().from(users).where(eq(users.email, 'test@luly.app'));

  let userId: string;
  if (existingUser) {
    userId = existingUser.id;
    console.log('ℹ️ User already exists, using existing...');
  } else {
    const [newUser] = await db
      .insert(users)
      .values({ email: 'test@luly.app', passwordHash: hashedPassword, name: 'Usuário Teste' })
      .returning();
    userId = newUser.id;
    console.log('✅ Created test user:', newUser.email);
  }

  const movieIds: string[] = [];
  for (const sample of sampleMovies) {
    const values = {
      ...sample,
      driveUrl: sample.driveFileId
        ? `https://drive.google.com/uc?export=download&id=${sample.driveFileId}`
        : null,
    };

    const [existingMovie] = await db
      .select()
      .from(movies)
      .where(
        sample.driveFileId
          ? or(eq(movies.title, sample.title), eq(movies.driveFileId, sample.driveFileId))
          : eq(movies.title, sample.title),
      )
      .limit(1);

    if (existingMovie) {
      await db
        .update(movies)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(movies.id, existingMovie.id));
      movieIds.push(existingMovie.id);
      console.log(`✅ Movie updated: ${sample.title}`);
      continue;
    }

    const [newMovie] = await db.insert(movies).values(values).returning();
    movieIds.push(newMovie.id);
    console.log(`✅ Movie created: ${sample.title}`);
  }

  const [existingList] = await db.select().from(lists).where(eq(lists.userId, userId));

  let listId: string;
  if (existingList) {
    listId = existingList.id;
    console.log('ℹ️ List already exists, using existing...');
  } else {
    const [newList] = await db
      .insert(lists)
      .values({ userId, name: 'Minha Lista' })
      .returning();
    listId = newList.id;
    console.log('✅ List created');
  }

  for (const movieId of movieIds) {
    await db.insert(listItems).values({ listId, movieId }).onConflictDoNothing();
  }
  console.log(`✅ Ensured ${movieIds.length} movies are in the list`);

  const [firstMovieId] = movieIds;
  if (firstMovieId) {
    await db
      .insert(viewings)
      .values({ userId, movieId: firstMovieId, startedAt: new Date() })
      .onConflictDoNothing();
    console.log('✅ Sample viewing ensured');
  }

  await db
    .insert(syncState)
    .values({ userId, cursor: 'initial' })
    .onConflictDoNothing();
  console.log('✅ Sync state ensured');

  console.log('🎉 Seeding completed!');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seed()
    .then(() => {
      console.log('✅ Seed completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Seed failed:', err);
      process.exit(1);
    });
}

export { seed };
