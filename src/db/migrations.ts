import type { SQLiteDatabase } from 'expo-sqlite';

import { seed } from './seed';

export const DATABASE_NAME = 'todoss.db';
const DATABASE_VERSION = 1;

const SCHEMA_V1 = `
CREATE TABLE IF NOT EXISTS categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT UNIQUE,
  name        TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  color       TEXT    NOT NULL,
  icon        TEXT    NOT NULL DEFAULT 'tag',
  is_default  INTEGER NOT NULL DEFAULT 0,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  title             TEXT    NOT NULL,
  note              TEXT,
  date              TEXT    NOT NULL,
  start_time        TEXT,
  end_time          TEXT,
  category_id       INTEGER NOT NULL REFERENCES categories(id),
  priority          INTEGER NOT NULL DEFAULT 1 CHECK (priority IN (0, 1, 2)),
  reminder_enabled  INTEGER NOT NULL DEFAULT 0,
  reminder_minutes  INTEGER NOT NULL DEFAULT 15,
  notification_id   TEXT,
  completed         INTEGER NOT NULL DEFAULT 0,
  completed_at      TEXT,
  created_at        TEXT    NOT NULL,
  updated_at        TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_date         ON tasks(date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at);
CREATE INDEX IF NOT EXISTS idx_tasks_category     ON tasks(category_id);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

type ColumnInfo = { name: string; notnull: number; dflt_value: string | null; pk: number };

type TableSpec = {
  /** Bunlar yoksa tablo bizim değildir: kenara alınıp yeniden kurulur */
  required: string[];
  /** Eksikse veri korunarak eklenir (ALTER TABLE ADD COLUMN tanımı) */
  addable: Record<string, string>;
};

const TABLES: Record<'categories' | 'tasks' | 'settings', TableSpec> = {
  categories: {
    required: ['id', 'name'],
    addable: {
      slug: 'TEXT',
      color: "TEXT NOT NULL DEFAULT '#1F6FD1'",
      icon: "TEXT NOT NULL DEFAULT 'tag'",
      is_default: 'INTEGER NOT NULL DEFAULT 0',
      sort_order: 'INTEGER NOT NULL DEFAULT 0',
      created_at: "TEXT NOT NULL DEFAULT ''",
    },
  },
  tasks: {
    required: ['id', 'title'],
    addable: {
      note: 'TEXT',
      date: "TEXT NOT NULL DEFAULT ''",
      start_time: 'TEXT',
      end_time: 'TEXT',
      // ADD COLUMN ile REFERENCES + NULL olmayan varsayılan birlikte verilemez
      category_id: 'INTEGER NOT NULL DEFAULT 0',
      priority: 'INTEGER NOT NULL DEFAULT 1',
      reminder_enabled: 'INTEGER NOT NULL DEFAULT 0',
      reminder_minutes: 'INTEGER NOT NULL DEFAULT 15',
      notification_id: 'TEXT',
      completed: 'INTEGER NOT NULL DEFAULT 0',
      completed_at: 'TEXT',
      created_at: "TEXT NOT NULL DEFAULT ''",
      updated_at: "TEXT NOT NULL DEFAULT ''",
    },
  },
  settings: { required: ['key', 'value'], addable: {} },
};

/**
 * Var olan tabloları beklenen şemaya getirir. Cihazda farklı/eski bir şemayla
 * oluşturulmuş todoss.db olabilir; CREATE TABLE IF NOT EXISTS bunları değiştirmez.
 * - Eksik sütunlar veri korunarak eklenir.
 * - Uyumsuz tablo (zorunlu sütunu yok ya da bizim doldurmadığımız NOT NULL sütunu var)
 *   silinmez, `<ad>_legacy_<zaman>` olarak kenara alınır ve temiz tablo kurulur.
 */
async function repairSchema(db: SQLiteDatabase): Promise<void> {
  // Yeniden adlandırma diğer tablolardaki REFERENCES'ları eski tabloya kaydırmasın
  await db.execAsync('PRAGMA legacy_alter_table = ON');
  try {
    for (const [table, spec] of Object.entries(TABLES)) {
      const cols = await db.getAllAsync<ColumnInfo>(`PRAGMA table_info(${table})`);
      if (cols.length === 0) continue; // tablo yok; SCHEMA_V1 kurar

      const names = new Set(cols.map((c) => c.name));
      const known = new Set([...spec.required, ...Object.keys(spec.addable)]);
      const incompatible =
        spec.required.some((c) => !names.has(c)) ||
        cols.some((c) => !known.has(c.name) && c.notnull === 1 && c.dflt_value == null && c.pk === 0);

      if (incompatible) {
        const legacy = `${table}_legacy_${Date.now()}`;
        console.warn(`Uyumsuz "${table}" tablosu "${legacy}" olarak kenara alındı`);
        await db.execAsync(`ALTER TABLE ${table} RENAME TO ${legacy}`);
        // Taşınan indeksler aynı adı tutar; yeni tablonun indeksleri çakışmasın
        const indexes = await db.getAllAsync<{ name: string }>(
          "SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = ? AND sql IS NOT NULL",
          legacy,
        );
        for (const { name } of indexes) await db.execAsync(`DROP INDEX IF EXISTS "${name}"`);
        continue;
      }

      for (const [column, definition] of Object.entries(spec.addable)) {
        if (!names.has(column)) {
          await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        }
      }
    }
  } finally {
    await db.execAsync('PRAGMA legacy_alter_table = OFF');
  }

  // Eksik tabloları ve indeksleri kur, varsayılanları tamamla (hepsi tekrar çalıştırılabilir)
  await db.execAsync(SCHEMA_V1);
  await db.execAsync('CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug)');
  await seed(db);
}

/** SQLiteProvider onInit: bağlantı ayarları + PRAGMA user_version tabanlı migration */
export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;

  // Her açılışta: ilk kurulumda tabloları oluşturur, var olan şema farklıysa onarır.
  // Önce sütunlar tamamlanır, sonra indeksler kurulur (eski tabloda eksik sütuna indeks patlamasın).
  await db.withTransactionAsync(() => repairSchema(db));

  // Gelecek sürümler: if (current < 2) { ...v2 değişiklikleri... }

  if (current !== DATABASE_VERSION) await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
