# 🚦 START HERE - Velocity 4-Way Junction

## Quick Start (2 Minutes)

### 1. Start Server
```bash
python server.py
```

✅ Server running when you see: `Auto cycling started (20s cycle)`

### 2. Open Dashboard on Laptop
```
http://localhost:5000/signal.html
```

**You should see:**
- ✅ 4 traffic lights in junction layout
- ✅ North signal (bigger) at top
- ✅ Signals cycling automatically
- ✅ "Connected" status (green)

### 3. Find Your IP
```bash
# Windows
ipconfig

# Look for: IPv4 Address . . . : 192.168.1.XXX
```

### 4. Open Phone Browser
```
http://YOUR_IP:5000/vehicle.html
```
Example: `http://192.168.1.100:5000/vehicle.html`

### 5. Test Emergency!

**On Phone:** Tap **"Send Trigger"**

**On Laptop:** Watch this happen:
1. 🚨 Alert: "Emergency Vehicle Approaching!"
2. 🟢 **North signal turns GREEN**
3. 🔴 **All other signals turn RED**
4. 🔄 After 5 seconds, returns to auto cycle

## That's It!

You now have a working 4-way smart junction with emergency vehicle priority! 🎉

---

## What You're Seeing

### Laptop (Junction Dashboard)
- **4 traffic lights** arranged around a junction
- **Auto cycling**: North → South → East → West (20s total)
- **Each gets 4s GREEN** + 1s YELLOW
- **Emergency mode**: North GREEN, others RED

### Phone (Emergency Vehicle)
- **Manual mode**: Big button to trigger
- **Auto mode**: GPS-based triggering
- **Shows distance** to junction
- **Auto-triggers** when within 50m

---

## Need Help?

- **Signals not cycling?** → Refresh dashboard, check "Connected" status
- **Phone can't connect?** → Same Wi-Fi network? Check firewall
- **Server error?** → Fixed for Python 3.12! Using `threading` mode

📖 **Full Guide**: See `JUNCTION_GUIDE.md`

---

**Made with ❤️ for smart city innovation**

