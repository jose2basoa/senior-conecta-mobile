import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@senior_conecta_idoso_session';

export type IdosoSession = {
    id: number;
    nome: string;
    cpf: string;
    email: string;
    telefone?: string | null;
    horario_teste_vida?: string | null;
    tempo_resposta_teste_vida?: number | null;
};

export async function salvarSessaoIdoso(sessao: IdosoSession) {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sessao));
}

export async function obterSessaoIdoso(): Promise<IdosoSession | null> {
    const raw = await AsyncStorage.getItem(SESSION_KEY);

    if (!raw) return null;

    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export async function removerSessaoIdoso() {
    await AsyncStorage.removeItem(SESSION_KEY);
}