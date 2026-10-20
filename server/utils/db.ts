import { DatabaseSync } from 'node:sqlite'
import type { Collective, Deliverer, Delivery, User, VolumeCategory, DeliveryStatus, PlatformFeeType, UserRole } from '~/types'

export type DbRow = Record<string, unknown>

export function firstRow(rows: DbRow[]): DbRow {
  const row = rows[0]
  if (!row) throw new Error('Expected at least one row')
  return row
}

let cachedDb: (DatabaseSync & { execute: typeof executeQuery }) | null = null

function executeQuery(
  this: DatabaseSync,
  input: string | { sql: string, args?: unknown[] }
): { rows: DbRow[] } {
  if (typeof input === 'string') {
    this.exec(input)
    return { rows: [] }
  }

  const { sql, args = [] } = input
  const statement = this.prepare(sql)
  const rows = statement.all(...(args as import('node:sqlite').SQLInputValue[])) as DbRow[]
  return { rows }
}

export function getDbClient(): DatabaseSync & { execute: typeof executeQuery } {
  if (cachedDb) return cachedDb

  const config = useRuntimeConfig()
  let url = config.database.url || 'file:server/database.sqlite'
  if (url.startsWith('file:')) {
    url = url.slice(5)
  }

  const db = new DatabaseSync(url) as DatabaseSync & { execute: typeof executeQuery }
  db.execute = executeQuery.bind(db)
  cachedDb = db
  return cachedDb
}

export async function execute(input: string | { sql: string, args?: unknown[] }): Promise<{ rows: DbRow[] }> {
  const db = getDbClient()
  return executeQuery.call(db, input)
}

export const migrations = `
CREATE TABLE IF NOT EXISTS collectives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  primary_color TEXT NOT NULL DEFAULT 'orange',
  neutral_color TEXT NOT NULL DEFAULT 'neutral',
  base_address TEXT,
  base_lat REAL,
  base_lng REAL,
  delivery_radius_km REAL NOT NULL DEFAULT 10,
  base_price REAL NOT NULL DEFAULT 0,
  price_per_km REAL NOT NULL DEFAULT 0,
  platform_fee_type TEXT CHECK(platform_fee_type IN ('fixed','percent')) DEFAULT 'percent',
  platform_fee_value REAL NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK(role IN ('admin','deliverer')) NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deliverers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone TEXT,
  vehicle_type TEXT,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS volume_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  collective_id INTEGER NOT NULL REFERENCES collectives(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  factor REAL NOT NULL DEFAULT 1,
  UNIQUE(collective_id, key)
);

CREATE TABLE IF NOT EXISTS deliveries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  collective_id INTEGER NOT NULL REFERENCES collectives(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  pickup_address TEXT,
  pickup_lat REAL,
  pickup_lng REAL,
  delivery_address TEXT NOT NULL,
  delivery_lat REAL NOT NULL,
  delivery_lng REAL NOT NULL,
  distance_km REAL,
  volume_category TEXT NOT NULL,
  base_price REAL NOT NULL,
  distance_price REAL NOT NULL,
  volume_factor REAL NOT NULL DEFAULT 1,
  price REAL NOT NULL,
  platform_fee_type TEXT,
  platform_fee_value REAL,
  platform_fee REAL NOT NULL,
  final_price REAL NOT NULL,
  deliverer_id INTEGER REFERENCES deliverers(id) ON DELETE SET NULL,
  status TEXT CHECK(status IN ('pending','assigned','in_progress','delivered','cancelled')) NOT NULL DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_deliverer ON deliveries(deliverer_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
`

export async function runMigrations() {
  const db = getDbClient()
  db.exec(migrations)
}

export async function createDefaultVolumeCategories(collectiveId: number) {
  const defaults = [
    { key: 'small', label: 'Pequeno', factor: 1 },
    { key: 'medium', label: 'Médio', factor: 1.2 },
    { key: 'large', label: 'Grande', factor: 1.5 }
  ]

  for (const item of defaults) {
    await execute({
      sql: `INSERT OR IGNORE INTO volume_categories (collective_id, key, label, factor)
            VALUES (?, ?, ?, ?)`,
      args: [collectiveId, item.key, item.label, item.factor]
    })
  }
}

export function rowToCollective(row: DbRow): Collective {
  return {
    id: Number(row.id),
    name: String(row.name),
    slug: String(row.slug),
    primaryColor: String(row.primary_color),
    neutralColor: String(row.neutral_color),
    baseAddress: row.base_address ? String(row.base_address) : undefined,
    baseLat: row.base_lat !== null && row.base_lat !== undefined ? Number(row.base_lat) : undefined,
    baseLng: row.base_lng !== null && row.base_lng !== undefined ? Number(row.base_lng) : undefined,
    deliveryRadiusKm: Number(row.delivery_radius_km),
    basePrice: Number(row.base_price),
    pricePerKm: Number(row.price_per_km),
    platformFeeType: String(row.platform_fee_type) as PlatformFeeType,
    platformFeeValue: Number(row.platform_fee_value),
    createdAt: String(row.created_at)
  }
}

export function rowToUser(row: DbRow): User {
  return {
    id: Number(row.id),
    email: String(row.email),
    name: String(row.name),
    role: String(row.role) as UserRole,
    createdAt: String(row.created_at)
  }
}

export function rowToDeliverer(row: DbRow): Deliverer {
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    phone: row.phone ? String(row.phone) : undefined,
    vehicleType: row.vehicle_type ? String(row.vehicle_type) : undefined,
    active: Boolean(row.active)
  }
}

export function rowToDelivery(row: DbRow): Delivery {
  return {
    id: Number(row.id),
    collectiveId: Number(row.collective_id),
    customerName: String(row.customer_name),
    customerPhone: row.customer_phone ? String(row.customer_phone) : undefined,
    pickupAddress: row.pickup_address ? String(row.pickup_address) : undefined,
    pickupLat: row.pickup_lat !== null && row.pickup_lat !== undefined ? Number(row.pickup_lat) : undefined,
    pickupLng: row.pickup_lng !== null && row.pickup_lng !== undefined ? Number(row.pickup_lng) : undefined,
    deliveryAddress: String(row.delivery_address),
    deliveryLat: Number(row.delivery_lat),
    deliveryLng: Number(row.delivery_lng),
    distanceKm: row.distance_km !== null && row.distance_km !== undefined ? Number(row.distance_km) : undefined,
    volumeCategory: String(row.volume_category),
    basePrice: Number(row.base_price),
    distancePrice: Number(row.distance_price),
    volumeFactor: Number(row.volume_factor),
    price: Number(row.price),
    platformFeeType: String(row.platform_fee_type) as PlatformFeeType,
    platformFeeValue: Number(row.platform_fee_value),
    platformFee: Number(row.platform_fee),
    finalPrice: Number(row.final_price),
    delivererId: row.deliverer_id !== null && row.deliverer_id !== undefined ? Number(row.deliverer_id) : undefined,
    status: String(row.status) as DeliveryStatus,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  }
}

export function rowToVolumeCategory(row: DbRow): VolumeCategory {
  return {
    id: Number(row.id),
    collectiveId: Number(row.collective_id),
    key: String(row.key),
    label: String(row.label),
    factor: Number(row.factor)
  }
}
