# Velocity Testing Guide

Quick reference for testing the Velocity Smart-Traffic Testbed.

## Quick Start Test (5 minutes)

### 1. Install & Start Server
```bash
# Install dependencies
pip install -r requirements.txt

# Start server
python server.py
```

**Expected**: Server starts on port 5000, shows junction configuration

### 2. Test Status API
```bash
curl http://localhost:5000/status
```

**Expected**: JSON response with junction1 state = "RED"

### 3. Test Trigger API
```bash
curl -X POST http://localhost:5000/trigger \
  -H "Content-Type: application/json" \
  -d '{"junctionId":"junction1","vehicleId":"TEST-001","timestamp":1700000000000}'
```

**Expected**: `{"success": true, "state": "GREEN"}`

### 4. Verify State Changed
```bash
curl http://localhost:5000/status
```

**Expected**: Junction1 state = "GREEN" (if within 5 seconds)

### 5. Test Web Interface
1. Open http://localhost:5000/vehicle.html
2. Open http://localhost:5000/signal.html in another tab
3. Click "Send Trigger" on vehicle page
4. Watch signal turn GREEN

**Expected**: Traffic light animates to GREEN, shows alert, returns to RED after 5s

## LAN Testing (Mobile + Laptop)

### Find Your IP
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig | grep "inet "
```

### Connect Mobile
1. Connect mobile to same Wi-Fi as laptop
2. Open http://YOUR_IP:5000/vehicle.html on mobile
3. Open http://localhost:5000/signal.html on laptop
4. Tap "Send Trigger" on mobile
5. Watch laptop signal turn GREEN

### Test GPS Mode (Optional)
1. On mobile, switch to "Auto (GPS)" mode
2. Tap "Start GPS Tracking"
3. Grant location permissions
4. Edit server.py to set junction coords to your location:
   ```python
   "lat": YOUR_LATITUDE,
   "lng": YOUR_LONGITUDE,
   "geofence_radius_m": 50
   ```
5. Walk within 50m of junction
6. Watch automatic trigger

## Automated Tests

### Run All Tests (Bash/Linux/Mac)
```bash
#!/bin/bash
echo "Testing Velocity..."

# Test 1: Status
curl -s http://localhost:5000/status | grep -q "junction1" && echo "✓ Status API" || echo "✗ Status API"

# Test 2: Trigger
curl -s -X POST http://localhost:5000/trigger \
  -H "Content-Type: application/json" \
  -d '{"junctionId":"junction1","vehicleId":"TEST","timestamp":1700000000000}' \
  | grep -q "success" && echo "✓ Trigger API" || echo "✗ Trigger API"

# Test 3: State change
sleep 1
curl -s http://localhost:5000/status | grep -q "GREEN" && echo "✓ State Changed" || echo "✗ State Changed"

echo "Tests complete!"
```

### Run All Tests (PowerShell/Windows)
```powershell
Write-Host "Testing Velocity..." -ForegroundColor Cyan

# Test 1: Status
$status = Invoke-RestMethod -Uri "http://localhost:5000/status"
if ($status.junctions.junction1) {
    Write-Host "✓ Status API" -ForegroundColor Green
} else {
    Write-Host "✗ Status API" -ForegroundColor Red
}

# Test 2: Trigger
$body = @{
    junctionId = "junction1"
    vehicleId = "TEST"
    timestamp = 1700000000000
} | ConvertTo-Json

$trigger = Invoke-RestMethod -Uri "http://localhost:5000/trigger" -Method Post -Body $body -ContentType "application/json"
if ($trigger.success) {
    Write-Host "✓ Trigger API" -ForegroundColor Green
} else {
    Write-Host "✗ Trigger API" -ForegroundColor Red
}

# Test 3: State change
Start-Sleep -Seconds 1
$status2 = Invoke-RestMethod -Uri "http://localhost:5000/status"
if ($status2.junctions.junction1.state -eq "GREEN") {
    Write-Host "✓ State Changed" -ForegroundColor Green
} else {
    Write-Host "✗ State Changed" -ForegroundColor Red
}

Write-Host "Tests complete!" -ForegroundColor Cyan
```

## Common Issues & Fixes

### Port Already in Use
```bash
# Find and kill process on port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :5000
kill -9 <PID>
```

### Dependencies Not Installing
```bash
# Upgrade pip first
python -m pip install --upgrade pip

# Then install requirements
pip install -r requirements.txt
```

### Can't Connect from Mobile
1. Check firewall (allow port 5000)
2. Verify same Wi-Fi network
3. Verify server is running on 0.0.0.0 (not 127.0.0.1)
4. Try IP address directly, not hostname

### GPS Not Working
1. Use HTTPS or localhost (browsers require secure context)
2. Grant location permissions
3. Wait 30s for GPS lock
4. Move outdoors for better signal
5. Use Manual mode as fallback

## Performance Testing

### Load Test with curl
```bash
# Send 100 triggers rapidly
for i in {1..100}; do
  curl -X POST http://localhost:5000/trigger \
    -H "Content-Type: application/json" \
    -d "{\"junctionId\":\"junction1\",\"vehicleId\":\"LOAD-$i\",\"timestamp\":$(date +%s)000}" &
done
wait
```

**Expected**: Server handles all requests, extends GREEN duration appropriately

### Socket.IO Stress Test
```javascript
// In browser console on vehicle.html
for (let i = 0; i < 10; i++) {
  setTimeout(() => {
    document.getElementById('triggerBtn').click();
  }, i * 1000);
}
```

**Expected**: All triggers processed, signal extends GREEN time

## Acceptance Criteria

- [x] Server starts without errors
- [x] Status API returns JSON
- [x] Trigger API changes junction state
- [x] Vehicle page connects to server
- [x] Signal page connects to server
- [x] Manual trigger works
- [x] Traffic light animates correctly
- [x] State syncs across clients
- [x] Manual override works
- [x] GPS mode requests permissions
- [x] Event logs update in real-time
- [x] Statistics increment correctly
- [x] Reconnection preserves state
- [x] Multiple triggers extend duration

## Browser Compatibility

Tested on:
- ✅ Chrome 120+
- ✅ Firefox 120+
- ✅ Safari 17+
- ✅ Edge 120+
- ✅ Chrome Mobile (Android)
- ✅ Safari Mobile (iOS)

## Next Steps

After successful testing:
1. Configure junction coordinates for your location
2. Adjust timing parameters (GREEN/YELLOW duration)
3. Deploy to cloud for remote testing
4. Add more junctions as needed
5. Implement authentication for production use

---

**Happy Testing! 🚦🚑**


