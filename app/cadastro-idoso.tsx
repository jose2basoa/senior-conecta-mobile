import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput
} from 'react-native';
import { cadastrarIdosoStep1 } from '../src/services/apiService';

export default function CadastroIdosoScreen() {
    const [nome, setNome] = useState('');
    const [dataNascimento, setDataNascimento] = useState('');
    const [sexo, setSexo] = useState('');
    const [cpf, setCpf] = useState('');
    const [telefone, setTelefone] = useState('');
    const [email, setEmail] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [carregando, setCarregando] = useState(false);

    async function cadastrar() {
        try {
            setCarregando(true);

            await cadastrarIdosoStep1({
                nome,
                data_nascimento: dataNascimento,
                sexo,
                cpf,
                telefone,
                email,
                observacoes,
            });

            Alert.alert('Sucesso', 'Cadastro realizado com sucesso.');
            router.replace('/login');
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Não foi possível cadastrar.');
        } finally {
            setCarregando(false);
        }
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Cadastro do idoso</Text>
                <Text style={styles.subtitle}>Preencha os dados iniciais.</Text>

                <TextInput style={styles.input} placeholder="Nome" value={nome} onChangeText={setNome} />
                <TextInput
                    style={styles.input}
                    placeholder="Data de nascimento (AAAA-MM-DD)"
                    value={dataNascimento}
                    onChangeText={setDataNascimento}
                />
                <TextInput style={styles.input} placeholder="Sexo" value={sexo} onChangeText={setSexo} />
                <TextInput
                    style={styles.input}
                    placeholder="CPF"
                    keyboardType="numeric"
                    value={cpf}
                    onChangeText={setCpf}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Telefone"
                    keyboardType="phone-pad"
                    value={telefone}
                    onChangeText={setTelefone}
                />
                <TextInput
                    style={styles.input}
                    placeholder="E-mail"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                />
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Observações"
                    multiline
                    value={observacoes}
                    onChangeText={setObservacoes}
                />

                <Pressable style={styles.button} onPress={cadastrar} disabled={carregando}>
                    {carregando ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.buttonText}>Cadastrar</Text>
                    )}
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F4F6F8',
    },
    container: {
        padding: 24,
        paddingBottom: 40,
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
        minHeight: 56,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 14,
        fontSize: 16,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
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
});