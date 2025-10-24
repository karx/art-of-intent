# Deployment Checklist

**Version:** 1.0.0  
**Date:** 2025-01-24

## ⚠️ Critical: Firestore Rules Update Required

The OG image generator requires updated Firestore security rules to fetch live data.

### Quick Fix

1. **Open Firebase Console**
   - Visit: https://console.firebase.google.com/project/art-of-intent/firestore/rules

2. **Copy Updated Rules**
   - Open `firestore.rules` in this repository
   - Copy the entire contents

3. **Paste and Publish**
   - Paste into Firebase Console
   - Click "Publish"
   - Wait 1-2 minutes for propagation

4. **Verify**
   - Visit `/generate-og-image.html`
   - Click "Fetch Live Data"
   - Should work without permission errors

**Detailed Guide:** See `docs/resources/FIRESTORE_RULES_DEPLOYMENT.md`

## Deployment Steps

### 1. Push to Repository

```bash
git push origin main
```

### 2. Deploy Firestore Rules

**Option A: Firebase Console (Recommended)**
- Follow steps above

**Option B: Firebase CLI**
```bash
firebase login
firebase use art-of-intent
firebase deploy --only firestore:rules
```

### 3. Verify Deployment

- [ ] Site loads correctly
- [ ] Version shows v1.0.0
- [ ] Share cards generate properly
- [ ] OG image generator works
- [ ] Firebase status shows "Connected"
- [ ] Live data fetches without errors

### 4. Test Social Media Previews

- [ ] Facebook: https://developers.facebook.com/tools/debug/
- [ ] Twitter: https://cards-dev.twitter.com/validator
- [ ] LinkedIn: https://www.linkedin.com/post-inspector/

### 5. Generate New OG Image

1. Visit `/generate-og-image.html`
2. Click "Fetch Live Data" (or "Use Mock Data")
3. Click "Generate Image"
4. Click "Download PNG"
5. Replace `src/assets/og_image.png`
6. Commit and push

## Post-Deployment Verification

### Functionality Tests

- [ ] Game loads and plays correctly
- [ ] Authentication works
- [ ] Leaderboard displays
- [ ] Session history accessible
- [ ] Share cards generate
- [ ] Sound effects work
- [ ] Voice input functions

### Performance Tests

- [ ] Page load time < 3s
- [ ] No console errors
- [ ] Firebase queries efficient
- [ ] Images load properly

### Mobile Tests

- [ ] Responsive layout works
- [ ] Touch controls functional
- [ ] Share to social works
- [ ] Images display correctly

## Known Issues

### 1. Firebase Permissions

**Issue:** "Missing or insufficient permissions" error

**Status:** ✅ Fixed in this release

**Solution:** Deploy updated Firestore rules (see above)

### 2. OG Image Generation

**Issue:** Live data not fetching

**Status:** ✅ Fixed in this release

**Solution:** 
- Deploy Firestore rules
- Check Firebase status indicator
- Use mock data as fallback

## Rollback Plan

If issues occur:

### 1. Revert Code

```bash
git revert HEAD
git push origin main
```

### 2. Restore Firestore Rules

Use previous rules from git history:
```bash
git show HEAD~1:firestore.rules > firestore.rules.backup
```

Then deploy backup rules via Firebase Console.

### 3. Restore OG Image

```bash
cp src/assets/og_image_backup.png src/assets/og_image.png
git add src/assets/og_image.png
git commit -m "Restore backup OG image"
git push origin main
```

## Monitoring

### Check After Deployment

1. **Firebase Console**
   - Monitor Firestore usage
   - Check for errors
   - Verify rule changes

2. **Analytics**
   - Page views
   - User engagement
   - Error rates

3. **Social Media**
   - Preview displays correctly
   - Images load
   - Links work

## Support

### If Issues Occur

1. Check browser console for errors
2. Review Firebase Console logs
3. Test with mock data
4. Verify Firestore rules deployed
5. Check documentation:
   - `docs/resources/FIRESTORE_RULES_DEPLOYMENT.md`
   - `docs/resources/OG_IMAGE_GENERATION.md`

### Contact

- GitHub Issues: https://github.com/karx/art-of-intent/issues
- Project Lead: @karx

## Success Criteria

Deployment is successful when:

- ✅ All tests pass
- ✅ No console errors
- ✅ Firebase rules deployed
- ✅ OG image generates
- ✅ Social previews work
- ✅ Mobile responsive
- ✅ Performance acceptable

## Next Steps

After successful deployment:

1. Monitor for 24 hours
2. Generate daily OG images
3. Update documentation as needed
4. Plan next features
5. Gather user feedback

---

**Deployment Date:** _____________

**Deployed By:** _____________

**Status:** ⬜ Pending | ⬜ In Progress | ⬜ Complete | ⬜ Issues

**Notes:**

_____________________________________________

_____________________________________________

_____________________________________________

---

*"C:\> DEPLOY.BAT --production"*
