import { DatabaseSync } from 'node:sqlite'
import type { Coletivo, Entregador, Entrega, Usuario, CategoriaVolume, StatusEntrega, TipoTaxaPlataforma, PerfilUsuario } from '~/types'

export type LinhaDb = Record<string, unknown>

export function primeiraLinha(linhas: LinhaDb[]): LinhaDb {
  const linha = linhas[0]
  if (!linha) throw new Error('Esperada pelo menos uma linha')
  return linha
}

let bancoEmCache: (DatabaseSync & { executar: typeof executarConsulta }) | null = null

function executarConsulta(
  this: DatabaseSync,
  entrada: string | { sql: string, args?: unknown[] }
): { linhas: LinhaDb[] } {
  if (typeof entrada === 'string') {
    this.exec(entrada)
    return { linhas: [] }
  }

  const { sql, args = [] } = entrada
  const statement = this.prepare(sql)
  const linhas = statement.all(...(args as import('node:sqlite').SQLInputValue[])) as LinhaDb[]
  return { linhas }
}

export function obterClienteDb(): DatabaseSync & { executar: typeof executarConsulta } {
  if (bancoEmCache) return bancoEmCache

  const config = useRuntimeConfig()
  let url = config.database.url || 'file:server/database.sqlite'
  if (url.startsWith('file:')) {
    url = url.slice(5)
  }

  const db = new DatabaseSync(url) as DatabaseSync & { executar: typeof executarConsulta }
  db.executar = executarConsulta.bind(db)
  bancoEmCache = db
  return bancoEmCache
}

export async function executar(entrada: string | { sql: string, args?: unknown[] }): Promise<{ linhas: LinhaDb[] }> {
  const db = obterClienteDb()
  return executarConsulta.call(db, entrada)
}

export const migracoes = `
CREATE TABLE IF NOT EXISTS coletivos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  slug TEXT UNIQUE,
  cor_primaria TEXT NOT NULL DEFAULT 'orange',
  cor_neutra TEXT NOT NULL DEFAULT 'neutral',
  endereco_base TEXT,
  latitude_base REAL,
  longitude_base REAL,
  raio_entrega_km REAL NOT NULL DEFAULT 10,
  preco_base REAL NOT NULL DEFAULT 0,
  preco_por_km REAL NOT NULL DEFAULT 0,
  tipo_taxa_plataforma TEXT CHECK(tipo_taxa_plataforma IN ('fixo','percentual')) DEFAULT 'percentual',
  valor_taxa_plataforma REAL NOT NULL DEFAULT 0,
  criado_em TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  senha_hash TEXT NOT NULL,
  perfil TEXT CHECK(perfil IN ('admin','entregador')) NOT NULL,
  criado_em TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS entregadores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER UNIQUE NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  telefone TEXT,
  tipo_veiculo TEXT,
  ativo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS categorias_volume (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coletivo_id INTEGER NOT NULL REFERENCES coletivos(id) ON DELETE CASCADE,
  chave TEXT NOT NULL,
  rotulo TEXT NOT NULL,
  fator REAL NOT NULL DEFAULT 1,
  UNIQUE(coletivo_id, chave)
);

CREATE TABLE IF NOT EXISTS entregas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coletivo_id INTEGER NOT NULL REFERENCES coletivos(id) ON DELETE CASCADE,
  nome_cliente TEXT NOT NULL,
  telefone_cliente TEXT,
  endereco_retirada TEXT,
  latitude_retirada REAL,
  longitude_retirada REAL,
  endereco_entrega TEXT NOT NULL,
  latitude_entrega REAL NOT NULL,
  longitude_entrega REAL NOT NULL,
  distancia_km REAL,
  categoria_volume TEXT NOT NULL,
  preco_base REAL NOT NULL,
  preco_distancia REAL NOT NULL,
  fator_volume REAL NOT NULL DEFAULT 1,
  preco REAL NOT NULL,
  tipo_taxa_plataforma TEXT,
  valor_taxa_plataforma REAL,
  taxa_plataforma REAL NOT NULL,
  preco_final REAL NOT NULL,
  entregador_id INTEGER REFERENCES entregadores(id) ON DELETE SET NULL,
  status TEXT CHECK(status IN ('pendente','atribuida','em_andamento','entregue','cancelada')) NOT NULL DEFAULT 'pendente',
  criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_entregas_status ON entregas(status);
CREATE INDEX IF NOT EXISTS idx_entregas_entregador ON entregas(entregador_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_perfil ON usuarios(perfil);
`

export async function executarMigracoes() {
  const db = obterClienteDb()
  db.exec(migracoes)
}

export async function criarCategoriasVolumePadrao(coletivoId: number) {
  const padroes = [
    { chave: 'pequeno', rotulo: 'Pequeno', fator: 1 },
    { chave: 'medio', rotulo: 'Médio', fator: 1.2 },
    { chave: 'grande', rotulo: 'Grande', fator: 1.5 }
  ]

  for (const item of padroes) {
    await executar({
      sql: `INSERT OR IGNORE INTO categorias_volume (coletivo_id, chave, rotulo, fator)
            VALUES (?, ?, ?, ?)`,
      args: [coletivoId, item.chave, item.rotulo, item.fator]
    })
  }
}

export function linhaParaColetivo(linha: LinhaDb): Coletivo {
  return {
    id: Number(linha.id),
    nome: String(linha.nome),
    slug: String(linha.slug),
    corPrimaria: String(linha.cor_primaria),
    corNeutra: String(linha.cor_neutra),
    enderecoBase: linha.endereco_base ? String(linha.endereco_base) : undefined,
    latitudeBase: linha.latitude_base !== null && linha.latitude_base !== undefined ? Number(linha.latitude_base) : undefined,
    longitudeBase: linha.longitude_base !== null && linha.longitude_base !== undefined ? Number(linha.longitude_base) : undefined,
    raioEntregaKm: Number(linha.raio_entrega_km),
    precoBase: Number(linha.preco_base),
    precoPorKm: Number(linha.preco_por_km),
    tipoTaxaPlataforma: String(linha.tipo_taxa_plataforma) as TipoTaxaPlataforma,
    valorTaxaPlataforma: Number(linha.valor_taxa_plataforma),
    criadoEm: String(linha.criado_em)
  }
}

export function linhaParaUsuario(linha: LinhaDb): Usuario {
  return {
    id: Number(linha.id),
    email: String(linha.email),
    nome: String(linha.nome),
    perfil: String(linha.perfil) as PerfilUsuario,
    criadoEm: String(linha.criado_em)
  }
}

export function linhaParaEntregador(linha: LinhaDb): Entregador {
  return {
    id: Number(linha.id),
    usuarioId: Number(linha.usuario_id),
    telefone: linha.telefone ? String(linha.telefone) : undefined,
    tipoVeiculo: linha.tipo_veiculo ? String(linha.tipo_veiculo) : undefined,
    ativo: Boolean(linha.ativo)
  }
}

export function linhaParaEntrega(linha: LinhaDb): Entrega {
  return {
    id: Number(linha.id),
    coletivoId: Number(linha.coletivo_id),
    nomeCliente: String(linha.nome_cliente),
    telefoneCliente: linha.telefone_cliente ? String(linha.telefone_cliente) : undefined,
    enderecoRetirada: linha.endereco_retirada ? String(linha.endereco_retirada) : undefined,
    latitudeRetirada: linha.latitude_retirada !== null && linha.latitude_retirada !== undefined ? Number(linha.latitude_retirada) : undefined,
    longitudeRetirada: linha.longitude_retirada !== null && linha.longitude_retirada !== undefined ? Number(linha.longitude_retirada) : undefined,
    enderecoEntrega: String(linha.endereco_entrega),
    latitudeEntrega: Number(linha.latitude_entrega),
    longitudeEntrega: Number(linha.longitude_entrega),
    distanciaKm: linha.distancia_km !== null && linha.distancia_km !== undefined ? Number(linha.distancia_km) : undefined,
    categoriaVolume: String(linha.categoria_volume),
    precoBase: Number(linha.preco_base),
    precoDistancia: Number(linha.preco_distancia),
    fatorVolume: Number(linha.fator_volume),
    preco: Number(linha.preco),
    tipoTaxaPlataforma: String(linha.tipo_taxa_plataforma) as TipoTaxaPlataforma,
    valorTaxaPlataforma: Number(linha.valor_taxa_plataforma),
    taxaPlataforma: Number(linha.taxa_plataforma),
    precoFinal: Number(linha.preco_final),
    entregadorId: linha.entregador_id !== null && linha.entregador_id !== undefined ? Number(linha.entregador_id) : undefined,
    status: String(linha.status) as StatusEntrega,
    criadoEm: String(linha.criado_em),
    atualizadoEm: String(linha.atualizado_em)
  }
}

export function linhaParaCategoriaVolume(linha: LinhaDb): CategoriaVolume {
  return {
    id: Number(linha.id),
    coletivoId: Number(linha.coletivo_id),
    chave: String(linha.chave),
    rotulo: String(linha.rotulo),
    fator: Number(linha.fator)
  }
}
