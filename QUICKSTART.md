# Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Initialize Git Repository

```bash
cd /home/lucas/.openclaw/workspace/candidate_matching
./setup_github_repo.sh
```

Follow the prompts to:
- Enter your GitHub username
- Choose public or private repo
- Push to GitHub

### Step 2: Enable GitHub Pages

1. Go to your repo on GitHub: `https://github.com/YOUR_USERNAME/candidate-matching`
2. Click **Settings** → **Pages** (left sidebar)
3. Under "Source":
   - Branch: **main**
   - Folder: **/ (root)**
4. Click **Save**
5. Wait 1-2 minutes
6. Your site is live at: `https://YOUR_USERNAME.github.io/candidate-matching/`

### Step 3: Test Locally (Optional)

Before pushing, test locally:

```bash
# Start a local web server
python3 -m http.server 8000

# Open in browser
open http://localhost:8000
# Or on Linux: xdg-open http://localhost:8000
```

You should see the Candidate Matcher with the sample data loaded!

---

## 📅 Weekly Data Refresh

### Option A: Manual Refresh

```bash
cd /home/lucas/.openclaw/workspace/candidate_matching

python3 export_to_json.py \
    --duckdb-path /path/to/your/sigma_analytics.db \
    --github-repo .

git add jobs.json candidates.json data_refresh_timestamp.json
git commit -m "Weekly data refresh: $(date +%Y-%m-%d)"
git push origin main
```

### Option B: Automated Cron Job

```bash
# Edit crontab
crontab -e

# Add this line (runs every Monday at 6 AM)
0 6 * * 1 cd /home/lucas/.openclaw/workspace/candidate_matching && \
    python3 export_to_json.py \
        --duckdb-path /path/to/your/sigma_analytics.db \
        --github-repo . && \
    git add jobs.json candidates.json data_refresh_timestamp.json && \
    git commit -m "Weekly data refresh: $(date +\%Y-\%m-\%d)" && \
    git push origin main >> /tmp/candidate_matcher_cron.log 2>&1
```

---

## 🔧 Using Your Own Data

### 1. Match the Schema

Your DuckDB should have tables matching `schema.sql`:

**Jobs table:**
```sql
CREATE TABLE jobs (
    job_id INTEGER PRIMARY KEY,
    title TEXT,
    company TEXT,
    location TEXT,
    employment_type TEXT,
    experience_level TEXT,
    required_skills TEXT[],
    preferred_skills TEXT[],
    salary_min DECIMAL,
    salary_max DECIMAL,
    status TEXT
);
```

**Candidates table:**
```sql
CREATE TABLE candidates (
    candidate_id INTEGER PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    current_title TEXT,
    current_company TEXT,
    years_experience INTEGER,
    experience_level TEXT,
    skills TEXT[],
    availability TEXT,
    salary_expectation_min DECIMAL,
    salary_expectation_max DECIMAL
);
```

### 2. Run Export Script

Point the export script to your actual database:

```bash
python3 export_to_json.py \
    --duckdb-path /home/lucas/path/to/your/real_database.db \
    --github-repo .
```

### 3. Commit and Push

```bash
git add *.json data_refresh_timestamp.json
git commit -m "Initial data load"
git push origin main
```

---

## 🎨 Customization

### Change Colors

Edit `styles.css`, find the `:root` section:

```css
:root {
    --primary: #2563eb;      /* Change main blue */
    --success: #22c55e;      /* Change green (high scores) */
    --warning: #f59e0b;      /* Change yellow (medium scores) */
    --danger: #ef4444;       /* Change red (low scores) */
}
```

### Adjust Matching Weights

Edit `app.js`, find `calculateMatchScore()` function:

```javascript
scores.overall_score = Math.round(
    (scores.skills_match_score * 0.40) +    // Change skill weight
    (scores.experience_match_score * 0.25) + // Change experience weight
    (scores.level_match_score * 0.15) +
    (scores.location_match_score * 0.10) +
    (scores.salary_match_score * 0.10)
);
```

### Add Your Logo

Add this to `index.html` in the header section:

```html
<div class="logo">
    <img src="your-logo.png" alt="Company Logo" height="40">
</div>
```

---

## 📱 How Users Access

1. **Share the URL**: `https://YOUR_USERNAME.github.io/candidate-matching/`
2. **For private repos**: Users need to be collaborators on the GitHub repo
3. **Bookmark**: Users should bookmark the page for easy access
4. **Notes are local**: Each user's notes are stored in their browser (localStorage)

---

## ❓ Troubleshooting

### Page shows "Error loading data"
- Check browser console (F12) for errors
- Verify `jobs.json` and `candidates.json` exist in repo root
- Make sure files were committed and pushed

### GitHub Pages shows 404
- Wait 1-2 minutes after pushing
- Check Settings → Pages is enabled
- Verify branch is set to `main` and folder is `/`

### Notes not saving
- Browser must allow localStorage (not incognito mode)
- Clear browser cache if issues persist
- Notes are per-browser/device (not synced across devices)

### Match scores seem wrong
- Check if candidate/job data has required fields
- Review matching logic in `app.js` → `calculateMatchScore()`
- Adjust weights as needed

---

## 📊 Sample Data

The repo includes `sample.db` with 20 jobs and 50 candidates for testing. To regenerate:

```bash
python3 sample_data_generator.py
```

Enter `sample.db` when prompted.

---

## 🎯 Next Steps

1. ✅ Set up GitHub repo and Pages
2. ✅ Test locally with sample data
3. ✅ Connect to your real DuckDB
4. ✅ Set up weekly cron job
5. ✅ Share URL with users
6. 🎉 Start matching candidates!

For detailed documentation, see [README.md](README.md).
