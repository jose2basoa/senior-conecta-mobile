import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getDatabase } from '../src/db/database';

type Registro = {
  id: string;
  titulo: string;
  descricao: string;
  data: string;
  icone: keyof typeof MaterialIcons.glyphMap;
};

export default function HistoricoScreen() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [carregando, setCarregando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);

    try {
      const db = getDatabase();

      if (!db) {
        setRegistros([]);
        return;
      }

      const lifeChecks = await db
        .getAllAsync<any>(
          `
          SELECT id, pergunta, resposta, respondido_em
          FROM life_checks
          ORDER BY datetime(respondido_em) DESC, id DESC
          LIMIT 20
          `
        )
        .catch(() => []);

      const emergencies = await db
        .getAllAsync<any>(
          `
          SELECT id, tipo, descricao, registrado_em, status
          FROM emergency_events
          ORDER BY datetime(registrado_em) DESC, id DESC
          LIMIT 20
          `
        )
        .catch(() => []);

      const localizacoes = await db
        .getAllAsync<any>(
          `
          SELECT id, latitude, longitude, registrado_em
          FROM locations
          ORDER BY datetime(registrado_em) DESC, id DESC
          LIMIT 20
          `
        )
        .catch(() => []);

      const combinado: Registro[] = [
        ...lifeChecks.map((item: any) => ({
          id: `life-${item.id}`,
          titulo: 'Teste de vida',
          descricao: `${item.pergunta || 'Pergunta não informada'} • Resposta: ${item.resposta || 'Não informada'
            }`,
          data: item.respondido_em || '',
          icone: 'favorite' as const,
        })),

        ...emergencies.map((item: any) => ({
          id: `emergency-${item.id}`,
          titulo: `Emergência${item.tipo ? `: ${String(item.tipo).toUpperCase()}` : ''}`,
          descricao:
            item.descricao ||
            (item.status ? `Status: ${item.status}` : 'Evento de emergência registrado'),
          data: item.registrado_em || '',
          icone: 'warning' as const,
        })),

        ...localizacoes.map((item: any) => ({
          id: `location-${item.id}`,
          titulo: 'Localização registrada',
          descricao:
            item.latitude != null && item.longitude != null
              ? `Lat: ${Number(item.latitude).toFixed(5)} • Long: ${Number(item.longitude).toFixed(5)}`
              : 'Coordenadas não disponíveis',
          data: item.registrado_em || '',
          icone: 'location-on' as const,
        })),
      ].sort((a, b) => String(b.data).localeCompare(String(a.data)));

      setRegistros(combinado);
    } catch (error) {
      console.log('Erro ao carregar histórico:', error);
      setRegistros([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  function formatarData(data: string) {
    if (!data) return 'Data não informada';

    const date = new Date(data);

    if (Number.isNaN(date.getTime())) {
      return data;
    }

    return date.toLocaleString('pt-BR');
  }

  function corDoIcone(icone: Registro['icone']) {
    switch (icone) {
      case 'warning':
        return '#C62828';
      case 'favorite':
        return '#2E7D32';
      case 'location-on':
        return '#1565C0';
      default:
        return '#6B7280';
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={registros}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={carregando} onRefresh={() => void carregar()} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Histórico</Text>
            <Text style={styles.subtitle}>
              Últimos registros locais do aplicativo.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: `${corDoIcone(item.icone)}18` },
                ]}
              >
                <MaterialIcons
                  name={item.icone}
                  size={22}
                  color={corDoIcone(item.icone)}
                />
              </View>

              <View style={styles.textWrap}>
                <Text style={styles.itemTitle}>{item.titulo}</Text>
                <Text style={styles.itemDesc}>{item.descricao}</Text>
                <Text style={styles.itemDate}>{formatarData(item.data)}</Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <MaterialIcons name="history" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Nenhum registro ainda</Text>
            <Text style={styles.emptyText}>
              Assim que houver SOS, teste de vida ou localização salva, eles aparecerão aqui.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },

  content: {
    padding: 20,
    paddingBottom: 28,
    flexGrow: 1,
  },

  header: {
    marginBottom: 18,
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
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textWrap: {
    flex: 1,
  },

  itemTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },

  itemDesc: {
    fontSize: 15,
    color: '#4B5563',
    marginBottom: 8,
    lineHeight: 21,
  },

  itemDate: {
    fontSize: 14,
    color: '#6B7280',
  },

  emptyWrap: {
    flex: 1,
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  emptyTitle: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },

  emptyText: {
    marginTop: 8,
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
});