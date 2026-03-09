import * as Location from 'expo-location';
import { db } from '../db/database';

export async function capturarLocalizacaoAtual() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return false;

    const location = await Location.getCurrentPositionAsync({});
    const agora = new Date().toISOString();

    db.runSync(
        'INSERT INTO locations (latitude, longitude, registrado_em) VALUES (?, ?, ?)',
        [location.coords.latitude, location.coords.longitude, agora]
    );

    return true;
}