# 4-Way Junction System Guide

## Overview

The Velocity system has been redesigned as a **4-way traffic junction** with automatic signal cycling and emergency vehicle priority.

## How It Works

### Auto Cycle Mode (Normal Operation)

The junction automatically cycles through 4 traffic signals in sequence:

```
North → South → East → West → (repeat)
```

- **Cycle Duration**: 20 seconds total
- **Each Signal**: 4 seconds GREEN + 1 second YELLOW
- **Sequence**: One signal GREEN while others are RED

### Emergency Mode (When Vehicle Approaches)

When your phone (emergency vehicle) comes near the junction:

1. **Auto cycle STOPS**
2. **North (Main) signal turns GREEN** (the bigger one)
3. **All other signals turn RED**
4. After 5 seconds, returns to auto cycle mode

## Visual Layout

```
                  [NORTH]
                 (BIGGER)
                    🚦
                    
      [WEST]        ✛        [EAST]
        🚦      (Junction)      🚦
                    
                 [SOUTH]
                    🚦
```

## How to Test

### Step 1: Start the Server

```bash
python server.py
```

You should see:
```
============================================================
Velocity Smart-Traffic Testbed Server
4-Way Junction with Auto Cycling
============================================================
Starting auto cycle for all junctions...
  ✓ junction1 - Auto cycling started (20s cycle)
```

### Step 2: Find Your Laptop IP

**Windows:**
```bash
ipconfig
```
Look for your IPv4 Address (e.g., 192.168.1.100)

### Step 3: Open Junction Dashboard on Laptop

Open in your laptop browser:
```
http://localhost:5000/signal.html
```

**What you'll see:**
- 4 traffic lights arranged in a junction layout
- North signal is bigger (main signal)
- Signals cycling automatically every 4-5 seconds
- Current mode: "Auto Cycle Mode"
- Roads crossing in the center with a junction box

### Step 4: Connect Phone as Emergency Vehicle

On your phone browser, open:
```
http://YOUR_IP:5000/vehicle.html
```
(Replace YOUR_IP with the address from Step 2)

**Example:** `http://192.168.1.100:5000/vehicle.html`

### Step 5: Test Emergency Trigger

#### Option A: Manual Trigger (Easy Test)

1. On your **phone**, tap the big **"Send Trigger"** button
2. Watch your **laptop**:
   - Auto cycle STOPS
   - Alert banner: "🚑 Emergency Vehicle Approaching!"
   - **North (main) signal turns GREEN**
   - All other signals turn RED
   - Mode badge changes to red "🚨 EMERGENCY MODE"
3. After 5 seconds:
   - Returns to "Auto Cycle Mode"
   - Signals resume cycling

#### Option B: GPS Mode (Realistic Test)

1. **Edit junction coordinates** in `server.py` (lines 21-26):
   ```python
   "lat": YOUR_LATITUDE,    # Set to your current location
   "lng": YOUR_LONGITUDE,
   "geofence_radius_m": 50
   ```

2. **Restart server**: Press `Ctrl+C`, then `python server.py`

3. On your **phone**:
   - Switch to **"Auto (GPS)"** mode
   - Tap **"Start GPS Tracking"**
   - Grant location permissions

4. **Walk within 50 meters** of the junction coordinates

5. **Automatic trigger** when you enter the geofence!

## Dashboard Controls

### Manual Emergency Button
Click **"🚨 Trigger Emergency"** to manually activate emergency mode (for testing)

### Resume Auto Cycle Button
Click **"🔄 Resume Auto Cycle"** to return to normal cycling (if stuck in emergency mode)

## What's Different from Before

### Old System
- Single traffic light
- RED/GREEN toggle
- Manual control only

### New System
✅ 4-way junction layout
✅ Automatic signal cycling (20s cycle)
✅ Visual roads and junction center
✅ North signal is bigger (emergency vehicle path)
✅ Emergency override stops cycle
✅ Automatic return to cycling

## Troubleshooting

### Server won't start
**Error:** `AttributeError: module 'ssl' has no attribute 'wrap_socket'`

**Fixed!** The server now uses `threading` mode instead of `eventlet` for Python 3.12 compatibility.

### Signals not cycling
- Check server console for errors
- Refresh the dashboard page
- Check "Connected" status in footer

### Phone can't connect
- Same Wi-Fi network? ✓
- Firewall blocking port 5000? (temporarily disable)
- Using your IP address, not "localhost"? ✓

### Emergency trigger not working
1. Check both devices show "Connected"
2. Try manual trigger first (big button on phone)
3. Check server console for "EMERGENCY MODE" message
4. Check browser console (F12) for errors

## Technical Details

### Signal Timing
- **Green Duration**: 4 seconds per signal
- **Yellow Duration**: 1 second transition
- **Total Cycle**: 20 seconds (4 signals × 5 seconds)
- **Emergency Duration**: 5 seconds (configurable)

### Configuration
Edit `server.py` to adjust:
```python
# Line 31-37
CYCLE_DURATION_MS = 20000        # 20 seconds
SIGNAL_GREEN_TIME_MS = 4000      # 4 seconds per signal
SIGNAL_YELLOW_TIME_MS = 1000     # 1 second yellow
GREEN_DURATION_MS = 5000         # Emergency duration
```

### Junction Coordinates
Edit `server.py` lines 21-26:
```python
JUNCTIONS_CONFIG = {
    "junction1": {
        "name": "Main St & 5th Ave",
        "lat": 40.7580,              # Your latitude
        "lng": -73.9855,             # Your longitude
        "geofence_radius_m": 50      # Detection radius
    }
}
```

## Expected Behavior

### Normal Auto Cycle
```
Time 0s:  North GREEN,  others RED
Time 4s:  North YELLOW, others RED
Time 5s:  South GREEN,  others RED
Time 9s:  South YELLOW, others RED
Time 10s: East GREEN,   others RED
Time 14s: East YELLOW,  others RED
Time 15s: West GREEN,   others RED
Time 19s: West YELLOW,  others RED
Time 20s: (repeat from North)
```

### Emergency Override
```
Time 0s:  [Auto cycle running]
Time Xs:  Phone sends trigger → EMERGENCY MODE
          North: GREEN
          South: RED
          East: RED
          West: RED
Time X+5s: Return to auto cycle
```

## Demo Video (Suggested Test)

1. **Open laptop** to junction dashboard
2. **Wait 20 seconds** - watch all 4 signals cycle through
3. **Pick up phone** and tap "Send Trigger"
4. **Watch laptop** - North goes GREEN, others RED, emergency alert
5. **Wait 5 seconds** - returns to auto cycling

Perfect demonstration of smart traffic priority! 🚦🚑

## Next Steps

1. ✅ Test auto cycling
2. ✅ Test manual emergency trigger
3. ✅ Configure junction to your location
4. ✅ Test GPS mode
5. ✅ Deploy to cloud for remote testing

---

**Enjoy your smart 4-way junction system! 🚦**

