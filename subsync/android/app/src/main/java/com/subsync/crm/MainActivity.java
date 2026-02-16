package com.subsync.crm;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import com.subsync.crm.calldetector.CallDetectorPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register our custom plugin
        registerPlugin(CallDetectorPlugin.class);
    }
}
