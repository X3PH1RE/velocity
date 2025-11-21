# 📍 Proximity Mode - Device-to-Device Triggering

## How It Works

The system now uses **device-to-device proximity detection**:

1. **Laptop (Junction Dashboard)** → Broadcasts its GPS location every 2 seconds
2. **Phone (Emergency Vehicle)** → Tracks its GPS location
3. **When phone comes within 1 meter of laptop** → Auto-triggers emergency mode!

```
     📱 Phone                💻 Laptop
  (Mobile Device)         (Junction)
        |                      |
        |   GPS Location       |
        |◄─────────────────────┤
        |                      |
        |  Calculate Distance  |
        |                      |
    Distance ≤ 1m?             |
        |                      |
        | ✓ YES!               |
        |                      |
        |  Send Trigger        |
        ├─────────────────────►|
        |                      |
        |                 🚨 EMERGENCY
        |                 North: GREEN
        |                 Others: RED
```

---

## Setup (Super Simple!)

### Step 1: Start Server
```bash
python server.py
```

### Step 2: Open Laptop (Junction)
```
http://localhost:5000/signal.html
```

**What happens:**
- ✅ Dashboard opens with 4-way junction
- ✅ Signals start cycling automatically
- ✅ **GPS tracking starts automatically**
- ✅ Browser asks for location permission → **Click Allow**
- ✅ Laptop location is now broadcasting to server

### Step 3: Open Phone (Emergency Vehicle)
```
http://YOUR_IP:5000/vehicle.html
```

**What to do:**
1. Switch to **"Auto (GPS)"** mode
2. Tap **"Start GPS Tracking"**
3. Grant location permissions

### Step 4: Walk Close!
- **Walk within 1 meter** of the laptop
- Watch the phone: Distance display shows meters
- **When distance ≤ 1m:**
  - 📱 Phone: "Inside geofence - Triggering!"
  - 💻 Laptop: Emergency mode activates!
  - 🟢 North signal turns GREEN
  - 🔴 All others turn RED

---

## Key Changes from Before

### Old System:
- ❌ Junction location hardcoded in `server.py`
- ❌ Had to manually edit coordinates
- ❌ Geofence radius: 50 meters
- ❌ Only phone tracked GPS

### New System:
- ✅ **Laptop location IS the junction** (dynamic!)
- ✅ No configuration needed
- ✅ **Geofence radius: 1 meter** (device-to-device)
- ✅ **Both devices track GPS**
- ✅ Real-time location updates

---

## Testing Options

### Option 1: Same Room Test
1. Put laptop and phone on different sides of the room (>1m apart)
2. Phone should show: "Outside geofence (3m)" (example)
3. Walk with phone towards laptop
4. Watch distance decrease: 3m → 2m → 1m → **0.5m**
5. **Trigger!** when you get within 1 meter

### Option 2: Desktop Test (Both Devices on Desk)
If both devices are already close:
1. Start with phone across the room
2. Then bring phone to laptop
3. Watch trigger happen automatically!

### Option 3: Adjust Radius (If 1m is too sensitive)
Edit `server.py` line 24:
```python
"geofence_radius_m": 3,  # Try 3 meters instead of 1
```

Then restart server.

---

## What You'll See

### On Laptop (Junction Dashboard)

**Console/Event Log:**
```
📍 PROXIMITY MODE: This device location is the junction
🚑 When mobile device comes within 1m, emergency triggers!
✓ GPS tracking started - Broadcasting location to vehicles
📍 Junction location updated: 40.123456, -73.987654
```

### On Phone (Emergency Vehicle)

**When Far Away:**
```
Outside geofence (5m)
Distance to junction: 5m
```

**Getting Closer:**
```
Outside geofence (2m)
Distance to junction: 2m
```

**Within 1 Meter:**
```
✓ Inside geofence (0.8m)
🎯 Entered geofence zone! Distance: 0.8m
→ Sent trigger: VEH-1234 → junction1
```

**On Laptop:**
```
🚨 EMERGENCY MODE ACTIVATED
North signal: GREEN
All others: RED
Emergency Vehicle: VEH-1234
```

---

## Troubleshooting

### Laptop GPS not working
**Problem:** "GPS not supported" or permission denied

**Solution:**
1. Make sure you're using a modern browser (Chrome, Firefox, Safari)
2. Click "Allow" when browser asks for location
3. For desktop browsers, may need to enable location services in OS settings
4. **Fallback:** Use phone as junction instead (swap the devices!)

### Distance not updating
**Problem:** Distance stuck at same number

**Solution:**
1. Check both devices show "GPS active" status
2. Try moving outdoors (GPS works better outside)
3. Wait 30 seconds for GPS to get accurate lock
4. Check that both devices are connected (green status)

### Trigger not happening at 1m
**Problem:** Distance shows 0.5m but no trigger

**Solution:**
1. Check debounce timing (won't trigger again for 5 seconds)
2. Look for "Already triggered" message in logs
3. Try moving away (>2m) then back again
4. Check both devices have accurate GPS (accuracy < 10m)

### GPS accuracy is poor (±50m)
**Problem:** Can't get accurate 1m detection

**Solution:**
1. **Go outdoors** (GPS doesn't work well indoors)
2. Wait 1-2 minutes for GPS to lock satellites
3. Clear view of sky helps
4. For indoor testing, increase radius to 5-10 meters

---

## Deployment (Railway/Zeabur)

The proximity mode works **perfectly** on cloud deployment!

**Why?**
- ✅ HTTPS automatic (GPS requires HTTPS)
- ✅ No local network issues
- ✅ Works on cellular data
- ✅ Can test from anywhere

**Just deploy and:**
- Laptop: `https://your-app.railway.app/signal.html`
- Phone: `https://your-app.railway.app/vehicle.html`

Both will get GPS permissions and work perfectly!

---

## Technical Details

### Distance Calculation
Uses **Haversine formula** for great-circle distance between GPS coordinates:
- Accounts for Earth's curvature
- Accurate to ±0.5% (good enough for meters)
- Real-time calculation on every GPS update

### Update Frequency
- **Laptop:** Sends location every 2 seconds
- **Phone:** Checks distance every ~2 seconds (when GPS updates)
- **Trigger:** Instant when distance ≤ threshold

### GPS Accuracy
- **Outdoors:** ±5-10 meters typical
- **Indoors:** ±20-50 meters (or no signal)
- **Phone usually better** than laptop GPS

### Debouncing
- After trigger, won't trigger again for **5 seconds**
- Must exit geofence (>1m) to reset
- Prevents multiple rapid triggers

---

## Demo Script

Perfect demonstration:

1. **Setup** (30 seconds)
   - Start server
   - Open laptop dashboard → Allow GPS
   - Open phone vehicle page → Auto mode → Start GPS

2. **Show Distance** (30 seconds)
   - Hold phone at distance
   - Show decreasing distance: "5m... 4m... 3m..."
   - Commentary: "When I get within 1 meter..."

3. **The Trigger** (10 seconds)
   - Walk close to laptop
   - **"0.8m - TRIGGERED!"**
   - Laptop goes to emergency mode
   - North signal GREEN
   - Alert banner appears

4. **Auto Recovery** (5 seconds)
   - After 5 seconds, returns to auto cycle
   - Normal operation resumes

**Total: 75 seconds for complete demo!** 🎬

---

## Next Steps

- ✅ Test locally (laptop + phone)
- ✅ Deploy to Railway/Zeabur
- ✅ Test with real walking (outdoors for best GPS)
- ✅ Show to friends/colleagues
- ✅ Use for smart city demos

---

**Ready to test? Restart the server and try it out!** 🚀

```bash
# Stop server
Ctrl + C

# Restart
python server.py

# Open laptop → Allow GPS
# Open phone → Auto mode + GPS
# Walk close together!
```

