import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { obterSessaoIdoso, removerSessaoIdoso } from '../src/services/sessionService';

export default function ConfiguracoesScreen() {
  const [nomeIdoso, setNomeIdoso] = useState('');
  const [emailIdoso, setEmailIdoso] = useState('');
  const [cpfIdoso, setCpfIdoso] = useState('');

  const carregarSessao = useCallback(async () => {
    try {
      const sessao = await obterSessaoIdoso();

      if (!sessao) {
        setNomeIdoso('');
        setEmailIdoso('');
        setCpfIdoso('');
        return;
      }

      setNomeIdoso(sessao.nome || '');
      setEmailIdoso(sessao.email || '');
      setCpfIdoso(sessao.cpf || '');
    } catch (error) {
      console.log('Erro ao carregar sessão nas configurações:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregarSessao();
    }, [carregarSessao])
  );

  async function sair() {
    try {
      await removerSessaoIdoso();
      router.replace('/login');
    } catch (error) {
      console.log('Erro ao sair da conta:', error);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Configurações</Text>
        <Text style={styles.subtitle}>Informações da sessão e ajustes do aplicativo.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Idoso conectado</Text>
          <Text style={styles.value}>{nomeIdoso || 'Não identificado'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>E-mail</Text>
          <Text style={styles.value}>{emailIdoso || 'Não informado'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>CPF</Text>
          <Text style={styles.value}>{cpfIdoso || 'Não informado'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Plataforma</Text>
          <Text style={styles.value}>{Platform.OS}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Modo atual</Text>
          <Text style={styles.value}>MVP local com SQLite + Expo Router</Text>
        </View>

        <Pressable style={styles.logoutButton} onPress={sair}>
          <Text style={styles.logoutText}>Sair da conta</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 18,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  value: {
    fontSize: 16,
    color: '#111827',
  },
  logoutButton: {
    marginTop: 20,
    backgroundColor: '#C62828',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
});