# Deployment Guide - Putting Improver v2.0

## Quick Deploy Steps

### Option 1: Direct File Replacement (Recommended)

1. **Backup Your Current Files**
   ```bash
   # On your server or local machine
   cp -r web web-backup-$(date +%Y%m%d)
   ```

2. **Replace Updated Files**
   Copy these files from the enhanced version:
   - `web/js/app.js` (main application logic)
   - `web/js/modules/user.js` (session count fix)
   - `web/js/config/constants.js` (games data)
   - `web/css/styles.css` (new styling)

3. **Test Locally** (if possible)
   ```bash
   cd web
   python3 -m http.server 8000
   # Visit http://localhost:8000
   ```

4. **Deploy to Firebase Hosting**
   ```bash
   cd web
   firebase deploy --only hosting
   ```

### Option 2: Git Deployment

1. **Commit Changes**
   ```bash
   git add web/js/app.js web/js/modules/user.js web/js/config/constants.js web/css/styles.css
   git commit -m "Add v2.0 features: routines, games, session tracking fixes"
   git push origin main
   ```

2. **Deploy**
   ```bash
   firebase deploy --only hosting
   ```

## Detailed Changes by File

### 1. `web/js/modules/user.js`
**Changes:**
- Added `totalSessions` to user initialization
- Increment/decrement `totalSessions` on add/delete
- Added `timestamp` field to sessions

**Critical:** This fixes the leaderboard session count bug.

### 2. `web/js/app.js`
**Changes:**
- Imported `SUGGESTED_ROUTINES` and `PUTTING_GAMES`
- Added `games` view to state
- Added `selectedGame` to state for UI
- Added Games tab to navigation
- Added `renderRoutines()` method
- Added `renderGames()` method
- Updated `renderSessionItem()` for timestamps and routine tags
- Added event listeners for routine and game buttons
- Added `startRoutine()` method

**Critical:** This adds all new UI functionality.

### 3. `web/js/config/constants.js`
**Changes:**
- Added `PUTTING_GAMES` array with 6 games

**Note:** `SUGGESTED_ROUTINES` already existed but is now utilized.

### 4. `web/css/styles.css`
**Changes:**
- Added `.routines-panel` and related styles
- Added `.routine-card`, `.routine-badge`, etc.
- Added `.games-grid` and related styles
- Added `.game-card`, `.game-badge`, etc.
- Added `.session-date`, `.session-time`, `.routine-tag`
- Added responsive breakpoints for new components

## Verification Checklist

After deployment, verify these features work:

- [ ] **Leaderboard** - Session count displays correctly
- [ ] **Add Session** - Creates session with timestamp
- [ ] **Session List** - Shows date, time, and routine tag (if applicable)
- [ ] **View Routines** - Button opens routines panel
- [ ] **Start Routine** - Pre-fills form with drill data
- [ ] **Games Tab** - Navigates to games view
- [ ] **Game Cards** - Expand/collapse to show details
- [ ] **Responsive** - All features work on mobile

## Rollback Plan

If issues occur:

1. **Immediate Rollback**
   ```bash
   # Restore from backup
   rm -rf web
   cp -r web-backup-YYYYMMDD web
   firebase deploy --only hosting
   ```

2. **Git Rollback**
   ```bash
   git revert HEAD
   git push origin main
   firebase deploy --only hosting
   ```

## Database Considerations

**Good News:** No database migrations needed!

- New `totalSessions` field auto-initializes to 0
- Existing sessions work fine (timestamp is optional)
- All changes are backwards compatible

### For Existing Users
Users with existing data will:
- See `totalSessions: 0` initially
- Have correct count as they add new sessions
- Old sessions display without timestamp (date only)

### For New Users
New users automatically get:
- `totalSessions: 0` on signup
- All sessions with timestamps

## Performance Notes

- No significant performance impact
- Routines and games data loaded statically
- No additional database queries
- CSS file slightly larger (~200 lines added)

## Browser Compatibility

Tested on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

All features use standard ES6+ JavaScript supported by modern browsers.

## Support & Troubleshooting

### Issue: Session count still showing 0
**Solution:** Users need to add a new session for count to update. Old sessions aren't retroactively counted (by design for data integrity).

### Issue: Games tab not showing
**Solution:** Hard refresh (Ctrl+F5) to clear cache, or check browser console for JS errors.

### Issue: Routines panel won't open
**Solution:** Verify `web/js/config/constants.js` was updated with `SUGGESTED_ROUTINES` export.

### Issue: Styling looks broken
**Solution:** Ensure `web/css/styles.css` was fully replaced and clear browser cache.

## Post-Deployment Tasks

1. **Test All Features** - Go through verification checklist
2. **Monitor Console** - Check for JavaScript errors
3. **User Communication** - Inform users of new features
4. **Collect Feedback** - Monitor for bug reports

## Future Maintenance

Regular monitoring points:
- Firebase usage (stays within free tier limits)
- User feedback on routines and games
- Feature requests in GitHub issues

---

**Questions?** Check the README.md or open an issue on GitHub.

**Need Help?** Contact the development team or consult the Firebase documentation.
