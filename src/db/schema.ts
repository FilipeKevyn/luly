export const SCHEMA_VERSION = 1;

export const MIGRATIONS: string[] = [
  `
CREATE TABLE IF NOT EXISTS usuarios (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  nome       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  senha      TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS filmes (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  nome            TEXT NOT NULL,
  ano_publicacao  INTEGER NOT NULL,
  duracao_seg     INTEGER NOT NULL,
  avaliacao_media REAL NOT NULL DEFAULT 0,
  url_video       TEXT NOT NULL,
  url_thumbnail   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS listas (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (usuario_id, nome)
);

CREATE TABLE IF NOT EXISTS lista_filmes (
  lista_id INTEGER NOT NULL REFERENCES listas(id) ON DELETE CASCADE,
  filme_id INTEGER NOT NULL REFERENCES filmes(id) ON DELETE CASCADE,
  added_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (lista_id, filme_id)
);

CREATE TABLE IF NOT EXISTS visualizacoes (
  usuario_id   INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  filme_id     INTEGER NOT NULL REFERENCES filmes(id) ON DELETE CASCADE,
  iniciado_em  TEXT NOT NULL DEFAULT (datetime('now')),
  finalizado   INTEGER NOT NULL DEFAULT 0 CHECK (finalizado IN (0, 1)),
  nota_usuario REAL CHECK (nota_usuario IS NULL OR (nota_usuario >= 0 AND nota_usuario <= 10)),
  PRIMARY KEY (usuario_id, filme_id)
);

CREATE INDEX IF NOT EXISTS idx_listas_usuario      ON listas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_lista_filmes_filme  ON lista_filmes(filme_id);
CREATE INDEX IF NOT EXISTS idx_visualizacoes_filme ON visualizacoes(filme_id);
`,
];
