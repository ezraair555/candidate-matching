# Candidate Matcher

Static GitHub Pages application for matching candidates to job postings with persistent notes.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  DuckDB (Local) │────▶│  ETL Script      │────▶│  GitHub Pages   │
│  - jobs         │     │  (Weekly Cron)   │     │  (Static Site)  │
│  - candidates   │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                       │
                                                       ▼
                                                ┌─────────────────┐
                                                │  User Browser   │
                                                │  - Match logic  │
                                                │  - localStorage │
                                                └─────────────────┘
```

## Quick Start

### 1. Initialize GitHub Repository

```bash
cd /home/lucas/.openclaw/workspace/candidate_matching

# Initialize git repo
git init
git add .
git commit -m "Initial commit: Candidate Matcher"

# Create GitHub repo (replace with your username)
# Option A: GitHub CLI
gh repo create candidate-matching --public --source=. --push

# Option B: Manual
# 1. Create repo on github.com
# 2. git remote add origin https://github.com/YOUR_USERNAME/candidate-matching.git
# 3. git push -u origin main
```

### 2. Enable GitHub Pages

1. Go to repo **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: **main** / Folder: **/ (root)**
4. Click **Save**
5. Wait 1-2 minutes for deployment
6. Your site will be at: `https://YOUR_USERNAME.github.io/candidate-matching/`

### 3. Set Up Weekly Data Refresh

Create a cron job to export data weekly:

```bash
# Edit crontab
crontab -e

# Add this line (runs every Monday at 6 AM)
0 6 * * 1 cd /home/lucas/.openclaw/workspace/candidate_matching && \
    python3 export_to_json.py \
        --duckdb-path /path/to/your/sigma_analytics.db \
        --github-repo /home/lucas/.openclaw/workspace/candidate_matching && \
    git add jobs.json candidates.json data_refresh_timestamp.json && \
    git commit -m "Weekly data refresh: $(date +\%Y-\%m-\%d)" && \
    git push origin main
```

**Test the export script manually first:**

```bash
python3 export_to_json.py \
    --duckdb-path /path/to/your/sigma_analytics.db \
    --github-repo /home/lucas/.openclaw/workspace/candidate_matching
```

### 4. (Optional) Make Repository Private

For private repos with GitHub Pages:

- **GitHub Free**: Private repos now support GitHub Pages! ✅
- Just change repo visibility in Settings
- Only collaborators can access the site

---

## Database Schema

See `schema.sql` for the ideal DuckDB table structure. The system expects:

### `jobs` table
- `job_id` (PRIMARY KEY)
- `title`, `company`, `location`
- `employment_type` (full-time, part-time, contract)
- `experience_level` (entry, mid, senior, executive)
- `required_skills` (ARRAY), `preferred_skills` (ARRAY)
- `salary_min`, `salary_max`
- `status` (active, closed, on-hold)

### `candidates` table
- `candidate_id` (PRIMARY KEY)
- `first_name`, `last_name`, `email`
- `current_title`, `current_company`, `location`
- `years_experience`, `experience_level`
- `skills` (ARRAY)
- `availability`, `salary_expectation_min`, `salary_expectation_max`
- `linkedin_url`, `resume_url`

---

## Features

### For Users
- ✅ Multi-select job postings
- ✅ Automatic candidate matching (skills, experience, level, location, salary)
- ✅ Filter candidates by score, experience level, search terms
- ✅ Add persistent notes per candidate (stored in browser localStorage)
- ✅ Rate candidates (1-5 stars)
- ✅ Export results to CSV or JSON
- ✅ Responsive design (desktop/mobile)

### Matching Algorithm
Scores candidates on 5 dimensions:
1. **Skills Match** (40% weight) - Required vs. candidate skills
2. **Experience Match** (25% weight) - Years and level comparison
3. **Level Match** (15% weight) - Entry/Mid/Senior/Executive alignment
4. **Location Match** (10% weight) - Remote-friendly or same city
5. **Salary Match** (10% weight) - Expectation vs. budget overlap

Overall score = weighted sum (0-100%)

---

## Data Flow

### Weekly Refresh Process
1. **Monday 6 AM**: Cron job triggers `export_to_json.py`
2. Script queries DuckDB for all active jobs and candidates
3. Exports to `jobs.json`, `candidates.json`, `data_refresh_timestamp.json`
4. Commits and pushes to GitHub
5. GitHub Pages auto-deploys within 1-2 minutes
6. Users see fresh data on next page load (hard refresh may be needed)

### Notes Persistence
- Notes stored in browser's `localStorage` under key `candidate_matcher_notes`
- Structure: `{ candidate_id: [{ note_text, rating, created_at }, ...] }`
- Persists across sessions on same browser/device
- Exported with CSV/JSON downloads
- **Limitation**: Not shared across devices/browsers (would need Google Sheets backend for that)

---

## Customization

### Styling
Edit `styles.css` to change colors, fonts, layout. Key variables in `:root`:
```css
--primary: #2563eb;      /* Main blue */
--success: #22c55e;      /* Green for high scores */
--warning: #f59e0b;      /* Yellow for medium scores */
--danger: #ef4444;       /* Red for low scores */
```

### Matching Weights
Edit `calculateMatchScore()` in `app.js`:
```javascript
scores.overall_score = Math.round(
    (scores.skills_match_score * 0.40) +    // Adjust these weights
    (scores.experience_match_score * 0.25) +
    (scores.level_match_score * 0.15) +
    (scores.location_match_score * 0.10) +
    (scores.salary_match_score * 0.10)
);
```

### Add Authentication
For private access control:
- Use GitHub Pages + private repo (built-in)
- Or add simple password protection via `.htaccess` (if using custom domain)
- Or integrate with Auth0/Clerk for user accounts

---

## Troubleshooting

### Data not loading
- Check browser console for errors
- Verify `jobs.json` and `candidates.json` exist in repo root
- Ensure CORS is not blocking (should be fine on same domain)

### Notes not saving
- Check if browser allows localStorage (not in incognito mode)
- Storage quota is ~5-10MB per domain (plenty for notes)

### Match scores seem off
- Review `calculateMatchScore()` logic in `app.js`
- Check if candidate/job data has required fields populated
- Adjust weights as needed

---

## Next Steps / Enhancements

1. **Google Sheets Backend** - Sync notes to Sheets for cross-device access
2. **Email Notifications** - Alert when new candidates match selected jobs
3. **Advanced Filters** - Skills, availability date, education level
4. **Candidate Comparison** - Side-by-side view of multiple candidates
5. **Interview Tracking** - Status pipeline (Applied → Screen → Interview → Offer)
6. **Team Collaboration** - Shared notes, comments, assignments

---

## License

MIT License - Feel free to fork and customize!
