import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
return (
    <View style={styles.container}>
        <Text style={styles.title}>Sênior Conecta</Text>
        <Text style={styles.subtitle}>Acompanhamento e segurança diária</Text>

    <Pressable style={styles.primaryButton} onPress={() => router.push('/emergencia')}>
        <Text style={styles.primaryButtonText}>Botão de Emergência</Text>
    </Pressable>

    <Pressable style={styles.button} onPress={() => router.push('/medicamentos')}>
        <Text style={styles.buttonText}>Medicamentos</Text>
    </Pressable>

    <Pressable style={styles.button} onPress={() => router.push('/teste-vida')}>
        <Text style={styles.buttonText}>Teste de Vida</Text>
    </Pressable>

    <Pressable style={styles.button} onPress={() => router.push('/historico')}>
        <Text style={styles.buttonText}>Histórico</Text>
    </Pressable>

    <Pressable style={styles.button} onPress={() => router.push('/configuracoes')}>
        <Text style={styles.buttonText}>Configurações</Text>
    </Pressable>
    </View>
);
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24, justifyContent: 'center', gap: 16 },
    title: { fontSize: 30, fontWeight: '700', textAlign: 'center' },
    subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 16 },
    primaryButton: { backgroundColor: '#C62828', padding: 20, borderRadius: 16 },
    primaryButtonText: { color: '#fff', textAlign: 'center', fontSize: 18, fontWeight: '700' },
    button: { backgroundColor: '#1565C0', padding: 18, borderRadius: 16 },
    buttonText: { color: '#fff', textAlign: 'center', fontSize: 17, fontWeight: '600' },
});