package com.subsync.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.IBinder;
import android.telephony.TelephonyManager;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class CallBackgroundService extends Service {
    private static final String TAG = "CallBackgroundService";
    private static final String CHANNEL_ID = "CallDetectionChannel";
    private CallReceiver callReceiver;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        registerCallReceiver();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // Start foreground to keep the service alive
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Subsync Call Detection")
                .setContentText("Monitoring calls for CRM")
                .setSmallIcon(R.mipmap.ic_launcher)
                .setPriority(NotificationCompat.PRIORITY_MIN)
                .setOngoing(true)
                .build();
                
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) { // Android 14+
            startForeground(1002, notification, 
                    android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL | 
                    android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        } else {
            startForeground(1002, notification);
        }

        return START_STICKY; // Restart if killed by OS
    }

    private void registerCallReceiver() {
        if (callReceiver == null) {
            callReceiver = new CallReceiver();
            IntentFilter filter = new IntentFilter();
            filter.addAction(TelephonyManager.ACTION_PHONE_STATE_CHANGED);
            filter.addAction(Intent.ACTION_NEW_OUTGOING_CALL);
            
            Log.d(TAG, "Registering dynamic CallReceiver");
            registerReceiver(callReceiver, filter);
        }
    }

    private void unregisterCallReceiver() {
        if (callReceiver != null) {
            Log.d(TAG, "Unregistering dynamic CallReceiver");
            try {
                unregisterReceiver(callReceiver);
            } catch (Exception e) {
                Log.e(TAG, "Error unregistering receiver", e);
            }
            callReceiver = null;
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        unregisterCallReceiver();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "Call Detection Service",
                    NotificationManager.IMPORTANCE_LOW
            );
            serviceChannel.setDescription("Required to monitor calls in the background for CRM logging");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(serviceChannel);
            }
        }
    }
}
