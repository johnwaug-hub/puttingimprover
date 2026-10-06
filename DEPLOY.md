# Deployment Checklist

## Pre-Deploy
- [ ] Firebase credentials configured in `js/config/firebase.js`
- [ ] Firebase project set: `putting-improver-waugs`
- [ ] Test locally: `firebase serve`

## Deploy
```bash
firebase deploy
```

## Post-Deploy
```bash
# Clear cache (paste in browser console):
navigator.serviceWorker.getRegistrations().then(r=>r.forEach(r=>r.unregister()));
caches.keys().then(k=>k.forEach(k=>caches.delete(k)));
location.reload(true);
```

## Verify
- [ ] Login works
- [ ] Can log practice session
- [ ] Games work
- [ ] Routines work  
- [ ] Leaderboard loads
- [ ] Community features work
- [ ] PWA install prompt appears
- [ ] No console errors

## Monitoring
- Firebase Console: https://console.firebase.google.com/project/putting-improver-waugs
- Check Authentication usage
- Check Firestore reads/writes
- Monitor hosting bandwidth

## Support
- Clear user cache if issues persist
- Check browser console for errors
- Verify Firebase rules are correct
