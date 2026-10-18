import { getMovieById } from '@/data/movies';

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
  filme_id: number;
  iniciado_em: string;
};

async function ensureFilmeRow(filmeId: number): Promise<void> {
  const movie = getMovieById(filmeId);
  if (!movie) {
    throw new Error('Filme não encontrado no catálogo.');
  }
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR IGNORE INTO filmes (id, nome, ano_publicacao, duracao_seg, avaliacao_media, url_video, url_thumbnail)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    movie.id,
    movie.title,
    movie.year,
    movie.durationMin * 60,
    movie.rating,
    movie.videoUrl,
    movie.poster
  );
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

export async function addFilmeALista(listaId: number, filmeId: number): Promise<void> {
  await ensureFilmeRow(filmeId);
  const db = await getDatabase();
  await db.runAsync('INSERT OR IGNORE INTO lista_filmes (lista_id, filme_id) VALUES (?, ?)', listaId, filmeId);
}

export async function removeFilmeDaLista(listaId: number, filmeId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM lista_filmes WHERE lista_id = ? AND filme_id = ?', listaId, filmeId);
}

export async function listFilmesDaLista(listaId: number): Promise<number[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ filme_id: number }>(
    'SELECT filme_id FROM lista_filmes WHERE lista_id = ? ORDER BY added_at DESC, filme_id ASC',
    listaId
  );
  return rows.map((row) => row.filme_id);
}

export async function listFilmesSalvos(usuarioId: number): Promise<number[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ filme_id: number }>(
    `SELECT lf.filme_id AS filme_id, MAX(lf.added_at) AS ultima
     FROM lista_filmes lf
     JOIN listas l ON l.id = lf.lista_id
     WHERE l.usuario_id = ?
     GROUP BY lf.filme_id
     ORDER BY ultima DESC, lf.filme_id ASC`,
    usuarioId
  );
  return rows.map((row) => row.filme_id);
}

export async function getListasComFilme(usuarioId: number, filmeId: number): Promise<Lista[]> {
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

export async function isFilmeEmAlgumaLista(usuarioId: number, filmeId: number): Promise<boolean> {
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

export async function marcarIniciado(usuarioId: number, filmeId: number): Promise<void> {
  await ensureFilmeRow(filmeId);
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR IGNORE INTO visualizacoes (usuario_id, filme_id) VALUES (?, ?)',
    usuarioId,
    filmeId
  );
}

export async function marcarFinalizado(usuarioId: number, filmeId: number): Promise<void> {
  await ensureFilmeRow(filmeId);
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR IGNORE INTO visualizacoes (usuario_id, filme_id) VALUES (?, ?)',
    usuarioId,
    filmeId
  );
  await db.runAsync(
    'UPDATE visualizacoes SET finalizado = 1 WHERE usuario_id = ? AND filme_id = ?',
    usuarioId,
    filmeId
  );
}

export async function getContinueAssistindo(usuarioId: number): Promise<Visualizacao[]> {
  const db = await getDatabase();
  return db.getAllAsync<Visualizacao>(
    `SELECT filme_id, iniciado_em
     FROM visualizacoes
     WHERE usuario_id = ? AND finalizado = 0
     ORDER BY iniciado_em DESC, rowid DESC`,
    usuarioId
  );
}

export async function avaliarFilme(usuarioId: number, filmeId: number, nota: number): Promise<void> {
  const clamped = Math.min(10, Math.max(0, nota));
  await ensureFilmeRow(filmeId);
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR IGNORE INTO visualizacoes (usuario_id, filme_id) VALUES (?, ?)',
    usuarioId,
    filmeId
  );
  await db.runAsync(
    'UPDATE visualizacoes SET nota_usuario = ? WHERE usuario_id = ? AND filme_id = ?',
    clamped,
    usuarioId,
    filmeId
  );
}
