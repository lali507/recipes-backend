# 🍰 Recipes API – שרת Backend לאתר מתכונים משותפים

שרת Backend מלא לאתר מתכונים: משתמשים שומרים מתכונים פרטיים או ציבוריים, מחפשים, מסננים, שומרים מועדפים ומעלים תמונות. מנהל האתר מנהל קטגוריות ויכול להסיר מתכונים ציבוריים לא ראויים.

> **מתחילה בפעם הראשונה? פתחי קודם את [START-HERE.md](START-HERE.md)** – שם יש הוראות צעד אחר צעד להעלאה לאינטרנט.
> **כותבת את צד ה-React?** כל מה שצריך נמצא ב-[FRONTEND-API-GUIDE.md](FRONTEND-API-GUIDE.md).

---

## טכנולוגיות

| תחום | טכנולוגיה |
|---|---|
| שפה | TypeScript (מצב strict) על Node.js 22 LTS |
| שרת | Express 5 |
| מסד נתונים | PostgreSQL |
| ORM | Prisma 7 (עם `@prisma/adapter-pg`) |
| ולידציה | Zod 4 |
| התחברות | JWT (HS256) + סיסמאות מוצפנות ב-bcrypt |
| תיעוד | Swagger UI / OpenAPI 3 בכתובת `/api-docs` |
| בדיקות | Vitest + Supertest מול PostgreSQL אמיתי |
| תמונות | Cloudinary (לא חובה) |
| אבטחה נוספת | Helmet, CORS ניתן להגדרה, הגבלת ניסיונות התחברות |

אין צורך בשום שירות AI או מפתח בתשלום כדי להפעיל את השרת.

---

## מבנה הפרויקט

```
backend-project/
├── src/
│   ├── app.ts                 # בניית האפליקציה: אבטחה, CORS, Routes, Swagger
│   ├── server.ts              # נקודת הכניסה – מפעיל את השרת
│   ├── config/env.ts          # קריאה ובדיקה של משתני הסביבה
│   ├── db/prisma.ts           # החיבור למסד הנתונים
│   ├── bootstrap/             # קטגוריות ברירת מחדל, מנהל ראשון, נתוני הדגמה
│   ├── docs/openapi.ts        # מסמך Swagger / OpenAPI
│   ├── lib/                   # JWT, הצפנת סיסמאות, שגיאות, ולידציה, תמונות
│   ├── middleware/            # Authentication, Authorization, שגיאות, העלאת קבצים
│   ├── modules/               # כל נושא בתיקייה משלו:
│   │   ├── auth/              #   routes → controller → service + schemas
│   │   ├── categories/
│   │   ├── recipes/
│   │   ├── favorites/
│   │   └── health/
│   └── types/                 # הרחבת טיפוסים (המשתמש המחובר ב-Request)
├── prisma/
│   ├── schema.prisma          # הגדרת הטבלאות
│   ├── migrations/            # קובצי SQL ליצירת הטבלאות
│   └── seed.ts                # נתוני הדגמה למחשב המקומי
├── tests/                     # 85 בדיקות אוטומטיות
├── docs/
│   ├── SPEC.md                # מסמך האפיון המאושר
│   └── openapi.json           # קובץ OpenAPI (נוצר מהקוד)
├── scripts/export-openapi.ts
├── prisma.config.ts           # הגדרות Prisma
├── render.yaml                # הגדרות פריסה ל-Render
├── .env.example               # דוגמה למשתני סביבה
├── START-HERE.md              # הוראות העלאה לאינטרנט (GitHub, Neon, Render)
└── FRONTEND-API-GUIDE.md      # מדריך API לכתיבת צד ה-React
```

כל בקשה עוברת את המסלול: **Route** ← **Middleware** (התחברות, הרשאות) ← **Controller** (ולידציה עם Zod) ← **Service** (לוגיקה ובדיקות פרטיות) ← **Prisma** ← PostgreSQL.

---

## הרצה במחשב (לא חובה)

אפשר להעלות את השרת ישר לענן לפי [START-HERE.md](START-HERE.md) בלי להריץ אותו במחשב. אם בכל זאת תרצי להריץ מקומית:

**דרישות:** Node.js 22 ומעלה, ו-PostgreSQL (מקומי, או מסד חינמי בענן כמו Neon).

```bash
npm install                 # מתקין חבילות ויוצר את Prisma Client
cp .env.example .env        # ב-Windows: copy .env.example .env  → ואז לערוך את .env
npm run db:deploy           # יוצר את הטבלאות במסד הנתונים
npm run db:seed             # נתוני הדגמה (מוחק נתונים קיימים!)
npm run dev                 # מפעיל את השרת עם רענון אוטומטי
```

ואז לפתוח:
- http://localhost:3000/api/health
- http://localhost:3000/api-docs

**חשבונות הדגמה (רק אחרי `npm run db:seed` במחשב המקומי):**

| תפקיד | אימייל | סיסמה |
|---|---|---|
| מנהל | admin@example.com | Admin1234 |
| משתמש | sara@example.com | User1234 |
| משתמש | david@example.com | User1234 |

> הסיסמאות האלה ידועות לכולם ולכן ה-Seed **מסרב לרוץ** כש-`NODE_ENV=production`. בענן נוצרים חשבונות רק עם סיסמאות שאת בוחרת (ראי START-HERE.md).

---

## פקודות

| פקודה | מה היא עושה |
|---|---|
| `npm run dev` | הרצה לפיתוח עם רענון אוטומטי |
| `npm run build` | יצירת Prisma Client וקומפילציה לתיקייה `dist` |
| `npm start` | הרצת הגרסה המקומפלת |
| `npm run start:prod` | הרצת Migrations ואז השרת (משמש את Render) |
| `npm run typecheck` | בדיקת TypeScript |
| `npm test` | הרצת הבדיקות האוטומטיות (צריך `.env.test`, ראי למטה) |
| `npm run db:deploy` | הרצת Migrations על מסד הנתונים |
| `npm run db:migrate` | יצירת Migration חדשה אחרי שינוי ב-`schema.prisma` |
| `npm run db:seed` | נתוני הדגמה (מקומי בלבד) |
| `npm run db:studio` | ממשק גרפי לצפייה בנתונים (Prisma Studio) |
| `npm run openapi:export` | עדכון הקובץ `docs/openapi.json` |

### הרצת הבדיקות

הבדיקות רצות מול מסד נתונים **נפרד** ומוחקות בו את כל הנתונים, לכן:

1. צרי מסד נתונים נוסף ששמו כולל `test` (למשל `recipes_test`).
2. העתיקי `.env.test.example` ל-`.env.test` ועדכני את `DATABASE_URL`.
3. `npm test`

---

## משתני סביבה

הרשימה המלאה עם הסברים נמצאת ב-[.env.example](.env.example). החשובים:

| משתנה | חובה | הסבר |
|---|:---:|---|
| `DATABASE_URL` | ✅ | כתובת החיבור ל-PostgreSQL |
| `JWT_SECRET` | ✅ | מחרוזת סודית, לפחות 32 תווים |
| `JWT_EXPIRES_IN` | | תוקף ה-Token (ברירת מחדל `1d`) |
| `CORS_ORIGINS` | | כתובות אתר ה-React, מופרדות בפסיק |
| `PORT` | | ברירת מחדל 3000 (Render מגדיר לבד) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | | יצירת מנהל אוטומטית בעליית השרת |
| `CLOUDINARY_*` | | העלאת תמונות. בלעדיהם העלאה מחזירה 503 |
| `SEED_DEMO_DATA`, `DEMO_USER_PASSWORD` | | נתוני הדגמה בענן |

אם חסר משתנה חובה, השרת לא יעלה ויכתוב בדיוק מה חסר.

---

## אבטחה – מה כבר מטופל

- סיסמאות נשמרות רק כ-Hash של bcrypt, ולעולם לא מוחזרות ב-API.
- כל נתיב חוץ מ-`/api/health`, `/api/auth/register` ו-`/api/auth/login` דורש Bearer Token.
- המשתמש והתפקיד נקבעים לפי ה-Token **ונטענים מחדש ממסד הנתונים** בכל בקשה (שינוי תפקיד או מחיקת משתמש משפיעים מיד).
- מתכון פרטי של משתמש אחר מחזיר 404 – אפילו למנהל – כדי לא לחשוף שהוא קיים.
- הגבלת ניסיונות התחברות כושלים (429).
- בדיקת "חתימת" קובץ התמונה, לא רק הסיומת.
- אילוצי CHECK ו-Foreign Keys במסד הנתונים כהגנה נוספת.
- ב-Production לא נוצרים חשבונות עם סיסמאות ידועות.
