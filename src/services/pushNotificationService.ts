import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/src/lib/supabase';
import { Capacitor } from '@capacitor/core';

export const PushNotificationService = {
  async init() {
    if (Capacitor.getPlatform() === 'web') {
      console.log('Push notifications are not supported on web.');
      return;
    }

    // Request permission to use push notifications
    // iOS will prompt user and return if they granted permission or not
    // Android will grant without prompting
    await PushNotifications.requestPermissions().then(result => {
      if (result.receive === 'granted') {
        // Register with Apple / Google to receive push via APNS/FCM
        PushNotifications.register();
      } else {
        // Show some error
        console.error('Push notification permission denied.');
      }
    });

    // On success, we should be able to receive notifications
    PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration success, token: ' + token.value);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Save token to your profiles table
        const { error } = await supabase
          .from('profiles')
          .update({ push_token: token.value })
          .eq('id', session.user.id);
          
        if (error) {
          console.error('Error saving push token:', error);
        } else {
          console.log('Push token saved to Supabase');
        }
      }
    });

    // Some error occurred
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    // Show us the notification payload if the app is open on our device
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received: ' + JSON.stringify(notification));
    });

    // Method called when tapping on a notification
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push action performed: ' + JSON.stringify(notification));
    });
  },

  async removeToken() {
    if (Capacitor.getPlatform() === 'web') return;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase
        .from('profiles')
        .update({ push_token: null })
        .eq('id', session.user.id);
    }
  }
};
