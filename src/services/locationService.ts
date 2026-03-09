import * as Location from 'expo-location';
import { getDatabase } from '../db/database';

export async function capturarLocalizacaoAtual() {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
            console.log('Permissão de localização negada');
            return false;
        }

        const location = await Location.getCurrentPositionAsync({});
        const agora = new Date().toISOString();

        const db = getDatabase();

        if (!db) {
            console.log('Banco indisponível');
            return false;
        }

        db.runSync(
            'INSERT INTO locations (latitude, longitude, registrado_em) VALUES (?, ?, ?)',
            [
                location.coords.latitude,
                location.coords.longitude,
                agora
            ]
        );

        console.log('Localização salva com sucesso');
        return true;
    } catch (error) {
        console.log('Erro ao capturar ou salvar localização:', error);
        return false;
    }
}