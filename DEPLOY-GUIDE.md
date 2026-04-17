# TumakMusic.com Hosting Guide

Your site is a single HTML file with a few images and font files. No server-side code, no build step, no database. This makes hosting dead simple. Here are three options ranked by effort and cost.


## Option A: GitHub Pages (Free, Recommended)

Total cost: $0. Best for a static site like this.

### Step 1: Create a GitHub account (skip if you have one)

Go to https://github.com/signup and create an account.

### Step 2: Create a new repository

1. Go to https://github.com/new
2. Name it `tumakmusic.com` (or whatever you like)
3. Set to **Public** (required for free GitHub Pages)
4. Don't add a README or .gitignore
5. Click **Create repository**

### Step 3: Upload the deploy folder

1. On the empty repo page, click **uploading an existing file**
2. Open Finder and navigate to: `Claude Cowork > TumakMusic > deploy`
3. Select ALL files inside the deploy folder (index.html, CNAME, robots.txt, sitemap.xml, 404.html, Gagalin-Regular.woff2, Gagalin-Regular.otf) and the `img` folder
4. Drag them into the GitHub upload area
5. Click **Commit changes**

Important: upload the CONTENTS of the deploy folder, not the folder itself. The index.html needs to be at the root of the repo.

### Step 4: Enable GitHub Pages

1. Go to your repo's **Settings** tab
2. Click **Pages** in the left sidebar
3. Under "Source", select **Deploy from a branch**
4. Set branch to `main`, folder to `/ (root)`
5. Click **Save**
6. Under "Custom domain", type `tumakmusic.com` and click **Save**
7. Check **Enforce HTTPS** once it becomes available (may take a few minutes)

### Step 5: Point your domain to GitHub

Log into wherever tumakmusic.com is registered (likely Hostinger) and go to DNS settings.

Add four A records for the apex domain:

    Type: A    Name: @    Value: 185.199.108.153
    Type: A    Name: @    Value: 185.199.109.153
    Type: A    Name: @    Value: 185.199.110.153
    Type: A    Name: @    Value: 185.199.111.153

Add one CNAME record for www:

    Type: CNAME    Name: www    Value: YOUR_GITHUB_USERNAME.github.io

Replace YOUR_GITHUB_USERNAME with your actual GitHub username.

If there are existing A records or CNAME records for @ or www, delete them first. Leave MX records (email) and TXT records alone.

### Step 6: Wait and verify

DNS propagation usually takes 5 to 30 minutes but can take up to 48 hours.

1. Visit https://tumakmusic.com
2. Check that HTTPS is working (padlock icon)
3. Test on your phone too

### Updating the site later

Edit the file locally (or ask me to edit it), then go to the GitHub repo, click the file, click the pencil icon, paste the new content, and commit. The site updates within a minute.


## Option B: Cloudflare Pages (Free, Faster CDN)

Same $0 cost as GitHub Pages but with Cloudflare's global CDN for faster load times worldwide. Slightly more setup.

### Step 1: Push to GitHub first

Follow Option A steps 1 through 3 to get your files on GitHub. You don't need to enable GitHub Pages though.

### Step 2: Connect Cloudflare Pages

1. Go to https://dash.cloudflare.com and create a free account (or log in)
2. Click **Workers & Pages** in the sidebar
3. Click **Create application**, then **Pages**
4. Click **Connect to Git** and authorize GitHub
5. Select your tumakmusic.com repo
6. For build settings: leave everything blank (no build command needed)
7. Set "Build output directory" to `/` (root)
8. Click **Save and Deploy**

### Step 3: Add your custom domain

1. In Cloudflare Pages, go to your project settings
2. Click **Custom domains** and add `tumakmusic.com`
3. If your domain is already on Cloudflare for DNS, it auto-configures
4. If not, follow the DNS instructions Cloudflare provides (similar to the GitHub A records but pointing to Cloudflare's servers)

Cloudflare Pages auto-deploys whenever you push to GitHub. It also handles HTTPS automatically.


## Option C: Hostinger (You Already Have an Account)

If you'd rather use your existing Hostinger account. Cost depends on your plan (you're likely already paying for it).

### Step 1: Access File Manager

1. Log into Hostinger at https://hpanel.hostinger.com
2. Go to **Websites** and select your domain (or add tumakmusic.com if not there)
3. Click **File Manager**

### Step 2: Upload files

1. Navigate to the `public_html` folder
2. Delete any existing files in there (if this is a fresh setup)
3. Click **Upload** and upload all files from the deploy folder
4. Make sure the `img` folder is uploaded with its contents inside it
5. The font files (Gagalin-Regular.woff2 and .otf) go in the root alongside index.html

### Step 3: Point your domain

If tumakmusic.com is registered at Hostinger, the DNS should already point to their servers. If the domain is registered elsewhere, update the nameservers to Hostinger's (they'll show you what to use in the domain setup wizard).

### Step 4: Enable SSL

1. In hPanel, go to **SSL** under your website
2. Install the free SSL certificate
3. Enable "Force HTTPS"

Hostinger's upside: you already have the account and can manage everything in one place. Downside: it's not free (you're paying for hosting), and deploying updates means manually uploading files each time.


## My Recommendation

**Go with GitHub Pages (Option A).** It's free, it's fast, deployment is just dragging files into GitHub, and it scales to any traffic level. The CNAME file in your deploy folder is already set to `tumakmusic.com` so it's pre-configured.

If you want even faster global performance later, you can always add Cloudflare in front of GitHub Pages (or switch to Cloudflare Pages).

Keep Hostinger for domain registration and email only. No need to pay for hosting when your site is a static HTML file.


## After the Site is Live: Next Steps

These are optional upgrades you can do anytime:

**YouTube API key** for auto-updating videos: Go to https://console.cloud.google.com, create a free project, enable "YouTube Data API v3", create an API key (restrict to HTTP referrer `https://tumakmusic.com/*` or to IPs if preferred), then add it in Cloudflare Pages → Settings → Environment Variables as `YOUTUBE_API_KEY`. The `/api/videos` Cloudflare Function picks it up automatically. Optionally set `YOUTUBE_CHANNEL_ID` to override the default channel.

**Kit (ConvertKit) email capture**: Sign up at https://app.kit.com (free up to 10,000 subscribers), create a form, and connect it to the email form in index.html.

**Install Gagalin on macOS** (if not already installed): Double-click `Gagalin-Regular.otf` in Finder. Font Book will open and offer to install it. Once installed, it's available in Logic Pro, Pages, Keynote, and any other app on your Mac.

**Update social bios**: Once the site is live, add tumakmusic.com to your bios on YouTube, X, TikTok, and Instagram.
