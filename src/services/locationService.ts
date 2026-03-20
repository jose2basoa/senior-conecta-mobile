import * as Location from 'expo-location';
import { getDatabase } from '../db/database';

export async function capturarLocalizacaoAtual() {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== 'granted') {
    return null;
  }

  const location = await Location.getCurrentPositionAsync({});
  const agora = new Date().toISOString();

  const db = getDatabase();

  if (db) {
    await db.runAsync(
      'INSERT INTO locations (latitude, longitude, registrado_em) VALUES (?, ?, ?)',
      [location.coords.latitude, location.coords.longitude, agora]
    );
  }

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    registrado_em: agora,
  };
}
