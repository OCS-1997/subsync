package com.subsync.app;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.telephony.TelephonyManager;
import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONArray;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "CallDetector",
    permissions = {
        @Permission(
            alias = "phone",
            strings = {
                Manifest.permission.READ_PHONE_STATE,
                Manifest.permission.READ_CALL_LOG,
                Manifest.permission.READ_CONTACTS,
                Manifest.permission.PROCESS_OUTGOING_CALLS,
                Manifest.permission.POST_NOTIFICATIONS
            }
        )
    }
)
public class CallDetectorPlugin extends Plugin {

    @Override
    public void load() {
        CallTracker.getInstance(getContext()).setPlugin(this);
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        JSObject result = new JSObject();
        boolean phoneGranted = hasPermission(Manifest.permission.READ_PHONE_STATE);
        boolean callLogGranted = hasPermission(Manifest.permission.READ_CALL_LOG);
        boolean contactsGranted = hasPermission(Manifest.permission.READ_CONTACTS);
        boolean outgoingGranted = hasPermission(Manifest.permission.PROCESS_OUTGOING_CALLS);
        boolean notificationGranted = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            notificationGranted = hasPermission(Manifest.permission.POST_NOTIFICATIONS);
        }

        result.put("phone", (phoneGranted && callLogGranted && contactsGranted && outgoingGranted && notificationGranted) ? "granted" : "denied");
        result.put("readPhoneState", phoneGranted ? "granted" : "denied");
        result.put("readCallLog", callLogGranted ? "granted" : "denied");
        result.put("readContacts", contactsGranted ? "granted" : "denied");
        result.put("notifications", notificationGranted ? "granted" : "denied");
        call.resolve(result);
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        requestPermissionForAlias("phone", call, "permissionsCallback");
    }

    @PermissionCallback
    private void permissionsCallback(PluginCall call) {
        JSObject result = new JSObject();
        boolean phoneGranted = getPermissionState("phone") == PermissionState.GRANTED;
        result.put("phone", phoneGranted ? "granted" : "denied");
        call.resolve(result);
    }

    @PluginMethod
    public void checkOverlayPermission(PluginCall call) {
        JSObject result = new JSObject();
        boolean granted = Build.VERSION.SDK_INT < Build.VERSION_CODES.M ||
                          Settings.canDrawOverlays(getContext());
        result.put("granted", granted);
        call.resolve(result);
    }

    @PluginMethod
    public void requestOverlayPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
            !Settings.canDrawOverlays(getContext())) {
            Intent intent = new Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + getContext().getPackageName())
            );
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        }
        call.resolve();
    }

    @PluginMethod
    public void startListening(PluginCall call) {
        Intent serviceIntent = new Intent(getContext(), CallBackgroundService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(serviceIntent);
        } else {
            getContext().startService(serviceIntent);
        }
        JSObject result = new JSObject();
        result.put("status", "started");
        call.resolve(result);
    }

    @PluginMethod
    public void stopListening(PluginCall call) {
        Intent serviceIntent = new Intent(getContext(), CallBackgroundService.class);
        getContext().stopService(serviceIntent);
        JSObject result = new JSObject();
        result.put("status", "stopped");
        call.resolve(result);
    }

    @PluginMethod
    public void getPendingCalls(PluginCall call) {
        try {
            JSONArray pendingArray = CallTracker.getInstance(getContext()).getPendingCalls();
            jsArrayToCall(call, pendingArray);
        } catch (Exception e) {
            call.reject("Failed to get pending calls", e);
        }
    }

    private void jsArrayToCall(PluginCall call, JSONArray pendingArray) throws JSONException {
        JSObject result = new JSObject();
        if (pendingArray != null) {
            result.put("calls", pendingArray);
        } else {
            result.put("calls", new com.getcapacitor.JSArray());
        }
        call.resolve(result);
    }

    @PluginMethod
    public void clearPendingCalls(PluginCall call) {
        try {
            CallTracker.getInstance(getContext()).clearPendingCalls();
            JSObject result = new JSObject();
            result.put("status", "cleared");
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Failed to clear pending calls", e);
        }
    }

    @PluginMethod
    public void getLaunchCallData(PluginCall call) {
        try {
            JSObject result = new JSObject();
            Intent intent = getActivity() != null ? getActivity().getIntent() : null;
            if (intent == null || !intent.hasExtra(CallOverlayService.EXTRA_CALL_PHONE)) {
                result.put("call", null);
                call.resolve(result);
                return;
            }
            JSObject callObj = new JSObject();
            callObj.put("phoneNumber", intent.getStringExtra(CallOverlayService.EXTRA_CALL_PHONE));
            callObj.put("name", intent.getStringExtra(CallOverlayService.EXTRA_CALL_NAME));
            callObj.put("duration", intent.getIntExtra(CallOverlayService.EXTRA_CALL_DURATION, 0));
            callObj.put("callType", intent.getStringExtra(CallOverlayService.EXTRA_CALL_TYPE));
            callObj.put("callId", intent.getStringExtra(CallOverlayService.EXTRA_CALL_ID));
            result.put("call", callObj);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Failed to get launch call data", e);
        }
    }

    @PluginMethod
    public void clearLaunchCallData(PluginCall call) {
        try {
            Intent intent = getActivity() != null ? getActivity().getIntent() : null;
            if (intent != null) {
                intent.removeExtra(CallOverlayService.EXTRA_CALL_PHONE);
                intent.removeExtra(CallOverlayService.EXTRA_CALL_DURATION);
                intent.removeExtra(CallOverlayService.EXTRA_CALL_TYPE);
                intent.removeExtra(CallOverlayService.EXTRA_CALL_ID);
            }
            JSObject result = new JSObject();
            result.put("status", "cleared");
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Failed to clear launch call data", e);
        }
    }

    @PluginMethod
    public void syncContacts(PluginCall call) {
        try {
            com.getcapacitor.JSArray contacts = call.getArray("contacts");
            if (contacts == null) {
                call.reject("Contacts array is required");
                return;
            }
            android.content.SharedPreferences prefs = getContext().getSharedPreferences("CallTrackerPrefs", android.content.Context.MODE_PRIVATE);
            prefs.edit().putString("appContacts", contacts.toString()).apply();
            com.getcapacitor.JSObject result = new com.getcapacitor.JSObject();
            result.put("status", "synced");
            result.put("count", contacts.length());
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Failed to sync contacts", e);
        }
    }

    public void emitCallEnded(String phoneNumber, int duration, String callType, String callId) {
        JSObject data = new JSObject();
        data.put("phoneNumber", phoneNumber);
        data.put("duration", duration);
        data.put("callType", callType);
        data.put("callId", callId);
        notifyListeners("callEnded", data);
    }

    public void emitPendingCallsAvailable() {
        notifyListeners("pendingCallsAdded", new JSObject());
    }
}
