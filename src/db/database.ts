import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

let db: SQLite.SQLiteDatabase | null = null;

export function getDatabase() {
  if (Platform.OS === 'web') {
    return null;
  }

  if (!db) {
    db = SQLite.openDatabaseSync('seniorconecta.db');
  }

  return db;
}

export function initDatabase() {
  const database = getDatabase();

  if (!database) {
    console.log('SQLite desativado no web.');
    return;
  }

  database.execSync(`
    CREATE TABLE IF NOT EXISTS medications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      dosagem TEXT,
      horario TEXT NOT NULL,
      ativo INTEGER NOT NULL DEFAULT 1,
      criado_em TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS life_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pergunta TEXT NOT NULL,
      resposta TEXT,
      respondido_em TEXT,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      registrado_em TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS emergency_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT NOT NULL,
      descricao TEXT,
      origem TEXT,
      status TEXT,
      latitude REAL,
      longitude REAL,
      registrado_em TEXT NOT NULL
    );
  `);
}
