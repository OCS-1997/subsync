package com.subsync.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.pm.ServiceInfo;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.IBinder;
import android.telephony.TelephonyManager;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

public class CallBackgroundService extends Service {
    private static final String TAG = "CallBackgroundService";
    private static final String CHANNEL_ID = "CallDetectionChannel";
    private BroadcastReceiver dynamicCallReceiver;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        registerDynamicReceiver();
    }

    private void registerDynamicReceiver() {
        dynamicCallReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                CallTracker.getInstance(context).handleIntent(context, intent, null);
            }
        };
        IntentFilter filter = new IntentFilter();
        filter.addAction(TelephonyManager.ACTION_PHONE_STATE_CHANGED);
        filter.addAction(Intent.ACTION_NEW_OUTGOING_CALL);

        try {
            ContextCompat.registerReceiver(this, dynamicCallReceiver, filter, ContextCompat.RECEIVER_EXPORTED);
            Log.i(TAG, "Dynamic CallReceiver registered successfully");
        } catch (Exception e) {
            Log.e(TAG, "Failed to register dynamic CallReceiver", e);
        }
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
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_PHONE_CALL | ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        } else {
            startForeground(1002, notification);
        }

        // Schedule/refresh keep-alive alarm
        CallTracker.scheduleKeepAlive(this);

        return START_STICKY; // Restart if killed by OS
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        Log.d(TAG, "onTaskRemoved called. App swiped away.");
        boolean shouldListen = getSharedPreferences("CallTrackerPrefs", MODE_PRIVATE).getBoolean("shouldListen", true);
        if (shouldListen) {
            Log.d(TAG, "shouldListen is true. Scheduling fast keep-alive restart...");
            CallTracker.scheduleKeepAlive(this, 5000); // 5 seconds restart delay
        }
        super.onTaskRemoved(rootIntent);
    }

    @Override
    public void onDestroy() {
        if (dynamicCallReceiver != null) {
            try {
                unregisterReceiver(dynamicCallReceiver);
                Log.i(TAG, "Dynamic CallReceiver unregistered");
            } catch (Exception e) {
                Log.e(TAG, "Failed to unregister dynamic CallReceiver", e);
            }
            dynamicCallReceiver = null;
        }
        super.onDestroy();
        Log.d(TAG, "onDestroy called");
        boolean shouldListen = getSharedPreferences("CallTrackerPrefs", MODE_PRIVATE).getBoolean("shouldListen", true);
        if (shouldListen) {
            Log.d(TAG, "shouldListen is true. Scheduling fast keep-alive restart...");
            CallTracker.scheduleKeepAlive(this, 5000); // 5 seconds restart delay
        }
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
