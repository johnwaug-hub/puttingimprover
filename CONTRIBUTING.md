# Contributing to Putting Improver

Thank you for your interest in contributing to Putting Improver! This document provides guidelines for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Process](#development-process)
4. [Pull Request Process](#pull-request-process)
5. [Coding Standards](#coding-standards)
6. [Testing Guidelines](#testing-guidelines)
7. [Documentation](#documentation)

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment or discriminatory language
- Trolling or insulting comments
- Public or private harassment
- Publishing others' private information

## Getting Started

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
```bash
git clone https://github.com/YOUR_USERNAME/putting-improver.git
cd putting-improver
```

3. Add upstream remote:
```bash
git remote add upstream https://github.com/ORIGINAL_OWNER/putting-improver.git
```

### Set Up Development Environment

1. Install dependencies:
```bash
# Web
cd web && npm install

# Mobile
cd mobile && npm install
```

2. Copy environment files:
```bash
cp .env.example .env
```

3. Configure Firebase (see SETUP.md)

## Development Process

### Create a Branch

Always create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or changes
- `chore/` - Maintenance tasks

### Make Your Changes

1. Write clear, concise code
2. Follow existing code style
3. Add tests for new features
4. Update documentation as needed

### Commit Your Changes

Write clear commit messages:

```bash
git commit -m "feat: add new achievement system"
# or
git commit -m "fix: resolve leaderboard sorting issue"
```

Commit message format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Maintenance

### Keep Your Fork Updated

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

## Pull Request Process

### Before Submitting

1. **Test your changes**
   ```bash
   npm test
   npm run lint
   ```

2. **Update documentation**
   - Update README if needed
   - Add/update inline comments
   - Document new features

3. **Check code style**
   ```bash
   npm run lint
   npm run format
   ```

### Submitting a Pull Request

1. Push to your fork:
```bash
git push origin feature/your-feature-name
```

2. Go to GitHub and create a Pull Request

3. Fill out the PR template:
   - **Title**: Clear, concise description
   - **Description**: What changes you made and why
   - **Related Issues**: Link to relevant issues
   - **Screenshots**: If UI changes

4. Wait for review

### PR Review Process

- Maintainers will review your PR
- Address any requested changes
- Once approved, your PR will be merged

### After Your PR is Merged

1. Delete your branch:
```bash
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

2. Update your local main:
```bash
git checkout main
git pull upstream main
```

## Coding Standards

### JavaScript/React Native

- Use ES6+ features
- Use functional components for React Native
- Use hooks instead of class components
- Keep functions small and focused
- Use meaningful variable names

**Good:**
```javascript
const calculateSessionPoints = (makes, distance, accuracy) => {
  return makes * (distance / 10) * (accuracy / 100) * 10;
};
```

**Bad:**
```javascript
const calc = (m, d, a) => {
  return m * (d / 10) * (a / 100) * 10;
};
```

### CSS

- Use BEM methodology for class names
- Mobile-first responsive design
- Use CSS variables for colors
- Keep specificity low

**Good:**
```css
.session-card__title {
  color: var(--primary-color);
  font-size: 1.2rem;
}
```

**Bad:**
```css
div.container div.card h2 {
  color: #FF6B35;
  font-size: 1.2rem;
}
```

### File Organization

- One component per file
- Related files grouped together
- Clear directory structure
- Consistent naming conventions

### Code Comments

- Explain WHY, not WHAT
- Document complex algorithms
- Keep comments up to date
- Use JSDoc for functions

```javascript
/**
 * Calculates points for a practice session
 * @param {number} makes - Number of successful putts
 * @param {number} distance - Distance in feet
 * @param {number} accuracy - Accuracy percentage (0-100)
 * @returns {number} Total points earned
 */
const calculatePoints = (makes, distance, accuracy) => {
  // Point formula designed to reward distance and accuracy
  return makes * (distance / 10) * (accuracy / 100) * 10;
};
```

## Testing Guidelines

### Write Tests For

- New features
- Bug fixes
- Critical functions
- Edge cases

### Test Structure

```javascript
describe('Point Calculation', () => {
  test('calculates points correctly for perfect accuracy', () => {
    const result = calculatePoints(10, 30, 100);
    expect(result).toBe(300);
  });

  test('handles zero makes correctly', () => {
    const result = calculatePoints(0, 30, 100);
    expect(result).toBe(0);
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- calculations.test.js

# Run with coverage
npm test -- --coverage
```

## Documentation

### Update When You

- Add new features
- Change existing functionality
- Fix bugs that weren't documented
- Improve code clarity

### Documentation Locations

- **README.md** - Project overview
- **docs/SETUP.md** - Setup instructions
- **docs/DEPLOYMENT.md** - Deployment guide
- **Inline comments** - Code explanation
- **JSDoc** - Function documentation

### Writing Good Documentation

- Be clear and concise
- Include examples
- Keep it up to date
- Use proper formatting

**Good:**
```markdown
## Adding a Practice Session

To add a new practice session:

1. Click the "Add Session" button
2. Enter distance (5-100 feet)
3. Enter makes and attempts
4. Click "Save"

Example: 10 makes from 30 feet out of 10 attempts = 300 points
```

**Bad:**
```markdown
Click add session and enter stuff.
```

## Need Help?

- **Questions**: Open a Discussion on GitHub
- **Bugs**: Open an Issue
- **Documentation**: Check the `docs/` folder
- **Chat**: Join our Discord (if available)

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Given credit in documentation

Thank you for contributing to Putting Improver! 🥏

---

**Remember**: The best way to contribute is to start small, learn the codebase, and gradually take on bigger tasks.
