# Deployment Guide - Railway, Zeabur, and More

## Quick Deployment Options

### Option 1: Railway (Recommended) ⭐

**Why Railway?**
- ✅ Free tier available
- ✅ Easy deployment from GitHub
- ✅ Automatic HTTPS
- ✅ Great for WebSocket/Socket.IO
- ✅ Fast and reliable

**Steps:**

1. **Push to GitHub** (if you haven't already):
   ```bash
   git init
   git add .
   git commit -m "Velocity 4-way junction system"
   git remote add origin https://github.com/YOUR_USERNAME/velocity-app.git
   git push -u origin main
   ```

2. **Go to Railway**: https://railway.app

3. **Click "Start a New Project"**

4. **Choose "Deploy from GitHub repo"**

5. **Select your `velocity-app` repository**

6. **Railway will automatically detect Python and deploy!**

7. **Get your URL**: 
   - Click on your deployment
   - Go to "Settings" → "Domains"
   - Generate domain: `https://velocity-app.railway.app`

8. **Done!** Access from anywhere:
   - Phone: `https://velocity-app.railway.app/vehicle.html`
   - Laptop: `https://velocity-app.railway.app/signal.html`

---

### Option 2: Zeabur

**Steps:**

1. **Go to Zeabur**: https://zeabur.com

2. **Create new project** → **Deploy from GitHub**

3. **Select repository**: `velocity-app`

4. **Zeabur auto-detects Python**

5. **Get your URL**: `https://velocity-app.zeabur.app`

6. **Access:**
   - Phone: `https://velocity-app.zeabur.app/vehicle.html`
   - Laptop: `https://velocity-app.zeabur.app/signal.html`

---

### Option 3: Render

**Steps:**

1. **Go to Render**: https://render.com

2. **New** → **Web Service**

3. **Connect GitHub** → Select `velocity-app`

4. **Settings:**
   - Name: `velocity-app`
   - Environment: `Python 3`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python server.py`

5. **Deploy!**

6. **URL**: `https://velocity-app.onrender.com`

---

### Option 4: Heroku

**Steps:**

1. **Install Heroku CLI**: https://devcenter.heroku.com/articles/heroku-cli

2. **Login**:
   ```bash
   heroku login
   ```

3. **Create app**:
   ```bash
   heroku create velocity-app
   ```

4. **Deploy**:
   ```bash
   git push heroku main
   ```

5. **URL**: `https://velocity-app.herokuapp.com`

---

## After Deployment

### Update Junction Coordinates

Once deployed, you can still configure the junction location:

**Option A: Edit on GitHub**
1. Go to your GitHub repo
2. Edit `server.py` → lines 21-26
3. Change `lat` and `lng` to your location
4. Commit → Railway/Zeabur will auto-redeploy!

**Option B: Environment Variables** (Advanced)
Add environment variables on Railway/Zeabur:
- `JUNCTION_LAT=40.7580`
- `JUNCTION_LNG=-73.9855`

(You'd need to modify `server.py` to read from env vars)

---

## Using Your Deployed App

### On Your Phone (Emergency Vehicle)

1. **Open browser** (Chrome, Safari, etc.)

2. **Go to**: `https://YOUR-APP.railway.app/vehicle.html`

3. **What you'll see:**
   - ✅ Vehicle simulator interface
   - ✅ "Connected" status
   - ✅ Manual and Auto (GPS) modes

4. **Test Manual Mode:**
   - Tap "Send Trigger"
   - Check laptop to see signal change!

5. **Test GPS Mode:**
   - Switch to "Auto (GPS)"
   - Tap "Start GPS Tracking"
   - Grant location permissions
   - Walk to the junction location

### On Your Laptop (Traffic Signal)

1. **Open browser**

2. **Go to**: `https://YOUR-APP.railway.app/signal.html`

3. **What you'll see:**
   - ✅ 4-way junction with traffic lights
   - ✅ Signals cycling automatically
   - ✅ North signal (bigger) at top
   - ✅ "Connected" status

4. **Watch for emergency:**
   - When phone sends trigger
   - North signal turns GREEN
   - Alert banner appears
   - Returns to cycling after 5s

---

## Benefits of Cloud Deployment

### 🌐 Access Anywhere
- Phone and laptop don't need same Wi-Fi
- Works on cellular data
- Access from anywhere in the world

### 🔒 HTTPS Automatic
- Geolocation API works (requires HTTPS)
- Secure WebSocket connections
- No browser warnings

### 🚀 No Local Server
- No need to keep laptop running
- Server always available
- Better performance

### 👥 Share with Others
- Send URL to teammates
- Multiple users can test simultaneously
- Great for demos

### 📱 Real Testing
- Actually walk around with phone
- Test real GPS geofencing
- More realistic scenarios

---

## Configuration for Production

### Update Server for Dynamic Port

Railway/Zeabur use dynamic ports. Update `server.py`:

```python
# Line 15-16, change from:
HOST = '0.0.0.0'
PORT = 5000

# To:
import os
HOST = '0.0.0.0'
PORT = int(os.environ.get('PORT', 5000))
```

This way it works both locally and on cloud platforms.

---

## Monitoring Your Deployed App

### Railway
- **Logs**: Click deployment → "Logs" tab
- **Metrics**: CPU, Memory, Network usage
- **Restart**: Settings → "Restart"

### Zeabur
- **Logs**: Project → Service → "Logs"
- **Metrics**: Built-in monitoring dashboard
- **Restart**: Service → "Restart"

---

## Cost

### Free Tiers Available:
- **Railway**: $5 free credit/month (enough for testing)
- **Zeabur**: Free tier available
- **Render**: Free tier (spins down after inactivity)
- **Heroku**: Free tier discontinued (now paid)

**Recommendation**: Start with **Railway** or **Zeabur** free tier!

---

## Example URLs After Deployment

### Railway
```
Main:     https://velocity-app.railway.app
Vehicle:  https://velocity-app.railway.app/vehicle.html
Signal:   https://velocity-app.railway.app/signal.html
Status:   https://velocity-app.railway.app/status
```

### Zeabur
```
Main:     https://velocity-app.zeabur.app
Vehicle:  https://velocity-app.zeabur.app/vehicle.html
Signal:   https://velocity-app.zeabur.app/signal.html
Status:   https://velocity-app.zeabur.app/status
```

### Render
```
Main:     https://velocity-app.onrender.com
Vehicle:  https://velocity-app.onrender.com/vehicle.html
Signal:   https://velocity-app.onrender.com/signal.html
Status:   https://velocity-app.onrender.com/status
```

---

## Testing After Deployment

### Quick Test
```bash
# Test status API
curl https://YOUR-APP.railway.app/status

# Test trigger API
curl -X POST https://YOUR-APP.railway.app/trigger \
  -H "Content-Type: application/json" \
  -d '{"junctionId":"junction1","vehicleId":"TEST","timestamp":1700000000000}'
```

### Full Test
1. ✅ Open signal page on laptop → See auto cycling
2. ✅ Open vehicle page on phone → See "Connected"
3. ✅ Tap "Send Trigger" → Signal changes to emergency mode
4. ✅ Test GPS mode → Walk to junction location

---

## Troubleshooting

### WebSocket Connection Issues
- Check Railway/Zeabur supports WebSockets (they do!)
- Verify HTTPS is enabled
- Check browser console for errors

### Port Configuration
Make sure `server.py` reads `PORT` from environment:
```python
PORT = int(os.environ.get('PORT', 5000))
```

### Static Files Not Loading
- Ensure `public/` folder is in the repository
- Check deployment logs for errors
- Verify Flask is serving from correct folder

---

## Need Help?

1. Check deployment logs on Railway/Zeabur
2. Test `/status` endpoint to see if server is running
3. Check browser console (F12) for frontend errors
4. Verify GPS coordinates are set correctly

---

**Ready to deploy? Choose Railway or Zeabur and follow the steps above! 🚀**

