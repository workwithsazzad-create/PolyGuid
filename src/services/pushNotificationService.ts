import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/src/lib/supabase';
import { Capacitor } from '@capacitor/core';

export const PushNotificationService = {
  async init() {
    if (Capacitor.getPlatform() === 'web') {
      if ('Notification' in window) {
        console.log('Web Notification permission status:', Notification.permission);
        try {
          const permission = await Notification.requestPermission();
          console.log('Result of Web Notification request:', permission);
          if (permission === 'granted') {
            new Notification('স্বাগতম!', {
              body: 'আপনি এখন থেকে সকল গুরুত্বপূর্ণ আপডেট পাবেন।',
              icon: '/hero.png'
            });
          }
        } catch (e) {
          console.error('Error requesting web notification permission:', e);
        }
      } else {
        console.warn('Push notifications / Notifications API not supported on this browser.');
      }
      return;
    }

    // Request permission to use push notifications
    // iOS will prompt user and return if they granted permission or not
    // Android will grant without prompting (on older versions) or prompt on 13+
    try {
      const status = await PushNotifications.checkPermissions();
      console.log('Current Push Status:', status.receive);

      if (status.receive !== 'granted') {
        const result = await PushNotifications.requestPermissions();
        if (result.receive === 'granted') {
          PushNotifications.register();
        } else {
          console.warn('Push permission denied after request');
        }
      } else {
        // Already granted, just register
        PushNotifications.register();
      }
    } catch (e) {
      console.error('Error in Push init:', e);
    }

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
