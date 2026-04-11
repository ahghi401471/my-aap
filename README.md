# my-aap

אפליקציית React Native / Expo למציאת ציוד סוכרת לפי קרבה.

## פריסה חינמית מומלצת

- קוד: GitHub
- שרת API: Render
- מסד נתונים חי: Neon Postgres

השרת יודע לעבוד בשני מצבים:
- `Postgres` אם מוגדר `DATABASE_URL`
- `SQL.js` מקומי כגיבוי, אם אין `DATABASE_URL`

## משתני סביבה לשרת

צור ב־Render או בקובץ `.env`:

```bash
PORT=3001
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
```

## פריסה ל־Render

1. העלה את הפרויקט ל־GitHub
2. פתח חשבון ב־[Render](https://render.com/)
3. לחץ `New` ואז `Web Service`
4. חבר את הריפו
5. הגדר:

```text
Environment: Node
Build Command: npm install
Start Command: npm run server
```

6. הוסף את `DATABASE_URL` של Neon
7. אשר את הפריסה

אפשר גם להשתמש בקובץ [render.yaml](C:\Users\Owner\Documents\my aap\render.yaml).

## יצירת מסד ב־Neon

1. פתח חשבון ב־[Neon](https://neon.com/)
2. צור פרויקט חדש
3. העתק `Connection string`
4. שים אותו ב־Render בתוך:

```text
Key: DATABASE_URL
Value: postgresql://...
```

בעלייה הראשונה השרת יריץ seed אוטומטי וייצור את הטבלאות.

## הרצה מקומית רק אם צריך

```bash
npm run server
```

## Google Maps לחיפוש רחובות

אם תרצה autocomplete ו־geocoding דרך Google Maps:

```bash
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

בלי המשתנה הזה, האפליקציה נופלת חזרה ל־OpenStreetMap.
