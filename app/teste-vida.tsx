import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { getDatabase } from '../src/db/database';

export default function TesteVidaScreen() {
  const [ultimoRegistro, setUltimoRegistro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string>('Use esta tela para registrar rapidamente que o idoso está bem.');

  async function registrarResposta() {
    try {
      const db = getDatabase();
      const agora = new Date().toISOString();

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (db) {
        await db.runAsync(
          'INSERT INTO life_checks (pergunta, resposta, respondido_em, status) VALUES (?, ?, ?, ?)',
          ['Você está bem?', 'Sim', agora, 'respondido']
        );
      }

      setUltimoRegistro(agora);
      setMensagem('Confirmação registrada com sucesso.');
    } catch (error) {
      console.log('Erro ao registrar teste de vida:', error);
      setMensagem('Não foi possível registrar agora.');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.card}>
          <MaterialIcons name="favorite" size={60} color="#2E7D32" />
          <Text style={styles.title}>Teste de vida</Text>
          <Text style={styles.subtitle}>{mensagem}</Text>

          <Pressable style={styles.button} onPress={registrarResposta}>
            <Text style={styles.buttonText}>Estou bem</Text>
          </Pressable>

          <Text style={styles.infoTitle}>Último registro nesta sessão</Text>
          <Text style={styles.infoText}>
            {ultimoRegistro
              ? new Date(ultimoRegistro).toLocaleString('pt-BR')
              : 'Nenhum registro ainda.'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F6F8' },
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  card: { backgroundColor: '#FFF', borderRadius: 22, padding: 24, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#1F2937', marginTop: 14 },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#2E7D32',
    borderRadius: 18,
    minHeight: 60,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },
  buttonText: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  infoTitle: { fontSize: 15, fontWeight: '700', color: '#374151', alignSelf: 'flex-start' },
  infoText: { marginTop: 6, fontSize: 16, color: '#111827', alignSelf: 'flex-start' },
});