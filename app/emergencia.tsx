import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    PanResponder,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { enviarEventoEmergenciaParaApi } from '../src/services/apiService';
import { registrarEventoEmergenciaLocal } from '../src/services/emergencyService';
import { capturarLocalizacaoAtual } from '../src/services/locationService';

const COUNTDOWN_START = 10;
const SLIDER_WIDTH = 320;
const KNOB_SIZE = 58;
const TRACK_PADDING = 4;
const MAX_DRAG = SLIDER_WIDTH - KNOB_SIZE - TRACK_PADDING * 2;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function EmergenciaScreen() {
    const [countdown, setCountdown] = useState(COUNTDOWN_START);
    const [cancelado, setCancelado] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [mostrarOverlaySucesso, setMostrarOverlaySucesso] = useState(false);
    const [mostrarOverlayCancelado, setMostrarOverlayCancelado] = useState(false);

    const dragX = useRef(new Animated.Value(0)).current;
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const countdownRef = useRef(COUNTDOWN_START);
    const canceladoRef = useRef(false);
    const enviadoRef = useRef(false);

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const telaOpacity = useRef(new Animated.Value(1)).current;

    const successCircleScale = useRef(new Animated.Value(1)).current;
    const successCircleOpacity = useRef(new Animated.Value(0)).current;
    const successMessageOpacity = useRef(new Animated.Value(0)).current;
    const successMessageTranslateY = useRef(new Animated.Value(18)).current;

    const cancelCircleScale = useRef(new Animated.Value(0.35)).current;
    const cancelCircleOpacity = useRef(new Animated.Value(0)).current;

    const maxCircleScale = useMemo(() => {
        const diagonal = Math.sqrt(SCREEN_WIDTH * SCREEN_WIDTH + SCREEN_HEIGHT * SCREEN_HEIGHT);
        const baseSize = 120;
        return diagonal / baseSize + 2.5;
    }, []);

    useEffect(() => {
        iniciarPulso();
        iniciarContagem();

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            pulseAnim.stopAnimation();
        };
    }, []);

    function iniciarPulso() {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.06,
                    duration: 700,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 700,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }

    function pararPulso() {
        pulseAnim.stopAnimation();
        pulseAnim.setValue(1);
    }

    function iniciarContagem() {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        timerRef.current = setInterval(() => {
            if (canceladoRef.current || enviadoRef.current) {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                }
                return;
            }

            countdownRef.current -= 1;
            setCountdown(countdownRef.current);

            if (countdownRef.current > 0) {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }

            if (countdownRef.current <= 0) {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                }
                void enviarSOS();
            }
        }, 1000);
    }

    async function reproduzirAnimacaoCancelamento() {
        setMostrarOverlayCancelado(true);

        cancelCircleScale.setValue(0.35);
        cancelCircleOpacity.setValue(1);

        await new Promise<void>((resolve) => {
            Animated.parallel([
                Animated.timing(telaOpacity, {
                    toValue: 0,
                    duration: 180,
                    useNativeDriver: true,
                }),
                Animated.timing(cancelCircleScale, {
                    toValue: maxCircleScale,
                    duration: 650,
                    useNativeDriver: true,
                }),
            ]).start(() => resolve());
        });

        router.replace('/');
    }

    async function cancelarSOS() {
        if (canceladoRef.current || enviadoRef.current || enviando) return;

        canceladoRef.current = true;
        setCancelado(true);

        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        pararPulso();
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await reproduzirAnimacaoCancelamento();
    }

    async function reproduzirAnimacaoSucesso() {
        setMostrarOverlaySucesso(true);

        successCircleScale.setValue(1);
        successCircleOpacity.setValue(1);
        successMessageOpacity.setValue(0);
        successMessageTranslateY.setValue(18);

        await new Promise<void>((resolve) => {
            Animated.parallel([
                Animated.timing(telaOpacity, {
                    toValue: 0,
                    duration: 180,
                    useNativeDriver: true,
                }),
                Animated.timing(successCircleScale, {
                    toValue: maxCircleScale,
                    duration: 700,
                    useNativeDriver: true,
                }),
            ]).start(() => resolve());
        });

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        await new Promise<void>((resolve) => {
            Animated.parallel([
                Animated.timing(successMessageOpacity, {
                    toValue: 1,
                    duration: 350,
                    useNativeDriver: true,
                }),
                Animated.timing(successMessageTranslateY, {
                    toValue: 0,
                    duration: 350,
                    useNativeDriver: true,
                }),
            ]).start(() => resolve());
        });

        setTimeout(() => {
            router.replace('/');
        }, 1200);
    }

    async function enviarSOS() {
        if (canceladoRef.current || enviadoRef.current || enviando) return;

        setEnviando(true);
        enviadoRef.current = true;
        setEnviado(true);
        pararPulso();

        try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

            let latitude: number | null = null;
            let longitude: number | null = null;

            try {
                const localizacao = await capturarLocalizacaoAtual();
                latitude = localizacao?.latitude ?? null;
                longitude = localizacao?.longitude ?? null;
            } catch (error) {
                console.log('Falha ao capturar localização:', error);
            }

            const evento = {
                tipo: 'sos',
                descricao: 'Pedido manual de ajuda pelo botão SOS',
                origem: 'app_idoso',
                status: 'pendente',
                latitude,
                longitude,
                registrado_em: new Date().toISOString(),
            };

            let localId: number | null = null;

            try {
                const eventoLocal = await registrarEventoEmergenciaLocal(evento);
                localId = eventoLocal?.id ?? null;
            } catch (error) {
                console.log('Falha ao registrar localmente:', error);
            }

            try {
                await enviarEventoEmergenciaParaApi({
                    ...evento,
                    local_id: localId,
                });
            } catch (error) {
                console.log('Falha ao enviar para API, seguindo fluxo visual:', error);
            }

            await reproduzirAnimacaoSucesso();
        } catch (error) {
            console.log('Erro inesperado no fluxo SOS:', error);

            setEnviando(false);
            enviadoRef.current = false;
            setEnviado(false);
            countdownRef.current = COUNTDOWN_START;
            setCountdown(COUNTDOWN_START);
            canceladoRef.current = false;
            setCancelado(false);
            dragX.setValue(0);
            telaOpacity.setValue(1);
            successCircleOpacity.setValue(0);
            successMessageOpacity.setValue(0);
            successMessageTranslateY.setValue(18);
            cancelCircleOpacity.setValue(0);
            cancelCircleScale.setValue(0.35);
            setMostrarOverlaySucesso(false);
            setMostrarOverlayCancelado(false);

            iniciarPulso();
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
            <Animated.View style={[styles.container, { opacity: telaOpacity }]}>
                <Pressable
                    style={styles.closeButton}
                    onPress={() => router.back()}
                    disabled={enviado || enviando || cancelado}
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
                        <Animated.View
                            style={[
                                styles.countdownCircle,
                                {
                                    transform: [{ scale: enviado || enviando || cancelado ? 1 : pulseAnim }],
                                },
                            ]}
                        >
                            <Text style={styles.countdownText}>
                                {enviado || enviando ? '✓' : cancelado ? '×' : countdown}
                            </Text>
                        </Animated.View>
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
            </Animated.View>

            {mostrarOverlaySucesso && (
                <View pointerEvents="none" style={styles.successOverlay}>
                    <Animated.View
                        style={[
                            styles.successCircleFill,
                            {
                                opacity: successCircleOpacity,
                                transform: [{ scale: successCircleScale }],
                            },
                        ]}
                    />

                    <Animated.View
                        style={[
                            styles.successMessageWrap,
                            {
                                opacity: successMessageOpacity,
                                transform: [{ translateY: successMessageTranslateY }],
                            },
                        ]}
                    >
                        <MaterialIcons name="check-circle" size={64} color="#FFFFFF" />
                        <Text style={styles.successTitle}>SOS enviado com sucesso</Text>
                        <Text style={styles.successSubtitle}>
                            Sua solicitação de ajuda foi registrada.
                        </Text>
                    </Animated.View>
                </View>
            )}

            {mostrarOverlayCancelado && (
                <View pointerEvents="none" style={styles.cancelOverlay}>
                    <Animated.View
                        style={[
                            styles.cancelCircleFill,
                            {
                                opacity: cancelCircleOpacity,
                                transform: [{ scale: cancelCircleScale }],
                            },
                        ]}
                    />
                </View>
            )}
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

    successOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },

    successCircleFill: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F26D6D',
    },

    successMessageWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
    },

    successTitle: {
        marginTop: 18,
        fontSize: 30,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
    },

    successSubtitle: {
        marginTop: 10,
        fontSize: 17,
        lineHeight: 24,
        color: '#FFFFFF',
        textAlign: 'center',
        opacity: 0.95,
        maxWidth: 300,
    },

    cancelOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        alignItems: 'center',
        overflow: 'hidden',
    },

    cancelCircleFill: {
        position: 'absolute',
        bottom: -60,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F26D6D',
    },
});