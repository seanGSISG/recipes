# Cooking with Hub Max

The kitchen workflow for **recipes.lsdmt.me** when you have a Google Nest Hub Max.

## One-time setup

1. **Install the PWA on your Android phone.**
   - Open Chrome → `https://recipes.lsdmt.me`
   - Chrome menu (⋮) → **Add to Home screen** → Install
   - The site now opens fullscreen with no browser chrome and works offline for any recipe you've previously visited.
2. **Confirm the Hub Max is set up as a Cast target.** (It is by default if it's on your wifi.)

## Per-cook workflow

1. Tap the **Recipes** icon on your phone home screen.
2. Open the recipe you want.
3. Tap the orange **▶ Cook** button.
4. Cook Mode opens fullscreen, dark-themed, screen wake-lock active.
5. Chrome ⋮ menu → **Cast** → pick your Hub Max ("Kitchen Display" or whatever you named it). Tab mirrors to the Hub.
6. **Phone is the controller**, Hub is the readable display:
   - Swipe left/right on phone → step advances on Hub
   - Tap a `⏱ X minutes` chip → timer starts (chime + vibration when done)
   - Tap servings ± to rescale ingredients live
   - Tap × top-left to exit
7. When done, tap "Back to recipe" or × to exit. Cast disconnects when you tap the Cast icon again.

## Why this design

The Hub Max can't install web apps or run interactive sites directly — it's a Cast receiver. Putting the controls on your phone (which you're holding anyway) and using the Hub purely as a big readable display is the cleanest fit. Step text is sized to be legible from across a typical kitchen.

## Notes & limitations

- **Wake lock** keeps the phone screen on while in Cook Mode. Exiting releases it.
- **Timers fire reliably while Cook Mode is in the foreground.** If you swipe away to check Slack mid-cook, the timer pauses making sound — but on return, it immediately fires the chime + system notification for any timer that elapsed during your absence.
- **Notifications**: on first timer tap, Chrome will ask to allow notifications. Allow them — that's the fallback for when the tab is backgrounded.
- **Vibration** on timer completion works on Android. (No iOS support — but you don't have iOS.)
- **Offline**: any recipe you've opened on the phone (with image) is cached for ~30 days and works on airplane mode. Brand-new recipes need wifi for the first load.
