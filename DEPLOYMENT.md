# OmniBin Free Deployment Guide

This guide details how to deploy the entire OmniBin project (Frontend, Backend, Background Services, and Database) online entirely for free.

## Architecture & Recommended Free Platforms
- **Database:** MongoDB Atlas (Free Tier)
- **Backend API (FastAPI):** Render Web Service (Free Tier)
- **Frontend (React/Vite):** Vercel or Netlify (Free Tier)
- **MQTT Listener Service:** Fly.io (Free Tier) or run locally
- **MQTT Broker:** HiveMQ Public Broker (Free)

---

## Step 1: Set Up the Database (MongoDB Atlas)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. Build a Database:
   - Select the **M0 Free** cluster.
   - Choose a cloud provider and region closest to your users.
3. Configure Security:
   - Create a database user with a secure username and password. **Save these credentials.**
   - Under "Network Access" on the left sidebar, add IP address `0.0.0.0/0` to allow access from anywhere (since free hosting IPs frequently change).
4. Get Connection String:
   - Click **Connect** -> **Connect your application** in your cluster dashboard.
   - Copy the connection string. It will look like:
     `mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority`

---

## Step 2: Push Your Code to GitHub
Both Render and Vercel will pull your code directly from GitHub to build and deploy.
1. Create a new repository on [GitHub](https://github.com/).
2. Push your local `omnibin` folder to the repository using Git:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/omnibin.git
   git push -u origin main
   ```

---

## Step 3: Deploy the Backend API (Render)
Render offers a free web service tier perfect for our FastAPI backend.

1. Go to [Render.com](https://render.com/) and sign up with your GitHub account.
2. Click **New +** -> **Web Service**.
3. Connect your `omnibin` GitHub repository.
4. Configure the Web Service:
   - **Name:** omnibin-backend (or similar)
   - **Environment:** Python 3
   - **Region:** Match your MongoDB region if possible.
   - **Branch:** `main`
   - **Root Directory:** Leave empty
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Set Environment Variables (Advanced -> Environment Variables):
   - Add your environment variables like `MONGO_URI` (or whatever your `.env` expects) and paste your MongoDB Atlas connection string.
   - Add any other API keys required by your `.env` (like NVIDIA API keys for AI vision features).
6. Click **Create Web Service**. Wait for the build to finish. Once deployed, Render will provide a URL like `https://omnibin-backend.onrender.com`.

---

## Step 4: Deploy the MQTT Listener Service
Because OmniBin requires continuous IoT telemetry listening (`mqtt_listener.py`), you need to run this script alongside your web API. 

*Note: Render's free tier spins down inactive web services after 15 minutes, which isn't ideal for real-time IoT processing.*

**Option A: Free Tier on Fly.io (Recommended)**
1. Install the [Fly.io CLI](https://fly.io/docs/hands-on/install-flyctl/).
2. Run `fly launch` in your project root.
3. For the start command configuration, set it to run `python mqtt_listener.py`. 
4. Fly.io gives free VMs that can run background tasks reliably.

**Option B: Local Hosting for IoT Simulator**
Since this is an IoT project, you might be running simulated bins locally. You can simply run `python mqtt_listener.py` on your local machine to pipe data into your cloud MongoDB database! Ensure your local `.env` has the cloud `MONGO_URI`.

---

## Step 5: Deploy the Frontend (Vercel)
Vercel is optimized for React and Vite applications and provides excellent free hosting.

1. Go to [Vercel](https://vercel.com/) and sign up with GitHub.
2. Click **Add New Project**.
3. Import your `omnibin` GitHub repository.
4. Configure the Project:
   - **Framework Preset:** Vite
   - **Root Directory:** Edit this and select `frontend`
5. Configure Environment Variables:
   - Expand the Environment Variables section.
   - Add `VITE_API_URL` and set the value to your Render backend URL (e.g., `https://omnibin-backend.onrender.com`).
6. Click **Deploy**. Vercel will build and deploy your React app, providing you with a public URL.

---

## Step 6: Final Configuration and Testing
1. **CORS Configuration:** Ensure your FastAPI backend (`app/main.py` or `app/config.py`) has CORS configured to allow requests from your new Vercel frontend URL.
2. Visit your Vercel URL in the browser.
3. Test the features: Submit a complaint, view the map, and check the dashboard.
4. If you chose Option B for the MQTT listener, start it locally and watch the dashboard update live on your Vercel URL!
