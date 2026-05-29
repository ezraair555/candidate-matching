#!/usr/bin/env python3
"""
Sample Data Generator - Creates test data in DuckDB for development/testing
Run this to populate a test database with realistic sample data.
"""

import duckdb
import random
from datetime import datetime, timedelta
from pathlib import Path

# Sample data pools
FIRST_NAMES = [
    "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
    "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
    "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa",
    "Matthew", "Betty", "Anthony", "Margaret", "Donald", "Sandra", "Mark", "Ashley",
    "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
    "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
    "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker"
]

SKILLS = [
    "Python", "JavaScript", "Java", "C++", "Go", "Rust", "Ruby", "PHP",
    "React", "Vue", "Angular", "Node.js", "Django", "Flask", "FastAPI",
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch",
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform",
    "Machine Learning", "Data Science", "SQL", "ETL", "Data Engineering",
    "DevOps", "CI/CD", "Agile", "Scrum", "Leadership", "Communication"
]

TECH_COMPANIES = [
    "TechCorp", "DataFlow Inc", "CloudNine Systems", "AI Innovations", "StartupHub",
    "Enterprise Solutions", "Digital Dynamics", "CodeCraft", "InnovateTech", "NextGen Labs",
    "Quantum Computing Co", "ByteWorks", "CyberSecure", "FinTech Solutions", "HealthTech Inc"
]

LOCATIONS = [
    "New York, NY", "San Francisco, CA", "Seattle, WA", "Austin, TX", "Boston, MA",
    "Denver, CO", "Chicago, IL", "Los Angeles, CA", "Remote", "Atlanta, GA",
    "Miami, FL", "Portland, OR", "San Diego, CA", "Washington, DC"
]

JOB_TITLES = [
    "Software Engineer", "Senior Software Engineer", "Staff Engineer", "Principal Engineer",
    "Data Engineer", "Senior Data Engineer", "ML Engineer", "Data Scientist",
    "Backend Engineer", "Frontend Engineer", "Full Stack Engineer", "DevOps Engineer",
    "Engineering Manager", "Director of Engineering", "VP of Engineering",
    "Product Manager", "Senior Product Manager", "Technical Product Manager"
]

CANDIDATE_TITLES = [
    "Software Developer", "Data Analyst", "Systems Engineer", "Application Developer",
    "Backend Developer", "Frontend Developer", "Full Stack Developer", "DevOps Specialist",
    "Data Engineer", "ML Engineer", "Cloud Engineer", "Site Reliability Engineer",
    "Technical Lead", "Engineering Lead", "Senior Developer", "Junior Developer"
]

EDUCATION_LEVELS = ["high-school", "bachelor", "master", "phd"]
EDUCATION_FIELDS = ["Computer Science", "Engineering", "Mathematics", "Physics", "Business", "Data Science"]
EMPLOYMENT_TYPES = ["full-time", "part-time", "contract"]
EXPERIENCE_LEVELS = ["entry", "mid", "senior", "executive"]
AVAILABILITY_OPTIONS = ["immediate", "2-weeks", "1-month", "not-looking"]


def random_date(start_years_ago, end_years_ago=0):
    """Generate a random date between start_years_ago and end_years_ago."""
    start = datetime.now() - timedelta(days=start_years_ago * 365)
    end = datetime.now() - timedelta(days=end_years_ago * 365)
    delta = end - start
    random_days = random.randint(0, delta.days)
    return (start + timedelta(days=random_days)).date()


def generate_jobs(num_jobs=20):
    """Generate sample job postings."""
    jobs = []
    for i in range(num_jobs):
        exp_level = random.choice(EXPERIENCE_LEVELS)
        min_years = {"entry": 0, "mid": 3, "senior": 7, "executive": 12}[exp_level]
        
        # Select skills for this job
        num_required = random.randint(3, 8)
        num_preferred = random.randint(2, 5)
        required_skills = random.sample(SKILLS, num_required)
        preferred_skills = random.sample([s for s in SKILLS if s not in required_skills], num_preferred)
        
        salary_min = random.choice([80000, 100000, 120000, 140000, 160000])
        salary_max = salary_min + random.choice([20000, 40000, 60000])
        
        job = {
            "job_id": i + 1,
            "title": random.choice(JOB_TITLES),
            "company": random.choice(TECH_COMPANIES),
            "location": random.choice(LOCATIONS),
            "employment_type": random.choice(EMPLOYMENT_TYPES),
            "experience_level": exp_level,
            "salary_min": salary_min,
            "salary_max": salary_max,
            "description": f"Exciting opportunity for a {exp_level} level engineer...",
            "required_skills": required_skills,
            "preferred_skills": preferred_skills,
            "posted_date": random_date(2, 0),
            "status": random.choices(["active", "closed", "on-hold"], weights=[0.7, 0.2, 0.1])[0],
            "source": random.choice(["linkedin", "indeed", "internal", "referral"]),
            "external_url": f"https://example.com/jobs/{i+1}",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        jobs.append(job)
    
    return jobs


def generate_candidates(num_candidates=50):
    """Generate sample candidate profiles."""
    candidates = []
    for i in range(num_candidates):
        first_name = random.choice(FIRST_NAMES)
        last_name = random.choice(LAST_NAMES)
        years_exp = random.randint(0, 20)
        
        # Determine experience level based on years
        if years_exp < 3:
            exp_level = "entry"
        elif years_exp < 7:
            exp_level = "mid"
        elif years_exp < 12:
            exp_level = "senior"
        else:
            exp_level = "executive"
        
        # Select candidate skills (more than jobs typically)
        num_skills = random.randint(5, 15)
        skills = random.sample(SKILLS, num_skills)
        
        salary_expectation = random.choice([70000, 90000, 110000, 130000, 150000, 170000])
        
        candidate = {
            "candidate_id": i + 1,
            "first_name": first_name,
            "last_name": last_name,
            "email": f"{first_name.lower()}.{last_name.lower()}{i}@email.com",
            "phone": f"555-{random.randint(100,999)}-{random.randint(1000,9999)}",
            "location": random.choice(LOCATIONS),
            "current_title": random.choice(CANDIDATE_TITLES),
            "current_company": random.choice(TECH_COMPANIES),
            "years_experience": years_exp,
            "experience_level": exp_level,
            "skills": skills,
            "education_level": random.choice(EDUCATION_LEVELS),
            "education_field": random.choice(EDUCATION_FIELDS),
            "availability": random.choice(AVAILABILITY_OPTIONS),
            "salary_expectation_min": salary_expectation,
            "salary_expectation_max": salary_expectation + 20000,
            "resume_url": f"https://example.com/resumes/{i+1}.pdf",
            "linkedin_url": f"https://linkedin.com/in/{first_name.lower()}-{last_name.lower()}-{i}",
            "portfolio_url": f"https://github.com/{first_name.lower()}{last_name.lower()}{i}",
            "source": random.choice(["applied", "referred", "sourced", "agency"]),
            "status": random.choices(["active", "placed", "archived"], weights=[0.8, 0.1, 0.1])[0],
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        candidates.append(candidate)
    
    return candidates


def main():
    print("📊 Sample Data Generator for Candidate Matcher")
    print("=" * 50)
    
    # Ask for database path
    db_path = input("\nEnter DuckDB database path (or press Enter for 'sample.db'): ").strip()
    db_path = db_path or "sample.db"
    db_path = Path(db_path).expanduser().resolve()
    
    print(f"\n📁 Database: {db_path}")
    
    # Confirm
    if db_path.exists():
        response = input(f"⚠️  Database already exists. Overwrite? [y/N]: ").strip().lower()
        if response != 'y':
            print("Aborted.")
            return
    
    # Generate data
    print("\n🔄 Generating sample data...")
    jobs = generate_jobs(20)
    candidates = generate_candidates(50)
    
    print(f"   - {len(jobs)} job postings")
    print(f"   - {len(candidates)} candidates")
    
    # Create database and insert
    print("\n💾 Creating database and inserting data...")
    conn = duckdb.connect(str(db_path))
    
    # Create tables
    conn.execute("""
        CREATE TABLE IF NOT EXISTS jobs (
            job_id INTEGER PRIMARY KEY,
            title TEXT, company TEXT, location TEXT,
            employment_type TEXT, experience_level TEXT,
            salary_min DECIMAL, salary_max DECIMAL,
            description TEXT, required_skills TEXT[], preferred_skills TEXT[],
            posted_date DATE, status TEXT, source TEXT, external_url TEXT,
            created_at TIMESTAMP, updated_at TIMESTAMP
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS candidates (
            candidate_id INTEGER PRIMARY KEY,
            first_name TEXT, last_name TEXT, email TEXT, phone TEXT,
            location TEXT, current_title TEXT, current_company TEXT,
            years_experience INTEGER, experience_level TEXT,
            skills TEXT[], education_level TEXT, education_field TEXT,
            availability TEXT, salary_expectation_min DECIMAL,
            salary_expectation_max DECIMAL, resume_url TEXT,
            linkedin_url TEXT, portfolio_url TEXT, source TEXT,
            status TEXT, created_at TIMESTAMP, updated_at TIMESTAMP
        )
    """)
    
    # Insert jobs using INSERT OR REPLACE to handle arrays properly
    for job in jobs:
        conn.execute("""
            INSERT OR REPLACE INTO jobs (
                job_id, title, company, location, employment_type, experience_level,
                salary_min, salary_max, description, required_skills, preferred_skills,
                posted_date, status, source, external_url, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            job["job_id"], job["title"], job["company"], job["location"],
            job["employment_type"], job["experience_level"],
            job["salary_min"], job["salary_max"],
            job["description"], job["required_skills"], job["preferred_skills"],
            job["posted_date"], job["status"], job["source"], job["external_url"],
            job["created_at"], job["updated_at"]
        ])
    
    # Insert candidates
    for candidate in candidates:
        conn.execute("""
            INSERT OR REPLACE INTO candidates (
                candidate_id, first_name, last_name, email, phone,
                location, current_title, current_company,
                years_experience, experience_level,
                skills, education_level, education_field,
                availability, salary_expectation_min,
                salary_expectation_max, resume_url,
                linkedin_url, portfolio_url, source,
                status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            candidate["candidate_id"], candidate["first_name"], candidate["last_name"],
            candidate["email"], candidate["phone"], candidate["location"],
            candidate["current_title"], candidate["current_company"],
            candidate["years_experience"], candidate["experience_level"],
            candidate["skills"], candidate["education_level"], candidate["education_field"],
            candidate["availability"], candidate["salary_expectation_min"],
            candidate["salary_expectation_max"], candidate["resume_url"],
            candidate["linkedin_url"], candidate["portfolio_url"], candidate["source"],
            candidate["status"], candidate["created_at"], candidate["updated_at"]
        ])
    
    conn.close()
    
    print("\n✅ Database created successfully!")
    print(f"\n📁 Database location: {db_path}")
    print("\nNext steps:")
    print(f"  python3 export_to_json.py --duckdb-path {db_path} --github-repo /path/to/repo")
    print("\nTo query the database:")
    print(f"  duckdb {db_path}")
    print("  SELECT * FROM jobs LIMIT 5;")
    print("  SELECT * FROM candidates LIMIT 5;")


if __name__ == "__main__":
    main()
