package com.subsync.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "BootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        Log.d(TAG, "onReceive action: " + action);

        if (Intent.ACTION_BOOT_COMPLETED.equals(action)
                || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)
                || "com.subsync.app.ACTION_KEEP_ALIVE".equals(action)
                || Intent.ACTION_USER_PRESENT.equals(action)
                || Intent.ACTION_POWER_CONNECTED.equals(action)
                || Intent.ACTION_POWER_DISCONNECTED.equals(action)) {

            // Check if user has disabled the service explicitly
            boolean shouldListen = context.getSharedPreferences("CallTrackerPrefs", Context.MODE_PRIVATE)
                    .getBoolean("shouldListen", true);

            if (!shouldListen) {
                Log.d(TAG, "shouldListen is false. Skipping service startup.");
                return;
            }

            boolean isRunning = CallTracker.isServiceRunning(context, CallBackgroundService.class);
            if (!isRunning) {
                Log.i(TAG, "CallBackgroundService is not running. Starting service...");
                Intent serviceIntent = new Intent(context, CallBackgroundService.class);
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        context.startForegroundService(serviceIntent);
                    } else {
                        context.startService(serviceIntent);
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Failed to start CallBackgroundService from background", e);
                }
            } else {
                Log.d(TAG, "CallBackgroundService is already running.");
            }

            // Always reschedule the keep-alive to keep the chain active
            CallTracker.scheduleKeepAlive(context);
        }
    }
}
