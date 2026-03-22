package com.subsync.app;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
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
                prefs.edit().putString("currentPhoneNumber", number).putString("currentCallType", "outgoing").apply();
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
                            .putString("currentCallType", "incoming").apply();
                }
            } else if (state == TelephonyManager.CALL_STATE_OFFHOOK) {
                if (previousState == TelephonyManager.CALL_STATE_IDLE && !"outgoing".equals(currentCallType)) {
                    currentCallType = "outgoing";
                    prefs.edit().putString("currentCallType", currentCallType).apply();
                }
                if (previousState != TelephonyManager.CALL_STATE_OFFHOOK) {
                    prefs.edit().putLong("callStartMs", System.currentTimeMillis()).apply();
                }
            } else if (state == TelephonyManager.CALL_STATE_IDLE) {
                if (previousState != TelephonyManager.CALL_STATE_IDLE) {
                    if (previousState == TelephonyManager.CALL_STATE_RINGING)
                        currentCallType = "missed";
                    long callStartMs = prefs.getLong("callStartMs", 0L);
                    final long durationMs = callStartMs > 0 ? System.currentTimeMillis() - callStartMs : 0;
                    final String numberToEmit = currentPhoneNumber;
                    final String typeToEmit = currentCallType;

                    prefs.edit().remove("callStartMs").remove("currentPhoneNumber").remove("currentCallType").apply();

                    Intent serviceIntent = new Intent(context, CallOverlayService.class);
                    serviceIntent.putExtra("number", numberToEmit);
                    serviceIntent.putExtra("duration", (int)(durationMs / 1000));
                    serviceIntent.putExtra("type", typeToEmit);

                    Log.i(TAG, "Starting OverlayService for " + numberToEmit);
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                        context.startForegroundService(serviceIntent);
                    else
                        context.startService(serviceIntent);
                }
            }
            prefs.edit().putInt("previousState", state).apply();
            
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
        JSONObject syncedContact = lookupSyncedContact(phoneNumber);
        if (syncedContact != null)
            return syncedContact;
        return null;
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

    public void addPendingCallToQueue(String phoneNumber, int duration, String callType, String name) {
        try {
            JSONObject callObj = new JSONObject();
            callObj.put("phoneNumber", phoneNumber);
            callObj.put("duration", duration);
            callObj.put("callType", callType);
            callObj.put("name", name);
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
}
