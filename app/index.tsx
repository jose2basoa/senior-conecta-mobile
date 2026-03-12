import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function HomeScreen() {
    const scaleAnim = useRef(new Animated.Value(1)).current;

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

    async function handleSOS() {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        router.push('/emergencia');
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.topArea}>
                    <Text style={styles.title}>Sênior Conecta</Text>
                    <Text style={styles.subtitle}>Em caso de ajuda, toque no botão</Text>
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
                    <SimpleActionButton
                        title="Medicamentos"
                        icon="medication"
                        color="#1976D2"
                        onPress={() => router.push('/medicamentos')}
                    />

                    <SimpleActionButton
                        title="Estou bem"
                        icon="favorite"
                        color="#2E7D32"
                        onPress={() => router.push('/teste-vida')}
                    />

                    <SimpleActionButton
                        title="Configurações"
                        icon="settings"
                        color="#6A1B9A"
                        onPress={() => router.push('/configuracoes')}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

type SimpleActionButtonProps = {
    title: string;
    icon: keyof typeof MaterialIcons.glyphMap;
    color: string;
    onPress: () => void;
};

function SimpleActionButton({
    title,
    icon,
    color,
    onPress,
}: SimpleActionButtonProps) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: color },
                pressed && styles.actionButtonPressed,
            ]}
            onPress={onPress}
        >
            <MaterialIcons name={icon} size={32} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>{title}</Text>
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
    },

    actionButtonPressed: {
        opacity: 0.85,
    },

    actionButtonText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});