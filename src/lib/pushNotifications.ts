import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const platform = Platform.OS === 'ios' ? 'ios' : 'android';

async function log(userId: string, stage: string, message: string) {
  await supabase.from('push_debug_log').insert({ user_id: userId, platform, stage, message });
}

export async function registerForPushNotifications(userId: string) {
  await log(userId, 'start', `isDevice=${Device.isDevice}`);
  if (!Device.isDevice) return;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
      });
      await log(userId, 'channel', 'ok');
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    await log(userId, 'existing_permission', existingStatus);
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      await log(userId, 'requested_permission', status);
    }
    if (finalStatus !== 'granted') {
      await log(userId, 'abort', `final status not granted: ${finalStatus}`);
      return;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? (Constants as any).easConfig?.projectId;
    await log(userId, 'project_id', String(projectId));
    if (!projectId) {
      await log(userId, 'abort', 'no projectId resolved');
      return;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await log(userId, 'token', token ? token.slice(0, 24) + '…' : 'empty');

    const { error } = await supabase.from('push_tokens').upsert(
      { user_id: userId, token, platform },
      { onConflict: 'user_id,token' }
    );
    await log(userId, 'upsert', error ? `error: ${error.message}` : 'ok');
  } catch (err: any) {
    await log(userId, 'exception', err?.message ?? String(err));
  }
}
