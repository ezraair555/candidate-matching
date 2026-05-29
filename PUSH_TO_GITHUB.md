# Push to GitHub - Manual Steps Required

The repository code is ready and committed locally. You need to create the GitHub repo manually.

## Option 1: Via GitHub Website (Easiest)

### Step 1: Create Repository
1. Go to: https://github.com/new
2. Repository name: `candidate-matching`
3. Choose: **Private** (or Public, your choice)
4. **Do NOT** initialize with README, .gitignore, or license
5. Click **Create repository**

### Step 2: Push Your Code
Run these commands in the terminal:

```bash
cd /home/lucas/.openclaw/workspace/candidate_matching

# Add remote (replace YOUR_USERNAME if different)
git remote add origin https://github.com/ezraair555/candidate-matching.git

# Push to GitHub
git push -u origin main
```

### Step 3: Enable GitHub Pages
1. Go to your repo: https://github.com/ezraair555/candidate-matching
2. Click **Settings** → **Pages** (left sidebar)
3. Under "Build and deployment":
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/ (root)**
4. Click **Save**
5. Wait 1-2 minutes for deployment

### Step 4: Access Your Site
Your live site will be at:
```
https://ezraair555.github.io/candidate-matching/
```

---

## Option 2: Install GitHub CLI (For Future Automation)

If you want to automate repo creation in the future:

```bash
# Install GitHub CLI
sudo apt update && sudo apt install gh

# Authenticate
gh auth login

# Then run the setup script
./setup_github_repo.sh
```

---

## Quick Command Summary

```bash
cd /home/lucas/.openclaw/workspace/candidate_matching
git remote add origin https://github.com/ezraair555/candidate-matching.git
git push -u origin main
```

Then enable Pages in GitHub Settings.

---

## After Setup

Once GitHub Pages is enabled, share this link with users:
**https://ezraair555.github.io/candidate-matching/**

For weekly data refresh, set up the cron job from QUICKSTART.md.
