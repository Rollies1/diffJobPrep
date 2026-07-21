Deep Linking — Implementation & Configuration
The app supports deep linking via both custom URL schemes and universal links,
enabling users to open specific screens from URLs (shared links, push
notifications, email campaigns, web fallbacks).

URL Formats
1. Custom scheme (app-to-app)
text

jobprep://screen/params
Examples:

URL
Screen
jobprep://dashboard	Dashboard
jobprep://practice	Practice setup
jobprep://library	Library
jobprep://tutor	AI Tutor
jobprep://deck/abc123	Deck detail (id=abc123)
jobprep://question/xyz789	Question detail (id=xyz789)
jobprep://achievements	Trophy room
jobprep://leaderboard	Leaderboard
jobprep://study-plan	Study plan
jobprep://search	Search & Explore
jobprep://mock-report	Mock interview report

2. Universal links (web-to-app, HTTPS)
text

https://jobprep.app/screen/params
Examples:

URL
Screen
https://jobprep.app/practice	Practice setup
https://jobprep.app/deck/abc123	Deck detail
https://jobprep.app/question/xyz789	Question detail

Universal links open the app directly on iOS/Android when installed, and
fall back to the website when not installed.

How It Works
text

User taps a jobprep:// or jobprep.app link
  → OS opens the app (if installed)
  → expo-linking fires 'url' event
  → useDeepLinks hook catches it
  → parseDeepLink(url) extracts screen + params
  → router.push(route, params)
  → Auth gate: if target requires auth + user not logged in → redirect to login
Configuration
app.json (already configured)
json

{
  "expo": {
    "scheme": "jobprep",
    "ios": {
      "associatedDomains": ["applinks:jobprep.app"]
    },
    "android": {
      "intentFilters": [{
        "action": "VIEW",
        "autoVerify": true,
        "data": [
          { "scheme": "jobprep" },
          { "scheme": "https", "host": "jobprep.app" }
        ],
        "category": ["BROWSABLE", "DEFAULT"]
      }]
    }
  }
}
iOS Universal Links
Host an apple-app-site-association file at:

text

https://jobprep.app/.well-known/apple-app-site-association
Content:

json

{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appIDs": ["TEAMID.com.knust.jobprep"],
        "components": [
          { "/": "/dashboard" },
          { "/": "/practice" },
          { "/": "/library" },
          { "/": "/deck/*" },
          { "/": "/question/*" },
          { "/": "/tutor" },
          { "/": "/achievements" },
          { "/": "/leaderboard" },
          { "/": "/study-plan" },
          { "/": "/search" },
          { "/": "/mock-report" }
        ]
      }
    ]
  }
}
Replace TEAMID with your Apple Developer Team ID.

Android App Links
Host an assetlinks.json file at:

text

https://jobprep.app/.well-known/assetlinks.json
Content:

json

[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.knust.jobprep",
      "sha256_cert_fingerprints": [
        "YOUR_APP_SIGNING_CERT_SHA256"
      ]
    }
  }
]
Get the SHA256 fingerprint:

bash

keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android | grep SHA256
Files
File
Purpose
src/services/deepLinks.ts	parseDeepLink(url) → route+params, buildDeepLink(screen, params) → URL, requiresAuth(route)
src/hooks/useDeepLinks.ts	Listens for initial + incoming URLs, routes via expo-router, handles auth gating
app.json	Scheme (jobprep), iOS associated domains, Android intent filters
app/_layout.tsx	Calls useDeepLinks(isAuthenticated)

Testing Deep Links
Custom scheme
bash

# iOS simulator
xcrun simctl openurl booted "jobprep://practice"

# Android emulator
adb shell am start -W -a android.intent.action.VIEW -d "jobprep://practice" com.knust.jobprep

# Or via Expo:
npx uri-scheme open "jobprep://deck/abc123" --ios
npx uri-scheme open "jobprep://deck/abc123" --android
Universal links
Test by visiting the URL in the browser:

text

https://jobprep.app/practice
If the app is installed and the association files are configured, the app
opens directly. Otherwise, the browser loads the web page.

Sharing Content
The app can generate deep links for sharing (e.g., sharing a deck or a score):

typescript

import { buildDeepLink } from '../services/deepLinks'

const shareUrl = buildDeepLink('deck', { id: 'abc123', title: 'Two Pointers' })
// → "jobprep://deck?id=abc123&title=Two+Pointers"

// Use with Share API:
import { Share } from 'react-native'
await Share.share({ url: shareUrl, message: `Check out this deck: ${shareUrl}` })
Auth Gating
Deep links to authenticated screens (/(app)/*) require the user to be
logged in. If not authenticated:

The user is redirected to the login screen
After successful login, they're taken to the dashboard (not the deep link
target — a future enhancement could store the intended destination and
redirect there after login)
Backend Integration
Share links from the backend
When the backend sends emails or generates share links, use the universal
link format:

text

https://jobprep.app/deck/{deckId}
https://jobprep.app/question/{questionId}
https://jobprep.app/practice
Push notification deep links
Push notifications already use the data.screen + data.params fields
(see PUSH_NOTIFICATIONS.md). The push notification tap handler and the
deep link handler both route to the same screens, so they're consistent.
