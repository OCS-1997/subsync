package com.subsync.crm.calldetector

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.telephony.PhoneStateListener
import android.telephony.TelephonyCallback
import android.telephony.TelephonyManager
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.core.app.NotificationCompat
import com.subsync.crm.MainActivity
import com.subsync.crm.R

class CallDetectionService : Service() {

    companion object {
        private const val TAG = "CallDetectionService"
        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_ID = "call_detection_channel"
    }

    private var telephonyManager: TelephonyManager? = null
    private var phoneStateListener: PhoneStateListener? = null
    private var telephonyCallback: TelephonyCallback? = null
    private var wakeLock: PowerManager.WakeLock? = null
    
    private var callStartTime: Long? = null
    private var currentPhoneNumber: String? = null
    private var isInCall = false

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "Service created")

        // Acquire wake lock for reliability
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "CallDetectionService::WakeLock"
        )
        wakeLock?.acquire(10 * 60 * 1000L) // 10 minutes

        createNotificationChannel()
        startForeground(NOTIFICATION_ID, createNotification())
        
        setupCallDetection()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Call Detection Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Monitors phone calls for CRM integration"
                setShowBadge(false)
            }

            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        val notificationIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            notificationIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Subsync Call Detection")
            .setContentText("Monitoring calls for CRM")
            .setSmallIcon(android.R.drawable.ic_menu_call)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun setupCallDetection() {
        telephonyManager = getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            // Android 12+ (API 31+)
            setupModernCallDetection()
        } else {
            // Android 11 and below
            setupLegacyCallDetection()
        }
    }

    @RequiresApi(Build.VERSION_CODES.S)
    private fun setupModernCallDetection() {
        telephonyCallback = object : TelephonyCallback(), TelephonyCallback.CallStateListener {
            override fun onCallStateChanged(state: Int) {
                handleCallStateChange(state)
            }
        }

        telephonyManager?.registerTelephonyCallback(
            mainExecutor,
            telephonyCallback!!
        )
    }

    @Suppress("DEPRECATION")
    private fun setupLegacyCallDetection() {
        phoneStateListener = object : PhoneStateListener() {
            override fun onCallStateChanged(state: Int, phoneNumber: String?) {
                currentPhoneNumber = phoneNumber
                handleCallStateChange(state)
            }
        }

        telephonyManager?.listen(phoneStateListener, PhoneStateListener.LISTEN_CALL_STATE)
    }

    private fun handleCallStateChange(state: Int) {
        Log.d(TAG, "Call state changed: $state")

        when (state) {
            TelephonyManager.CALL_STATE_RINGING -> {
                // Incoming call ringing
                Log.d(TAG, "Incoming call detected")
                if (!isInCall) {
                    val phoneNumber = getIncomingNumber()
                    currentPhoneNumber = phoneNumber
                    notifyCallStarted(phoneNumber, "incoming")
                }
            }

            TelephonyManager.CALL_STATE_OFFHOOK -> {
                // Call answered or outgoing call started
                Log.d(TAG, "Call active (answered or outgoing)")
                if (!isInCall) {
                    isInCall = true
                    callStartTime = System.currentTimeMillis()
                    
                    val phoneNumber = currentPhoneNumber ?: getIncomingNumber()
                    currentPhoneNumber = phoneNumber
                    
                    // Determine if incoming or outgoing
                    val callType = if (phoneNumber.isNotEmpty()) "outgoing" else "incoming"
                    notifyCallStarted(phoneNumber, callType)
                }
            }

            TelephonyManager.CALL_STATE_IDLE -> {
                // Call ended
                Log.d(TAG, "Call ended")
                if (isInCall) {
                    val duration = callStartTime?.let {
                        (System.currentTimeMillis() - it) / 1000 // Duration in seconds
                    } ?: 0
                    
                    val phoneNumber = currentPhoneNumber ?: ""
                    val callType = determineCallType(phoneNumber)
                    
                    notifyCallEnded(phoneNumber, callType, duration)
                    
                    // Reset state
                    isInCall = false
                    callStartTime = null
                    currentPhoneNumber = null
                }
            }
        }
    }

    private fun getIncomingNumber(): String {
        // Try to get phone number from call log (requires READ_CALL_LOG permission)
        return try {
            // This would require querying CallLog.Calls
            // For now, return empty string and rely on PhoneStateListener providing it
            ""
        } catch (e: Exception) {
            Log.e(TAG, "Error getting incoming number", e)
            ""
        }
    }

    private fun determineCallType(phoneNumber: String): String {
        // Simple heuristic: if we have a number, it's likely outgoing
        // More sophisticated detection would query call log
        return if (phoneNumber.isNotEmpty()) "outgoing" else "incoming"
    }

    private fun notifyCallStarted(phoneNumber: String, callType: String) {
        Log.d(TAG, "Notifying call started: $phoneNumber ($callType)")
        CallDetectorPlugin.pluginInstance?.notifyCallStarted(phoneNumber, callType)
    }

    private fun notifyCallEnded(phoneNumber: String, callType: String, duration: Long) {
        Log.d(TAG, "Notifying call ended: $phoneNumber ($callType) - ${duration}s")
        CallDetectorPlugin.pluginInstance?.notifyCallEnded(phoneNumber, callType, duration)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "Service started")
        return START_STICKY // Restart service if killed
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "Service destroyed")

        // Unregister listeners
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            telephonyCallback?.let {
                telephonyManager?.unregisterTelephonyCallback(it)
            }
        } else {
            @Suppress("DEPRECATION")
            phoneStateListener?.let {
                telephonyManager?.listen(it, PhoneStateListener.LISTEN_NONE)
            }
        }

        // Release wake lock
        wakeLock?.let {
            if (it.isHeld) {
                it.release()
            }
        }
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        super.onTaskRemoved(rootIntent)
        // Restart service when task is removed
        val restartServiceIntent = Intent(applicationContext, this::class.java)
        val pendingIntent = PendingIntent.getService(
            applicationContext,
            1,
            restartServiceIntent,
            PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
        )

        val alarmManager = getSystemService(Context.ALARM_SERVICE) as android.app.AlarmManager
        alarmManager.set(
            android.app.AlarmManager.ELAPSED_REALTIME,
            android.os.SystemClock.elapsedRealtime() + 1000,
            pendingIntent
        )
    }
}
