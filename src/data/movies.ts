import { z } from 'zod';

export const CastMemberSchema = z.object({
  name: z.string(),
  role: z.string(),
  avatar: z.string(),
});

export const MovieSchema = z.object({
  id: z.number().int().positive(),
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
  cast: z.array(CastMemberSchema).min(1),
  poster: z.string(),
  hero: z.string(),
  videoUrl: z.string(),
  isOriginal: z.boolean(),
  isNew: z.boolean(),
  featured: z.boolean(),
});

export type CastMember = z.infer<typeof CastMemberSchema>;
export type Movie = z.infer<typeof MovieSchema>;

const poster = (slug: string) => `https://picsum.photos/seed/${slug}-poster/600/900`;
const hero = (slug: string) => `https://picsum.photos/seed/${slug}-hero/1200/675`;
const avatar = (slug: string) => `https://picsum.photos/seed/${slug}-avatar/300/300`;
const video = (name: string) =>
  `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/${name}.mp4`;

const rawMovies = [
  {
    id: 1,
    title: 'Depois de Marte',
    tagline: 'A travessia',
    genre: 'Ficção científica',
    genres: ['Ficção científica', 'Ação', 'Aventura'],
    year: 2026,
    durationMin: 131,
    rating: 9.1,
    maturity: '14',
    matchPercent: 98,
    synopsis:
      'Após sete anos em Marte, a comandante Lia recebe um sinal impossível vindo da Terra. Para voltar, ela terá de escolher entre a missão que definiu sua vida e as pessoas que ainda lembra dela.',
    director: 'Julia Rezende',
    cast: [
      { name: 'Alice Braga', role: 'Lia', avatar: avatar('alice-braga') },
      { name: 'Seu Jorge', role: 'Tomás', avatar: avatar('seu-jorge') },
      { name: 'Bárbara Paz', role: 'Dra. Maia', avatar: avatar('barbara-paz') },
      { name: 'Gabriel Leone', role: 'Noah', avatar: avatar('gabriel-leone') },
    ],
    poster: poster('depois-de-marte'),
    hero: hero('depois-de-marte'),
    videoUrl: video('BigBuckBunny'),
    isOriginal: true,
    isNew: true,
    featured: true,
  },
  {
    id: 2,
    title: 'Maré Alta',
    tagline: 'O mar devolve o que a gente esquece',
    genre: 'Drama',
    genres: ['Drama', 'Aventura'],
    year: 2025,
    durationMin: 112,
    rating: 8.4,
    maturity: '12',
    matchPercent: 91,
    synopsis:
      'Uma surfista volta à vila onde cresceu para cuidar do pai doente e reencontra o irmão que jurou nunca mais ver. Entre ondas grandes e silêncios antigos, a família tenta se reconstruir.',
    director: 'Anna Muylaert',
    cast: [
      { name: 'Dira Paes', role: 'Rosa', avatar: avatar('dira-paes') },
      { name: 'Chay Suede', role: 'Bento', avatar: avatar('chay-suede') },
      { name: 'Bárbara Colen', role: 'Iara', avatar: avatar('barbara-colen') },
    ],
    poster: poster('mare-alta'),
    hero: hero('mare-alta'),
    videoUrl: video('ElephantsDream'),
    isOriginal: false,
    isNew: false,
    featured: false,
  },
  {
    id: 3,
    title: 'Código Aurora',
    tagline: 'A cidade nunca dorme, o crime também não',
    genre: 'Suspense',
    genres: ['Suspense', 'Ação', 'Ficção científica'],
    year: 2025,
    durationMin: 124,
    rating: 8.8,
    maturity: '14',
    matchPercent: 94,
    synopsis:
      'Uma analista de dados descobre um padrão de crimes que só acontece sob a aurora boreal. Para provar a teoria, ela mergulha em uma rede clandestina que controla a noite da cidade.',
    director: 'Fernando Coimbra',
    cast: [
      { name: 'Bruna Marquezine', role: 'Vera', avatar: avatar('bruna-marquezine') },
      { name: 'Wagner Moura', role: 'Cavalcanti', avatar: avatar('wagner-moura') },
      { name: 'Grace Passô', role: 'Nádia', avatar: avatar('grace-passo') },
    ],
    poster: poster('codigo-aurora'),
    hero: hero('codigo-aurora'),
    videoUrl: video('ForBiggerBlazes'),
    isOriginal: true,
    isNew: false,
    featured: true,
  },
  {
    id: 4,
    title: 'Sol de Inverno',
    tagline: 'Todo inverno tem seu sol',
    genre: 'Romance',
    genres: ['Romance', 'Drama'],
    year: 2025,
    durationMin: 101,
    rating: 8.1,
    maturity: 'L',
    matchPercent: 88,
    synopsis:
      'Uma pianista em crise criativa aluga uma casa na serra e descobre que o vizinho ranzinza guarda a trilha inacabada de uma antiga paixão. Dois invernos mudam o que os dois sabem sobre amor.',
    director: 'Laís Bodanzky',
    cast: [
      { name: 'Alice Wegmann', role: 'Clara', avatar: avatar('alice-wegmann') },
      { name: 'Rodrigo Santoro', role: 'Mauro', avatar: avatar('rodrigo-santoro') },
      { name: 'Zezé Motta', role: 'Dona Nívea', avatar: avatar('zeze-motta') },
    ],
    poster: poster('sol-de-inverno'),
    hero: hero('sol-de-inverno'),
    videoUrl: video('ForBiggerEscapes'),
    isOriginal: false,
    isNew: false,
    featured: false,
  },
  {
    id: 5,
    title: 'O Som das Estrelas',
    tagline: 'No silêncio do espaço, a música encontra você',
    genre: 'Ficção científica',
    genres: ['Ficção científica', 'Aventura'],
    year: 2026,
    durationMin: 116,
    rating: 8.6,
    maturity: 'L',
    matchPercent: 96,
    synopsis:
      'Dois radioastrônomos captam uma melodia vinda de um sistema distante. Quando a música começa a alterar memórias de quem a escuta, os dois precisam decidir se devem interromper o sinal.',
    director: 'Kleber Mendonça Filho',
    cast: [
      { name: 'Seu Jorge', role: 'Damião', avatar: avatar('seu-jorge-estrelas') },
      { name: 'Sônia Braga', role: 'Helena', avatar: avatar('sonia-braga') },
      { name: 'Ícaro Silva', role: 'Augusto', avatar: avatar('icaro-silva') },
    ],
    poster: poster('o-som-das-estrelas'),
    hero: hero('o-som-das-estrelas'),
    videoUrl: video('ForBiggerFun'),
    isOriginal: true,
    isNew: true,
    featured: false,
  },
  {
    id: 6,
    title: 'Domingo Azul',
    tagline: 'O dia em que tudo pode mudar',
    genre: 'Drama',
    genres: ['Drama', 'Romance'],
    year: 2024,
    durationMin: 108,
    rating: 7.9,
    maturity: '12',
    matchPercent: 84,
    synopsis:
      'Três vizinhos têm o mesmo domingo para resolver pendências que empurraram por anos: uma herança, um pedido de desculpas e uma viagem sem volta. O bairro inteiro acompanha a tarde mais longa do ano.',
    director: 'Daniel Filho',
    cast: [
      { name: 'Mariana Ximenes', role: 'Paula', avatar: avatar('mariana-ximenes') },
      { name: 'Lázaro Ramos', role: 'Jorge', avatar: avatar('lazaro-ramos') },
      { name: 'Julia Stockler', role: 'Cecília', avatar: avatar('julia-stockler') },
    ],
    poster: poster('domingo-azul'),
    hero: hero('domingo-azul'),
    videoUrl: video('ForBiggerJoyrides'),
    isOriginal: false,
    isNew: false,
    featured: false,
  },
  {
    id: 7,
    title: 'Meia-Noite em Recife',
    tagline: 'A cidade esconde mais um segredo à meia-noite',
    genre: 'Suspense',
    genres: ['Suspense', 'Ação'],
    year: 2026,
    durationMin: 122,
    rating: 8.9,
    maturity: '16',
    matchPercent: 97,
    synopsis:
      'Um motorista de aplicativo aceita uma corrida que não deveria existir e testemunha um crime no centro histórico do Recife. Para sobreviver à noite, ele precisa entregar o que viu a quem não deveria saber.',
    director: 'Gabriel Mascaro',
    cast: [
      { name: 'Jesuíta Barbosa', role: 'Caio', avatar: avatar('jesuita-barbosa') },
      { name: 'Sophie Charlotte', role: 'Marina', avatar: avatar('sophie-charlotte') },
      { name: 'Irandhir Santos', role: 'Delegado', avatar: avatar('irandhir-santos') },
    ],
    poster: poster('meia-noite-recife'),
    hero: hero('meia-noite-recife'),
    videoUrl: video('ForBiggerMeltdowns'),
    isOriginal: true,
    isNew: true,
    featured: true,
  },
  {
    id: 8,
    title: 'Quase Ontem',
    tagline: 'O amor chega com atraso de um dia',
    genre: 'Romance',
    genres: ['Romance', 'Comédia'],
    year: 2024,
    durationMin: 97,
    rating: 7.6,
    maturity: '12',
    matchPercent: 80,
    synopsis:
      'Dois desconhecidos trocam mensagens no celular por engano e marcam de se encontrar. Um fuso horário de um dia separa os dois encontros — e cada um precisa decidir se espera.',
    director: 'Susana Garcia',
    cast: [
      { name: 'Tatá Werneck', role: 'Bia', avatar: avatar('tata-werneck') },
      { name: 'Marcus Majella', role: 'Fábio', avatar: avatar('marcus-majella') },
      { name: 'Camila Queiroz', role: 'Renata', avatar: avatar('camila-queiroz') },
    ],
    poster: poster('quase-ontem'),
    hero: hero('quase-ontem'),
    videoUrl: video('Sintel'),
    isOriginal: false,
    isNew: false,
    featured: false,
  },
  {
    id: 9,
    title: 'A Noite e o Silêncio',
    tagline: 'Alguns silêncios gritam mais alto',
    genre: 'Terror',
    genres: ['Terror', 'Suspense'],
    year: 2025,
    durationMin: 105,
    rating: 7.4,
    maturity: '16',
    matchPercent: 82,
    synopsis:
      'Uma família se muda para uma casa afastada onde nenhum som entra depois das dez. Quando ouvem o primeiro barulho, descobrem que alguém — ou algo — estava esperando que quebrassem a regra.',
    director: 'Gabriela Amaral Almeida',
    cast: [
      { name: 'Mari Oliveira', role: 'Laura', avatar: avatar('mari-oliveira') },
      { name: 'Daniel de Oliveira', role: 'Heitor', avatar: avatar('daniel-de-oliveira') },
      { name: 'Valentina Herzage', role: 'Nina', avatar: avatar('valentina-herzage') },
    ],
    poster: poster('a-noite-e-o-silencio'),
    hero: hero('a-noite-e-o-silencio'),
    videoUrl: video('TearsOfSteel'),
    isOriginal: true,
    isNew: true,
    featured: false,
  },
];

const catalog: Movie[] = z.array(MovieSchema).parse(rawMovies);

export function getMovies(): Movie[] {
  return catalog;
}

export function getMovieById(id: number): Movie | null {
  return catalog.find((movie) => movie.id === id) ?? null;
}

export function getFeaturedMovies(): Movie[] {
  const featured = catalog.filter((movie) => movie.featured);
  return featured.length > 0 ? featured : catalog.slice(0, 1);
}

export function getFeaturedMovie(): Movie {
  return getFeaturedMovies()[0];
}

export function getMoviesByGenre(genre: string): Movie[] {
  return catalog.filter((movie) => movie.genres.includes(genre));
}

export function getHomeSections(): { genre: string; movies: Movie[] }[] {
  return ['Ação', 'Aventura']
    .map((genre) => ({ genre, movies: getMoviesByGenre(genre) }))
    .filter((section) => section.movies.length > 0);
}

export function getNextMovie(id: number): Movie | null {
  if (catalog.length === 0) {
    return null;
  }
  const index = catalog.findIndex((movie) => movie.id === id);
  if (index < 0) {
    return null;
  }
  return catalog[(index + 1) % catalog.length];
}

export function searchMovies(query: string): Movie[] {
  const term = query.trim().toLowerCase();
  if (!term) {
    return catalog;
  }
  return catalog.filter(
    (movie) =>
      movie.title.toLowerCase().includes(term) || movie.genres.some((genre) => genre.toLowerCase().includes(term))
  );
}
