import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { initDatabase } from '../src/db/database';

export default function RootLayout() {
  useEffect(() => {
    initDatabase();
  }, []);

  return (
    <Stack screenOptions={{ headerTitleAlign: 'center' }}>
      <Stack.Screen name="index" options={{ title: 'Sênior Conecta' }} />
      <Stack.Screen name="emergencia" options={{ title: 'Emergência' }} />
      <Stack.Screen name="medicamentos" options={{ title: 'Medicamentos' }} />
      <Stack.Screen name="teste-vida" options={{ title: 'Teste de Vida' }} />
      <Stack.Screen name="historico" options={{ title: 'Histórico' }} />
      <Stack.Screen name="configuracoes" options={{ title: 'Configurações' }} />
    </Stack>
  );
}