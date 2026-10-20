export type PerfilUsuario = 'admin' | 'entregador'

export type StatusEntrega = 'pendente' | 'atribuida' | 'em_andamento' | 'entregue' | 'cancelada'

export type TipoTaxaPlataforma = 'fixo' | 'percentual'

export interface Usuario {
  id: number
  email: string
  nome: string
  perfil: PerfilUsuario
  criadoEm: string
}

export interface Coletivo {
  id: number
  nome: string
  slug: string
  corPrimaria: string
  corNeutra: string
  enderecoBase?: string
  latitudeBase?: number
  longitudeBase?: number
  raioEntregaKm: number
  precoBase: number
  precoPorKm: number
  tipoTaxaPlataforma: TipoTaxaPlataforma
  valorTaxaPlataforma: number
  criadoEm: string
}

export interface CategoriaVolume {
  id: number
  coletivoId: number
  chave: string
  rotulo: string
  fator: number
}

export interface Entregador {
  id: number
  usuarioId: number
  telefone?: string
  tipoVeiculo?: string
  ativo: boolean
  usuario?: Usuario
}

export interface Entrega {
  id: number
  coletivoId: number
  nomeCliente: string
  telefoneCliente?: string
  enderecoRetirada?: string
  latitudeRetirada?: number
  longitudeRetirada?: number
  enderecoEntrega: string
  latitudeEntrega: number
  longitudeEntrega: number
  distanciaKm?: number
  categoriaVolume: string
  precoBase: number
  precoDistancia: number
  fatorVolume: number
  preco: number
  tipoTaxaPlataforma: TipoTaxaPlataforma
  valorTaxaPlataforma: number
  taxaPlataforma: number
  precoFinal: number
  entregadorId?: number
  status: StatusEntrega
  criadoEm: string
  atualizadoEm: string
  entregador?: Entregador
}
