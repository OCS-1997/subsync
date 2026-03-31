package com.subsync.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.pm.ServiceInfo;
import android.content.Context;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.provider.Settings;
import android.util.Log;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;
import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.animation.ObjectAnimator;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import org.json.JSONException;
import org.json.JSONObject;

public class CallOverlayService extends Service {
    private static final String TAG = "CallOverlayService";
    private static final String CHANNEL_ID = "CallOverlayChannel";
    public static final String EXTRA_CALL_PHONE = "subsync_call_phone";
    public static final String EXTRA_CALL_NAME = "subsync_call_name";
    public static final String EXTRA_CALL_DURATION = "subsync_call_duration";
    public static final String EXTRA_CALL_TYPE = "subsync_call_type";
    public static final String EXTRA_CALL_ID = "subsync_call_id";
    private WindowManager windowManager;
    private View overlayView;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // Start foreground notification IMMEDIATELY on Android 14+ to avoid crash/blocking
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Subsync Call Tracker")
                .setContentText("Processing call details...")
                .setSmallIcon(R.mipmap.ic_launcher)
                .setPriority(NotificationCompat.PRIORITY_MIN)
                .build();
                
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(1001, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        } else {
            startForeground(1001, notification);
        }

        if (intent != null) {
            final String initialNumber = intent.getStringExtra("number");
            final int initialDuration = intent.getIntExtra("duration", 0);
            final String initialType = intent.getStringExtra("type");
            final String initialName = intent.getStringExtra("name");
            final String initialCallId = intent.getStringExtra("callId");

            // Refine in background: pull from CallLog after a short delay to be sure it's updated
            new Thread(() -> {
                Log.d(TAG, "Refinement thread started for " + initialNumber);
                
                String finalNumber = initialNumber != null ? initialNumber : "";
                int finalDuration = initialDuration;
                String finalType = initialType != null ? initialType : "unknown";
                String finalName = initialName;
                final String finalCallId = initialCallId;
                String finalCompany = null;
                String finalEntityType = null;

                // Poll for CallLog (up to 3 seconds)
                boolean foundInLog = false;
                for (int i = 0; i < 3; i++) {
                    try { Thread.sleep(1000); } catch (InterruptedException e) {}
                    
                    try {
                        android.database.Cursor cursor = getContentResolver().query(
                            android.provider.CallLog.Calls.CONTENT_URI,
                            new String[] { 
                                android.provider.CallLog.Calls.NUMBER, 
                                android.provider.CallLog.Calls.DURATION, 
                                android.provider.CallLog.Calls.TYPE,
                                android.provider.CallLog.Calls.CACHED_NAME 
                            },
                            null, null, 
                            android.provider.CallLog.Calls.DATE + " DESC LIMIT 1"
                        );

                        if (cursor != null && cursor.moveToFirst()) {
                            String logNumber = cursor.getString(cursor.getColumnIndexOrThrow(android.provider.CallLog.Calls.NUMBER));
                            int logDuration = cursor.getInt(cursor.getColumnIndexOrThrow(android.provider.CallLog.Calls.DURATION));
                            int logType = cursor.getInt(cursor.getColumnIndexOrThrow(android.provider.CallLog.Calls.TYPE));
                            String cachedName = cursor.getString(cursor.getColumnIndexOrThrow(android.provider.CallLog.Calls.CACHED_NAME));
                            cursor.close();

                            // Verify if it's likely the same call (matching number or if captured number was empty)
                            boolean isMatch = finalNumber.isEmpty();
                            if (!isMatch && logNumber != null) {
                                String cleanFinal = finalNumber.replaceAll("[^0-9]", "");
                                String cleanLog = logNumber.replaceAll("[^0-9]", "");
                                isMatch = (!cleanFinal.isEmpty() && cleanLog.contains(cleanFinal)) ||
                                          (!cleanLog.isEmpty() && cleanFinal.contains(cleanLog));
                            }
                            if (isMatch) {
                                finalNumber = logNumber != null ? logNumber : finalNumber;
                                if (logDuration > 0) finalDuration = logDuration;
                                finalType = mapCallType(logType);
                                if (finalName == null || finalName.isEmpty()) finalName = cachedName;
                                foundInLog = true;
                                break;
                            }
                        } else if (cursor != null) {
                            cursor.close();
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "Error querying log in thread", e);
                    }
                }

                // Call information lookup
                JSONObject contactInfo = CallTracker.getInstance(getApplicationContext()).queryContactInfo(getApplicationContext(), finalNumber);
                if (contactInfo != null) {
                    finalName = contactInfo.optString("name", finalName);
                    finalCompany = contactInfo.optString("company", "");
                    finalEntityType = contactInfo.optString("type", "");
                }

                final String resultNumber = finalNumber;
                final int resultDuration = finalDuration;
                final String resultType = finalType;
                final String resultName = finalName;
                final String resultCompany = finalCompany;
                final String resultEntityType = finalEntityType;

                new Handler(Looper.getMainLooper()).post(() -> {
                    // Emit event to app immediately for in-app prompt
                    CallDetectorPlugin plugin = CallTracker.getInstance(getApplicationContext()).getPlugin();
                    if (plugin != null) {
                        plugin.emitCallEnded(resultNumber, resultDuration, resultType, finalCallId);
                    }
                    showOverlay(resultNumber, resultDuration, resultType, resultName, resultCompany, resultEntityType, finalCallId);
                    
                    // Auto-dismiss after 60 seconds to prevent blocking future calls
                    new Handler(Looper.getMainLooper()).postDelayed(() -> {
                        removeOverlay();
                        stopSelf();
                    }, 60000);
                });
            }).start();
        }

        return START_STICKY;
    }

    private String mapCallType(int type) {
        switch (type) {
            case android.provider.CallLog.Calls.INCOMING_TYPE: return "incoming";
            case android.provider.CallLog.Calls.OUTGOING_TYPE: return "outgoing";
            case android.provider.CallLog.Calls.MISSED_TYPE: return "missed";
            default: return "unknown";
        }
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void showOverlay(String number, int duration, String type, String name, String company, String entityType, String callId) {
        Log.d(TAG, "showOverlay called for: " + number + ", name: " + name);
        if (overlayView != null) {
            Log.d(TAG, "Overlay already exists, updating content instead of skipping");
            updateOverlayContent(number, duration, type, name, company, entityType, callId);
            return;
        }

        try {
            Context appContext = getApplicationContext();
            windowManager = (WindowManager) appContext.getSystemService(Context.WINDOW_SERVICE);
            
            boolean canDraw = true;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                canDraw = Settings.canDrawOverlays(appContext);
                if (!canDraw) {
                    Log.e(TAG, "CRITICAL: Overlay permission (SYSTEM_ALERT_WINDOW) is NOT granted. Overlay cannot be shown.");
                } else {
                    Log.d(TAG, "Overlay permission is granted.");
                }
            }

            LayoutInflater inflater = LayoutInflater.from(appContext);
            overlayView = inflater.inflate(R.layout.call_overlay, null);

            int layoutFlag;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                layoutFlag = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
            } else {
                layoutFlag = WindowManager.LayoutParams.TYPE_PHONE;
            }

            WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                    (int) (appContext.getResources().getDisplayMetrics().widthPixels * 0.96),
                    WindowManager.LayoutParams.WRAP_CONTENT,
                    layoutFlag,
                    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE 
                    | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL
                    | WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH
                    | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
                    | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
                    | WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                    | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
                    | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON,
                    PixelFormat.TRANSLUCENT);

            params.gravity = Gravity.CENTER; 
            params.windowAnimations = R.style.OverlayAnimation;

            TextView tvName = overlayView.findViewById(R.id.tv_contact_name);
            TextView tvPhone = overlayView.findViewById(R.id.tv_phone_number);
            TextView tvStatusPill = overlayView.findViewById(R.id.tv_status_pill);
            TextView tvInitials = overlayView.findViewById(R.id.tv_initials);
            View btnDismissIcon = overlayView.findViewById(R.id.btn_dismiss_icon);
            Button btnDismiss = overlayView.findViewById(R.id.btn_dismiss);
            Button btnLogCall = overlayView.findViewById(R.id.btn_log_call);

            boolean hasName = name != null && !name.trim().isEmpty();
            String displayName = hasName ? name : number;
            
            if (tvName != null) tvName.setText(displayName);
            if (tvPhone != null) tvPhone.setText(number);
            
            if (tvInitials != null) {
                if (hasName) {
                    tvInitials.setText(name.substring(0, 1).toUpperCase());
                } else {
                    tvInitials.setText("U");
                }
            }

            int mins = duration / 60;
            int secs = duration % 60;
            String timeStr = mins > 0 ? mins + "m " + secs + "s" : secs + "s";
            String safeType = type != null ? type : "unknown";
            String typeStr = safeType.substring(0, 1).toUpperCase() + safeType.substring(1);
            
            if (tvStatusPill != null) {
                if ("missed".equals(safeType)) {
                    tvStatusPill.setText("Missed call just now");
                } else {
                    tvStatusPill.setText(typeStr + " ended • " + timeStr + " ago");
                }
            }

            if (btnDismissIcon != null) {
                btnDismissIcon.setOnClickListener(v -> {
                    removeOverlay();
                    stopSelf();
                });
            }

            btnDismiss.setOnClickListener(v -> {
                removeOverlay();
                stopSelf();
            });
            btnLogCall.setOnClickListener(v -> {
                CallTracker.getInstance(getApplicationContext()).addPendingCallToQueue(number, duration, type, name, callId);
                forceAppToForeground(number, duration, type, name, callId);
                new Handler(Looper.getMainLooper()).postDelayed(() -> {
                    CallDetectorPlugin plugin = CallTracker.getInstance(getApplicationContext()).getPlugin();
                    if (plugin != null)
                        plugin.emitPendingCallsAvailable();
                    removeOverlay();
                    stopSelf();
                }, 1000);
            });

            setupSwipeToDismiss(overlayView, params);
            try {
                windowManager.addView(overlayView, params);
            } catch (WindowManager.BadTokenException e) {
                Log.e(TAG, "Overlay permission denied or invalid token", e);
                CallTracker.getInstance(getApplicationContext()).addPendingCallToQueue(number, duration, type, name, callId);
                forceAppToForeground(number, duration, type, name, callId);
                stopSelf();
            }
        } catch (Exception e) {
            Log.e(TAG, "Overlay error", e);
            CallTracker.getInstance(getApplicationContext()).addPendingCallToQueue(number, duration, type, name, callId);
            forceAppToForeground(number, duration, type, name, callId);
            stopSelf();
        }
    }

    private void updateOverlayContent(String number, int duration, String type, String name, String company, String entityType, String callId) {
        try {
            TextView tvName = overlayView.findViewById(R.id.tv_contact_name);
            TextView tvPhone = overlayView.findViewById(R.id.tv_phone_number);
            TextView tvStatusPill = overlayView.findViewById(R.id.tv_status_pill);
            TextView tvInitials = overlayView.findViewById(R.id.tv_initials);
            Button btnLogCall = overlayView.findViewById(R.id.btn_log_call);

            boolean hasName = name != null && !name.trim().isEmpty();
            String displayName = hasName ? name : number;
            
            if (tvName != null) tvName.setText(displayName);
            if (tvPhone != null) tvPhone.setText(number);
            
            if (tvInitials != null) {
                if (hasName) {
                    tvInitials.setText(name.substring(0, 1).toUpperCase());
                } else {
                    tvInitials.setText("U");
                }
            }

            int mins = duration / 60;
            int secs = duration % 60;
            String timeStr = mins > 0 ? mins + "m " + secs + "s" : secs + "s";
            String safeType = type != null ? type : "unknown";
            String typeStr = safeType.substring(0, 1).toUpperCase() + safeType.substring(1);
            
            if (tvStatusPill != null) {
                if ("missed".equals(safeType)) {
                    tvStatusPill.setText("Missed call just now");
                } else {
                    tvStatusPill.setText(typeStr + " ended • " + timeStr + " ago");
                }
            }

            btnLogCall.setOnClickListener(v -> {
                CallTracker.getInstance(getApplicationContext()).addPendingCallToQueue(number, duration, type, name, callId);
                forceAppToForeground(number, duration, type, name, callId);
                new Handler(Looper.getMainLooper()).postDelayed(() -> {
                    CallDetectorPlugin plugin = CallTracker.getInstance(getApplicationContext()).getPlugin();
                    if (plugin != null)
                        plugin.emitPendingCallsAvailable();
                    removeOverlay();
                    stopSelf();
                }, 1000);
            });
        } catch (Exception e) {
            Log.e(TAG, "Update overlay error", e);
        }
    }

    private void setupSwipeToDismiss(View view, WindowManager.LayoutParams params) {
        view.setOnTouchListener(new View.OnTouchListener() {
            private float initialY, initialTouchY;
            private int swipeThreshold = 50;

            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        initialY = params.y;
                        initialTouchY = event.getRawY();
                        return false; 
                    case MotionEvent.ACTION_MOVE:
                        params.y = (int) (initialY + (initialTouchY - event.getRawY()));
                        windowManager.updateViewLayout(overlayView, params);
                        return true;
                    case MotionEvent.ACTION_UP:
                        if (Math.abs(initialTouchY - event.getRawY()) > swipeThreshold)
                            dismissWithAnimation(params, (initialTouchY - event.getRawY()) > 0);
                        else
                            snapBack(params);
                        return true;
                }
                return false;
            }
        });
    }

    private void dismissWithAnimation(WindowManager.LayoutParams params, boolean toUp) {
        float targetY = toUp ? getResources().getDisplayMetrics().heightPixels : -getResources().getDisplayMetrics().heightPixels;
        ObjectAnimator animator = ObjectAnimator.ofInt(params, "y", params.y, (int) targetY);
        animator.setDuration(300);
        animator.addUpdateListener(animation -> {
            if (overlayView != null)
                windowManager.updateViewLayout(overlayView, params);
        });
        animator.addListener(new AnimatorListenerAdapter() {
            @Override
            public void onAnimationEnd(Animator animation) {
                removeOverlay();
                stopSelf();
            }
        });
        animator.start();
    }

    private void snapBack(WindowManager.LayoutParams params) {
        ObjectAnimator animator = ObjectAnimator.ofInt(params, "y", params.y, 0);
        animator.setDuration(200);
        animator.addUpdateListener(animation -> {
            if (overlayView != null)
                windowManager.updateViewLayout(overlayView, params);
        });
        animator.start();
    }

    private void forceAppToForeground(String number, int duration, String type, String name, String callId) {
        try {
            Intent launchIntent = new Intent(this, MainActivity.class);
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK 
                    | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
                    | Intent.FLAG_ACTIVITY_SINGLE_TOP
                    | Intent.FLAG_ACTIVITY_CLEAR_TOP
                    | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
            if (number != null)
                launchIntent.putExtra(EXTRA_CALL_PHONE, number);
            if (name != null)
                launchIntent.putExtra(EXTRA_CALL_NAME, name);
            if (callId != null)
                launchIntent.putExtra(EXTRA_CALL_ID, callId);
            launchIntent.putExtra(EXTRA_CALL_DURATION, duration);
            launchIntent.putExtra(EXTRA_CALL_TYPE, type);
            startActivity(launchIntent);
        } catch (Exception e) {
            Log.e(TAG, "Foreground launch error", e);
        }
    }

    private void removeOverlay() {
        if (overlayView != null && windowManager != null) {
            try {
                windowManager.removeView(overlayView);
            } catch (Exception e) {
                Log.e(TAG, "Remove overlay error", e);
            }
            overlayView = null;
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        removeOverlay();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(CHANNEL_ID, "Call Overlay",
                    NotificationManager.IMPORTANCE_LOW);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null)
                manager.createNotificationChannel(serviceChannel);
        }
    }
}
