import { MovieSchema, type Movie } from '@/data/movies';

import { getDatabase, USUARIO_DEMO_ID } from './client';

export { USUARIO_DEMO_ID };

export type Lista = {
  id: number;
  usuario_id: number;
  nome: string;
  created_at: string;
};

export type ListaComContagem = Lista & {
  total: number;
};

export type Visualizacao = {
  filme: Movie;
  iniciado_em: string;
};

function parseMovie(json: string): Movie | null {
  try {
    const result = MovieSchema.safeParse(JSON.parse(json));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

function parseMovieRows(rows: { dados_json: string }[]): Movie[] {
  return rows
    .map((row) => parseMovie(row.dados_json))
    .filter((movie): movie is Movie => movie !== null);
}

async function salvarFilme(movie: Movie): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO filmes (id, dados_json, atualizado_em)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(id) DO UPDATE SET dados_json = excluded.dados_json, atualizado_em = datetime('now')`,
    movie.id,
    JSON.stringify(movie)
  );
}

export async function getFilmeById(filmeId: string): Promise<Movie | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ dados_json: string }>(
    'SELECT dados_json FROM filmes WHERE id = ?',
    filmeId
  );
  return row ? parseMovie(row.dados_json) : null;
}

export async function listListasComContagem(usuarioId: number): Promise<ListaComContagem[]> {
  const db = await getDatabase();
  return db.getAllAsync<ListaComContagem>(
    `SELECT l.id, l.usuario_id, l.nome, l.created_at, COUNT(lf.filme_id) AS total
     FROM listas l
     LEFT JOIN lista_filmes lf ON lf.lista_id = l.id
     WHERE l.usuario_id = ?
     GROUP BY l.id
     ORDER BY l.created_at ASC, l.id ASC`,
    usuarioId
  );
}

export async function getListaPorId(listaId: number): Promise<Lista | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Lista>(
    'SELECT id, usuario_id, nome, created_at FROM listas WHERE id = ?',
    listaId
  );
}

export async function createLista(usuarioId: number, nome: string): Promise<Lista> {
  const trimmed = nome.trim();
  if (!trimmed) {
    throw new Error('Informe um nome para a lista.');
  }
  const db = await getDatabase();
  await db.runAsync('INSERT OR IGNORE INTO listas (usuario_id, nome) VALUES (?, ?)', usuarioId, trimmed);
  const lista = await db.getFirstAsync<Lista>(
    'SELECT id, usuario_id, nome, created_at FROM listas WHERE usuario_id = ? AND nome = ?',
    usuarioId,
    trimmed
  );
  if (!lista) {
    throw new Error('Não foi possível criar a lista.');
  }
  return lista;
}

export async function deleteLista(listaId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM listas WHERE id = ?', listaId);
}

export async function addFilmeALista(listaId: number, movie: Movie): Promise<void> {
  await salvarFilme(movie);
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR IGNORE INTO lista_filmes (lista_id, filme_id) VALUES (?, ?)',
    listaId,
    movie.id
  );
}

export async function removeFilmeDaLista(listaId: number, filmeId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM lista_filmes WHERE lista_id = ? AND filme_id = ?', listaId, filmeId);
}

export async function listFilmesDaLista(listaId: number): Promise<Movie[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ dados_json: string }>(
    `SELECT f.dados_json
     FROM lista_filmes lf
     JOIN filmes f ON f.id = lf.filme_id
     WHERE lf.lista_id = ?
     ORDER BY lf.added_at DESC, lf.filme_id ASC`,
    listaId
  );
  return parseMovieRows(rows);
}

export async function listFilmesSalvos(usuarioId: number): Promise<Movie[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ dados_json: string }>(
    `SELECT f.dados_json, MAX(lf.added_at) AS ultima
     FROM lista_filmes lf
     JOIN listas l ON l.id = lf.lista_id
     JOIN filmes f ON f.id = lf.filme_id
     WHERE l.usuario_id = ?
     GROUP BY lf.filme_id
     ORDER BY ultima DESC, lf.filme_id ASC`,
    usuarioId
  );
  return parseMovieRows(rows);
}

export async function getListasComFilme(usuarioId: number, filmeId: string): Promise<Lista[]> {
  const db = await getDatabase();
  return db.getAllAsync<Lista>(
    `SELECT l.id, l.usuario_id, l.nome, l.created_at
     FROM listas l
     JOIN lista_filmes lf ON lf.lista_id = l.id
     WHERE l.usuario_id = ? AND lf.filme_id = ?
     ORDER BY l.created_at ASC, l.id ASC`,
    usuarioId,
    filmeId
  );
}

export async function isFilmeEmAlgumaLista(usuarioId: number, filmeId: string): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ existe: number }>(
    `SELECT EXISTS(
       SELECT 1
       FROM lista_filmes lf
       JOIN listas l ON l.id = lf.lista_id
       WHERE l.usuario_id = ? AND lf.filme_id = ?
     ) AS existe`,
    usuarioId,
    filmeId
  );
  return (row?.existe ?? 0) === 1;
}

export async function marcarIniciado(usuarioId: number, movie: Movie): Promise<void> {
  await salvarFilme(movie);
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR IGNORE INTO visualizacoes (usuario_id, filme_id) VALUES (?, ?)',
    usuarioId,
    movie.id
  );
}

export async function marcarFinalizado(usuarioId: number, movie: Movie): Promise<void> {
  await salvarFilme(movie);
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR IGNORE INTO visualizacoes (usuario_id, filme_id) VALUES (?, ?)',
    usuarioId,
    movie.id
  );
  await db.runAsync(
    'UPDATE visualizacoes SET finalizado = 1 WHERE usuario_id = ? AND filme_id = ?',
    usuarioId,
    movie.id
  );
}

export async function getContinueAssistindo(usuarioId: number): Promise<Visualizacao[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ dados_json: string; iniciado_em: string }>(
    `SELECT f.dados_json, v.iniciado_em
     FROM visualizacoes v
     JOIN filmes f ON f.id = v.filme_id
     WHERE v.usuario_id = ? AND v.finalizado = 0
     ORDER BY v.iniciado_em DESC, v.rowid DESC`,
    usuarioId
  );
  return rows.flatMap((row) => {
    const filme = parseMovie(row.dados_json);
    return filme ? [{ filme, iniciado_em: row.iniciado_em }] : [];
  });
}

export async function avaliarFilme(usuarioId: number, movie: Movie, nota: number): Promise<void> {
  const clamped = Math.min(10, Math.max(0, nota));
  await salvarFilme(movie);
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR IGNORE INTO visualizacoes (usuario_id, filme_id) VALUES (?, ?)',
    usuarioId,
    movie.id
  );
  await db.runAsync(
    'UPDATE visualizacoes SET nota_usuario = ? WHERE usuario_id = ? AND filme_id = ?',
    clamped,
    usuarioId,
    movie.id
  );
}
