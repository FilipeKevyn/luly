import { Alert, Platform, ToastAndroid } from 'react-native';

export function showNotice(message: string, title = 'Luly') {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    return;
  }
  if (Platform.OS === 'web') {
    window.alert(message);
    return;
  }
  Alert.alert(title, message);
}
