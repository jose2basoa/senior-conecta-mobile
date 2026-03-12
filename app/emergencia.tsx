import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    PanResponder,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

// AJUSTE ESTES IMPORTS CONFORME SEU PROJETO
import { enviarEventoEmergenciaParaApi } from '../src/services/apiService';
import { registrarEventoEmergenciaLocal } from '../src/services/emergencyService';
import { capturarLocalizacaoAtual } from '../src/services/locationService';

const COUNTDOWN_START = 10;
const SLIDER_WIDTH = 320;
const KNOB_SIZE = 58;
const TRACK_PADDING = 4;
const MAX_DRAG = SLIDER_WIDTH - KNOB_SIZE - TRACK_PADDING * 2;

export default function EmergenciaScreen() {
    const [countdown, setCountdown] = useState(COUNTDOWN_START);
    const [cancelado, setCancelado] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [enviando, setEnviando] = useState(false);

    const dragX = useRef(new Animated.Value(0)).current;
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const countdownRef = useRef(COUNTDOWN_START);
    const canceladoRef = useRef(false);
    const enviadoRef = useRef(false);

    useEffect(() => {
        iniciarContagem();

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    function iniciarContagem() {
        timerRef.current = setInterval(async () => {
            if (canceladoRef.current || enviadoRef.current) {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                }
                return;
            }

            countdownRef.current -= 1;
            setCountdown(countdownRef.current);

            if (countdownRef.current > 0) {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }

            if (countdownRef.current <= 0) {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                }
                await enviarSOS();
            }
        }, 1000);
    }

    async function cancelarSOS() {
        if (canceladoRef.current || enviadoRef.current || enviando) return;

        canceladoRef.current = true;
        setCancelado(true);

        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        Alert.alert('SOS cancelado', 'O pedido de ajuda foi cancelado.', [
            {
                text: 'Voltar',
                onPress: () => router.back(),
            },
        ]);
    }

    async function enviarSOS() {
        if (canceladoRef.current || enviadoRef.current || enviando) return;

        try {
            setEnviando(true);
            enviadoRef.current = true;
            setEnviado(true);

            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

            const localizacao = await capturarLocalizacaoAtual();

            const evento = {
                tipo: 'sos',
                descricao: 'Pedido manual de ajuda pelo botão SOS',
                origem: 'app_idoso',
                status: 'pendente',
                latitude: localizacao?.latitude ?? null,
                longitude: localizacao?.longitude ?? null,
                registrado_em: new Date().toISOString(),
            };

            const eventoLocal = await registrarEventoEmergenciaLocal(evento);

            try {
                await enviarEventoEmergenciaParaApi({
                    ...evento,
                    local_id: eventoLocal?.id ?? null,
                });
            } catch (apiError) {
                console.log('Falha ao enviar para API, evento mantido localmente.', apiError);
            }

            Alert.alert(
                'Ajuda solicitada',
                'O pedido de ajuda foi registrado e enviado.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.replace('/'),
                    },
                ]
            );
        } catch (error) {
            console.log('Erro ao processar SOS:', error);

            Alert.alert(
                'Erro',
                'Não foi possível concluir o pedido de ajuda agora.'
            );

            enviadoRef.current = false;
            setEnviado(false);
            setEnviando(false);
            countdownRef.current = COUNTDOWN_START;
            setCountdown(COUNTDOWN_START);
            canceladoRef.current = false;
            setCancelado(false);
            dragX.setValue(0);

            iniciarContagem();
        }
    }

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return !cancelado && !enviado && !enviando && gestureState.dx < -5;
            },
            onPanResponderMove: (_, gestureState) => {
                const nextX = Math.max(-MAX_DRAG, Math.min(0, gestureState.dx));
                dragX.setValue(nextX);
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dx <= -MAX_DRAG * 0.75) {
                    Animated.timing(dragX, {
                        toValue: -MAX_DRAG,
                        duration: 120,
                        useNativeDriver: true,
                    }).start(() => {
                        void cancelarSOS();
                    });
                } else {
                    Animated.spring(dragX, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    const sliderLabel = cancelado
        ? 'SOS cancelado'
        : enviado || enviando
            ? 'Enviando pedido de ajuda'
            : 'Deslize para cancelar';

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Pressable
                    style={styles.closeButton}
                    onPress={() => router.back()}
                    disabled={enviado || enviando}
                >
                    <MaterialIcons name="close" size={28} color="#333333" />
                </Pressable>

                <View style={styles.content}>
                    <Text style={styles.title}>SOS</Text>
                    <Text style={styles.subtitle}>Deslize para cancelar</Text>

                    <Text style={styles.description}>
                        Seu pedido de ajuda será enviado quando a contagem terminar.
                    </Text>

                    <View style={styles.countdownWrap}>
                        <View style={styles.countdownCircle}>
                            <Text style={styles.countdownText}>
                                {enviado || enviando ? '✓' : countdown}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.spacer} />

                    <View style={styles.sliderArea}>
                        <View style={styles.sliderTrack}>
                            <Text style={styles.sliderText}>{sliderLabel}</Text>

                            <Animated.View
                                style={[
                                    styles.sliderKnob,
                                    { transform: [{ translateX: dragX }] },
                                ]}
                                {...(!cancelado && !enviado && !enviando
                                    ? panResponder.panHandlers
                                    : {})}
                            >
                                <MaterialIcons name="arrow-back" size={30} color="#FFFFFF" />
                            </Animated.View>
                        </View>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },

    container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 28,
    },

    closeButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 22,
    },

    content: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 16,
    },

    title: {
        fontSize: 30,
        fontWeight: '700',
        color: '#222222',
        marginBottom: 10,
    },

    subtitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#222222',
        textAlign: 'center',
        marginBottom: 12,
    },

    description: {
        fontSize: 17,
        lineHeight: 24,
        color: '#555555',
        textAlign: 'center',
        maxWidth: 320,
    },

    countdownWrap: {
        marginTop: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },

    countdownCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F26D6D',
        alignItems: 'center',
        justifyContent: 'center',
    },

    countdownText: {
        fontSize: 38,
        fontWeight: '800',
        color: '#FFFFFF',
    },

    spacer: {
        flex: 1,
    },

    sliderArea: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 18,
    },

    sliderTrack: {
        width: SLIDER_WIDTH,
        height: 66,
        borderRadius: 33,
        backgroundColor: '#2F2F2F',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 72,
        position: 'relative',
        overflow: 'hidden',
    },

    sliderText: {
        color: '#FF9A9A',
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
    },

    sliderKnob: {
        position: 'absolute',
        right: TRACK_PADDING,
        width: KNOB_SIZE,
        height: KNOB_SIZE,
        borderRadius: KNOB_SIZE / 2,
        backgroundColor: '#F26D6D',
        alignItems: 'center',
        justifyContent: 'center',
    },
});