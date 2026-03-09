import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('seniorconecta.db');

export function initDatabase() {
    db.execSync(`
        CREATE TABLE IF NOT EXISTS medications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            dosagem TEXT,
            horario TEXT NOT NULL,
            ativo INTEGER NOT NULL DEFAULT 1
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
            criado_em TEXT NOT NULL
        );
    `);
}