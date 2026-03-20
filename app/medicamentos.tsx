import { MaterialIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { getDatabase } from '../src/db/database';
import { agendarNotificacaoMedicamento, solicitarPermissaoNotificacao } from '../src/services/notificationService';

type Medicamento = {
  id: number;
  nome: string;
  dosagem: string | null;
  horario: string;
  ativo: number;
};

export default function MedicamentosScreen() {
  const [nome, setNome] = useState('');
  const [dosagem, setDosagem] = useState('');
  const [horario, setHorario] = useState('08:00');
  const [lista, setLista] = useState<Medicamento[]>([]);

  const carregar = useCallback(async () => {
    const db = getDatabase();
    if (!db) {
      setLista([]);
      return;
    }

    const rows = await db.getAllAsync<Medicamento>(
      'SELECT id, nome, dosagem, horario, ativo FROM medications ORDER BY horario, nome'
    );
    setLista(rows);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function salvar() {
    if (!nome.trim() || !horario.trim()) {
      Alert.alert('Preencha os campos', 'Informe pelo menos o nome e o horário.');
      return;
    }

    const db = getDatabase();
    if (!db) {
      Alert.alert('Indisponível', 'O cadastro local não funciona no modo web.');
      return;
    }

    await db.runAsync(
      'INSERT INTO medications (nome, dosagem, horario, ativo, criado_em) VALUES (?, ?, ?, 1, ?)',
      [nome.trim(), dosagem.trim() || null, horario.trim(), new Date().toISOString()]
    );

    const partes = horario.split(':');
    const hour = Number(partes[0]);
    const minute = Number(partes[1]);

    if (!Number.isNaN(hour) && !Number.isNaN(minute)) {
      const permitido = await solicitarPermissaoNotificacao();
      if (permitido) {
        await agendarNotificacaoMedicamento(
          nome.trim(),
          dosagem.trim() ? `Dosagem: ${dosagem.trim()}` : 'Horário do medicamento.',
          hour,
          minute
        );
      }
    }

    setNome('');
    setDosagem('');
    setHorario('08:00');
    await carregar();
  }

  async function alternarAtivo(item: Medicamento) {
    const db = getDatabase();
    if (!db) return;

    await db.runAsync('UPDATE medications SET ativo = ? WHERE id = ?', [item.ativo ? 0 : 1, item.id]);
    await carregar();
  }

  async function remover(id: number) {
    const db = getDatabase();
    if (!db) return;

    await db.runAsync('DELETE FROM medications WHERE id = ?', [id]);
    await carregar();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={lista}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Medicamentos</Text>
            <Text style={styles.subtitle}>Cadastre lembretes simples para a rotina do idoso.</Text>

            <View style={styles.card}>
              <Text style={styles.label}>Nome</Text>
              <TextInput value={nome} onChangeText={setNome} placeholder="Ex.: Losartana" style={styles.input} />

              <Text style={styles.label}>Dosagem</Text>
              <TextInput value={dosagem} onChangeText={setDosagem} placeholder="Ex.: 50 mg" style={styles.input} />

              <Text style={styles.label}>Horário</Text>
              <TextInput value={horario} onChangeText={setHorario} placeholder="08:00" style={styles.input} />

              <Pressable style={styles.primaryButton} onPress={salvar}>
                <MaterialIcons name="add-alert" size={22} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Salvar medicamento</Text>
              </Pressable>
            </View>

            <Text style={styles.sectionTitle}>Lista cadastrada</Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.listCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{item.nome}</Text>
              <Text style={styles.itemText}>Dosagem: {item.dosagem || 'Não informada'}</Text>
              <Text style={styles.itemText}>Horário: {item.horario}</Text>
              <Text style={[styles.badge, item.ativo ? styles.badgeActive : styles.badgeInactive]}>
                {item.ativo ? 'Ativo' : 'Inativo'}
              </Text>
            </View>

            <View style={styles.actionsCol}>
              <Pressable style={styles.iconButton} onPress={() => alternarAtivo(item)}>
                <MaterialIcons name={item.ativo ? 'toggle-on' : 'toggle-off'} size={30} color="#333" />
              </Pressable>
              <Pressable style={styles.iconButton} onPress={() => remover(item.id)}>
                <MaterialIcons name="delete-outline" size={26} color="#C62828" />
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum medicamento cadastrado ainda.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F6F8' },
  content: { padding: 20, gap: 14 },
  title: { fontSize: 28, fontWeight: '800', color: '#1F2937', marginBottom: 6 },
  subtitle: { fontSize: 16, color: '#6B7280', marginBottom: 16 },
  card: { backgroundColor: '#FFF', borderRadius: 18, padding: 16, gap: 10, marginBottom: 18 },
  label: { fontSize: 15, fontWeight: '700', color: '#374151' },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  primaryButton: { marginTop: 8, minHeight: 52, borderRadius: 14, backgroundColor: '#1976D2', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  primaryButtonText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#1F2937', marginBottom: 8 },
  listCard: { backgroundColor: '#FFF', borderRadius: 18, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12 },
  itemTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 6 },
  itemText: { fontSize: 15, color: '#4B5563', marginBottom: 4 },
  badge: { alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, fontWeight: '700', overflow: 'hidden' },
  badgeActive: { backgroundColor: '#DCFCE7', color: '#166534' },
  badgeInactive: { backgroundColor: '#F3F4F6', color: '#4B5563' },
  actionsCol: { gap: 8 },
  iconButton: { padding: 4 },
  emptyText: { color: '#6B7280', fontSize: 15 },
});
