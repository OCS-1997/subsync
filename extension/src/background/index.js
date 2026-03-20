// This is the background service worker for the extension.
// It runs independently of the popup and can persist state (like the active timer)
// across sessions, even when the extension popup is closed.

chrome.runtime.onInstalled.addListener(() => {
  console.log('Subsync Extension Installed');
});

// Example: Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_TIMER') {
    // Start tracking time logic here
    console.log('Timer started in background');
    sendResponse({ status: 'running' });
  }
});
