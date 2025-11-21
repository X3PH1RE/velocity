# GPS & Geofence Debugging Guide

## What I Fixed

### 1. Better GPS Tracking ✅
- **High accuracy mode** enabled (was off)
- **Real-time updates** (no cached positions)
- **Immediate initial position** check
- **Reduced debounce**: 5s → 3s

### 2. Better Distance Calculation ✅
- **Decimal precision**: Shows `0.52m` instead of `1m`
- **Real-time logging** to console
- **Visual feedback** when inside geofence

### 3. Debug Panel Added ✅
- Shows exact distance in real-time
- Shows if you're inside zone (YES/NO)
- Shows GPS accuracy
- Shows last update time

---

## How to Test (Step-by-Step)

### Step 1: Restart & Setup

```bash
# Stop server
Ctrl + C

# Start fresh
python server.py
```

### Step 2: Set Laptop Location

1. **On Laptop** - Open: `http://localhost:5000/signal.html`
2. Click **"Enter Location Manually"**
3. Get your coordinates from Google Maps:
   - Go to https://www.google.com/maps
   - Right-click your location
   - Copy coordinates (e.g., `40.712776, -74.005974`)
4. Enter in form and click **"Set as Junction Location"**
5. **Verify**: "Current Location" updates to YOUR coordinates

### Step 3: Start Phone GPS

1. **On Phone** - Open: `http://YOUR_IP:5000/vehicle.html`
2. Switch to **"Auto (GPS)"** mode
3. Click **"Start GPS Tracking"**
4. Grant location permission
5. Wait 10-30 seconds for GPS lock

### Step 4: Watch Debug Info

You should see:
- **Your Location**: Updates every 1-2 seconds
- **Junction Location**: Shows laptop coordinates
- **Geofence Radius**: `1m`
- **Debug Distance**: Real-time distance (e.g., `5.42m`)
- **Inside Zone**: `✗ NO` or `✓ YES`

### Step 5: Move Closer!

**Walk towards your laptop** and watch:
- Distance decreases: `5m → 4m → 3m → 2m → 1m → 0.5m`
- When distance ≤ 1m:
  - **Inside Zone** changes to `✓ YES` (green)
  - Log shows: `🎯 ENTERED GEOFENCE!`
  - Trigger sends automatically!

---

## Console Debugging (Important!)

### Open Browser Console

**On Phone:**
- Chrome Android: Menu (⋮) → More Tools → Remote Devices (connect to PC)
- Safari iOS: Settings → Safari → Advanced → Web Inspector

**On Laptop:**
- Press **F12**
- Go to **Console** tab

### What to Look For

```javascript
// Good GPS updates (every 1-2 seconds):
📍 GPS Update: 40.712776, -74.005974 ±12m

// Distance calculation:
📏 Distance: 5.42m | Threshold: 1m | Inside: false
📏 Distance: 0.87m | Threshold: 1m | Inside: true  ← Should trigger here!

// When entering geofence:
🎯 INSIDE GEOFENCE! Distance: 0.87m
→ Sent trigger: VEH-1234 → junction1

// When exiting:
↩ Exited geofence. Distance: 1.23m
```

---

## Troubleshooting

### Issue: Distance Not Updating

**Check:**
1. GPS permission granted? (look for "Allow" prompt)
2. GPS Status shows "✓ GPS active"?
3. "Your Location" coordinates changing?
4. "Last Update" time refreshing?

**If GPS not working:**
- Try going **outdoors** (GPS weak indoors)
- Wait **60 seconds** for GPS lock
- Check phone location settings (High Accuracy mode)
- **OR use Manual mode** to test system without GPS

### Issue: Inside Geofence But Not Triggering

**Check Console For:**
```javascript
📏 Distance: 0.50m | Threshold: 1m | Inside: true
✓ Still inside: 0.50m
```

If you see "Still inside" but no trigger:
- **Debounce active** - Wait 3 seconds after last trigger
- **Already triggered** - Need to exit (>1m) and re-enter

**Force reset:**
1. Walk >2m away from laptop
2. Wait for "↩ Exited geofence" message
3. Walk back within 1m

### Issue: GPS Accuracy Too Poor

**Bad GPS (±50m or more):**
- Can't get accurate 1m detection
- Go outdoors for better signal
- Wait for better accuracy

**Temporary Solution:**
Increase geofence radius in `server.py`:
```python
# Line 24
"geofence_radius_m": 5,  # Try 5 meters instead of 1
```
Restart server.

### Issue: Location Updates Slow

**If updates every 5-10 seconds:**
- Phone may be in power-saving mode
- Disable battery optimization for browser
- Android: Settings → Apps → Browser → Battery → Unrestricted

---

## Expected Behavior

### Good GPS Lock
```
GPS Accuracy: ±5m to ±15m
Update Frequency: Every 1-2 seconds
Distance: Updates in real-time as you move
```

### Inside Geofence
```
Distance: 0.87m
Inside Zone: ✓ YES (green)
Status: "✓ INSIDE geofence (0.87m)"
Log: "🎯 ENTERED GEOFENCE! Distance: 0.87m"
Log: "🚨 Sending emergency trigger..."
Laptop: Emergency mode activates!
```

### After Trigger
```
Status: "Trigger Sent Successfully"
Debounce: Wait 3 seconds before next trigger
To trigger again: Exit geofence (>1m) then re-enter
```

---

## Testing Without GPS (Fallback)

If GPS just won't work:

1. **Use Manual Mode** - Works perfectly!
2. **Test system logic** without proximity
3. **Deploy to Railway** - HTTPS makes GPS work better on phone

Manual mode demonstrates:
- ✅ Real-time communication
- ✅ Emergency activation
- ✅ Signal changes
- ✅ Auto-cycle behavior

---

## Quick Checklist

Before testing proximity:

- [ ] Server running ✓
- [ ] Laptop location set manually ✓
- [ ] Phone GPS permission granted ✓
- [ ] Phone shows "GPS active" ✓
- [ ] "Your Location" updating ✓
- [ ] "Distance" showing real number ✓
- [ ] Console open (F12) to see logs ✓
- [ ] Geofence radius = 1m ✓

During test:

- [ ] Walk towards laptop with phone ✓
- [ ] Watch distance decrease ✓
- [ ] Distance ≤ 1m → Should trigger! ✓
- [ ] Laptop goes to emergency mode ✓
- [ ] Phone shows "Trigger Sent" ✓

---

## Real-World Testing Tips

### Best Conditions:
- ✅ **Outdoors** (GPS works best)
- ✅ **Clear sky view** (better satellite lock)
- ✅ **Phone fully charged** (better GPS)
- ✅ **High accuracy mode** enabled

### Indoor Testing:
- ⚠️ GPS may be ±20-50m (too inaccurate for 1m)
- ⚠️ Updates may be slower
- ✅ **Increase radius** to 5-10m for testing
- ✅ Or use Manual mode

### Demo Script:
1. Start with phone 5-10m away from laptop
2. Show decreasing distance on screen
3. Narrate: "When I get within 1 meter..."
4. Walk close → **Auto-triggers!**
5. Laptop emergency mode activates
6. Signals turn green for emergency vehicle

---

## Still Not Working?

### Try This:
```bash
# 1. Clear everything
Ctrl + C (stop server)

# 2. Restart fresh
python server.py

# 3. Laptop: Set location manually

# 4. Phone: Clear cache
Settings → Apps → Browser → Clear cache

# 5. Refresh both pages

# 6. Phone: Start GPS, check console logs

# 7. Walk close and watch console!
```

### Or Deploy for Better GPS:
```bash
# Deploy to Railway (automatic HTTPS)
git push
# Then access from https://your-app.railway.app
# GPS works much better with HTTPS!
```

---

**Check your console logs - they show exactly what's happening!** 🔍

