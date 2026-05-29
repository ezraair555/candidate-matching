#!/usr/bin/env python3
"""
Weekly ETL: DuckDB → JSON for GitHub Pages
Run this script weekly to refresh candidate/job data.

Usage:
    python3 export_to_json.py --duckdb-path /path/to/your.db --github-repo /path/to/repo

Outputs:
    - candidates.json
    - jobs.json
    - data_refresh_timestamp.json
"""

import argparse
import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path

try:
    import duckdb
except ImportError:
    print("Installing duckdb...")
    subprocess.check_call(["pip", "install", "duckdb"])
    import duckdb


def parse_args():
    parser = argparse.ArgumentParser(description="Export DuckDB data to JSON for GitHub Pages")
    parser.add_argument("--duckdb-path", required=True, help="Path to DuckDB database file")
    parser.add_argument("--github-repo", required=True, help="Path to GitHub Pages repo root")
    parser.add_argument("--limit", type=int, default=None, help="Limit results (for testing)")
    return parser.parse_args()


def export_table_to_json(conn, table_name, output_path, limit=None):
    """Export a table to JSON with clean formatting."""
    limit_clause = f"LIMIT {limit}" if limit else ""
    
    query = f"SELECT * FROM {table_name} {limit_clause}"
    df = conn.execute(query).fetchdf()
    
    # Convert to list of dicts, handling special types
    records = []
    for _, row in df.iterrows():
        record = {}
        for col in df.columns:
            val = row[col]
            # Handle pandas/numpy types
            if hasattr(val, 'tolist'):
                # This is an array (like skills[]) - convert to list
                val = val.tolist()
            elif hasattr(val, 'item'):
                # Single scalar value - convert to Python native
                val = val.item()
            # Convert datetime to ISO string
            elif hasattr(val, 'isoformat'):
                val = val.isoformat()
            record[col] = val
        records.append(record)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(records, f, indent=2, default=str)
    
    print(f"✓ Exported {len(records)} records from {table_name} → {output_path}")
    return len(records)


def main():
    args = parse_args()
    
    # Validate paths
    db_path = Path(args.duckdb_path).expanduser().resolve()
    repo_path = Path(args.github_repo).expanduser().resolve()
    
    if not db_path.exists():
        print(f"❌ Database not found: {db_path}")
        return 1
    
    if not repo_path.exists():
        print(f"❌ GitHub repo not found: {repo_path}")
        return 1
    
    # Connect to DuckDB
    print(f"📊 Connecting to DuckDB: {db_path}")
    conn = duckdb.connect(str(db_path))
    
    # Check which tables exist
    tables = conn.execute("SHOW TABLES").fetchall()
    table_names = [t[0] for t in tables]
    print(f"Found tables: {table_names}")
    
    # Export jobs
    if 'jobs' in table_names:
        export_table_to_json(conn, 'jobs', repo_path / 'jobs.json', args.limit)
    else:
        print("⚠️  Table 'jobs' not found, skipping...")
        # Create empty file
        with open(repo_path / 'jobs.json', 'w') as f:
            json.dump([], f)
    
    # Export candidates
    if 'candidates' in table_names:
        export_table_to_json(conn, 'candidates', repo_path / 'candidates.json', args.limit)
    else:
        print("⚠️  Table 'candidates' not found, skipping...")
        # Create empty file
        with open(repo_path / 'candidates.json', 'w') as f:
            json.dump([], f)
    
    # Export match_scores if exists
    if 'match_scores' in table_names:
        export_table_to_json(conn, 'match_scores', repo_path / 'match_scores.json', args.limit)
    
    # Write timestamp
    timestamp_data = {
        "last_refresh": datetime.now(timezone.utc).isoformat(),
        "timezone": "UTC",
        "source_db": str(db_path),
        "tables_exported": [t for t in ['jobs', 'candidates', 'match_scores'] if t in table_names]
    }
    with open(repo_path / 'data_refresh_timestamp.json', 'w') as f:
        json.dump(timestamp_data, f, indent=2)
    
    print(f"\n✅ Export complete! Data refreshed at {timestamp_data['last_refresh']}")
    print(f"📁 Files written to: {repo_path}")
    print("\nNext steps:")
    print("  1. cd <repo-path> && git add *.json data_refresh_timestamp.json")
    print("  2. git commit -m 'Weekly data refresh: $(date +%Y-%m-%d)'")
    print("  3. git push origin main")
    print("\nGitHub Pages will auto-deploy within 1-2 minutes.")
    
    conn.close()
    return 0


if __name__ == "__main__":
    exit(main())
