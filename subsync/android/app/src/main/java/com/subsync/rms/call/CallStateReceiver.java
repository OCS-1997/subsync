package com.subsync.rms.call;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.telephony.TelephonyManager;
import android.util.Log;

/**
 * CallStateReceiver — BroadcastReceiver that tracks phone call state transitions.
 *
 * State machine:
 *   IDLE  → RINGING  : Incoming call arriving
 *   RINGING → OFFHOOK: Incoming call answered
 *   IDLE  → OFFHOOK  : Outgoing call dialed
 *   OFFHOOK → IDLE   : Call ended (incoming or outgoing)
 *   RINGING → IDLE   : Missed call
 *
 * Fires the listener with phone number, duration, and call type when a call ends.
 */
public class CallStateReceiver extends BroadcastReceiver {

    private static final String TAG = "CallStateReceiver";

    /** Implement in CallDetectorPlugin to receive call-end events */
    public interface CallEndListener {
        void onCallEnded(String phoneNumber, int durationSeconds, String callType);
    }

    private final CallEndListener listener;

    // State tracking (static so it survives onReceive calls which create new instances)
    private static String lastState   = TelephonyManager.EXTRA_STATE_IDLE;
    private static String phoneNumber = null;
    private static long   callStartMs = 0L;
    private static String callType   = "incoming"; // 'incoming' | 'outgoing'

    // Outgoing number captured from ACTION_NEW_OUTGOING_CALL
    private static String outgoingNumber = null;

    public CallStateReceiver(CallEndListener listener) {
        this.listener = listener;
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();

        // Capture outgoing number before the call connects
        if (Intent.ACTION_NEW_OUTGOING_CALL.equals(action)) {
            outgoingNumber = intent.getStringExtra(Intent.EXTRA_PHONE_NUMBER);
            Log.d(TAG, "Outgoing call to: " + outgoingNumber);
            return;
        }

        if (!TelephonyManager.ACTION_PHONE_STATE_CHANGED.equals(action)) {
            return;
        }

        String state = intent.getStringExtra(TelephonyManager.EXTRA_STATE);
        String incomingNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER);

        if (state == null) return;

        Log.d(TAG, "Call state: " + lastState + " → " + state + " number=" + incomingNumber);

        switch (state) {
            case TelephonyManager.EXTRA_STATE_RINGING:
                // Incoming call ringing
                lastState   = state;
                phoneNumber = incomingNumber;
                callType    = "incoming";
                callStartMs = 0L; // Not yet answered
                break;

            case TelephonyManager.EXTRA_STATE_OFFHOOK:
                if (TelephonyManager.EXTRA_STATE_IDLE.equals(lastState)) {
                    // Direct IDLE→OFFHOOK = outgoing call
                    callType    = "outgoing";
                    phoneNumber = outgoingNumber;
                    outgoingNumber = null;
                } else {
                    // RINGING→OFFHOOK = incoming call answered
                    callType = "incoming";
                }
                callStartMs = System.currentTimeMillis();
                lastState   = state;
                break;

            case TelephonyManager.EXTRA_STATE_IDLE:
                if (TelephonyManager.EXTRA_STATE_OFFHOOK.equals(lastState)) {
                    // OFFHOOK→IDLE = call ended normally
                    int durationSeconds = 0;
                    if (callStartMs > 0) {
                        durationSeconds = (int) ((System.currentTimeMillis() - callStartMs) / 1000);
                    }
                    String finalPhone  = phoneNumber != null ? phoneNumber : "unknown";
                    String finalType   = callType;
                    int    finalDur    = durationSeconds;

                    Log.d(TAG, "Call ended: " + finalPhone + " type=" + finalType + " dur=" + finalDur + "s");

                    if (listener != null) {
                        listener.onCallEnded(finalPhone, finalDur, finalType);
                    }
                } else if (TelephonyManager.EXTRA_STATE_RINGING.equals(lastState)) {
                    // RINGING→IDLE = missed call
                    Log.d(TAG, "Missed call from: " + phoneNumber);
                    if (listener != null) {
                        listener.onCallEnded(
                            phoneNumber != null ? phoneNumber : "unknown",
                            0,
                            "missed"
                        );
                    }
                }

                // Reset state
                lastState   = state;
                phoneNumber = null;
                callStartMs = 0L;
                callType    = "incoming";
                break;
        }
    }
}
