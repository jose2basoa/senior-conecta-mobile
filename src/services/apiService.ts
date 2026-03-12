const API_BASE_URL = 'http://SEU_IP_OU_DOMINIO:8000/api';

type EventoApi = {
    local_id?: number | null;
    tipo: string;
    descricao: string;
    origem: string;
    status: string;
    latitude: number | null;
    longitude: number | null;
    registrado_em: string;
};

export async function enviarEventoEmergenciaParaApi(evento: EventoApi) {
    const response = await fetch(`${API_BASE_URL}/eventos/emergencia`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify(evento),
    });

    if (!response.ok) {
        throw new Error(`Falha ao enviar evento. Status: ${response.status}`);
    }

    return response.json();
}