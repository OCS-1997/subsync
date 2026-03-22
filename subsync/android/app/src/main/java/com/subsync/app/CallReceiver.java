package com.subsync.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class CallReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        PendingResult pendingResult = goAsync();
        CallTracker.getInstance(context).handleIntent(context, intent, pendingResult);
    }
}
