package com.subsync.rms.call;

import android.content.Context;
import android.database.Cursor;
import android.provider.CallLog;
import android.util.Log;

/**
 * CallLogHelper — reads the most recent call record from the Android system Call Log.
 *
 * This provides accurate data after a call ends, including:
 *   - Actual duration (more reliable than our timer for very short calls)
 *   - Normalized phone number (as stored by system)
 *   - Call type: INCOMING, OUTGOING, MISSED
 *
 * Requires: android.permission.READ_CALL_LOG
 */
public class CallLogHelper {

    private static final String TAG = "CallLogHelper";

    /** Maps Android CallLog.Calls type integer to our string type */
    public static class CallDetails {
        public String number;    // Raw number from call log
        public int    duration;  // Duration in seconds
        public String type;      // "incoming" | "outgoing" | "missed"

        public CallDetails(String number, int duration, String type) {
            this.number   = number;
            this.duration = duration;
            this.type     = type;
        }
    }

    /**
     * Query the system call log for the most recent call record.
     * Should be called shortly after a call ends (within a few seconds).
     *
     * @param context Application context
     * @return CallDetails or null if unable to read
     */
    public static CallDetails getLatestCallDetails(Context context) {
        String[] projection = {
            CallLog.Calls.NUMBER,
            CallLog.Calls.DURATION,
            CallLog.Calls.TYPE,
            CallLog.Calls.DATE,
        };

        // Sort by date descending to get the most recent call first
        String sortOrder = CallLog.Calls.DATE + " DESC";

        try (Cursor cursor = context.getContentResolver().query(
            CallLog.Calls.CONTENT_URI,
            projection,
            null,
            null,
            sortOrder + " LIMIT 1"
        )) {
            if (cursor != null && cursor.moveToFirst()) {
                String number   = cursor.getString(cursor.getColumnIndexOrThrow(CallLog.Calls.NUMBER));
                int    duration = cursor.getInt(cursor.getColumnIndexOrThrow(CallLog.Calls.DURATION));
                int    typeCode = cursor.getInt(cursor.getColumnIndexOrThrow(CallLog.Calls.TYPE));

                String typeStr = mapCallType(typeCode);
                Log.d(TAG, "Latest call: " + number + " dur=" + duration + "s type=" + typeStr);

                return new CallDetails(number, duration, typeStr);
            }
        } catch (SecurityException e) {
            Log.w(TAG, "READ_CALL_LOG permission denied: " + e.getMessage());
        } catch (Exception e) {
            Log.e(TAG, "Error reading call log: " + e.getMessage());
        }

        return null;
    }

    /**
     * Map Android CallLog.Calls type integer to a string type.
     * @param typeCode - CallLog.Calls type integer
     * @return "incoming" | "outgoing" | "missed"
     */
    private static String mapCallType(int typeCode) {
        switch (typeCode) {
            case CallLog.Calls.INCOMING_TYPE:
                return "incoming";
            case CallLog.Calls.OUTGOING_TYPE:
                return "outgoing";
            case CallLog.Calls.MISSED_TYPE:
                return "missed";
            case CallLog.Calls.REJECTED_TYPE:
                return "missed";
            case CallLog.Calls.BLOCKED_TYPE:
                return "missed";
            default:
                return "incoming";
        }
    }
}
