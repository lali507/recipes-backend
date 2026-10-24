# 🚀 מתחילים כאן – העלאת השרת לאינטרנט

המדריך הזה מיועד למי שמעולם לא העלתה שרת לאינטרנט. עברי עליו לפי הסדר, שלב אחרי שלב.

**מה נעשה:**
1. **GitHub** – נעלה את הקוד לאתר ששומר קוד.
2. **Neon** – ניצור מסד נתונים PostgreSQL חינמי בענן.
3. **Cloudinary** – (לא חובה) נפתח חשבון לאחסון תמונות.
4. **Render** – נפעיל את השרת בענן, מחובר ל-GitHub ולמסד הנתונים.
5. **בדיקה** – נוודא שהכול עובד דרך Swagger.

**זמן משוער:** 45–60 דקות. **עלות:** 0 ₪ – כל השירותים במסלול חינמי.

> ⚠️ **הערה חשובה על הממשקים:** אתרים כמו GitHub, Neon ו-Render משנים מדי פעם את העיצוב ואת שמות הכפתורים. כתבתי את השמות כפי שהם ידועים לי, אבל לא יכולתי לבדוק אותם בזמן אמת. אם כפתור נקרא קצת אחרת – חפשי כפתור עם משמעות דומה. **הערכים שצריך להקליד** (פקודות, שמות משתנים) – מדויקים ומתאימים לפרויקט הזה.

> ⚠️ **על מסלולים חינמיים:** לכל מסלול חינמי יש מגבלות, והחברות יכולות לשנות אותן. בזמן כתיבת המדריך: השרת ב-Render "נרדם" אחרי 15 דקות בלי שימוש, והבקשה הראשונה אחרי זה לוקחת בערך דקה. זה תקין לפרויקט גמר.

---

## 📦 לפני שמתחילים – חילוץ ה-ZIP

1. הורידי את הקובץ `backend-project.zip`.
2. **Windows:** לחיצה ימנית על הקובץ ← **Extract All** (חלץ הכל) ← **Extract**.
   **Mac:** לחיצה כפולה על הקובץ.
3. תיווצר תיקייה בשם `backend-project`. בתוכה יש תיקיות כמו `src`, `prisma`, `tests` וקבצים כמו `package.json`.

**קבצים מוסתרים:** בפרויקט יש קבצים ששמם מתחיל בנקודה: `.gitignore`, `.env.example`, `.env.test.example`, `.node-version`. הם חשובים!
- **Mac:** ב-Finder לחצי `Cmd + Shift + .` (נקודה) כדי לראות אותם.
- **Windows:** בסייר הקבצים ← **View** (תצוגה) ← סמני **Hidden items** (פריטים מוסתרים).

---

# חלק א – GitHub: העלאת הקוד

### 1. פתיחת חשבון
1. היכנסי ל-**https://github.com**
2. לחצי **Sign up**.
3. הזיני אימייל, סיסמה ושם משתמש, ואשרי את האימייל שתקבלי.

### 2. יצירת Repository (מאגר קוד)
1. אחרי ההתחברות, לחצי על **+** בפינה העליונה ← **New repository**.
2. **Repository name:** `recipes-backend`
3. **Public** או **Private** – שניהם עובדים. Public נוח אם המורה צריכה לראות את הקוד. אין בקוד סודות, כך שזה בטוח.
4. **אל תסמני** את Add a README / .gitignore / license (כבר יש לנו את כולם).
5. לחצי **Create repository**.

### 3. העלאת הקבצים דרך הדפדפן
1. בעמוד ה-Repository הריק, לחצי על הקישור **uploading an existing file**.
2. פתחי את התיקייה `backend-project` שחילצת.
3. סמני **את כל התוכן שבתוך התיקייה** (`Ctrl + A` ב-Windows, `Cmd + A` ב-Mac) – **לא** את התיקייה עצמה.
4. גררי את כל מה שסימנת לאזור ההעלאה בדפדפן.
5. חכי שכל הקבצים יעלו (תראי רשימה).
6. למטה, ב-**Commit changes**, לחצי על הכפתור הירוק **Commit changes**.

### 4. בדיקה שהכול עלה
בעמוד הראשי של ה-Repository צריכים להופיע **בשורה העליונה**:
- תיקיות: `docs`, `prisma`, `scripts`, `src`, `tests`
- קבצים: `.env.example`, `.gitignore`, `.node-version`, `package.json`, `package-lock.json`, `prisma.config.ts`, `render.yaml`, `README.md`, `START-HERE.md`, `tsconfig.json` ועוד.

היכנסי ל-`prisma` ← `migrations` ← ודאי שיש תיקייה `20261024190000_init` ובתוכה `migration.sql`.

> ❗ אם `package.json` נמצא בתוך תיקייה בשם `backend-project` ולא בשורה הראשית – העלית את התיקייה עצמה. מחקי את ה-Repository (Settings ← בתחתית: Delete this repository) והעלי שוב רק את **התוכן**.

> ❗ אם חסרים `.gitignore` או `.node-version` – הקבצים המוסתרים לא עלו. הפעילי הצגת קבצים מוסתרים (ראי למעלה) והעלי אותם בנפרד: **Add file** ← **Upload files**.

---

# חלק ב – Neon: מסד נתונים PostgreSQL חינמי

בחרתי ב-**Neon** כי הוא פשוט, חינמי, לא דורש כרטיס אשראי ומתחבר בקלות מ-Render. (חלופה: Supabase – ראי בסוף החלק.)

### 1. פתיחת חשבון
1. היכנסי ל-**https://neon.com**
2. לחצי **Sign up**. הכי פשוט: **Continue with GitHub** (עם החשבון שפתחת).

### 2. יצירת מסד נתונים
1. אם לא נפתח חלון יצירה אוטומטית, לחצי **New Project** (או **Create project**).
2. **Project name:** `recipes`
3. **Postgres version:** השאירי את ברירת המחדל.
4. **Region:** בחרי אזור באירופה, למשל **Frankfurt** (קרוב לשרת שניצור ב-Render).
5. לחצי **Create project**.

### 3. קבלת כתובת החיבור (Connection String)
1. בלוח הבקרה של הפרויקט, לחצי על הכפתור **Connect**.
2. בחלון שנפתח, **כבי** את המתג **Connection pooling** (כדי לקבל חיבור ישיר – הוא הכי מתאים להרצת Migrations).
3. העתיקי את הכתובת. היא נראית בערך כך:
   ```
   postgresql://neondb_owner:XXXXXXXX@ep-xxxx-xxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```
   (אם יש כפתור **Show password** – לחצי עליו לפני ההעתקה, כדי שהסיסמה תופיע בכתובת ולא כוכביות.)

### 4. שמירה בטוחה
- שמרי את הכתובת **רק** במקום פרטי (למשל קובץ טקסט במחשב שלך, או מנהל סיסמאות).
- ❌ **לעולם אל תכתבי אותה בתוך קובץ בפרויקט ב-GitHub.** מי שיש לו את הכתובת – יכול למחוק את כל הנתונים.
- את הכתובת נדביק רק ב-Render, כמשתנה סביבה בשם `DATABASE_URL`.

### 5. איך השרת יתחבר למסד?
את זה עושים ב-Render (חלק ד). בהפעלה הראשונה השרת יריץ אוטומטית `prisma migrate deploy` שייצור את כל הטבלאות, ואז ייצור את 8 הקטגוריות ואת חשבון המנהל.

<details>
<summary><b>חלופה: Supabase במקום Neon</b></summary>

1. ב-https://supabase.com צרי פרויקט חדש ושמרי את סיסמת מסד הנתונים שתבחרי.
2. לחצי **Connect** ובחרי את מחרוזת ה-**Session pooler** (פורט `5432`).
   **לא** את Direct connection – הוא עובד רק ב-IPv6, ו-Render לא תומך בזה.
3. החליפי את `[YOUR-PASSWORD]` בסיסמה שבחרת.
4. שימי לב: פרויקט חינמי ב-Supabase עלול לעבור להשהיה אחרי תקופה בלי שימוש, ואז צריך להפעיל אותו מחדש בלוח הבקרה.
5. אם בלוגים של Render מופיעה השגיאה `self-signed certificate in certificate chain` – זו בעיית אישור אבטחה מוכרת עם Supabase. הפתרון הפשוט ביותר: לעבור ל-Neon.
</details>

---

# חלק ג – Cloudinary: אחסון תמונות (לא חובה)

**אפשר לדלג על החלק הזה.** בלי Cloudinary כל האתר עובד, ורק העלאת תמונה תחזיר הודעה ש"העלאת תמונות אינה זמינה". אפשר להוסיף את זה גם מאוחר יותר.

1. היכנסי ל-**https://cloudinary.com** ולחצי **Sign up for free**.
2. אחרי ההרשמה, בלוח הבקרה (Dashboard) חפשי את שלושת הפרטים:
   - **Cloud name**
   - **API Key**
   - **API Secret** (לפעמים צריך ללחוץ על אייקון עין כדי לראות אותו)
   אם הם לא מופיעים במסך הראשי, חפשי בהגדרות אזור בשם **API Keys**.
3. שמרי אותם במקום פרטי. ה-**API Secret** סודי בדיוק כמו סיסמה.

---

# חלק ד – Render: הפעלת השרת בענן

### 1. פתיחת חשבון
1. היכנסי ל-**https://render.com** ולחצי **Get Started** (או **Sign Up**).
2. בחרי **GitHub** – כך Render יוכל לראות את ה-Repository שלך.
3. אשרי את ההרשאות ש-GitHub מבקש.

### 2. בחירת סיסמה למנהל
לפני שממשיכים, החליטי על:
- **אימייל למנהל** – למשל האימייל שלך.
- **סיסמה למנהל** – לפחות 8 תווים, אות אחת וספרה אחת. **סיסמה משלך**, לא אחת מהדוגמאות במדריך.

### 3. יצירת השרת – דרך א: Blueprint (מומלץ, הכי מעט הקלדות)
הפרויקט כולל קובץ `render.yaml` שמגדיר הכול אוטומטית.

1. בלוח הבקרה של Render לחצי **New** (או **+ New**) ← **Blueprint**.
2. אם צריך, לחצי **Connect GitHub** / **Configure account** ותני גישה ל-Repository בשם `recipes-backend`.
3. בחרי את ה-Repository `recipes-backend` ולחצי **Connect**.
4. **Blueprint Name:** `recipes`
5. Render יקרא את `render.yaml` ויבקש למלא כמה ערכים:

| משתנה | מה למלא |
|---|---|
| `DATABASE_URL` | הכתובת מ-Neon (חלק ב, שלב 3) |
| `ADMIN_EMAIL` | האימייל שבחרת למנהל |
| `ADMIN_PASSWORD` | הסיסמה שבחרת למנהל |
| `CLOUDINARY_CLOUD_NAME` | מ-Cloudinary, או להשאיר ריק |
| `CLOUDINARY_API_KEY` | מ-Cloudinary, או להשאיר ריק |
| `CLOUDINARY_API_SECRET` | מ-Cloudinary, או להשאיר ריק |
| `DEMO_USER_PASSWORD` | להשאיר ריק (או ראי "נתוני הדגמה" למטה) |

את `JWT_SECRET` אין צורך למלא – Render ייצור אותו לבד.

6. לחצי **Apply** (או **Deploy Blueprint**).

### 3. יצירת השרת – דרך ב: Web Service ידני (אם דרך א לא עובדת)
1. **New** ← **Web Service**.
2. בחרי **Build and deploy from a Git repository** (אם מופיעה שאלה כזו) ← בחרי את `recipes-backend` ← **Connect**.
3. מלאי **בדיוק** את הערכים האלה:

| שדה | ערך |
|---|---|
| **Name** | `recipes-backend` |
| **Region** | `Frankfurt (EU Central)` |
| **Branch** | `main` |
| **Root Directory** | להשאיר ריק |
| **Runtime / Language** | `Node` |
| **Build Command** | `npm ci --include=dev && npm run build` |
| **Start Command** | `npm run start:prod` |
| **Instance Type** | `Free` |

4. גללי ל-**Environment Variables** ולחצי **Add Environment Variable** עבור כל אחד:

| Key | Value |
|---|---|
| `NODE_VERSION` | `22` |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | הכתובת מ-Neon |
| `JWT_SECRET` | מחרוזת אקראית ארוכה – ראי למטה איך ליצור |
| `JWT_EXPIRES_IN` | `1d` |
| `CORS_ORIGINS` | `http://localhost:5173` |
| `ADMIN_EMAIL` | האימייל של המנהל |
| `ADMIN_PASSWORD` | הסיסמה של המנהל |
| `CLOUDINARY_CLOUD_NAME` | (לא חובה) |
| `CLOUDINARY_API_KEY` | (לא חובה) |
| `CLOUDINARY_API_SECRET` | (לא חובה) |

**יצירת JWT_SECRET:** אם יש כפתור **Generate** ליד השדה – לחצי עליו. אחרת, הקלידי לפחות 40 תווים אקראיים (אותיות וספרות מעורבבות), למשל ע"י הקשה אקראית על המקלדת. אין צורך לזכור אותו.

5. אם יש שדה **Health Check Path** (לפעמים תחת **Advanced**) – הזיני `/api/health`.
6. לחצי **Create Web Service** (או **Deploy Web Service**).

### 4. Prisma Migrations – יצירת הטבלאות
**אין צורך לעשות שום דבר ידנית.** פקודת ההפעלה `npm run start:prod` מריצה קודם `prisma migrate deploy`, שיוצרת את הטבלאות במסד הנתונים (רק בפעם הראשונה – בפעמים הבאות היא רואה שהכול קיים וממשיכה).

### 5. מעקב אחר ה-Deploy
1. בעמוד השרת ב-Render, לחצי על **Logs** (או **Events** ← הפריסה האחרונה).
2. התהליך לוקח כמה דקות. בסדר הזה תראי:
   - התקנת חבילות (`npm ci`)
   - `Generated Prisma Client`
   - `Build successful` 🎉
   - `All migrations have been successfully applied` (או `No pending migrations to apply`)
   - `[bootstrap] created 8 default categories`
   - `[bootstrap] created ADMIN ...`
   - `✅ Server is running on port ...`
3. כשהסטטוס הופך ל-**Live** – השרת באוויר!

### 6. הכתובת של השרת
בראש עמוד השרת ב-Render מופיעה כתובת כמו:
```
https://recipes-backend-xxxx.onrender.com
```
**זו כתובת ה-Base URL של השרת.** שמרי אותה – תצטרכי אותה ב-React.

### 7. עדכונים בעתיד
בכל פעם שתעלי שינוי ל-GitHub, Render יבנה ויפעיל את השרת מחדש אוטומטית.
אם תרצי לשנות משתנה סביבה: עמוד השרת ← **Environment** ← לשנות ← **Save Changes** (השרת יופעל מחדש).

### נתוני הדגמה בענן (לא חובה)
כדי שיהיו באתר בענן מתכונים לדוגמה ושני משתמשים לבדיקת הרשאות:
1. ב-Render ← **Environment**:
   - `SEED_DEMO_DATA` = `true`
   - `DEMO_USER_PASSWORD` = סיסמה שתבחרי (8+ תווים, אות וספרה)
2. **Save Changes**.
3. אחרי ההפעלה מחדש יהיו שני משתמשים: `sara@example.com` ו-`david@example.com` עם הסיסמה שבחרת, ובערך 18 מתכונים (חלקם פרטיים, חלקם ציבוריים). גם המנהל יקבל כמה מתכונים לדוגמה.
4. הפעולה בטוחה להרצה חוזרת – היא לא יוצרת כפילויות.

---

# חלק ה – בדיקה שהכול עובד

החליפי בכל מקום את `https://recipes-backend-xxxx.onrender.com` בכתובת האמיתית שלך.

> 💤 אם השרת "ישן", הפתיחה הראשונה עלולה לקחת עד דקה. זה תקין.

### 1. בדיקת בריאות
פתחי בדפדפן:
```
https://recipes-backend-xxxx.onrender.com/api/health
```
צריך להופיע:
```json
{"status":"ok","database":"ok", ...}
```
אם `database` הוא `unreachable` – הבעיה ב-`DATABASE_URL` (ראי טבלת תקלות).

### 2. פתיחת Swagger
```
https://recipes-backend-xxxx.onrender.com/api-docs
```
יופיע עמוד עם כל ה-Endpoints, מחולקים לקבוצות: System, Auth, Categories, Recipes, Favorites.

### 3. התחברות מתוך Swagger
1. פתחי את **POST /api/auth/login** (קבוצת Auth).
2. לחצי **Try it out**.
3. בתיבה, החליפי את הדוגמה בפרטי המנהל שלך:
   ```json
   { "email": "האימייל-שלך@example.com", "password": "הסיסמה-שלך" }
   ```
4. לחצי **Execute**.
5. למטה, ב-**Response body**, תראי `"token": "eyJ..."`.

### 4. קבלת ה-JWT
העתיקי את **כל** הטקסט שבתוך המירכאות אחרי `"token":` (מתחיל ב-`eyJ`, בלי המירכאות).

### 5. שימוש ב-Authorize
1. גללי לראש העמוד ולחצי על הכפתור הירוק **Authorize** 🔓.
2. הדביקי את ה-Token בשדה **Value** (בלי המילה Bearer).
3. לחצי **Authorize** ← **Close**. המנעולים בעמוד ייסגרו 🔒.

### 6. קריאה ל-Endpoint מוגן
1. פתחי **GET /api/auth/me** ← **Try it out** ← **Execute**.
2. תקבלי את פרטי המנהל עם `"role": "ADMIN"`.
3. 🧪 **בדיקת 401:** לחצי שוב **Authorize** ← **Logout**, והריצי שוב את `/api/auth/me`. תקבלי **401**. התחברי מחדש לפני שממשיכים.

### 7. הוספת רשומה
1. קודם, מצאי מזהה קטגוריה: **GET /api/categories** ← **Try it out** ← **Execute**. רשמי `id` של קטגוריה כלשהי (למשל של "עוגות").
2. פתחי **POST /api/recipes** ← **Try it out**.
3. בדוגמה שמופיעה, עדכני את `categoryId` למספר שרשמת.
4. **Execute** ← צריך להתקבל **201** עם המתכון החדש. רשמי את ה-`id` שלו.

### 8. שליפת הרשומה ממסד הנתונים
1. **GET /api/recipes/{id}** ← **Try it out** ← הזיני את ה-id ← **Execute** ← **200**.
2. **GET /api/recipes/mine** ← **Execute** ← המתכון מופיע ברשימה.
3. אפשר לראות אותו גם ישירות במסד הנתונים: ב-Neon ← **Tables** (או **SQL Editor** והקלידי `SELECT * FROM recipes;`).

### 9. 🧪 בדיקת 403 (אין הרשאה)
1. ב-Swagger, **POST /api/auth/register** – הירשמי עם משתמש חדש (אימייל אחר).
2. העתיקי את ה-Token שלו ו-**Authorize** איתו (קודם Logout).
3. נסי **POST /api/categories** עם `{ "name": "ניסיון" }` ← תקבלי **403** – משתמש רגיל לא יכול לנהל קטגוריות. 

🎉 **אם הכול עבד – השרת שלך באוויר ומוכן לחיבור ל-React!**

### 10. חיבור אתר ה-React
- כתובת השרת ל-React: `https://recipes-backend-xxxx.onrender.com/api`
- כשתעלי את אתר ה-React לאינטרנט (למשל ל-Vercel או Netlify), הוסיפי את הכתובת שלו ל-`CORS_ORIGINS` ב-Render, מופרד בפסיק:
  ```
  http://localhost:5173,https://my-recipes.vercel.app
  ```
  (בלי `/` בסוף.)

---

# חלק ו – פתרון תקלות

| תקלה | איך זה נראה | פתרון |
|---|---|---|
| **Build Failed** | ב-Logs של Render מופיעה שגיאה בשלב Build | 1. ודאי שה-Build Command הוא בדיוק `npm ci --include=dev && npm run build`. 2. ודאי ש-`package.json` ו-`package-lock.json` נמצאים בשורה הראשית של ה-Repository (לא בתוך תיקייה). 3. ודאי ש-`NODE_VERSION` = `22`. |
| **`npm ci` נכשל** | `package-lock.json` not found / out of sync | ודאי שהעלית את `package-lock.json` ל-GitHub. |
| **DATABASE_URL שגוי** | `DATABASE_URL חייב להתחיל ב-postgresql://`, או `P1001: Can't reach database server`, או `/api/health` מחזיר `unreachable` | 1. העתיקי מחדש מ-Neon (Connect ← Connection pooling כבוי). 2. ודאי שאין רווח או מירכאות בהתחלה/סוף. 3. ודאי שהסיסמה מופיעה בכתובת ולא `****`. 4. ב-Render ← Environment ← עדכני ← Save Changes. |
| **בעיית Prisma / Migrations** | `P3009` / `P3018` / `migrate deploy` נכשל | 1. ודאי שהתיקייה `prisma/migrations` עלתה ל-GitHub כולל `migration_lock.toml`. 2. אם ניסית קודם עם מסד אחר ונשארו טבלאות חלקיות – ב-Neon צרי Database חדש או פרויקט חדש והחליפי את `DATABASE_URL`. |
| **Prisma Client חסר** | `Cannot find module '../generated/prisma/client'` | ה-Build לא הריץ `prisma generate`. ודאי שה-Build Command כולל `npm run build` (הוא מריץ את זה). |
| **JWT_SECRET חסר** | בלוגים: `JWT_SECRET חסר` או `חייב להכיל לפחות 32 תווים` | Render ← Environment ← הוסיפי `JWT_SECRET` עם לפחות 32 תווים אקראיים ← Save Changes. |
| **המנהל לא נוצר** | בלוגים: `ADMIN_PASSWORD חלשה מדי` | סיסמה של לפחות 8 תווים, עם אות וספרה. עדכני ← Save Changes. |
| **שכחתי את סיסמת המנהל** | 401 בהתחברות | שני פתרונות: (א) שני את `ADMIN_EMAIL` לאימייל חדש וסיסמה חדשה – ייווצר מנהל חדש. (ב) ב-Neon ← SQL Editor: `DELETE FROM users WHERE email = 'האימייל';` ואז Manual Deploy ב-Render. (זהירות: (ב) מוחק גם את המתכונים שלו.) |
| **שגיאת CORS** | בדפדפן (Console) של ה-React: `blocked by CORS policy` | הוסיפי את כתובת ה-React המדויקת ל-`CORS_ORIGINS` ב-Render, כולל `http://` או `https://` והפורט, **בלי** `/` בסוף. מופרד בפסיקים. Save Changes. |
| **401 Unauthorized** | `MISSING_TOKEN` / `INVALID_TOKEN` / `TOKEN_EXPIRED` | חסר Token, הוא הועתק חלקית, או שפג תוקפו (אחרי יום). התחברי מחדש ועשי Authorize שוב. ב-React: שלחי כותרת `Authorization: Bearer <token>`. |
| **403 Forbidden** | `FORBIDDEN` | הפעולה מותרת רק למנהל, או שהמתכון שייך למשתמש אחר. זו התנהגות נכונה של השרת. |
| **404 על מתכון שקיים** | `המתכון לא נמצא` | המתכון פרטי ושייך למשתמש אחר. גם זו התנהגות נכונה (פרטיות). |
| **Swagger לא נפתח** | עמוד ריק / 404 | 1. הכתובת היא `/api-docs` (עם מקף). 2. חכי דקה – אולי השרת התעורר. 3. בדקי שהשרת **Live** ב-Render. |
| **השרת לא עולה** | סטטוס Failed / `Exited with status 1` | פתחי **Logs** וחפשי שורה עם ❌. בדרך כלל זה משתנה סביבה חסר או `DATABASE_URL` שגוי – השרת כותב בדיוק מה חסר. |
| **השרת איטי מאוד בפעם הראשונה** | הבקשה הראשונה לוקחת ~דקה | במסלול החינמי השרת נרדם אחרי 15 דקות בלי שימוש. זה תקין. כדאי לפתוח את `/api/health` כמה דקות לפני הצגת הפרויקט. גם Neon "נרדם" ומתעורר תוך שניות. |
| **העלאת תמונה מחזירה 503** | `IMAGE_STORAGE_NOT_CONFIGURED` | לא הוגדרו שלושת משתני `CLOUDINARY_*`. הוסיפי אותם ב-Render ← Save Changes. |
| **העלאת תמונה מחזירה 413 / 415** | `FILE_TOO_LARGE` / `UNSUPPORTED_FILE_TYPE` | תמונה עד 5MB, מסוג JPG / PNG / WEBP בלבד. |
| **429 Too Many Requests** | `TOO_MANY_REQUESTS` | יותר מ-20 ניסיונות התחברות כושלים ב-15 דקות. חכי 15 דקות. |

**עדיין תקועה?** העתיקי את 30 השורות האחרונות מה-Logs ב-Render (בלי סיסמאות!) ושאלי את המורה או חברה.
