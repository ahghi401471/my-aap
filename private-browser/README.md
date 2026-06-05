# דפדפן פרטי

אפליקציית דפדפן פרטית וקלה שמיועדת להיבנות בענף נפרד בלי לשנות את אפליקציית Expo הקיימת.

## יכולות

- לשוניות זמניות שנשמרות בזיכרון בלבד.
- ניקוי מלא של כל הלשוניות בלחיצה אחת.
- פתיחת כתובת URL או חיפוש דרך DuckDuckGo.
- מסגרת גלישה עם `sandbox` ו-`referrerpolicy="no-referrer"` לצמצום חשיפת מידע.
- ללא שימוש ב-`localStorage`, `sessionStorage` או שמירת היסטוריה מקומית.

## בנייה מקומית

```bash
npm run build:private-browser
```

הפלט נוצר בתיקייה `private-browser/dist` ומועלה גם כ-artifact ב-GitHub Actions.

## קימפול CI בגיטהאב

הפרויקט כולל GitHub Actions workflow בשם `CI compile apps` שמאפשר להריץ קימפול אוטומטי או ידני:

- בכל `push` לענפים `work` או `private-browser-app`.
- בכל Pull Request אל `work`.
- ידנית דרך `workflow_dispatch`, עם בחירה בין `all`, `existing-app` או `private-browser`.

להרצה מקומית של אותה בדיקת CI מלאה:

```bash
npm run ci:compile
```
