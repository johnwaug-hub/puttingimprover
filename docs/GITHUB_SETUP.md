# GitHub Repository Setup Instructions

Follow these steps to set up your GitHub repository for the Putting Improver project.

## Step 1: Create a New GitHub Repository

1. Go to [GitHub](https://github.com)
2. Click the "+" icon → "New repository"
3. Fill in:
   - **Repository name**: `putting-improver`
   - **Description**: "Disc golf putting practice tracker for Lock Jaw Disc Golf"
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
4. Click "Create repository"

## Step 2: Initialize Local Git Repository

```bash
cd putting-improver-complete

# Initialize git
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Complete Putting Improver project with web and mobile apps"
```

## Step 3: Connect to GitHub

```bash
# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/putting-improver.git

# Or use SSH:
git remote add origin git@github.com:YOUR_USERNAME/putting-improver.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 4: Configure GitHub Secrets (for CI/CD)

### Required Secrets

Go to your repository → Settings → Secrets and variables → Actions → New repository secret

Add these secrets:

1. **FIREBASE_TOKEN** (for web deployment)
   ```bash
   # Get token by running:
   firebase login:ci
   # Copy the token and add as secret
   ```

2. **FIREBASE_SERVICE_ACCOUNT** (alternative to FIREBASE_TOKEN)
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Copy the entire JSON content
   - Add as secret

### Optional Secrets (for mobile deployment)

3. **FASTLANE_USER** - Your Apple ID email

4. **FASTLANE_PASSWORD** - App-specific password from Apple
   - Generate at appleid.apple.com

5. **PLAY_STORE_CREDENTIALS** - Google Play service account JSON
   - Create service account in Google Cloud Console
   - Download JSON key
   - Add entire JSON as secret

## Step 5: Enable GitHub Actions

1. Go to repository → Actions tab
2. Workflows should appear automatically
3. You may need to enable Actions if prompted

## Step 6: Set Up Branch Protection (Optional but Recommended)

1. Go to Settings → Branches
2. Add rule for `main` branch:
   - ✅ Require pull request before merging
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date
   - ✅ Include administrators

## Step 7: Add Collaborators (Optional)

1. Go to Settings → Collaborators
2. Add team members with appropriate permissions

## Repository Structure

Your repository should now have:

```
putting-improver/
├── .github/
│   └── workflows/          # CI/CD pipelines
├── docs/                   # Documentation
├── mobile/                 # React Native app
├── web/                    # Web application
├── .gitignore             # Git ignore rules
├── CONTRIBUTING.md        # Contribution guidelines
├── LICENSE                # MIT license
└── README.md              # Project documentation
```

## GitHub Actions Workflows

### Automatic Web Deployment

When you push to `main` branch with changes in `web/`:
1. Tests run automatically
2. Build is created
3. Deploys to Firebase Hosting
4. You get notifications

### Mobile Build

When you push to `main` or create PR:
1. Linting runs
2. Tests execute
3. Builds are created for iOS and Android
4. Artifacts are stored

## Next Steps

1. **Customize README.md**
   - Add your repository URL
   - Update screenshots
   - Add badges (build status, etc.)

2. **Create Issues and Projects**
   - Add GitHub Issues for tasks
   - Create Project board for tracking

3. **Set Up GitHub Pages** (optional)
   - Host documentation
   - Create landing page

4. **Add Badges to README**

Example badges:

```markdown
[![Firebase Deploy](https://github.com/YOUR_USERNAME/putting-improver/actions/workflows/deploy-web.yml/badge.svg)](https://github.com/YOUR_USERNAME/putting-improver/actions/workflows/deploy-web.yml)

[![Mobile CI](https://github.com/YOUR_USERNAME/putting-improver/actions/workflows/mobile-ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/putting-improver/actions/workflows/mobile-ci.yml)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
```

## Common Git Commands

```bash
# Create new branch
git checkout -b feature/new-feature

# Switch branches
git checkout main

# Pull latest changes
git pull origin main

# Push changes
git add .
git commit -m "Description of changes"
git push origin branch-name

# View status
git status

# View history
git log --oneline
```

## Troubleshooting

### "Permission denied"
- Check if you're using the correct remote URL
- Verify your GitHub credentials
- Make sure you have write access

### "Failed to push"
- Pull latest changes first: `git pull origin main`
- Resolve any conflicts
- Push again

### "GitHub Actions not running"
- Check if Actions are enabled in repository settings
- Verify workflow YAML syntax
- Check required secrets are added

## Resources

- [GitHub Docs](https://docs.github.com)
- [Git Documentation](https://git-scm.com/doc)
- [GitHub Actions](https://docs.github.com/en/actions)

---

**Your repository is now ready for collaborative development!** 🚀
