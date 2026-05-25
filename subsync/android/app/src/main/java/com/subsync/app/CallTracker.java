package com.subsync.app;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import java.util.UUID;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.CallLog;
import android.provider.ContactsContract;
import android.telephony.TelephonyManager;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class CallTracker {
    private static final String TAG = "CallTracker";
    private static final String PREFS_NAME = "CallTrackerPrefs";
    private static CallTracker instance;
    private final SharedPreferences prefs;
    private CallDetectorPlugin plugin;

    private CallTracker(Context context) {
        prefs = context.getApplicationContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    public static synchronized CallTracker getInstance(Context context) {
        if (instance == null)
            instance = new CallTracker(context);
        return instance;
    }

    public void setPlugin(CallDetectorPlugin plugin) {
        this.plugin = plugin;
    }

    public CallDetectorPlugin getPlugin() {
        return this.plugin;
    }

    public void handleIntent(Context context, Intent intent,
            android.content.BroadcastReceiver.PendingResult pendingResult) {
        String action = intent.getAction();
        Log.i(TAG, "handleIntent: " + action);

        if ("android.intent.action.NEW_OUTGOING_CALL".equals(action)) {
            String number = intent.getStringExtra(Intent.EXTRA_PHONE_NUMBER);
            if (number != null && !number.isEmpty()) {
                prefs.edit().putString("currentPhoneNumber", number).putString("currentCallType", "outgoing").commit();
            }
            if (pendingResult != null)
                pendingResult.finish();
            return;
        }

        if (TelephonyManager.ACTION_PHONE_STATE_CHANGED.equals(action)
                || "android.intent.action.PHONE_STATE".equals(action)) {
            String stateStr = intent.getStringExtra(TelephonyManager.EXTRA_STATE);
            int state = stateFromString(stateStr);
            int previousState = prefs.getInt("previousState", TelephonyManager.CALL_STATE_IDLE);
            Log.i(TAG, "Phone state changed: " + stateStr + " (From " + previousState + ")");

            String currentPhoneNumber = prefs.getString("currentPhoneNumber", null);
            String currentCallType = prefs.getString("currentCallType", "unknown");

            if (state == TelephonyManager.CALL_STATE_RINGING) {
                currentCallType = "incoming";
                String incomingNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER);
                if (incomingNumber != null && !incomingNumber.isEmpty()) {
                    currentPhoneNumber = incomingNumber;
                    prefs.edit().putString("currentPhoneNumber", currentPhoneNumber)
                            .putString("currentCallType", "incoming").commit();
                }
            } else if (state == TelephonyManager.CALL_STATE_OFFHOOK) {
                if (previousState == TelephonyManager.CALL_STATE_IDLE && !"outgoing".equals(currentCallType)) {
                    currentCallType = "outgoing";
                    prefs.edit().putString("currentCallType", currentCallType).commit();
                }
                if (previousState != TelephonyManager.CALL_STATE_OFFHOOK) {
                    prefs.edit().putLong("callStartMs", System.currentTimeMillis()).commit();
                }
            } else if (state == TelephonyManager.CALL_STATE_IDLE) {
                if (previousState != TelephonyManager.CALL_STATE_IDLE) {
                    if (previousState == TelephonyManager.CALL_STATE_RINGING)
                        currentCallType = "missed";
                    long callStartMs = prefs.getLong("callStartMs", 0L);
                    final long durationMs = callStartMs > 0 ? System.currentTimeMillis() - callStartMs : 0;
                    final String numberToEmit = currentPhoneNumber;
                    final String typeToEmit = currentCallType;

                    prefs.edit().remove("callStartMs").remove("currentPhoneNumber").remove("currentCallType").commit();

                    String callId = UUID.randomUUID().toString();
                    Intent serviceIntent = new Intent(context, CallOverlayService.class);
                    serviceIntent.putExtra("number", numberToEmit);
                    serviceIntent.putExtra("duration", (int)(durationMs / 1000));
                    serviceIntent.putExtra("type", typeToEmit);
                    serviceIntent.putExtra("callId", callId);

                    Log.i(TAG, "Starting OverlayService for " + numberToEmit);
                    try {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                            context.startForegroundService(serviceIntent);
                        else
                            context.startService(serviceIntent);
                    } catch (Exception e) {
                        Log.e(TAG, "Failed to start OverlayService due to background limits. Queueing call immediately.", e);
                        addPendingCallToQueue(numberToEmit, (int)(durationMs / 1000), typeToEmit, null, null, null, callId);
                        if (plugin != null) {
                            plugin.emitPendingCallsAvailable();
                        }
                    }
                }
            }
            prefs.edit().putInt("previousState", state).commit();
            
            // Note: readCallLogAndEmit is no longer called here; the service does it.
            if (pendingResult != null)
                pendingResult.finish();
            return;
        }

        if (pendingResult != null)
            pendingResult.finish();
    }

    // readCallLogAndEmit logic moved to CallOverlayService for better foreground service starting


    public JSONObject queryContactInfo(Context context, String phoneNumber) {
        if (phoneNumber == null || phoneNumber.isEmpty())
            return null;
        
        // 1. Try local cache first
        JSONObject syncedContact = lookupSyncedContact(phoneNumber);
        if (syncedContact != null) {
            Log.i(TAG, "Found contact in local cache: " + syncedContact.toString());
            return syncedContact;
        }
        
        // 2. Fallback to server query
        return queryContactInfoFromServer(context, phoneNumber);
    }

    private JSONObject lookupSyncedContact(String phoneNumber) {
        String appContactsJson = prefs.getString("appContacts", null);
        if (appContactsJson == null || appContactsJson.equals("[]"))
            return null;
        try {
            JSONArray contacts = new JSONArray(appContactsJson);
            String normalizedQuery = normalizeNumber(phoneNumber);
            if (normalizedQuery.isEmpty())
                return null;
            for (int i = 0; i < contacts.length(); i++) {
                JSONObject contact = contacts.getJSONObject(i);
                if (normalizeNumber(contact.optString("phoneNumber", "")).equals(normalizedQuery))
                    return contact;
            }
        } catch (JSONException e) {
            Log.e(TAG, "Error sync lookup", e);
        }
        return null;
    }

    public JSONObject queryContactInfoFromServer(Context context, String phoneNumber) {
        if (phoneNumber == null || phoneNumber.isEmpty())
            return null;

        String apiUrl = prefs.getString("apiUrl", null);
        String token = prefs.getString("token", null);

        if (apiUrl == null || token == null) {
            Log.w(TAG, "API URL or Token not available in prefs. Skipping server lookup.");
            return null;
        }

        java.net.HttpURLConnection conn = null;
        java.io.BufferedReader reader = null;
        try {
            String urlStr = apiUrl;
            if (!urlStr.endsWith("/")) {
                urlStr += "/";
            }
            urlStr += "directory?search=" + java.net.URLEncoder.encode(phoneNumber, "UTF-8") + "&limit=1";

            Log.i(TAG, "Querying server directory: " + urlStr);
            java.net.URL url = new java.net.URL(urlStr);
            conn = (java.net.HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Authorization", "Bearer " + token);
            conn.setRequestProperty("Accept", "application/json");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);

            int responseCode = conn.getResponseCode();
            if (responseCode == 200) {
                java.io.InputStream in = conn.getInputStream();
                reader = new java.io.BufferedReader(new java.io.InputStreamReader(in, "UTF-8"));
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    response.append(line);
                }
                
                JSONObject responseJson = new JSONObject(response.toString());
                JSONArray entries = responseJson.optJSONArray("entries");
                if (entries != null && entries.length() > 0) {
                    JSONObject entry = entries.getJSONObject(0);
                    JSONObject contactObj = new JSONObject();
                    contactObj.put("name", entry.optString("name", ""));
                    contactObj.put("company", entry.optString("company_name", ""));
                    contactObj.put("type", entry.optString("entity_type", ""));
                    contactObj.put("phoneNumber", entry.optString("phone_number", phoneNumber));
                    contactObj.put("id", entry.optString("id", ""));
                    Log.i(TAG, "Found contact on server: " + contactObj.toString());
                    return contactObj;
                }
            } else {
                Log.e(TAG, "Server query failed with response code: " + responseCode);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error querying contact from server", e);
        } finally {
            if (reader != null) {
                try { reader.close(); } catch (Exception e) {}
            }
            if (conn != null) {
                conn.disconnect();
            }
        }
        return null;
    }

    public JSONArray getPendingCalls() {
        String pendingStr = prefs.getString("pendingCalls", null);
        if (pendingStr != null) {
            try {
                return new JSONArray(pendingStr);
            } catch (JSONException e) {
                prefs.edit().remove("pendingCalls").commit();
            }
        }
        return null;
    }

    public void clearPendingCalls() {
        prefs.edit().remove("pendingCalls").commit();
    }

    public void addPendingCallToQueue(String phoneNumber, int duration, String callType, String name, String company, String entityType, String callId) {
        try {
            JSONObject callObj = new JSONObject();
            callObj.put("phoneNumber", phoneNumber);
            callObj.put("duration", duration);
            callObj.put("callType", callType);
            callObj.put("name", name);
            callObj.put("company", company);
            callObj.put("entityType", entityType);
            callObj.put("callId", callId != null ? callId : UUID.randomUUID().toString());
            callObj.put("timestamp", System.currentTimeMillis());
            String pendingStr = prefs.getString("pendingCalls", "[]");
            JSONArray pendingArray = new JSONArray(pendingStr);
            pendingArray.put(callObj);
            prefs.edit().putString("pendingCalls", pendingArray.toString()).commit();
        } catch (JSONException e) {
            Log.e(TAG, "Error pending", e);
        }
    }

    private String normalizeNumber(String number) {
        if (number == null)
            return "";
        String normalized = number.replaceAll("[^0-9]", "");
        if (normalized.length() > 10)
            return normalized.substring(normalized.length() - 10);
        return normalized;
    }

    private int stateFromString(String s) {
        if (TelephonyManager.EXTRA_STATE_RINGING.equals(s))
            return TelephonyManager.CALL_STATE_RINGING;
        if (TelephonyManager.EXTRA_STATE_OFFHOOK.equals(s))
            return TelephonyManager.CALL_STATE_OFFHOOK;
        return TelephonyManager.CALL_STATE_IDLE;
    }

    private String mapCallType(int type) {
        switch (type) {
            case CallLog.Calls.INCOMING_TYPE:
                return "incoming";
            case CallLog.Calls.OUTGOING_TYPE:
                return "outgoing";
            case CallLog.Calls.MISSED_TYPE:
                return "missed";
            default:
                return "unknown";
        }
    }

    public static boolean isServiceRunning(Context context, Class<?> serviceClass) {
        android.app.ActivityManager manager = (android.app.ActivityManager) context.getSystemService(Context.ACTIVITY_SERVICE);
        if (manager != null) {
            try {
                // Returns only caller's own services on Android 8.0+
                java.util.List<android.app.ActivityManager.RunningServiceInfo> services = manager.getRunningServices(Integer.MAX_VALUE);
                if (services != null) {
                    for (android.app.ActivityManager.RunningServiceInfo service : services) {
                        if (serviceClass.getName().equals(service.service.getClassName())) {
                            return true;
                        }
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, "Error checking if service is running", e);
            }
        }
        return false;
    }

    public static void scheduleKeepAlive(Context context) {
        scheduleKeepAlive(context, 15 * 60 * 1000); // 15 minutes default
    }

    public static void scheduleKeepAlive(Context context, long delayMs) {
        try {
            Intent intent = new Intent(context, BootReceiver.class);
            intent.setAction("com.subsync.app.ACTION_KEEP_ALIVE");
            
            int flags = android.app.PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= android.app.PendingIntent.FLAG_IMMUTABLE;
            }
            
            android.app.PendingIntent pendingIntent = android.app.PendingIntent.getBroadcast(
                context, 
                1003, 
                intent, 
                flags
            );
            
            android.app.AlarmManager alarmManager = (android.app.AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager != null) {
                long triggerAtMillis = System.currentTimeMillis() + delayMs;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setAndAllowWhileIdle(
                        android.app.AlarmManager.RTC_WAKEUP, 
                        triggerAtMillis, 
                        pendingIntent
                    );
                } else {
                    alarmManager.set(
                        android.app.AlarmManager.RTC_WAKEUP, 
                        triggerAtMillis, 
                        pendingIntent
                    );
                }
                Log.d(TAG, "Scheduled keep-alive alarm in " + (delayMs / 1000) + " seconds");
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to schedule keep-alive alarm", e);
        }
    }
}
