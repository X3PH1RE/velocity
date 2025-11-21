# How to Restart the Server

## The Problem
The server is running old code. The error "junctionId and state required" means it's using the old version before we added the 4-way junction system.

## Solution: Restart the Server

### Step 1: Stop the Old Server

**In your terminal/PowerShell where the server is running:**

Press: **`Ctrl + C`**

This will stop the server.

### Step 2: Start the New Server

```bash
python server.py
```

You should see the NEW output:
```
============================================================
Velocity Smart-Traffic Testbed Server
4-Way Junction with Auto Cycling
============================================================
Starting server on 0.0.0.0:5000
Junctions configured: junction1

...

Starting auto cycle for all junctions...
  ✓ junction1 - Auto cycling started (20s cycle)

============================================================
```

### Step 3: Refresh the Dashboard

In your browser, **refresh** the page:
- Press **`Ctrl + R`** or **`F5`**
- Or click the refresh button

### Step 4: Test Again

Now the manual override buttons should work!

---

## If Server Won't Stop

If `Ctrl+C` doesn't work, **force close it**:

### Windows (PowerShell):
```powershell
# Find Python process
Get-Process python

# Kill it (replace XXXX with the actual PID)
Stop-Process -Id XXXX -Force

# Or kill all Python processes
Stop-Process -Name python -Force
```

### Windows (CMD):
```bash
# Find process on port 5000
netstat -ano | findstr :5000

# Kill it (replace XXXX with PID from output)
taskkill /PID XXXX /F
```

---

## Quick Command Summary

```bash
# 1. Stop server
Ctrl + C

# 2. Start new server
python server.py

# 3. Wait for: "Auto cycling started"

# 4. Refresh browser
Ctrl + R
```

That's it! 🚀

