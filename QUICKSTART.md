# Velocity Quick Start Guide

Get Velocity running in under 5 minutes!

## Prerequisites Check

```bash
# Verify Python 3.10+
python --version

# Verify pip
pip --version
```

## Installation (2 minutes)

### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Start Server
```bash
python server.py
```

✅ **Server Running!** You should see:
```
============================================================
Velocity Smart-Traffic Testbed Server
============================================================
Starting server on 0.0.0.0:5000
...
```

## Testing (2 minutes)

### Option A: Single Computer Test

1. Open your browser to: **http://localhost:5000/vehicle.html**
2. Open a second tab to: **http://localhost:5000/signal.html**
3. Click **"Send Trigger"** on the vehicle page
4. Watch the traffic light turn **GREEN** on the signal page! 🚦

### Option B: Mobile + Laptop Test

1. Find your computer's IP address:
   - **Windows**: `ipconfig` (look for IPv4 Address)
   - **Mac/Linux**: `ifconfig | grep "inet "`
   
2. On your **laptop**, open: `http://localhost:5000/signal.html`

3. On your **mobile** (same Wi-Fi), open: `http://YOUR_IP:5000/vehicle.html`
   - Example: `http://192.168.1.100:5000/vehicle.html`

4. Tap **"Send Trigger"** on mobile

5. Watch laptop traffic light turn **GREEN**! 🎉

## What's Next?

### Customize Junction Location
Edit `server.py` line 21 with your coordinates:
```python
"lat": YOUR_LATITUDE,
"lng": YOUR_LONGITUDE,
```

### Try GPS Mode
1. On mobile, switch to **"Auto (GPS)"** mode
2. Tap **"Start GPS Tracking"**
3. Grant location permissions
4. Walk within 50m of the junction
5. Watch automatic trigger!

### API Testing
```bash
# Check status
curl http://localhost:5000/status

# Trigger via API
curl -X POST http://localhost:5000/trigger \
  -H "Content-Type: application/json" \
  -d '{"junctionId":"junction1","vehicleId":"API-TEST","timestamp":1700000000000}'
```

## Troubleshooting

### "Address already in use"
Someone is using port 5000. Kill it:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>
```

### Can't connect from mobile
1. Both devices on same Wi-Fi? ✓
2. Firewall blocking port 5000? (Disable temporarily)
3. Using your IP, not `localhost`? ✓
4. Server running on `0.0.0.0`? (Should be default)

### Import errors
```bash
pip install --upgrade -r requirements.txt
```

## Alternative: Use Startup Script

### Windows
```bash
scripts\start.bat
```

### Mac/Linux
```bash
chmod +x scripts/start.sh
./scripts/start.sh
```

### Docker
```bash
docker-compose up
```

## Success Criteria

You're ready if:
- ✅ Server starts without errors
- ✅ Can access vehicle page
- ✅ Can access signal page  
- ✅ Both show "Connected" status
- ✅ Trigger button makes light turn GREEN
- ✅ Light returns to RED after ~5 seconds

## Full Documentation

- **README.md** - Complete documentation
- **TESTING.md** - Detailed testing guide
- **PROJECT_SUMMARY.md** - Technical overview

## Support

Stuck? Check:
1. README.md → Troubleshooting section
2. Browser console (F12) for errors
3. Server console for error messages

---

**Enjoy your smart traffic system! 🚦🚑**


