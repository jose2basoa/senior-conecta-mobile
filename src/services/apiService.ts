const API_URL = 'http://SEU_IP_OU_DOMINIO/api';

export async function loginIdoso(payload: { cpf: string; email: string }) {
    const response = await fetch(`${API_URL}/idoso/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data?.message || 'Não foi possível fazer login.');
    }

    return data;
}

export async function cadastrarIdosoStep1(payload: {
    nome: string;
    data_nascimento: string;
    sexo: string;
    cpf: string;
    telefone: string;
    email: string;
    observacoes?: string;
}) {
    const response = await fetch(`${API_URL}/idoso/cadastro-step1`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data?.message || 'Não foi possível cadastrar.');
    }

    return data;
}