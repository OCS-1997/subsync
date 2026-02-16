# Play Store Compliance Documentation for Subsync CRM

## Overview

This document provides all necessary information for Google Play Store submission, including permission justifications, privacy policy requirements, and compliance guidelines for the call detection feature in Subsync CRM.

---

## 🔐 Required Permissions & Justifications

### 1. READ_PHONE_STATE

**Permission String:**  
`android.permission.READ_PHONE_STATE`

**Justification for Google Play:**

```
Our CRM application automatically detects incoming and outgoing phone calls to help sales teams track customer interactions. This permission is required to detect call state changes (ringing, answered, ended) for automatic call logging in our Daily Call Register feature. This enables our business users to accurately track customer communications without manual entry, improving CRM data quality and sales team productivity.
```

**Business Use Case:**  
Sales teams need to log every customer interaction. Manual call logging is error-prone and time-consuming. Automatic call detection ensures 100% capture rate of customer communications.

**Alternative Considered:**  
Manual call logging - rejected due to user friction and data loss.

---

### 2. READ_CALL_LOG

**Permission String:**  
`android.permission.READ_CALL_LOG`

**Justification for Google Play:**

```
This permission is used to verify call history and duration metadata for accurate call logging in our CRM system. It enables automatic customer lookup based on phone numbers and ensures accurate time tracking for business activity reporting. The permission allows our sales teams to match incoming/outgoing calls with existing customer records in their CRM database, streamlining workflow and improving data accuracy.
```

**Business Use Case:**  
Customer relationship management requires accurate call duration tracking and customer identification. READ_CALL_LOG allows the app to retrieve call metadata for business reporting and analytics.

**Data Collection:**

- Phone numbers (to match with CRM customers)
- Call duration (for time tracking and reporting)
- Call timestamp (for activity logging)

**Data NOT Collected:**

- ❌ Call audio or recordings
- ❌ Call content or transcripts
- ❌ Personal contact names
- ❌ Third-party contacts

---

### 3. FOREGROUND_SERVICE

**Permission String:**  
`android.permission.FOREGROUND_SERVICE`

**Justification for Google Play:**

```
The foreground service is required to maintain call detection functionality when the app is in the background. This ensures that sales team members can log all customer calls automatically, even when using other apps or when the device screen is off. The service displays a persistent notification to inform users of active call monitoring, providing full transparency. This is essential for business users who need reliable call tracking throughout their workday.
```

**Business Use Case:**  
Sales professionals use multiple apps throughout the day. Background call detection ensures no customer interactions are missed, regardless of which app is in the foreground.

**User Visibility:**

- ✅ Persistent notification always visible
- ✅ Notification text: "Subsync Call Detection - Monitoring calls for CRM"
- ✅ Non-dismissible (required for foreground service)
- ✅ Low priority (doesn't interrupt user)

---

### 4. FOREGROUND_SERVICE_PHONE_CALL

**Permission String:**  
`android.permission.FOREGROUND_SERVICE_PHONE_CALL`

**Justification for Google Play:**

```
This Android 14+ permission is required to run a foreground service that monitors phone call states. It works in conjunction with FOREGROUND_SERVICE permission to enable our CRM call detection feature. This is classified as a phoneCall foreground service type as defined in our AndroidManifest.xml, which is appropriate for business communication tracking applications.
```

**Android Version Requirement:**  
Required for Android 14 (API 34) and above. Part of Android 14's enhanced permission model for foreground services.

---

### 5. POST_NOTIFICATIONS

**Permission String:**  
`android.permission.POST_NOTIFICATIONS`

**Justification for Google Play:**

```
Required to show the foreground service notification that informs users the call detection feature is active. This provides transparency and allows users to be aware of background monitoring. The notification serves as a persistent indicator that the CRM is actively logging customer calls, giving users full control and visibility over the feature.
```

**Notification Purpose:**

- Inform users that call detection is active
- Provide foreground service visibility (Android requirement)
- Allow users to stop service via app access

---

### 6. WAKE_LOCK

**Permission String:**  
`android.permission.WAKE_LOCK`

**Justification for Google Play:**

```
Used to ensure reliable call detection even when the device CPU is in a low-power state. The wake lock is acquired only during active call detection operations and released immediately after. This prevents the system from putting the device into deep sleep while a call is in progress, ensuring accurate call duration tracking for business reporting.
```

**Duration:**  
Wake lock is held for maximum 10 minutes per acquisition and only during active call processing.

---

### 7. REQUEST_IGNORE_BATTERY_OPTIMIZATIONS

**Permission String:**  
`android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`

**Justification for Google Play:**

```
This permission allows the app to request exemption from battery optimization restrictions to ensure reliable call detection throughout the business day. Sales professionals require consistent call logging without interruption from aggressive battery management. The app will guide users through the system settings to manually disable battery optimization for Subsync if they choose to enable this feature.
```

**User Control:**

- ❌ NOT automatically enabled
- ✅ User must manually grant via system settings
- ✅ App provides guidance on how to disable battery optimization
- ✅ Optional for app functionality (reduces reliability on some manufacturers)

---

## 📱 Privacy Policy Requirements

### Required Disclosures

Your privacy policy MUST include the following section:

```markdown
## Call Detection Feature

Subsync CRM includes an optional automatic call detection feature designed for business users to track customer interactions.

### What Data We Collect

When you enable call detection, Subsync collects:

- **Phone Numbers**: To match calls with existing customers in your CRM
- **Call Duration**: To track time spent on customer calls for reporting
- **Call Type**: Whether the call was incoming or outgoing
- **Call Timestamp**: When the call occurred

### What We DO NOT Collect

- ❌ Call audio recordings
- ❌ Call content or transcripts
- ❌ Contact names from your device
- ❌ Personal contacts not related to your business

### How We Use This Data

- Match incoming/outgoing calls with customer records in your CRM
- Automatically log calls in your Daily Call Register
- Generate business reports on call activity and customer engagement
- Track sales team productivity and communication metrics

### Data Storage

- All call metadata is stored securely on your company's server
- Data is encrypted in transit using HTTPS
- Authentication tokens are stored locally in encrypted device storage
- No call data is shared with third parties

### Your Control

- You can enable/disable call detection at any time
- You can review all logged calls in the Daily Call Register
- You can delete individual call records
- You can log out to clear all locally stored authentication data

### Permissions Required

This feature requires the following Android permissions:

- **READ_PHONE_STATE**: To detect when calls start and end
- **READ_CALL_LOG**: To access call duration and phone number metadata
- **FOREGROUND_SERVICE**: To maintain call detection when app is in background
- **FOREGROUND_SERVICE_PHONE_CALL**: Android 14+ requirement for phone-related services
- **POST_NOTIFICATIONS**: To show persistent notification during active monitoring

### Transparency

When call detection is active, you will see a persistent notification: "Subsync Call Detection - Monitoring calls for CRM". This cannot be dismissed while the feature is active, ensuring full transparency.

### Business Use Only

This feature is designed exclusively for business communication tracking. It should only be used for work-related calls with customer contacts stored in your CRM system.
```

---

## 🎬 Play Store Submission Assets

### App Description

Include this in your Play Store description:

```
📞 AUTOMATIC CALL DETECTION

Track customer calls automatically with our intelligent call detection feature. Perfect for sales teams who need accurate call logs without manual entry.

✅ Automatic customer lookup
✅ Call duration tracking
✅ Seamless CRM integration
✅ Background monitoring
✅ Full transparency with persistent notification

Note: Call detection requires specific permissions and displays a persistent notification when active. Your privacy matters - we never record call audio or access personal contacts.
```

---

### Screenshots Required

1. **Permission Request Screen** - Show READ_PHONE_STATE permission dialog
2. **Active Call Detection** - Show persistent notification in notification drawer
3. **Post-Call Dialog** - Show customer lookup and call details
4. **Daily Call Register** - Show logged calls with metadata
5. **Settings Screen** - Show call detection enable/disable toggle _(if implemented)_

---

### Demo Video Script

**Duration:** 30-60 seconds

1. **Scene 1** (5s): App login screen → User logs in
2. **Scene 2** (5s): Permission request appears → User grants permissions
3. **Scene 3** (5s): Notification appears: "Subsync Call Detection - Monitoring calls for CRM"
4. **Scene 4** (10s): User receives incoming call → Answers → Talks → Ends call
5. **Scene 5** (10s): Post-call dialog appears → Shows customer info → User adds notes
6. **Scene 6** (5s): User clicks "Log Call" → Success message
7. **Scene 7** (5s): Navigate to Daily Call Register → Call is logged with all metadata
8. **Scene 8** (5s): End screen with app logo and tagline

---

## ✅ Pre-Submission Checklist

### Documentation

- [ ] Privacy policy updated with call detection disclosure
- [ ] Terms of service mention call detection feature
- [ ] App description includes call detection mention
- [ ] FAQ includes call detection usage guide

### App Store Assets

- [ ] At least 2 screenshots showing call detection workflow
- [ ] Demo video (30-60 seconds) showing call detection
- [ ] Feature graphic mentions call detection
- [ ] Banner image includes notification mockup

### Testing

- [ ] Tested on Samsung Galaxy device (most common)
- [ ] Tested on Google Pixel device (stock Android)
- [ ] Tested on Xiaomi device (aggressive battery optimization)
- [ ] Tested with battery saver mode enabled
- [ ] Tested with app in background
- [ ] Tested with app force-stopped and reopened
- [ ] Verified all permissions can be granted
- [ ] Verified persistent notification is visible and informative

### Compliance

- [ ] Permission justifications documented (see above)
- [ ] Privacy policy link in app settings
- [ ] Privacy policy link in Play Store listing
- [ ] User can disable call detection
- [ ] Clear notification when feature is active
- [ ] No misleading claims in app description

---

## 🚨 Common Play Store Rejection Reasons

### Rejection Scenario 1: Insufficient Justification

**Problem:** "Your use of READ_CALL_LOG is not sufficiently justified."

**Solution:**  
Provide detailed business use case in Play Store console. Reference this document and emphasize:

- CRM (business tool, not personal use)
- Sales team productivity
- Customer relationship tracking
- No call audio recording
- Transparent with persistent notification

---

### Rejection Scenario 2: Privacy Policy Missing Information

**Problem:** "Your privacy policy doesn't mention call-related permissions."

**Solution:**  
Update privacy policy with the complete section provided above BEFORE submission.

---

### Rejection Scenario 3: Misleading Feature Claims

**Problem:** "App description claims features not demonstrated in screenshots."

**Solution:**  
Ensure screenshots and demo video clearly show:

- Permission grant flow
- Persistent notification
- Post-call dialog
- Call logged in DCR

---

## 📊 Expected Reliability by Manufacturer

| Manufacturer | Reliability     | Notes                                             |
| ------------ | --------------- | ------------------------------------------------- |
| Samsung      | 9/10 ⭐⭐⭐⭐⭐ | Best reliability, minimal battery optimization    |
| Google Pixel | 9/10 ⭐⭐⭐⭐⭐ | Stock Android, foreground services work perfectly |
| OnePlus      | 8/10 ⭐⭐⭐⭐   | Good, may require battery optimization disable    |
| Xiaomi       | 7/10 ⭐⭐⭐⭐   | Requires manual battery optimization disable      |
| Oppo         | 7/10 ⭐⭐⭐⭐   | Requires manual battery optimization disable      |
| Vivo         | 6.5/10 ⭐⭐⭐   | Aggressive battery management, guide users        |
| Realme       | 6.5/10 ⭐⭐⭐   | Aggressive battery management, guide users        |

---

## 🔗 Useful Links

- **Android Foreground Service Guide**: https://developer.android.com/develop/background-work/services/foreground-services
- **Play Store Privacy Policy Requirements**: https://support.google.com/googleplay/android-developer/answer/9859455
- **Call Log Permission Best Practices**: https://developer.android.com/training/permissions/requesting
- **Battery Optimization Guidance**: https://developer.android.com/training/monitoring-device-state/doze-standby

---

**End of Play Store Compliance Documentation**
