import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { supabase } from '@/src/lib/supabase';
import { Capacitor } from '@capacitor/core';

export const PushNotificationService = {
  async init() {
    if (Capacitor.getPlatform() === 'web') {
      console.log('Push notifications are skipped on web platform.');
      return;
    }

    try {
      // Create a notification channel for Android (Crucial for Android 8+)
      if (Capacitor.getPlatform() === 'android') {
        const channelId = 'fcm_fallback_notification_channel';
        await LocalNotifications.createChannel({
          id: channelId,
          name: 'General Notifications',
          description: 'Used for important updates and results',
          importance: 5, // Max importance for popup
          visibility: 1, // Public
          vibration: true
        });
        console.log('Notification channel created');
      }

      // Request permission to use push notifications
      const status = await PushNotifications.checkPermissions();
      
      if (status.receive !== 'granted') {
        const result = await PushNotifications.requestPermissions();
        if (result.receive === 'granted') {
          await PushNotifications.register();
        }
      } else {
        await PushNotifications.register();
      }
      
      // Also request Local Notifications permission (required for foreground on some platforms)
      const localStatus = await LocalNotifications.checkPermissions();
      if (localStatus.display !== 'granted') {
        await LocalNotifications.requestPermissions();
      }

      this.setupListeners();
    } catch (e) {
      console.error('Push Notification Initialization Error:', e);
    }
  },

  async setupListeners() {
    // On success, we should be able to receive notifications
    PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration success, token: ' + token.value);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase
          .from('profiles')
          .update({ push_token: token.value })
          .eq('id', session.user.id);
      }
    });

    // Handle incoming notifications (Foreground)
    PushNotifications.addListener('pushNotificationReceived', async (notification) => {
      console.log('Foreground Push received:', notification);
      
      await LocalNotifications.schedule({
        notifications: [
          {
            title: notification.title || 'নতুন আপডেট',
            body: notification.body || '',
            id: new Date().getTime(),
            schedule: { at: new Date(Date.now() + 100) },
            sound: 'default',
            channelId: 'fcm_fallback_notification_channel',
            extra: notification.data
          }
        ]
      });
    });

    // Handle notification tap
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Notification tapped:', notification);
    });
  },

  async sendTestNotification() {
    if (Capacitor.getPlatform() === 'web') {
      alert('সিস্টেম চেক: আপনার ব্রাউজারে নোটিফিকেশন বন্ধ আছে বা এটি শুধু অ্যাপের জন্য প্রযোজ্য।');
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
