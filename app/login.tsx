import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { loginIdoso } from '../src/services/apiService';
import { salvarSessaoIdoso } from '../src/services/sessionService';

export default function LoginScreen() {
    const [cpf, setCpf] = useState('');
    const [email, setEmail] = useState('');
    const [carregando, setCarregando] = useState(false);

    async function entrar() {
        try {
            setCarregando(true);

            const resposta = await loginIdoso({
                cpf,
                email,
            });

            if (!resposta?.idoso) {
                throw new Error('Dados do idoso não encontrados.');
            }

            await salvarSessaoIdoso({
                id: resposta.idoso.id,
                nome: resposta.idoso.nome,
                cpf: resposta.idoso.cpf,
                email: resposta.idoso.email,
                telefone: resposta.idoso.telefone ?? null,
                horario_teste_vida: resposta.idoso.horario_teste_vida ?? null,
                tempo_resposta_teste_vida: resposta.idoso.tempo_resposta_teste_vida ?? null,
            });

            router.replace('/');
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Falha ao entrar.');
        } finally {
            setCarregando(false);
        }
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.title}>Entrar</Text>
                <Text style={styles.subtitle}>Informe seu CPF e e-mail.</Text>

                <TextInput
                    style={styles.input}
                    placeholder="CPF"
                    keyboardType="numeric"
                    value={cpf}
                    onChangeText={setCpf}
                />

                <TextInput
                    style={styles.input}
                    placeholder="E-mail"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                />

                <Pressable style={styles.button} onPress={entrar} disabled={carregando}>
                    {carregando ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.buttonText}>Entrar</Text>
                    )}
                </Pressable>

                <Pressable onPress={() => router.push('/cadastro-idoso')}>
                    <Text style={styles.link}>Cadastrar idoso</Text>
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
        justifyContent: 'center',
        padding: 24,
    },
    title: {
        fontSize: 30,
        fontWeight: '800',
        color: '#1F2937',
    },
    subtitle: {
        marginTop: 8,
        marginBottom: 24,
        fontSize: 16,
        color: '#6B7280',
    },
    input: {
        backgroundColor: '#FFFFFF',
        height: 56,
        borderRadius: 14,
        paddingHorizontal: 16,
        marginBottom: 14,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#1976D2',
        height: 56,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
    link: {
        marginTop: 18,
        textAlign: 'center',
        color: '#1976D2',
        fontSize: 16,
        fontWeight: '700',
    },
});