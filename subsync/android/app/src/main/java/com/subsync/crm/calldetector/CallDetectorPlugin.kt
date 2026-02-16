package com.subsync.crm.calldetector

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.ContextCompat
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback

@CapacitorPlugin(
    name = "CallDetector",
    permissions = [
        Permission(
            strings = [
                Manifest.permission.READ_PHONE_STATE,
                Manifest.permission.READ_CALL_LOG
            ],
            alias = "callDetection"
        ),
        Permission(
            strings = [Manifest.permission.POST_NOTIFICATIONS],
            alias = "notifications"
        )
    ]
)
class CallDetectorPlugin : Plugin() {

    companion object {
        private const val TAG = "CallDetectorPlugin"
        var pluginInstance: CallDetectorPlugin? = null
    }

    override fun load() {
        super.load()
        pluginInstance = this
    }

    @PluginMethod
    fun startCallDetection(call: PluginCall) {
        // Check permissions first
        if (!hasRequiredPermissions()) {
            requestAllPermissions(call, "permissionCallback")
            return
        }

        // Start the foreground service
        startService()
        call.resolve()
    }

    @PluginMethod
    fun stopCallDetection(call: PluginCall) {
        stopService()
        call.resolve()
    }

    @PluginMethod
    fun checkPermissions(call: PluginCall) {
        val result = com.getcapacitor.JSObject()
        result.put("granted", hasRequiredPermissions())
        call.resolve(result)
    }

    @PermissionCallback
    private fun permissionCallback(call: PluginCall) {
        if (hasRequiredPermissions()) {
            startService()
            call.resolve()
        } else {
            call.reject("Permissions denied")
        }
    }

    private fun hasRequiredPermissions(): Boolean {
        val context = activity ?: return false
        
        val hasPhoneState = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.READ_PHONE_STATE
        ) == PackageManager.PERMISSION_GRANTED

        val hasCallLog = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.READ_CALL_LOG
        ) == PackageManager.PERMISSION_GRANTED

        var hasNotifications = true
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            hasNotifications = ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        }

        return hasPhoneState && hasCallLog && hasNotifications
    }

    private fun startService() {
        val context = activity ?: return
        val serviceIntent = Intent(context, CallDetectionService::class.java)
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent)
        } else {
            context.startService(serviceIntent)
        }
    }

    private fun stopService() {
        val context = activity ?: return
        val serviceIntent = Intent(context, CallDetectionService::class.java)
        context.stopService(serviceIntent)
    }

    // Called from service to notify web layer
    fun notifyCallStarted(phoneNumber: String, callType: String) {
        val data = com.getcapacitor.JSObject()
        data.put("phoneNumber", phoneNumber)
        data.put("callType", callType)
        data.put("timestamp", System.currentTimeMillis())
        notifyListeners("callStarted", data)
    }

    fun notifyCallEnded(phoneNumber: String, callType: String, duration: Long) {
        val data = com.getcapacitor.JSObject()
        data.put("phoneNumber", phoneNumber)
        data.put("callType", callType)
        data.put("duration", duration)
        data.put("timestamp", System.currentTimeMillis())
        notifyListeners("callEnded", data)
    }
}
