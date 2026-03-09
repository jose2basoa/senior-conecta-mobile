import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { db } from '../src/db/database';

export default function EmergencyScreen() {
    const acionarEmergencia = () => {
        const agora = new Date().toISOString();

        db.runSync(
        'INSERT INTO emergency_events (tipo, descricao, criado_em) VALUES (?, ?, ?)',
        ['manual', 'Botão de emergência acionado pelo usuário', agora]
        );

        Alert.alert('Emergência registrada', 'O pedido de ajuda foi salvo no aplicativo.');
    };

    return (
        <View style={styles.container}>
        <Text style={styles.title}>Precisa de ajuda?</Text>

        <Pressable style={styles.button} onPress={acionarEmergencia}>
            <Text style={styles.buttonText}>ACONAR EMERGÊNCIA</Text>
        </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 24 },    
    title: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 24 },
    button: { backgroundColor: '#D32F2F', padding: 28, borderRadius: 20 },
    buttonText: { color: '#fff', textAlign: 'center', fontWeight: '700', fontSize: 20 },
});