import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
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
    try {
      const status = await PushNotifications.checkPermissions();
      console.log('Push Notification Current Status:', status.receive);

      if (status.receive !== 'granted') {
        console.log('Requesting push permissions...');
        const result = await PushNotifications.requestPermissions();
        console.log('Push permission result:', result.receive);
        
        if (result.receive === 'granted') {
          console.log('Permission granted. Registering...');
          PushNotifications.register();
        } else {
          console.warn('Push permission denied or prompt ignored:', result.receive);
        }
      } else {
        // Already granted, just register
        console.log('Permission already granted. Registering...');
        PushNotifications.register();
      }
      
      // Also request Local Notifications permission (required for foreground on some platforms)
      const localStatus = await LocalNotifications.checkPermissions();
      if (localStatus.display !== 'granted') {
        await LocalNotifications.requestPermissions();
      }
    } catch (e) {
      console.error('CRITICAL: Error in Push init:', e);
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
    PushNotifications.addListener('pushNotificationReceived', async (notification) => {
      console.log('Push received in foreground: ' + JSON.stringify(notification));
      
      // If the app is in the foreground, manually trigger a local notification 
      // so the user sees it "outside" the app (system-level)
      await LocalNotifications.schedule({
        notifications: [
          {
            title: notification.title || 'নতুন নোটিফিকেশন',
            body: notification.body || '',
            id: new Date().getTime(),
            schedule: { at: new Date(Date.now() + 100) },
            sound: 'default',
            attachments: [],
            extra: notification.data
          }
        ]
      });
    });

    // Method called when tapping on a notification
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push action performed: ' + JSON.stringify(notification));
    });
  },

  async sendTestNotification() {
    if (Capacitor.getPlatform() === 'web') {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('টেস্ট নোটিফিকেশন', {
          body: 'এটি একটি টেস্ট নোটিফিকেশন। আপনার সিস্টেম ঠিকভাবে কাজ করছে।',
          icon: '/hero.png'
        });
      } else {
        alert('Web notifications not granted or supported.');
      }
      return;
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'সিস্টেম টেস্ট',
            body: 'আপনার নোটিফিকেশন সিস্টেম এখন সক্রিয় এবং সঠিকভাবে কাজ করছে।',
            id: 1,
            schedule: { at: new Date(Date.now() + 500) },
            sound: 'default'
          }
        ]
      });
    } catch (e) {
      console.error('Test notification failed:', e);
    }
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
