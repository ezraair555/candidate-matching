#!/bin/bash
# Setup script: Initialize Git repo and prepare for GitHub Pages deployment
# Run this once to get started

set -e

REPO_NAME="candidate-matching"
GITHUB_USER=""

echo "🚀 Candidate Matcher - GitHub Pages Setup"
echo "=========================================="
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install git first."
    exit 1
fi

# Get GitHub username
echo "Enter your GitHub username:"
read GITHUB_USER

if [ -z "$GITHUB_USER" ]; then
    echo "❌ GitHub username cannot be empty"
    exit 1
fi

echo ""
echo "📁 Initializing Git repository..."
cd "$(dirname "$0")"

if [ -d ".git" ]; then
    echo "⚠️  Git repository already exists. Skipping init."
else
    git init
    git checkout -b main 2>/dev/null || git checkout master
fi

echo ""
echo "📝 Adding files to git..."
git add .

echo ""
echo "💾 Creating initial commit..."
git commit -m "Initial commit: Candidate Matcher application" || {
    echo "⚠️  No changes to commit or commit failed"
}

echo ""
echo "🔗 Setting up GitHub remote..."
echo "Choose an option:"
echo "  1) Create new public repository via GitHub CLI (gh)"
echo "  2) Create new private repository via GitHub CLI (gh)"
echo "  3) Use existing repository (enter URL manually)"
echo "  4) Skip remote setup (do it manually later)"
read -p "Option [1-4]: " REMOTE_OPTION

case $REMOTE_OPTION in
    1)
        if command -v gh &> /dev/null; then
            echo "Creating public repository..."
            gh repo create "$REPO_NAME" --public --source=. --push
            echo "✅ Repository created: https://github.com/$GITHUB_USER/$REPO_NAME"
        else
            echo "❌ GitHub CLI (gh) not found. Install from: https://cli.github.com/"
            echo "   Or choose option 3 to set remote manually."
            exit 1
        fi
        ;;
    2)
        if command -v gh &> /dev/null; then
            echo "Creating private repository..."
            gh repo create "$REPO_NAME" --private --source=. --push
            echo "✅ Private repository created: https://github.com/$GITHUB_USER/$REPO_NAME"
            echo "   Note: GitHub Pages works on private repos too!"
        else
            echo "❌ GitHub CLI (gh) not found."
            exit 1
        fi
        ;;
    3)
        read -p "Enter repository URL (https://github.com/USER/REPO.git): " REPO_URL
        if [ -n "$REPO_URL" ]; then
            git remote add origin "$REPO_URL"
            git push -u origin main
            echo "✅ Remote configured"
        else
            echo "❌ Invalid URL"
            exit 1
        fi
        ;;
    4)
        echo "⏭️  Skipping remote setup. You can do this later:"
        echo "   git remote add origin https://github.com/USER/$REPO_NAME.git"
        echo "   git push -u origin main"
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Enable GitHub Pages:"
echo "   - Go to: https://github.com/$GITHUB_USER/$REPO_NAME/settings/pages"
echo "   - Source: Deploy from a branch"
echo "   - Branch: main / Folder: / (root)"
echo "   - Click Save"
echo ""
echo "2. Wait 1-2 minutes for deployment"
echo "   Your site will be at:"
echo "   https://$GITHUB_USER.github.io/$REPO_NAME/"
echo ""
echo "3. Set up weekly data refresh (see README.md):"
echo "   crontab -e"
echo "   # Add the cron job from README.md"
echo ""
echo "4. Test the export script manually:"
echo "   python3 export_to_json.py --duckdb-path /path/to/your.db --github-repo ."
echo ""
echo "🎉 Happy matching!"
