/**
 * Candidate Matcher - Frontend Application
 * Loads jobs/candidates from JSON, matches client-side, stores notes in localStorage
 */

// === State ===
let jobs = [];
let candidates = [];
let selectedJobIds = new Set();
let filteredCandidates = [];
let currentCandidateId = null;

// === DOM Elements ===
const jobList = document.getElementById('jobList');
const jobSearch = document.getElementById('jobSearch');
const jobTypeFilter = document.getElementById('jobTypeFilter');
const selectedJobsSummary = document.getElementById('selectedJobsSummary');
const matchBtn = document.getElementById('matchBtn');
const candidatesGrid = document.getElementById('candidatesGrid');
const candidateFilters = document.getElementById('candidateFilters');
const candidateSearch = document.getElementById('candidateSearch');
const minScoreFilter = document.getElementById('minScoreFilter');
const experienceFilter = document.getElementById('experienceFilter');
const dataStatus = document.getElementById('dataStatus');
const candidateModal = document.getElementById('candidateModal');
const exportModal = document.getElementById('exportModal');

// === Initialization ===
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    setupEventListeners();
});

// === Data Loading ===
async function loadData() {
    try {
        // Load jobs
        const jobsResponse = await fetch('jobs.json');
        if (!jobsResponse.ok) throw new Error('Failed to load jobs.json');
        jobs = await jobsResponse.json();
        
        // Load candidates
        const candidatesResponse = await fetch('candidates.json');
        if (!candidatesResponse.ok) throw new Error('Failed to load candidates.json');
        candidates = await candidatesResponse.json();
        
        // Load timestamp
        let timestampData = null;
        try {
            const tsResponse = await fetch('data_refresh_timestamp.json');
            if (tsResponse.ok) timestampData = await tsResponse.json();
        } catch (e) {
            console.warn('No timestamp file found');
        }
        
        updateDataStatus(true, timestampData);
        renderJobs();
        
    } catch (error) {
        console.error('Error loading data:', error);
        updateDataStatus(false, null, error.message);
    }
}

function updateDataStatus(ready, timestampData, errorMessage = null) {
    const indicator = dataStatus.querySelector('.status-indicator');
    const text = dataStatus.querySelector('.status-text');
    
    if (errorMessage) {
        indicator.className = 'status-indicator error';
        text.textContent = `Error: ${errorMessage}`;
    } else if (ready) {
        indicator.className = 'status-indicator ready';
        if (timestampData) {
            const date = new Date(timestampData.last_refresh);
            text.textContent = `Data refreshed: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        } else {
            text.textContent = '✓ Data loaded';
        }
    } else {
        indicator.className = 'status-indicator loading';
        text.textContent = 'Loading data...';
    }
}

// === Event Listeners ===
function setupEventListeners() {
    // Job search/filter
    jobSearch.addEventListener('input', renderJobs);
    jobTypeFilter.addEventListener('change', renderJobs);
    
    // Match button
    matchBtn.addEventListener('click', findMatchingCandidates);
    
    // Candidate filters
    candidateSearch.addEventListener('input', filterCandidates);
    minScoreFilter.addEventListener('change', filterCandidates);
    experienceFilter.addEventListener('change', filterCandidates);
    
    // Modal close
    document.getElementById('modalClose').addEventListener('click', closeCandidateModal);
    document.getElementById('exportModalClose').addEventListener('click', closeExportModal);
    candidateModal.addEventListener('click', (e) => {
        if (e.target === candidateModal) closeCandidateModal();
    });
    exportModal.addEventListener('click', (e) => {
        if (e.target === exportModal) closeExportModal();
    });
    
    // Note saving
    document.getElementById('saveNoteBtn').addEventListener('click', saveCandidateNote);
    
    // Export
    document.getElementById('exportCSV').addEventListener('click', exportToCSV);
    document.getElementById('exportJSON').addEventListener('click', exportToJSON);
}

// === Job Rendering ===
function renderJobs() {
    const searchTerm = jobSearch.value.toLowerCase();
    const typeFilter = jobTypeFilter.value;
    
    const filtered = jobs.filter(job => {
        const matchesSearch = !searchTerm || 
            job.title?.toLowerCase().includes(searchTerm) ||
            job.company?.toLowerCase().includes(searchTerm) ||
            job.location?.toLowerCase().includes(searchTerm);
        
        const matchesType = !typeFilter || job.employment_type === typeFilter;
        
        return matchesSearch && matchesType && job.status === 'active';
    });
    
    jobList.innerHTML = filtered.map(job => `
        <div class="job-item ${selectedJobIds.has(job.job_id) ? 'selected' : ''}" 
             data-job-id="${job.job_id}" onclick="toggleJobSelection(${job.job_id})">
            <h3>${escapeHtml(job.title)}</h3>
            <div class="company">${escapeHtml(job.company || 'Unknown Company')}</div>
            <div class="meta">
                <span>📍 ${escapeHtml(job.location || 'Remote')}</span>
                <span>💼 ${formatEmploymentType(job.employment_type)}</span>
                <span>📊 ${formatExperienceLevel(job.experience_level)}</span>
            </div>
        </div>
    `).join('');
}

function toggleJobSelection(jobId) {
    if (selectedJobIds.has(jobId)) {
        selectedJobIds.delete(jobId);
    } else {
        selectedJobIds.add(jobId);
    }
    
    // Update UI
    document.querySelectorAll('.job-item').forEach(item => {
        const id = parseInt(item.dataset.jobId);
        item.classList.toggle('selected', selectedJobIds.has(id));
    });
    
    // Update summary
    selectedJobsSummary.innerHTML = `<strong>${selectedJobIds.size}</strong> job${selectedJobIds.size !== 1 ? 's' : ''} selected`;
    
    // Enable/disable match button
    matchBtn.disabled = selectedJobIds.size === 0;
}

// === Matching Logic ===
function findMatchingCandidates() {
    if (selectedJobIds.size === 0) return;
    
    const selectedJobs = jobs.filter(j => selectedJobIds.has(j.job_id));
    
    // Score each candidate against selected jobs
    const scored = candidates.map(candidate => {
        const scores = selectedJobs.map(job => calculateMatchScore(candidate, job));
        const bestMatch = scores.reduce((best, current) => 
            current.overall_score > best.overall_score ? current : best
        );
        
        return {
            candidate,
            ...bestMatch,
            matched_job_id: bestMatch.job_id
        };
    });
    
    // Filter to only show candidates with decent matches
    filteredCandidates = scored.filter(s => s.overall_score >= 50);
    
    // Sort by score
    filteredCandidates.sort((a, b) => b.overall_score - a.overall_score);
    
    // Show results
    candidateFilters.style.display = 'block';
    renderCandidates();
}

function calculateMatchScore(candidate, job) {
    const scores = {
        candidate_id: candidate.candidate_id,
        job_id: job.job_id,
        overall_score: 0,
        skills_match_score: 0,
        experience_match_score: 0,
        level_match_score: 0,
        location_match_score: 0,
        salary_match_score: 0,
        matched_skills: [],
        missing_skills: []
    };
    
    // Skills matching (40% weight)
    const candidateSkills = new Set(candidate.skills || []);
    const requiredSkills = new Set(job.required_skills || []);
    const preferredSkills = new Set(job.preferred_skills || []);
    
    const matchedRequired = [...requiredSkills].filter(s => candidateSkills.has(s));
    const matchedPreferred = [...preferredSkills].filter(s => candidateSkills.has(s));
    const missingRequired = [...requiredSkills].filter(s => !candidateSkills.has(s));
    
    if (requiredSkills.size > 0) {
        scores.skills_match_score = (matchedRequired.length / requiredSkills.size) * 100;
    } else {
        scores.skills_match_score = matchedPreferred.length > 0 ? 70 : 50;
    }
    
    scores.matched_skills = [...matchedRequired, ...matchedPreferred];
    scores.missing_skills = missingRequired;
    
    // Experience matching (25% weight)
    const expLevelScores = { entry: 1, mid: 2, senior: 3, executive: 4 };
    const candidateLevel = expLevelScores[candidate.experience_level] || 2;
    const jobLevel = expLevelScores[job.experience_level] || 2;
    
    if (candidateLevel >= jobLevel) {
        scores.experience_match_score = 100;
    } else {
        const diff = jobLevel - candidateLevel;
        scores.experience_match_score = Math.max(0, 100 - (diff * 30));
    }
    
    // Years of experience check
    const jobMinYears = job.experience_level === 'entry' ? 0 :
                        job.experience_level === 'mid' ? 3 :
                        job.experience_level === 'senior' ? 7 : 12;
    
    if (candidate.years_experience >= jobMinYears) {
        scores.experience_match_score = Math.min(100, scores.experience_match_score + 10);
    }
    
    // Level matching (15% weight)
    scores.level_match_score = candidateLevel === jobLevel ? 100 :
                               Math.abs(candidateLevel - jobLevel) === 1 ? 70 : 40;
    
    // Location matching (10% weight)
    if (job.location?.toLowerCase().includes('remote') || 
        candidate.location?.toLowerCase() === job.location?.toLowerCase()) {
        scores.location_match_score = 100;
    } else if (candidate.location && job.location) {
        // Simple check for same city/state
        scores.location_match_score = 50;
    } else {
        scores.location_match_score = 60; // Assume remote-friendly
    }
    
    // Salary matching (10% weight)
    if (candidate.salary_expectation_min && job.salary_max) {
        if (candidate.salary_expectation_min <= job.salary_max) {
            scores.salary_match_score = 100;
        } else {
            const overlap = (job.salary_max / candidate.salary_expectation_min) * 100;
            scores.salary_match_score = Math.max(0, Math.min(100, overlap));
        }
    } else {
        scores.salary_match_score = 70; // Unknown, assume okay
    }
    
    // Calculate weighted overall score
    scores.overall_score = Math.round(
        (scores.skills_match_score * 0.40) +
        (scores.experience_match_score * 0.25) +
        (scores.level_match_score * 0.15) +
        (scores.location_match_score * 0.10) +
        (scores.salary_match_score * 0.10)
    );
    
    return scores;
}

// === Candidate Rendering ===
function renderCandidates() {
    const searchTerm = candidateSearch.value.toLowerCase();
    const minScore = parseInt(minScoreFilter.value);
    const expFilter = experienceFilter.value;
    
    const filtered = filteredCandidates.filter(item => {
        const c = item.candidate;
        
        const matchesSearch = !searchTerm ||
            `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm) ||
            c.current_title?.toLowerCase().includes(searchTerm) ||
            c.skills?.some(s => s.toLowerCase().includes(searchTerm));
        
        const matchesScore = item.overall_score >= minScore;
        
        const matchesExp = !expFilter || c.experience_level === expFilter;
        
        return matchesSearch && matchesScore && matchesExp;
    });
    
    if (filtered.length === 0) {
        candidatesGrid.innerHTML = `
            <div class="empty-state">
                <p>No candidates match your filters. Try adjusting the criteria.</p>
            </div>
        `;
        return;
    }
    
    candidatesGrid.innerHTML = filtered.map(item => {
        const c = item.candidate;
        const scoreClass = item.overall_score >= 80 ? 'high' : 
                          item.overall_score >= 60 ? 'medium' : 'low';
        
        return `
            <div class="candidate-card" onclick="openCandidateModal(${c.candidate_id}, ${item.overall_score})">
                <div class="candidate-card-header">
                    <h3>${escapeHtml(c.first_name)} ${escapeHtml(c.last_name)}</h3>
                    <span class="match-score ${scoreClass}">${item.overall_score}% match</span>
                </div>
                <div class="title">${escapeHtml(c.current_title || 'Unknown Title')}</div>
                <div class="meta">
                    <span>📍 ${escapeHtml(c.location || 'Unknown')}</span>
                    <span>💼 ${c.years_experience || 0} yrs exp</span>
                </div>
                <div class="skills-preview">
                    ${(c.skills || []).slice(0, 5).map(s => 
                        `<span class="skill-tag">${escapeHtml(s)}</span>`
                    ).join('')}
                    ${(c.skills || []).length > 5 ? `<span class="skill-tag">+${c.skills.length - 5} more</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function filterCandidates() {
    renderCandidates();
}

// === Modal Logic ===
function openCandidateModal(candidateId, matchScore) {
    const candidate = candidates.find(c => c.candidate_id === candidateId);
    if (!candidate) return;
    
    currentCandidateId = candidateId;
    
    // Set header
    document.getElementById('modalCandidateName').textContent = 
        `${candidate.first_name} ${candidate.last_name}`;
    document.getElementById('modalMatchScore').textContent = `${matchScore}% Match`;
    
    // Profile info
    document.getElementById('modalProfile').innerHTML = `
        <p><strong>Current Role:</strong> ${escapeHtml(candidate.current_title || 'N/A')}</p>
        <p><strong>Company:</strong> ${escapeHtml(candidate.current_company || 'N/A')}</p>
        <p><strong>Location:</strong> ${escapeHtml(candidate.location || 'N/A')}</p>
        <p><strong>Experience:</strong> ${candidate.years_experience || 0} years</p>
        <p><strong>Level:</strong> ${formatExperienceLevel(candidate.experience_level)}</p>
        <p><strong>Availability:</strong> ${candidate.availability || 'Unknown'}</p>
        ${candidate.email ? `<p><strong>Email:</strong> ${escapeHtml(candidate.email)}</p>` : ''}
        ${candidate.linkedin_url ? `<p><strong>LinkedIn:</strong> <a href="${escapeHtml(candidate.linkedin_url)}" target="_blank">View Profile</a></p>` : ''}
    `;
    
    // Skills
    const allJobSkills = new Set();
    selectedJobIds.forEach(jobId => {
        const job = jobs.find(j => j.job_id === jobId);
        if (job) {
            (job.required_skills || []).forEach(s => allJobSkills.add(s));
            (job.preferred_skills || []).forEach(s => allJobSkills.add(s));
        }
    });
    
    const candidateSkills = new Set(candidate.skills || []);
    const matchedSkills = [...allJobSkills].filter(s => candidateSkills.has(s));
    const unmatchedSkills = [...allJobSkills].filter(s => !candidateSkills.has(s));
    
    document.getElementById('modalSkills').innerHTML = `
        <div class="skills-container">
            ${matchedSkills.map(s => `<span class="skill-tag matched">✓ ${escapeHtml(s)}</span>`).join('')}
            ${unmatchedSkills.map(s => `<span class="skill-tag missing">✗ ${escapeHtml(s)}</span>`).join('')}
            ${(candidate.skills || []).filter(s => !allJobSkills.has(s)).map(s => 
                `<span class="skill-tag">${escapeHtml(s)}</span>`
            ).join('')}
        </div>
    `;
    
    // Load notes
    loadCandidateNotes(candidateId);
    
    // Clear input
    document.getElementById('noteInput').value = '';
    document.getElementById('noteRating').value = '';
    
    candidateModal.classList.add('active');
}

function closeCandidateModal() {
    candidateModal.classList.remove('active');
    currentCandidateId = null;
}

// === Notes Management (localStorage) ===
function getNotesKey() {
    return `candidate_matcher_notes`;
}

function getAllNotes() {
    try {
        const data = localStorage.getItem(getNotesKey());
        return data ? JSON.parse(data) : {};
    } catch (e) {
        console.error('Error reading notes:', e);
        return {};
    }
}

function saveAllNotes(notes) {
    try {
        localStorage.setItem(getNotesKey(), JSON.stringify(notes));
    } catch (e) {
        console.error('Error saving notes:', e);
        alert('Failed to save notes. Your browser storage may be full.');
    }
}

function loadCandidateNotes(candidateId) {
    const allNotes = getAllNotes();
    const candidateNotes = allNotes[candidateId] || [];
    
    const notesList = document.getElementById('notesList');
    
    if (candidateNotes.length === 0) {
        notesList.innerHTML = '<p style="color: var(--text-muted); font-style: italic;">No notes yet. Add your first note above.</p>';
        return;
    }
    
    notesList.innerHTML = candidateNotes.map(note => `
        <div class="note-item">
            <div class="note-item-header">
                <span class="note-item-date">${new Date(note.created_at).toLocaleString()}</span>
                <span class="note-item-rating">${'⭐'.repeat(note.rating || 0)}</span>
            </div>
            <div class="note-item-text">${escapeHtml(note.note_text)}</div>
        </div>
    `).join('');
}

function saveCandidateNote() {
    const noteText = document.getElementById('noteInput').value.trim();
    const rating = parseInt(document.getElementById('noteRating').value) || 0;
    
    if (!noteText) {
        alert('Please enter a note before saving.');
        return;
    }
    
    if (!currentCandidateId) return;
    
    const allNotes = getAllNotes();
    if (!allNotes[currentCandidateId]) {
        allNotes[currentCandidateId] = [];
    }
    
    allNotes[currentCandidateId].push({
        note_text: noteText,
        rating: rating,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    });
    
    saveAllNotes(allNotes);
    
    // Clear input and reload
    document.getElementById('noteInput').value = '';
    document.getElementById('noteRating').value = '';
    loadCandidateNotes(currentCandidateId);
    
    // Show success feedback
    const saveBtn = document.getElementById('saveNoteBtn');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = '✓ Saved!';
    setTimeout(() => {
        saveBtn.textContent = originalText;
    }, 2000);
}

// === Export Functions ===
function exportToCSV() {
    if (filteredCandidates.length === 0) {
        alert('No candidates to export. Run a match first.');
        return;
    }
    
    const allNotes = getAllNotes();
    
    const headers = [
        'Candidate ID', 'First Name', 'Last Name', 'Email', 'Current Title',
        'Company', 'Location', 'Years Experience', 'Match Score', 'Notes'
    ];
    
    const rows = filteredCandidates.map(item => {
        const c = item.candidate;
        const notes = (allNotes[c.candidate_id] || [])
            .map(n => `[${new Date(n.created_at).toLocaleDateString()}] ${n.note_text}`)
            .join(' | ');
        
        return [
            c.candidate_id,
            c.first_name,
            c.last_name,
            c.email || '',
            c.current_title || '',
            c.current_company || '',
            c.location || '',
            c.years_experience || 0,
            item.overall_score,
            notes
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });
    
    const csv = [headers.join(','), ...rows].join('\n');
    downloadFile(csv, 'candidate_matches.csv', 'text/csv');
    
    closeExportModal();
}

function exportToJSON() {
    if (filteredCandidates.length === 0) {
        alert('No candidates to export. Run a match first.');
        return;
    }
    
    const allNotes = getAllNotes();
    
    const exportData = {
        exported_at: new Date().toISOString(),
        selected_jobs: Array.from(selectedJobIds),
        candidates: filteredCandidates.map(item => ({
            ...item.candidate,
            match_score: item.overall_score,
            matched_job_id: item.matched_job_id,
            notes: allNotes[item.candidate.candidate_id] || []
        }))
    };
    
    downloadFile(JSON.stringify(exportData, null, 2), 'candidate_matches.json', 'application/json');
    
    closeExportModal();
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function closeExportModal() {
    exportModal.classList.remove('active');
}

// === Utility Functions ===
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatEmploymentType(type) {
    if (!type) return 'Unknown';
    return type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function formatExperienceLevel(level) {
    if (!level) return 'Unknown';
    return level.charAt(0).toUpperCase() + level.slice(1);
}

// Add export button to UI (optional enhancement)
function addExportButton() {
    const exportBtn = document.createElement('button');
    exportBtn.id = 'exportBtn';
    exportBtn.className = 'btn btn-secondary';
    exportBtn.textContent = '📤 Export Results';
    exportBtn.style.marginTop = '16px';
    exportBtn.onclick = () => exportModal.classList.add('active');
    exportBtn.disabled = true;
    
    // Enable when candidates are shown
    const originalFindMatchingCandidates = findMatchingCandidates;
    findMatchingCandidates = function() {
        originalFindMatchingCandidates();
        exportBtn.disabled = filteredCandidates.length === 0;
    };
    
    document.querySelector('.candidates-panel').appendChild(exportBtn);
}

// Initialize export button
addExportButton();
