import { getDatabase } from '../db/database';

type EventoEmergencia = {
    tipo: string;
    descricao: string;
    origem: string;
    status: string;
    latitude: number | null;
    longitude: number | null;
    registrado_em: string;
};

export async function registrarEventoEmergenciaLocal(evento: EventoEmergencia) {
    const db = getDatabase();

    const result = await db.runAsync(
        `
      INSERT INTO eventos (
        tipo,
        descricao,
        origem,
        status,
        latitude,
        longitude,
        registrado_em
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
        [
            evento.tipo,
            evento.descricao,
            evento.origem,
            evento.status,
            evento.latitude,
            evento.longitude,
            evento.registrado_em,
        ]
    );

    return {
        id: result.lastInsertRowId,
        ...evento,
    };
}