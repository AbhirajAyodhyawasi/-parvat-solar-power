Parvat Solar Power - Website with Testimonial Approval System
================================================================

IMPORTANT: HOW STORAGE WORKS
-------------------------------
This app can store testimonials in two ways:

1. LOCAL JSON FILE (default) - used automatically when you just run it on
   your own computer. Good for testing, but NOT safe for permanent hosting
   because free hosting platforms wipe local files whenever the app
   restarts (which happens often on free tiers).

2. MONGODB ATLAS (free cloud database) - used automatically once you add a
   MONGODB_URI to the app's environment variables. This keeps your
   testimonials safe permanently, even when the free host restarts.

   You only need to set this up ONCE, before deploying live. Locally on
   your computer you can keep using the simple JSON file - no need to touch
   MongoDB Atlas unless you're deploying.


================================================================
PART 1 - RUNNING LOCALLY (unchanged, for testing on your computer)
================================================================
1. Open a terminal inside this folder.
2. Run:   npm install
3. Run:   npm start
4. Open:  http://localhost:3000
5. Admin: http://localhost:3000/admin.html   (password: changeme123)


================================================================
PART 2 - SETTING UP FREE PERMANENT STORAGE (MongoDB Atlas)
================================================================
Do this once, before deploying live. It's free and takes about 5 minutes.

1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up for a free account (no credit card required).
3. When asked to create a cluster, choose the FREE tier (called "M0").
4. Choose any cloud provider/region (any nearby one is fine) and click
   "Create Deployment".
5. It will ask you to create a database user:
   - Set a username (e.g. pspAdmin)
   - Set a password (SAVE THIS SOMEWHERE - you'll need it in a moment)
   - Click "Create Database User"
6. Under "Where would you like to connect from?", choose
   "My Local Environment" or just add IP address 0.0.0.0/0 (Allow access
   from anywhere) - this is needed because Render's servers don't have a
   fixed IP address. Click "Add Entry" then "Finish and Close".
7. Go to your cluster's "Connect" button > "Drivers" (or "Connect your
   application"). Copy the connection string - it looks like:
     mongodb+srv://pspAdmin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
8. Replace <password> in that string with the actual password you set in
   step 5. Save this full string somewhere safe - this is your MONGODB_URI,
   you'll paste it into Render in Part 3.


================================================================
PART 3 - DEPLOYING FOR FREE ON RENDER
================================================================
1. Go to https://render.com and sign up (free, GitHub login is easiest).

2. You need your project in a GitHub repository first:
   - Go to https://github.com and create a new repository (e.g.
     "parvat-solar-power").
   - Upload all the files from this folder into that repository
     (GitHub's website lets you drag-and-drop files if you don't use Git
     commands - use "Add file > Upload files").

3. In Render, click "New +" > "Web Service".

4. Connect your GitHub account and select the repository you just created.

5. Fill in the settings:
   - Name: parvat-solar-power (or anything you like)
   - Region: choose one close to India (e.g. Singapore)
   - Branch: main
   - Build Command:  npm install
   - Start Command:  npm start
   - Instance Type: Free

6. Before clicking create, scroll to "Environment Variables" and add:
   - Key: ADMIN_PASSWORD      Value: (choose your own secret password)
   - Key: MONGODB_URI         Value: (paste the connection string from Part 2)

7. Click "Create Web Service". Render will build and deploy your site -
   this takes a few minutes the first time.

8. Once deployed, Render gives you a live URL like:
     https://parvat-solar-power.onrender.com
   Your admin page will be at:
     https://parvat-solar-power.onrender.com/admin.html


IMPORTANT NOTES ABOUT RENDER'S FREE TIER
-------------------------------------------
- The free tier "sleeps" after 15 minutes without visitors. The next
  visitor will see the site take about 30-60 seconds to load while it
  wakes up. This is normal and only affects the free tier.
- Because your testimonials are now stored in MongoDB Atlas (not the local
  file), this sleep/wake cycle will NOT delete any data anymore.
- Render gives 750 free hours per month, which comfortably covers a
  small business site.


UPDATING THE LIVE SITE LATER
-------------------------------
Whenever you want to change something (like updating text, images, or
prices), update the files in your GitHub repository. Render automatically
redeploys the site within a minute or two of the change.


OTHER THINGS YOU MAY WANT TO UPDATE
--------------------------------------
- Stats section (in public/index.html, search for "data-count") has sample
  numbers (8 years, 250 installations, 12 MW, 98%) - replace with real figures.
- Phone/WhatsApp number is set to +91 78955 31049 in several places -
  update if needed.
- Gallery images currently point to your existing hosted photos - replace
  anytime by swapping the image paths in index.html.

For any updates or issues, just message me what you'd like changed.
