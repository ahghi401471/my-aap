# Equipment Nearby App

אפליקציית React Native עם Expo למציאת ציוד לפי קרבה גיאוגרפית, עם שתי שיטות חיפוש:

- `השתמש במיקום שלי` באמצעות GPS
- `בחר עיר` מתוך רשימת ערים בישראל עם autocomplete

## מה יש בפרויקט

- מסך הרשמה עם בחירת עיר
- פרופיל משתמש
- פרסום ציוד קיים
- פתיחת בקשה לציוד
- חיפוש ומיון תוצאות מהקרוב לרחוק
- רשימת ערים מסודרת עם קו רוחב וקו אורך
- סכמת SQL בסיסית לשרת עתידי
- GitHub Actions לבניית APK

## טכנולוגיות

- Expo
- React Native
- TypeScript
- React Navigation
- Expo Location

## הרצה מקומית

```bash
npm install
npm start
```

להרצה על אנדרואיד:

```bash
npm run android
```

## בניית APK דרך GitHub

קיים וורקפלואו בנתיב:

`/.github/workflows/build-apk.yml`

הוא מבצע:

1. התקנת תלויות
2. `expo prebuild`
3. בניית `assembleRelease`
4. העלאת קובץ APK כ־artifact

כדי להשתמש בו:

1. צור ריפו חדש ב־GitHub
2. העלה את הקוד מהתיקייה הזו לריפו
3. פתח את לשונית `Actions`
4. הרץ את `Build Android APK` או בצע `push` ל־`main`
5. בסיום הורד את ה־artifact בשם `equipment-nearby-release-apk`

## העלאה ראשונה ל־GitHub

אם עדיין אין ריפו מחובר, אפשר להשתמש בפקודות האלה:

```bash
git init
git add .
git commit -m "Initial mobile app"
git branch -M main
git remote add origin https://github.com/YOUR-USER/YOUR-REPO.git
git push -u origin main
```

אחרי ה־push הראשון, ה־workflow יוכל לרוץ אוטומטית על כל שינוי ל־`main`.

## איפה מורידים את ה־APK

1. היכנס לריצה המתאימה ב־GitHub Actions
2. גלול לאזור `Artifacts`
3. הורד את `equipment-nearby-release-apk`
4. פתח את הקובץ שהורד ותמצא בפנים את `app-release.apk`

## קבצים מרכזיים

- `App.tsx` נקודת הכניסה
- `src/navigation/AppNavigator.tsx` ניווט בין המסכים
- `src/hooks/useAppState.tsx` מצב האפליקציה
- `src/services/search.ts` לוגיקת הסינון והמיון
- `src/services/distance.ts` חישוב מרחק בין נקודות
- `src/services/db-schema.sql` סכמת בסיס נתונים ראשונית

## הערות להמשך

זהו MVP מקומי עם נתוני דמו. השלב הבא הטבעי הוא לחבר:

- backend אמיתי
- מסד נתונים אמיתי
- התחברות משתמשים
- שמירת בקשות וציוד בשרת
- רשימת ערים מלאה מתוך מקור רשמי
