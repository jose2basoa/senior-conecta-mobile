import * as Notifications from 'expo-notifications';

export async function solicitarPermissaoNotificacao() {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
}

export async function agendarNotificacaoMedicamento(nome: string, body: string, hour: number, minute: number) {
    await Notifications.scheduleNotificationAsync({
        content: {
        title: `Hora do medicamento: ${nome}`,
        body,
        },
        trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        },
    });
}