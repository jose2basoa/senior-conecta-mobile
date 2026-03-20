import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getDatabase } from '../src/db/database';
import { obterSessaoIdoso } from '../src/services/sessionService';

type ProximoMedicamento = {
  nome: string;
  horario: string;
  statusTexto: string;
};

const TEMPO_RESPOSTA_TESTE_VIDA = 30;

export default function HomeScreen() {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const params = useLocalSearchParams();

  const [proximoMedicamento, setProximoMedicamento] =
    useState<ProximoMedicamento | null>(null);

  const [mostrarTesteVida, setMostrarTesteVida] = useState(false);
  const [tempoRestante, setTempoRestante] = useState(TEMPO_RESPOSTA_TESTE_VIDA);
  const [processandoTesteVida, setProcessandoTesteVida] = useState(false);

  const [sessaoVerificada, setSessaoVerificada] = useState(false);
  const [nomeIdoso, setNomeIdoso] = useState('');

  const timerTesteVidaRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const jaRedirecionouRef = useRef(false);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [scaleAnim]);

  useEffect(() => {
    if (params.sos === 'success') {
      Alert.alert(
        'Sucesso',
        typeof params.mensagem === 'string'
          ? params.mensagem
          : 'SOS enviado com sucesso',
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/');
            },
          },
        ]
      );
    }
  }, [params]);

  useEffect(() => {
    return () => {
      if (timerTesteVidaRef.current) {
        clearInterval(timerTesteVidaRef.current);
      }
    };
  }, []);

  const verificarSessao = useCallback(async () => {
    try {
      const sessao = await obterSessaoIdoso();

      if (!sessao) {
        router.replace('/login');
        return;
      }

      setNomeIdoso(sessao.nome || '');
    } catch (error) {
      console.log('Erro ao verificar sessão:', error);
      router.replace('/login');
    } finally {
      setSessaoVerificada(true);
    }
  }, []);

  const carregarProximoMedicamento = useCallback(async () => {
    try {
      const db = getDatabase();

      if (!db) {
        setProximoMedicamento(null);
        return;
      }

      const medicamentos = await db
        .getAllAsync<any>(
          `
          SELECT id, nome, horario
          FROM medications
          ORDER BY horario ASC
          `
        )
        .catch(() => []);

      const hoje = new Date();
      const hojeStr = hoje.toISOString().slice(0, 10);

      const tomadasHoje = await db
        .getAllAsync<any>(
          `
          SELECT medication_id, tomado_em
          FROM medication_logs
          WHERE substr(tomado_em, 1, 10) = ?
          `,
          [hojeStr]
        )
        .catch(() => []);

      if (!medicamentos.length) {
        setProximoMedicamento({
          nome: 'Nenhum medicamento',
          horario: '--:--',
          statusTexto: 'Cadastre um medicamento',
        });
        return;
      }

      const idsTomadosHoje = new Set(
        tomadasHoje.map((item: any) => String(item.medication_id))
      );

      const pendentes = medicamentos.filter(
        (med: any) => !idsTomadosHoje.has(String(med.id))
      );

      if (pendentes.length > 0) {
        const agoraMinutos = hoje.getHours() * 60 + hoje.getMinutes();

        const pendentesOrdenados = [...pendentes].sort((a: any, b: any) => {
          const aMin = horarioParaMinutos(a.horario);
          const bMin = horarioParaMinutos(b.horario);

          const aDiff =
            aMin >= agoraMinutos
              ? aMin - agoraMinutos
              : aMin + 1440 - agoraMinutos;

          const bDiff =
            bMin >= agoraMinutos
              ? bMin - agoraMinutos
              : bMin + 1440 - agoraMinutos;

          return aDiff - bDiff;
        });

        const prox = pendentesOrdenados[0];

        setProximoMedicamento({
          nome: prox.nome || 'Medicamento',
          horario: prox.horario || '--:--',
          statusTexto: 'Próximo ainda não tomado',
        });

        return;
      }

      const agoraMinutos = hoje.getHours() * 60 + hoje.getMinutes();

      const proximosDoHorario = [...medicamentos].sort((a: any, b: any) => {
        const aMin = horarioParaMinutos(a.horario);
        const bMin = horarioParaMinutos(b.horario);

        const aDiff =
          aMin >= agoraMinutos
            ? aMin - agoraMinutos
            : aMin + 1440 - agoraMinutos;

        const bDiff =
          bMin >= agoraMinutos
            ? bMin - agoraMinutos
            : bMin + 1440 - agoraMinutos;

        return aDiff - bDiff;
      });

      const proxHorario = proximosDoHorario[0];

      setProximoMedicamento({
        nome: proxHorario.nome || 'Medicamento',
        horario: proxHorario.horario || '--:--',
        statusTexto: 'Todos tomados • Próximo horário',
      });
    } catch (error) {
      console.log('Erro ao carregar próximo medicamento:', error);
      setProximoMedicamento({
        nome: 'Medicamentos',
        horario: '--:--',
        statusTexto: 'Não foi possível carregar',
      });
    }
  }, []);

  const verificarSeDeveAbrirTesteVida = useCallback(async () => {
    try {
      const db = getDatabase();
      if (!db) return;

      const agora = new Date();
      const horaAtual = agora.getHours();
      const minutoAtual = agora.getMinutes();
      const hojeStr = agora.toISOString().slice(0, 10);

      const jaRespondeuHoje = await db
        .getFirstAsync<any>(
          `
          SELECT id, respondido_em
          FROM life_checks
          WHERE substr(respondido_em, 1, 10) = ?
          ORDER BY datetime(respondido_em) DESC, id DESC
          LIMIT 1
          `,
          [hojeStr]
        )
        .catch(() => null);

      if (jaRespondeuHoje) {
        return;
      }

      const dentroDaJanela =
        horaAtual >= 9 &&
        (horaAtual < 9 || minutoAtual <= 59);

      if (dentroDaJanela) {
        abrirPopupTesteVida();
      }
    } catch (error) {
      console.log('Erro ao verificar teste de vida:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void verificarSessao();
      void carregarProximoMedicamento();
      void verificarSeDeveAbrirTesteVida();
    }, [
      verificarSessao,
      carregarProximoMedicamento,
      verificarSeDeveAbrirTesteVida,
    ])
  );

  function abrirPopupTesteVida() {
    if (mostrarTesteVida) return;

    jaRedirecionouRef.current = false;
    setTempoRestante(TEMPO_RESPOSTA_TESTE_VIDA);
    setMostrarTesteVida(true);

    if (timerTesteVidaRef.current) {
      clearInterval(timerTesteVidaRef.current);
    }

    timerTesteVidaRef.current = setInterval(() => {
      setTempoRestante((valorAtual) => {
        if (valorAtual <= 1) {
          if (timerTesteVidaRef.current) {
            clearInterval(timerTesteVidaRef.current);
          }

          if (!jaRedirecionouRef.current) {
            jaRedirecionouRef.current = true;
            setMostrarTesteVida(false);
            void Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Warning
            );
            router.push('/emergencia');
          }

          return 0;
        }

        return valorAtual - 1;
      });
    }, 1000);
  }

  async function confirmarEstouBem() {
    if (processandoTesteVida) return;

    try {
      setProcessandoTesteVida(true);

      if (timerTesteVidaRef.current) {
        clearInterval(timerTesteVidaRef.current);
      }

      const db = getDatabase();
      const agora = new Date().toISOString();

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );

      if (db) {
        await db.runAsync(
          'INSERT INTO life_checks (pergunta, resposta, respondido_em, status) VALUES (?, ?, ?, ?)',
          ['Você está bem?', 'Sim', agora, 'respondido']
        );
      }

      setMostrarTesteVida(false);
    } catch (error) {
      console.log('Erro ao registrar teste de vida:', error);
      setMostrarTesteVida(false);
    } finally {
      setProcessandoTesteVida(false);
    }
  }

  async function precisoDeAjuda() {
    if (processandoTesteVida) return;

    if (timerTesteVidaRef.current) {
      clearInterval(timerTesteVidaRef.current);
    }

    setMostrarTesteVida(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    router.push('/emergencia');
  }

  async function handleSOS() {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    router.push('/emergencia');
  }

  if (!sessaoVerificada) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topArea}>
          <Text style={styles.title}>Sênior Conecta</Text>
          <Text style={styles.subtitle}>
            {nomeIdoso
              ? `Olá, ${nomeIdoso}`
              : 'Em caso de ajuda, toque no botão'}
          </Text>
        </View>

        <View style={styles.centerArea}>
          <Pressable onPress={handleSOS}>
            <Animated.View
              style={[
                styles.sosButton,
                { transform: [{ scale: scaleAnim }] },
              ]}
            >
              <MaterialIcons name="warning" size={70} color="#FFFFFF" />
              <Text style={styles.sosText}>SOS</Text>
            </Animated.View>
          </Pressable>
        </View>

        <View style={styles.bottomArea}>
          <MedicationNextCard
            nome={proximoMedicamento?.nome ?? 'Medicamentos'}
            horario={proximoMedicamento?.horario ?? '--:--'}
            statusTexto={proximoMedicamento?.statusTexto ?? 'Carregando...'}
            onPress={() => router.push('/medicamentos')}
          />

          <View style={styles.actionRow}>
            <CompactActionButton
              title="Histórico"
              icon="history"
              color="#455A64"
              onPress={() => router.push('/historico')}
            />

            <CompactActionButton
              title="Configurações"
              icon="settings"
              color="#6A1B9A"
              onPress={() => router.push('/configuracoes')}
            />
          </View>
        </View>
      </View>

      <Modal
        visible={mostrarTesteVida}
        transparent
        animationType="fade"
        onRequestClose={() => { }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <MaterialIcons name="favorite" size={42} color="#2E7D32" />
            </View>

            <Text style={styles.modalTitle}>Como você está agora?</Text>
            <Text style={styles.modalSubtitle}>
              Toque abaixo para confirmar que está tudo bem.
            </Text>

            <Text style={styles.modalCountdown}>
              Redirecionando para emergência em {tempoRestante}s
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.modalPrimaryButton,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={confirmarEstouBem}
              disabled={processandoTesteVida}
            >
              <Text style={styles.modalPrimaryButtonText}>Estou bem</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.modalSecondaryButton,
                pressed && styles.actionButtonPressed,
              ]}
              onPress={precisoDeAjuda}
              disabled={processandoTesteVida}
            >
              <Text style={styles.modalSecondaryButtonText}>
                Preciso de ajuda
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function horarioParaMinutos(horario?: string) {
  if (!horario || !horario.includes(':')) return 99999;

  const [h, m] = horario.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

type ActionButtonProps = {
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  onPress: () => void;
};

type MedicationNextCardProps = {
  nome: string;
  horario: string;
  statusTexto: string;
  onPress: () => void;
};

function MedicationNextCard({
  nome,
  horario,
  statusTexto,
  onPress,
}: MedicationNextCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionButton,
        styles.medCard,
        pressed && styles.actionButtonPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.medLeft}>
        <View style={styles.medIconWrap}>
          <MaterialIcons name="medication" size={30} color="#FFFFFF" />
        </View>
      </View>

      <View style={styles.medCenter}>
        <Text style={styles.medStatus}>{statusTexto}</Text>
        <Text style={styles.medName} numberOfLines={1}>
          {nome}
        </Text>
      </View>

      <View style={styles.medRight}>
        <Text style={styles.medTime}>{horario}</Text>
      </View>
    </Pressable>
  );
}

function CompactActionButton({
  title,
  icon,
  color,
  onPress,
}: ActionButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.compactButton,
        { backgroundColor: color },
        pressed && styles.actionButtonPressed,
      ]}
      onPress={onPress}
    >
      <MaterialIcons name={icon} size={28} color="#FFFFFF" />
      <Text style={styles.compactButtonText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 28,
    justifyContent: 'space-between',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#6B7280',
  },
  topArea: {
    alignItems: 'center',
    marginTop: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#222222',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 20,
    color: '#444444',
    textAlign: 'center',
  },
  centerArea: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  sosButton: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#C62828',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  sosText: {
    fontSize: 60,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  bottomArea: {
    gap: 16,
    marginBottom: 8,
  },
  actionButton: {
    borderRadius: 20,
    minHeight: 80,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 16,
  },
  medCard: {
    backgroundColor: '#1976D2',
    justifyContent: 'space-between',
  },
  medLeft: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  medIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medCenter: {
    flex: 1,
    justifyContent: 'center',
  },
  medStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 4,
  },
  medName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  medRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 74,
  },
  medTime: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  compactButton: {
    flex: 1,
    borderRadius: 20,
    minHeight: 74,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  compactButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  actionButtonPressed: {
    opacity: 0.85,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  modalIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
  },
  modalSubtitle: {
    marginTop: 10,
    fontSize: 17,
    lineHeight: 24,
    color: '#4B5563',
    textAlign: 'center',
  },
  modalCountdown: {
    marginTop: 18,
    marginBottom: 22,
    fontSize: 16,
    fontWeight: '700',
    color: '#C62828',
    textAlign: 'center',
  },
  modalPrimaryButton: {
    width: '100%',
    minHeight: 60,
    backgroundColor: '#2E7D32',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalPrimaryButtonText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalSecondaryButton: {
    width: '100%',
    minHeight: 56,
    backgroundColor: '#C62828',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryButtonText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});