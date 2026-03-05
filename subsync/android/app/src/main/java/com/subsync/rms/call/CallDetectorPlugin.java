package com.subsync.rms.call;

import android.Manifest;
import android.content.Context;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.telephony.TelephonyManager;
import android.util.Log;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/**
 * CallDetectorPlugin — Capacitor Plugin for detecting phone call events.
 *
 * Listens for call state changes via a BroadcastReceiver, detects when
 * a call ends (IDLE after OFFHOOK), reads actual call details from the
 * Android Call Log, and fires a "callEnded" event to the JavaScript layer.
 *
 * JavaScript usage:
 *   import { registerPlugin } from '@capacitor/core';
 *   const CallDetector = registerPlugin('CallDetector');
 *   await CallDetector.startListening();
 *   CallDetector.addListener('callEnded', (data) => { ... });
 */
@CapacitorPlugin(
    name = "CallDetector",
    permissions = {
        @Permission(strings = {Manifest.permission.READ_PHONE_STATE}, alias = "phone"),
        @Permission(strings = {Manifest.permission.READ_CALL_LOG}, alias = "callLog"),
    }
)
public class CallDetectorPlugin extends Plugin implements CallStateReceiver.CallEndListener {

    private static final String TAG = "CallDetectorPlugin";
    private CallStateReceiver callStateReceiver;
    private boolean isListening = false;

    /**
     * Start listening for call state changes.
     * Registers the broadcast receiver and requests permissions if needed.
     */
    @PluginMethod
    public void startListening(PluginCall call) {
        Context context = getContext();

        boolean hasPhonePermission = ContextCompat.checkSelfPermission(
            context, Manifest.permission.READ_PHONE_STATE
        ) == PackageManager.PERMISSION_GRANTED;

        boolean hasCallLogPermission = ContextCompat.checkSelfPermission(
            context, Manifest.permission.READ_CALL_LOG
        ) == PackageManager.PERMISSION_GRANTED;

        if (!hasPhonePermission || !hasCallLogPermission) {
            // Request permissions — Capacitor will call onPermissionsResult
            requestPermissionForAliases(new String[]{"phone", "callLog"}, call, "permissionsCallback");
            return;
        }

        registerCallReceiver();
        call.resolve(buildStatusObject("started"));
    }

    @PermissionCallback
    private void permissionsCallback(PluginCall call) {
        boolean phoneGranted = getPermissionState("phone") == com.getcapacitor.PermissionState.GRANTED;
        boolean callLogGranted = getPermissionState("callLog") == com.getcapacitor.PermissionState.GRANTED;

        if (phoneGranted) {
            registerCallReceiver();
        }

        JSObject result = buildStatusObject(phoneGranted ? "started" : "permission_denied");
        result.put("phonePermission", phoneGranted);
        result.put("callLogPermission", callLogGranted);
        call.resolve(result);
    }

    /**
     * Stop listening for call state changes.
     */
    @PluginMethod
    public void stopListening(PluginCall call) {
        unregisterCallReceiver();
        call.resolve(buildStatusObject("stopped"));
    }

    /**
     * Check current permission status.
     */
    @PluginMethod
    public void checkPermissions(PluginCall call) {
        boolean phoneGranted = ContextCompat.checkSelfPermission(
            getContext(), Manifest.permission.READ_PHONE_STATE
        ) == PackageManager.PERMISSION_GRANTED;

        boolean callLogGranted = ContextCompat.checkSelfPermission(
            getContext(), Manifest.permission.READ_CALL_LOG
        ) == PackageManager.PERMISSION_GRANTED;

        JSObject result = new JSObject();
        result.put("phonePermission", phoneGranted);
        result.put("callLogPermission", callLogGranted);
        result.put("allGranted", phoneGranted && callLogGranted);
        call.resolve(result);
    }

    /**
     * Handle a completed call — called by CallStateReceiver when call ends.
     * Reads final call details from the system call log and notifies JS.
     */
    @Override
    public void onCallEnded(String phoneNumber, int durationSeconds, String callType) {
        Log.d(TAG, "Call ended: " + phoneNumber + " (" + callType + ") duration=" + durationSeconds + "s");

        // If READ_CALL_LOG is granted, try to get more accurate data from system log
        boolean hasCallLog = ContextCompat.checkSelfPermission(
            getContext(), Manifest.permission.READ_CALL_LOG
        ) == PackageManager.PERMISSION_GRANTED;

        if (hasCallLog) {
            CallLogHelper.CallDetails details = CallLogHelper.getLatestCallDetails(getContext());
            if (details != null) {
                // Use system call log data for accuracy
                phoneNumber = details.number != null ? details.number : phoneNumber;
                durationSeconds = details.duration > 0 ? details.duration : durationSeconds;
                callType = details.type;
            }
        }

        JSObject event = new JSObject();
        event.put("phoneNumber", phoneNumber != null ? phoneNumber : "unknown");
        event.put("duration", durationSeconds);
        event.put("callType", callType);

        notifyListeners("callEnded", event, true);
    }

    // ─── Private helpers ─────────────────────────────────────────────────

    private void registerCallReceiver() {
        if (isListening) return;

        callStateReceiver = new CallStateReceiver(this);
        IntentFilter filter = new IntentFilter(TelephonyManager.ACTION_PHONE_STATE_CHANGED);
        // Also catch outgoing calls to detect the number
        filter.addAction(android.content.Intent.ACTION_NEW_OUTGOING_CALL);
        getContext().registerReceiver(callStateReceiver, filter);
        isListening = true;
        Log.d(TAG, "CallStateReceiver registered");
    }

    private void unregisterCallReceiver() {
        if (!isListening || callStateReceiver == null) return;
        try {
            getContext().unregisterReceiver(callStateReceiver);
        } catch (IllegalArgumentException e) {
            Log.w(TAG, "Receiver was not registered: " + e.getMessage());
        }
        callStateReceiver = null;
        isListening = false;
        Log.d(TAG, "CallStateReceiver unregistered");
    }

    private JSObject buildStatusObject(String status) {
        JSObject obj = new JSObject();
        obj.put("status", status);
        return obj;
    }

    @Override
    protected void handleOnDestroy() {
        unregisterCallReceiver();
        super.handleOnDestroy();
    }
}
