# Branching Strategy

## Main Branch (main)
- **Purpose**: Stable, production-ready code
- **Current Version**: v1.0.0
- Contains fully tested, working features
- All core functionality operational:
  - AI Chat with Claude integration ✓
  - Drug calculators ✓
  - Emergency protocols ✓
  - PubMed integration ✓
  - Backend proxy for API calls ✓
  - CORS issues resolved ✓

## Feature Branch (feature/enhanced-capabilities)
- **Purpose**: Development of new features
- **Current Status**: Active development branch
- **Planned Enhancements**:
  - [ ] Pediatric drug calculators
  - [ ] Opioid conversion calculator
  - [ ] IndexedDB for true offline storage
  - [ ] FDA drug alerts integration
  - [ ] Dark mode toggle
  - [ ] Print-friendly protocol sheets
  - [ ] Advanced PubMed filtering
  - [ ] User preferences/bookmarks
  - [ ] Export chat conversations
  - [ ] Service worker for offline mode
  - [ ] Enhanced error recovery
  - [ ] Session persistence
  - [ ] Advanced citation management
  - [ ] Multi-language support

## Branch Management Rules
1. **Main branch** = always deployable
2. **Feature branch** = active development
3. Test thoroughly before merging to main
4. No direct commits to main (except hotfixes)
5. Create new branches for major features:
   - `feature/offline-mode`
   - `feature/advanced-calculators`
   - `feature/user-accounts`
   - `feature/dark-theme`
   - `bugfix/[issue-name]`

## Merging Strategy
- Feature → Main only when fully tested
- Use pull requests for review (if collaborating)
- Tag releases with semantic versioning
- Document all breaking changes
- Run full test suite before merge

## Version Numbering
- **Major (X.0.0)**: Breaking changes, major feature additions
- **Minor (1.X.0)**: New features, backwards compatible
- **Patch (1.0.X)**: Bug fixes, minor improvements

## Git Commands Quick Reference

### Switch to stable version:
```bash
git checkout main
npm install
npm run dev
```

### Switch to development:
```bash
git checkout feature/enhanced-capabilities
npm install
npm run dev
```

### Create new feature branch:
```bash
git checkout -b feature/[feature-name]
```

### Update feature branch with main:
```bash
git checkout feature/enhanced-capabilities
git merge main
```

### Save work in progress:
```bash
git add .
git commit -m "WIP: [description]"
```

### View all branches:
```bash
git branch -a
```

### View tags:
```bash
git tag -l
```

## Commit Message Format
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Build process or auxiliary tool changes

Example: `feat: add pediatric drug calculator`

## Release Process
1. Merge feature branch to main
2. Tag the release: `git tag -a v1.1.0 -m "Release description"`
3. Update VERSION_HISTORY.md
4. Push tags: `git push --tags`
5. Create GitHub release (if using GitHub)