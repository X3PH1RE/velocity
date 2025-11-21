# 🚀 Deploy to Railway in 5 Minutes

## What You'll Get

After deployment:
- 🌐 **Public URL**: `https://your-app.railway.app`
- 📱 **Phone Access**: Open URL + `/vehicle.html`
- 💻 **Laptop Access**: Open URL + `/signal.html`
- ✅ **Works Anywhere**: Different Wi-Fi networks, even cellular!

---

## Step-by-Step

### 1. Push to GitHub

```bash
# In your project folder
git init
git add .
git commit -m "Velocity smart traffic system"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/velocity-app.git
git push -u origin main
```

### 2. Deploy to Railway

1. Go to: **https://railway.app**
2. Click **"Start a New Project"**
3. Click **"Deploy from GitHub repo"**
4. Select your **`velocity-app`** repository
5. Railway will automatically:
   - ✅ Detect Python
   - ✅ Install dependencies
   - ✅ Start server
   - ✅ Give you a URL!

### 3. Get Your URL

1. Click on your deployment
2. Go to **"Settings"** → **"Networking"** → **"Public Networking"**
3. Click **"Generate Domain"**
4. You'll get: `https://velocity-app-production.up.railway.app`

### 4. Use It!

**On Phone:**
```
https://your-app.railway.app/vehicle.html
```

**On Laptop:**
```
https://your-app.railway.app/signal.html
```

**That's it!** 🎉

---

## Testing Checklist

- [ ] Open signal page on laptop → See 4-way junction
- [ ] Signals cycling automatically?
- [ ] "Connected" status showing?
- [ ] Open vehicle page on phone
- [ ] Tap "Send Trigger" → Signal changes to emergency?
- [ ] GPS mode works?

---

## Configure Junction Location

**After deployment**, edit coordinates:

1. Go to your GitHub repo
2. Edit `server.py` → **Lines 23-25**
3. Change:
   ```python
   "lat": YOUR_LATITUDE,
   "lng": YOUR_LONGITUDE,
   ```
4. Commit → Railway auto-redeploys!

Get coordinates from: https://www.google.com/maps (right-click location)

---

## Alternative: Zeabur

Prefer Zeabur? Same process:

1. **https://zeabur.com**
2. **Deploy from GitHub**
3. Select repository
4. Get URL: `https://velocity-app.zeabur.app`

---

## Why Cloud Deployment?

| Local (Laptop) | Cloud (Railway) |
|---|---|
| Same Wi-Fi only | Anywhere! |
| Firewall issues | Always accessible |
| No HTTPS | HTTPS automatic |
| GPS restricted | GPS works perfectly |
| Must keep running | Always online |

---

## Need Help?

**Check Railway Logs:**
1. Click your deployment
2. Go to "Deployments" tab
3. Click latest deployment
4. View logs

**Test API:**
```bash
curl https://your-app.railway.app/status
```

Should return JSON with junction info!

---

## Free Tier Info

- **Railway**: $5 free credit/month
- **Zeabur**: Free tier available
- **Perfect for**: Testing, demos, small projects

---

**Ready? Go to Railway and deploy! 🚀**

https://railway.app

