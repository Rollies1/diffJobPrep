#!/bin/bash
# STATE=on or off

if [ "$STATE" = "off" ]; then
  # Android
  adb shell cmd connectivity airplane-mode enable 2>/dev/null || true
  # iOS (simctl doesn't support airplane mode directly - use network link conditioner)
  xcrun simctl spawn booted defaults write com.apple.Preferences AirplaneModeEnabled -bool true 2>/dev/null || true
  echo "Network disabled"
else
  adb shell cmd connectivity airplane-mode disable 2>/dev/null || true
  xcrun simctl spawn booted defaults write com.apple.Preferences AirplaneModeEnabled -bool false 2>/dev/null || true
  echo "Network enabled"
fi
