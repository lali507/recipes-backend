// =====================================================================
// מסמך OpenAPI 3 – משמש את Swagger UI בכתובת /api-docs
// וגם מיוצא לקובץ docs/openapi.json (npm run openapi:export)
// =====================================================================

const json = (schema: object, example?: unknown) => ({
  'application/json': { schema, ...(example !== undefined ? { example } : {}) },
});

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const resp = (name: string) => ({ $ref: `#/components/responses/${name}` });

const errorExample = (code: string, message: string, details?: unknown) => ({
  error: { code, message, ...(details ? { details } : {}) },
});

const exampleUser = {
  id: 2,
  name: 'שרה לוי',
  email: 'sara@example.com',
  role: 'USER',
  createdAt: '2026-10-24T19:00:00.000Z',
};

const exampleRecipe = {
  id: 1,
  title: 'עוגת שוקולד בחושה',
  description: 'עוגת שוקולד פשוטה ומהירה שמכינים בקערה אחת',
  ingredients: '2 כוסות קמח\n1.5 כוסות סוכר\n0.5 כוס קקאו',
  instructions: '1. מחממים תנור ל-180 מעלות.\n2. מערבבים...',
  prepTimeMinutes: 50,
  difficulty: 'EASY',
  servings: 12,
  kosherType: 'PAREVE',
  isPublic: true,
  imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/recipes-app/abc123.jpg',
  createdAt: '2026-10-24T19:00:00.000Z',
  updatedAt: '2026-10-24T19:00:00.000Z',
  category: { id: 5, name: 'עוגות' },
  author: { id: 2, name: 'שרה לוי' },
  isFavorite: false,
  isOwner: true,
  canEdit: true,
  canDelete: true,
};

const exampleRecipeInput = {
  title: 'עוגת שמרים',
  description: 'עוגה רכה ואוורירית לשבת',
  ingredients: '1 ק"ג קמח\n50 גרם שמרים\n1 כוס סוכר',
  instructions: '1. לשים בצק.\n2. מתפיחים שעה.\n3. אופים 40 דקות.',
  prepTimeMinutes: 90,
  difficulty: 'MEDIUM',
  servings: 12,
  kosherType: 'PAREVE',
  isPublic: true,
  categoryId: 5,
};

const pagination = { page: 1, limit: 12, total: 1, totalPages: 1 };

const idParam = (name = 'id', description = 'מזהה') => ({
  name,
  in: 'path',
  required: true,
  description,
  schema: { type: 'integer', minimum: 1 },
  example: 1,
});

const pageParams = [
  { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 }, description: 'מספר עמוד' },
  {
    name: 'limit',
    in: 'query',
    schema: { type: 'integer', minimum: 1, maximum: 50, default: 12 },
    description: 'כמות פריטים בעמוד',
  },
];

const recipeQueryParams = [
  {
    name: 'search',
    in: 'query',
    schema: { type: 'string', maxLength: 100 },
    description: 'חיפוש טקסט בשם, בתיאור וברכיבים (ללא תלות באותיות גדולות/קטנות)',
    example: 'שוקולד',
  },
  { name: 'categoryId', in: 'query', schema: { type: 'integer', minimum: 1 }, description: 'סינון לפי קטגוריה' },
  { name: 'authorId', in: 'query', schema: { type: 'integer', minimum: 1 }, description: 'סינון לפי מפרסם (מזהה מ-GET /api/recipes/authors)' },
  {
    name: 'difficulty',
    in: 'query',
    schema: { type: 'string', enum: ['EASY', 'MEDIUM', 'HARD'] },
    description: 'סינון לפי רמת קושי',
  },
  {
    name: 'kosherType',
    in: 'query',
    schema: { type: 'string', enum: ['MEAT', 'DAIRY', 'PAREVE'] },
    description: 'סינון לפי סוג כשרות',
  },
  {
    name: 'maxPrepTime',
    in: 'query',
    schema: { type: 'integer', minimum: 1, maximum: 1440 },
    description: 'זמן הכנה מקסימלי בדקות',
  },
  {
    name: 'sort',
    in: 'query',
    schema: { type: 'string', enum: ['newest', 'oldest', 'prepTime', 'title'], default: 'newest' },
    description: 'מיון: newest – החדש ביותר, oldest – הישן ביותר, prepTime – זמן הכנה מהקצר, title – לפי א-ב',
  },
  ...pageParams,
];

const bearer = [{ bearerAuth: [] }];

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Recipes API – אתר מתכונים משותפים',
    version: '1.0.0',
    description: [
      'שרת Backend לאתר מתכונים: התחברות עם JWT, שני תפקידים (USER, ADMIN), מתכונים פרטיים וציבוריים, קטגוריות, מועדפים והעלאת תמונות.',
      '',
      '**איך בודקים נתיבים מוגנים:**',
      '1. פתחי את `POST /api/auth/login`, לחצי **Try it out** ואז **Execute**.',
      '2. העתיקי את הערך של `token` מהתשובה.',
      '3. לחצי על הכפתור **Authorize** למעלה, הדביקי את ה-Token (בלי המילה Bearer) ולחצי **Authorize**.',
      '4. מעכשיו כל הבקשות יישלחו עם ה-Token.',
      '',
      'כל השגיאות מוחזרות במבנה: `{ "error": { "code", "message", "details?" } }`.',
    ].join('\n'),
  },
  servers: [{ url: '/', description: 'השרת הנוכחי' }],
  tags: [
    { name: 'System', description: 'בדיקת תקינות השרת' },
    { name: 'Auth', description: 'הרשמה, התחברות ופרטי המשתמש המחובר' },
    { name: 'Categories', description: 'קטגוריות – צפייה לכל מחובר, ניהול למנהל בלבד' },
    { name: 'Recipes', description: 'מתכונים – רשימות, חיפוש, יצירה, עריכה, מחיקה ותמונות' },
    { name: 'Favorites', description: 'המועדפים של המשתמש המחובר' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'הדביקי כאן את ה-Token שקיבלת מ-/api/auth/login (בלי המילה Bearer)',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: { type: 'string', example: 'NOT_FOUND' },
              message: { type: 'string', example: 'המשאב המבוקש לא נמצא' },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { field: { type: 'string' }, message: { type: 'string' } },
                },
              },
            },
          },
        },
      },
      Role: { type: 'string', enum: ['USER', 'ADMIN'] },
      Difficulty: { type: 'string', enum: ['EASY', 'MEDIUM', 'HARD'], description: 'קל / בינוני / קשה' },
      KosherType: { type: 'string', enum: ['MEAT', 'DAIRY', 'PAREVE'], description: 'בשרי / חלבי / פרווה' },
      User: {
        type: 'object',
        required: ['id', 'name', 'email', 'role', 'createdAt'],
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: ref('Role'),
          createdAt: { type: 'string', format: 'date-time' },
        },
        example: exampleUser,
      },
      RegisterInput: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 50 },
          email: { type: 'string', format: 'email', maxLength: 254 },
          password: {
            type: 'string',
            minLength: 8,
            maxLength: 72,
            description: 'לפחות 8 תווים, לפחות אות אחת וספרה אחת',
          },
        },
        example: { name: 'רחל ישראלי', email: 'rachel@example.com', password: 'Password123' },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: { email: { type: 'string', format: 'email' }, password: { type: 'string' } },
        example: { email: 'sara@example.com', password: 'User1234' },
      },
      AuthResponse: {
        type: 'object',
        required: ['token', 'user'],
        properties: {
          token: { type: 'string', description: 'JWT Access Token. יש לשלוח בכותרת Authorization: Bearer <token>' },
          user: ref('User'),
        },
        example: { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', user: exampleUser },
      },
      Category: {
        type: 'object',
        required: ['id', 'name', 'recipeCount'],
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          recipeCount: { type: 'integer', description: 'מספר המתכונים בקטגוריה שגלויים למשתמש המחובר' },
          totalRecipeCount: {
            type: 'integer',
            description: 'למנהל בלבד: מספר כל המתכונים בקטגוריה, כולל פרטיים (קובע אם אפשר למחוק)',
          },
        },
        example: { id: 5, name: 'עוגות', recipeCount: 3, totalRecipeCount: 4 },
      },
      CategoryInput: {
        type: 'object',
        required: ['name'],
        properties: { name: { type: 'string', minLength: 2, maxLength: 40 } },
        example: { name: 'פשטידות' },
      },
      RecipeInput: {
        type: 'object',
        required: [
          'title',
          'description',
          'ingredients',
          'instructions',
          'prepTimeMinutes',
          'difficulty',
          'servings',
          'kosherType',
          'categoryId',
        ],
        properties: {
          title: { type: 'string', minLength: 2, maxLength: 100, description: 'שם המתכון' },
          description: { type: 'string', minLength: 5, maxLength: 500, description: 'תיאור קצר' },
          ingredients: { type: 'string', minLength: 1, maxLength: 5000, description: 'רכיבים – שורה לכל רכיב' },
          instructions: { type: 'string', minLength: 1, maxLength: 10000, description: 'אופן ההכנה' },
          prepTimeMinutes: { type: 'integer', minimum: 1, maximum: 1440, description: 'זמן הכנה בדקות' },
          difficulty: ref('Difficulty'),
          servings: { type: 'integer', minimum: 1, maximum: 100, description: 'מספר מנות' },
          kosherType: ref('KosherType'),
          isPublic: {
            type: 'boolean',
            default: false,
            description: 'ביצירה: לא חובה (ברירת מחדל false). בעדכון (PUT): חובה',
          },
          categoryId: { type: 'integer', minimum: 1, description: 'מזהה קטגוריה קיימת' },
        },
        example: exampleRecipeInput,
      },
      Recipe: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          title: { type: 'string' },
          description: { type: 'string' },
          ingredients: { type: 'string' },
          instructions: { type: 'string' },
          prepTimeMinutes: { type: 'integer' },
          difficulty: ref('Difficulty'),
          servings: { type: 'integer' },
          kosherType: ref('KosherType'),
          isPublic: { type: 'boolean' },
          imageUrl: { type: 'string', nullable: true, description: 'קישור לתמונה, או null' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          category: {
            type: 'object',
            properties: { id: { type: 'integer' }, name: { type: 'string' } },
          },
          author: {
            type: 'object',
            description: 'יוצר המתכון (בלי אימייל)',
            properties: { id: { type: 'integer' }, name: { type: 'string' } },
          },
          isFavorite: { type: 'boolean', description: 'האם המתכון במועדפים של המשתמש המחובר' },
          isOwner: { type: 'boolean', description: 'האם המשתמש המחובר יצר את המתכון' },
          canEdit: { type: 'boolean', description: 'האם מותר למשתמש המחובר לערוך' },
          canDelete: { type: 'boolean', description: 'האם מותר למשתמש המחובר למחוק' },
        },
        example: exampleRecipe,
      },
      FavoriteRecipe: {
        allOf: [
          ref('Recipe'),
          { type: 'object', properties: { favoritedAt: { type: 'string', format: 'date-time' } } },
        ],
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer', description: 'סך כל התוצאות' },
          totalPages: { type: 'integer' },
        },
        example: pagination,
      },
      RecipeList: {
        type: 'object',
        properties: { items: { type: 'array', items: ref('Recipe') }, pagination: ref('Pagination') },
        example: { items: [exampleRecipe], pagination },
      },
      FavoriteList: {
        type: 'object',
        properties: { items: { type: 'array', items: ref('FavoriteRecipe') }, pagination: ref('Pagination') },
      },
      FavoriteResult: {
        type: 'object',
        properties: { recipeId: { type: 'integer' }, isFavorite: { type: 'boolean' } },
        example: { recipeId: 1, isFavorite: true },
      },
      Health: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['ok', 'error'] },
          database: { type: 'string', enum: ['ok', 'unreachable'] },
          uptimeSeconds: { type: 'integer' },
          timestamp: { type: 'string', format: 'date-time' },
        },
        example: { status: 'ok', database: 'ok', uptimeSeconds: 42, timestamp: '2026-10-24T19:00:00.000Z' },
      },
    },
    responses: {
      ValidationError: {
        description: '400 – הנתונים שנשלחו אינם תקינים',
        content: json(
          ref('Error'),
          errorExample('VALIDATION_ERROR', 'הנתונים שנשלחו אינם תקינים', [
            { field: 'title', message: 'שם המתכון חייב להכיל לפחות 2 תווים' },
          ]),
        ),
      },
      Unauthorized: {
        description: '401 – לא נשלח Token, ה-Token לא תקין, או שפג תוקפו',
        content: json(
          ref('Error'),
          errorExample('MISSING_TOKEN', 'נדרשת התחברות. יש לשלוח Authorization: Bearer <token>'),
        ),
      },
      Forbidden: {
        description: '403 – אין הרשאה לפעולה',
        content: json(ref('Error'), errorExample('FORBIDDEN', 'אין לך הרשאה לבצע פעולה זו')),
      },
      NotFound: {
        description: '404 – לא נמצא (או מתכון פרטי של משתמש אחר)',
        content: json(ref('Error'), errorExample('NOT_FOUND', 'המתכון לא נמצא')),
      },
      TooManyRequests: {
        description: '429 – יותר מדי ניסיונות',
        content: json(ref('Error'), errorExample('TOO_MANY_REQUESTS', 'יותר מדי ניסיונות. נסי שוב בעוד כמה דקות')),
      },
    },
  },
  paths: {
    // ------------------------------------------------------------ System
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'בדיקת תקינות השרת ומסד הנתונים',
        description: 'ציבורי – לא דורש Token. משמש גם את Render לבדיקת בריאות.',
        responses: {
          200: { description: 'השרת ומסד הנתונים פעילים', content: json(ref('Health')) },
          503: {
            description: 'אין חיבור למסד הנתונים',
            content: json(ref('Health'), {
              status: 'error',
              database: 'unreachable',
              uptimeSeconds: 42,
              timestamp: '2026-10-24T19:00:00.000Z',
            }),
          },
        },
      },
    },
    // ------------------------------------------------------------ Auth
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'הרשמה',
        description: 'ציבורי. יוצר תמיד משתמש רגיל (USER) ומחזיר Token – אין צורך להתחבר בנפרד.',
        requestBody: { required: true, content: json(ref('RegisterInput')) },
        responses: {
          201: { description: 'נרשמת בהצלחה', content: json(ref('AuthResponse')) },
          400: resp('ValidationError'),
          409: {
            description: 'האימייל כבר רשום',
            content: json(ref('Error'), errorExample('EMAIL_TAKEN', 'כתובת האימייל כבר רשומה במערכת')),
          },
          429: resp('TooManyRequests'),
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'התחברות',
        description: 'ציבורי. מחזיר JWT Token עם תוקף מוגבל (ברירת מחדל: יום אחד).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: ref('LoginInput'),
              examples: {
                user: { summary: 'משתמש רגיל (נתוני הדגמה במחשב המקומי)', value: { email: 'sara@example.com', password: 'User1234' } },
                admin: { summary: 'מנהל (נתוני הדגמה במחשב המקומי)', value: { email: 'admin@example.com', password: 'Admin1234' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'התחברת בהצלחה', content: json(ref('AuthResponse')) },
          400: resp('ValidationError'),
          401: {
            description: 'אימייל או סיסמה שגויים',
            content: json(ref('Error'), errorExample('INVALID_CREDENTIALS', 'אימייל או סיסמה שגויים')),
          },
          429: resp('TooManyRequests'),
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'פרטי המשתמש המחובר',
        description: 'דורש Token. מתאים לבדיקה בטעינת האתר אם ה-Token השמור עדיין תקף.',
        security: bearer,
        responses: {
          200: {
            description: 'פרטי המשתמש',
            content: json(
              { type: 'object', properties: { user: ref('User') } },
              { user: exampleUser },
            ),
          },
          401: resp('Unauthorized'),
        },
      },
    },
    // ------------------------------------------------------------ Categories
    '/api/categories': {
      get: {
        tags: ['Categories'],
        summary: 'רשימת כל הקטגוריות',
        description: 'דורש Token (כל משתמש מחובר). ממוין לפי שם.',
        security: bearer,
        responses: {
          200: { description: 'רשימת קטגוריות', content: json({ type: 'array', items: ref('Category') }) },
          401: resp('Unauthorized'),
        },
      },
      post: {
        tags: ['Categories'],
        summary: 'הוספת קטגוריה (מנהל בלבד)',
        security: bearer,
        requestBody: { required: true, content: json(ref('CategoryInput')) },
        responses: {
          201: { description: 'הקטגוריה נוצרה', content: json(ref('Category')) },
          400: resp('ValidationError'),
          401: resp('Unauthorized'),
          403: resp('Forbidden'),
          409: {
            description: 'כבר קיימת קטגוריה בשם הזה',
            content: json(ref('Error'), errorExample('CATEGORY_NAME_TAKEN', 'כבר קיימת קטגוריה בשם הזה')),
          },
        },
      },
    },
    '/api/categories/{id}': {
      put: {
        tags: ['Categories'],
        summary: 'שינוי שם קטגוריה (מנהל בלבד)',
        security: bearer,
        parameters: [idParam('id', 'מזהה הקטגוריה')],
        requestBody: { required: true, content: json(ref('CategoryInput')) },
        responses: {
          200: { description: 'הקטגוריה עודכנה', content: json(ref('Category')) },
          400: resp('ValidationError'),
          401: resp('Unauthorized'),
          403: resp('Forbidden'),
          404: resp('NotFound'),
          409: {
            description: 'כבר קיימת קטגוריה בשם הזה',
            content: json(ref('Error'), errorExample('CATEGORY_NAME_TAKEN', 'כבר קיימת קטגוריה בשם הזה')),
          },
        },
      },
      delete: {
        tags: ['Categories'],
        summary: 'מחיקת קטגוריה (מנהל בלבד, רק קטגוריה ריקה)',
        security: bearer,
        parameters: [idParam('id', 'מזהה הקטגוריה')],
        responses: {
          204: { description: 'הקטגוריה נמחקה (אין גוף תשובה)' },
          400: resp('ValidationError'),
          401: resp('Unauthorized'),
          403: resp('Forbidden'),
          404: resp('NotFound'),
          409: {
            description: 'יש מתכונים בקטגוריה',
            content: json(ref('Error'), errorExample('CATEGORY_IN_USE', 'לא ניתן למחוק קטגוריה שיש בה מתכונים')),
          },
        },
      },
    },
    // ------------------------------------------------------------ Recipes
    '/api/recipes': {
      get: {
        tags: ['Recipes'],
        summary: 'רשימת מתכונים ציבוריים – חיפוש, סינון, מיון ועמודים',
        description: 'דורש Token. מחזיר רק מתכונים ציבוריים (של כל המשתמשים). אפשר לשלב כמה סינונים יחד.',
        security: bearer,
        parameters: recipeQueryParams,
        responses: {
          200: { description: 'עמוד של מתכונים', content: json(ref('RecipeList')) },
          400: resp('ValidationError'),
          401: resp('Unauthorized'),
        },
      },
      post: {
        tags: ['Recipes'],
        summary: 'יצירת מתכון חדש',
        description:
          'דורש Token. היוצר נקבע לפי ה-Token (שדה authorId שנשלח מהלקוח מתעלמים ממנו). להוספת תמונה: לשלוח אחרי היצירה ל-POST /api/recipes/{id}/image.',
        security: bearer,
        requestBody: { required: true, content: json(ref('RecipeInput')) },
        responses: {
          201: { description: 'המתכון נוצר', content: json(ref('Recipe')) },
          400: resp('ValidationError'),
          401: resp('Unauthorized'),
        },
      },
    },
    '/api/recipes/mine': {
      get: {
        tags: ['Recipes'],
        summary: 'המתכונים שלי (פרטיים וציבוריים)',
        description: 'דורש Token. כולל את כל אפשרויות החיפוש, ובנוסף סינון isPublic.',
        security: bearer,
        parameters: [
          ...recipeQueryParams,
          {
            name: 'isPublic',
            in: 'query',
            schema: { type: 'string', enum: ['true', 'false'] },
            description: 'true – רק ציבוריים, false – רק פרטיים',
          },
        ],
        responses: {
          200: { description: 'עמוד של מתכונים', content: json(ref('RecipeList')) },
          400: resp('ValidationError'),
          401: resp('Unauthorized'),
        },
      },
    },
    '/api/recipes/authors': {
      get: {
        tags: ['Recipes'],
        summary: 'רשימת מפרסמים – לתיבת הסינון לפי מפרסם',
        description: 'דורש Token. רק משתמשים שיש להם לפחות מתכון ציבורי אחד, ממוינים לפי שם. recipeCount = מספר המתכונים הציבוריים.',
        security: bearer,
        responses: {
          200: {
            description: 'מערך מפרסמים',
            content: json({
              type: 'array',
              items: {
                type: 'object',
                properties: { id: { type: 'integer' }, name: { type: 'string' }, recipeCount: { type: 'integer' } },
              },
              example: [{ id: 2, name: 'שרה לוי', recipeCount: 5 }],
            }),
          },
          401: resp('Unauthorized'),
        },
      },
    },
    '/api/recipes/{id}': {
      get: {
        tags: ['Recipes'],
        summary: 'צפייה במתכון',
        description: 'דורש Token. מתכון ציבורי – לכולם. מתכון פרטי – רק ליוצר (לאחרים, גם למנהל, מוחזר 404).',
        security: bearer,
        parameters: [idParam('id', 'מזהה המתכון')],
        responses: {
          200: { description: 'המתכון', content: json(ref('Recipe')) },
          400: resp('ValidationError'),
          401: resp('Unauthorized'),
          404: resp('NotFound'),
        },
      },
      put: {
        tags: ['Recipes'],
        summary: 'עדכון מתכון (יוצר המתכון, או מנהל במתכון ציבורי)',
        description: 'דורש Token. שולחים את כל השדות, כולל isPublic.',
        security: bearer,
        parameters: [idParam('id', 'מזהה המתכון')],
        requestBody: { required: true, content: json(ref('RecipeInput')) },
        responses: {
          200: { description: 'המתכון עודכן', content: json(ref('Recipe')) },
          400: resp('ValidationError'),
          401: resp('Unauthorized'),
          403: resp('Forbidden'),
          404: resp('NotFound'),
        },
      },
      delete: {
        tags: ['Recipes'],
        summary: 'מחיקת מתכון',
        description: 'דורש Token. מותר ליוצר המתכון, או למנהל – רק אם המתכון ציבורי. התמונה נמחקת גם מהענן.',
        security: bearer,
        parameters: [idParam('id', 'מזהה המתכון')],
        responses: {
          204: { description: 'המתכון נמחק (אין גוף תשובה)' },
          400: resp('ValidationError'),
          401: resp('Unauthorized'),
          403: resp('Forbidden'),
          404: resp('NotFound'),
        },
      },
    },
    '/api/recipes/{id}/image': {
      post: {
        tags: ['Recipes'],
        summary: 'העלאה או החלפה של תמונת מתכון (יוצר המתכון, או מנהל במתכון ציבורי)',
        description:
          'דורש Token. multipart/form-data עם שדה בשם image. JPG / PNG / WEBP עד 5MB. התמונה הקודמת (אם הייתה) נמחקת מהענן.',
        security: bearer,
        parameters: [idParam('id', 'מזהה המתכון')],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['image'],
                properties: { image: { type: 'string', format: 'binary', description: 'קובץ התמונה' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'התמונה הועלתה – מוחזר המתכון המעודכן', content: json(ref('Recipe')) },
          400: resp('ValidationError'),
          401: resp('Unauthorized'),
          403: resp('Forbidden'),
          404: resp('NotFound'),
          413: {
            description: 'הקובץ גדול מ-5MB',
            content: json(ref('Error'), errorExample('FILE_TOO_LARGE', 'הקובץ גדול מדי. הגודל המקסימלי הוא 5MB')),
          },
          415: {
            description: 'סוג קובץ לא נתמך',
            content: json(ref('Error'), errorExample('UNSUPPORTED_FILE_TYPE', 'סוג הקובץ אינו נתמך. מותר: JPG, PNG, WEBP')),
          },
          503: {
            description: 'Cloudinary לא הוגדר בשרת',
            content: json(
              ref('Error'),
              errorExample('IMAGE_STORAGE_NOT_CONFIGURED', 'העלאת תמונות אינה זמינה: Cloudinary לא הוגדר בשרת'),
            ),
          },
        },
      },
      delete: {
        tags: ['Recipes'],
        summary: 'הסרת תמונת מתכון (יוצר המתכון, או מנהל במתכון ציבורי)',
        security: bearer,
        parameters: [idParam('id', 'מזהה המתכון')],
        responses: {
          200: { description: 'התמונה הוסרה – מוחזר המתכון המעודכן', content: json(ref('Recipe')) },
          400: resp('ValidationError'),
          401: resp('Unauthorized'),
          403: resp('Forbidden'),
          404: resp('NotFound'),
        },
      },
    },
    // ------------------------------------------------------------ Favorites
    '/api/favorites': {
      get: {
        tags: ['Favorites'],
        summary: 'המועדפים שלי',
        description: 'דורש Token. מציג רק מתכונים שעדיין גלויים למשתמש. ממוין מהאחרון שנוסף.',
        security: bearer,
        parameters: pageParams,
        responses: {
          200: { description: 'עמוד של מועדפים', content: json(ref('FavoriteList')) },
          400: resp('ValidationError'),
          401: resp('Unauthorized'),
        },
      },
    },
    '/api/favorites/{recipeId}': {
      post: {
        tags: ['Favorites'],
        summary: 'הוספת מתכון למועדפים',
        description: 'דורש Token. אם המתכון כבר במועדפים – מוחזר 200 ולא נוצרת כפילות.',
        security: bearer,
        parameters: [idParam('recipeId', 'מזהה המתכון')],
        responses: {
          201: { description: 'נוסף למועדפים', content: json(ref('FavoriteResult')) },
          200: { description: 'כבר היה במועדפים', content: json(ref('FavoriteResult')) },
          400: resp('ValidationError'),
          401: resp('Unauthorized'),
          404: resp('NotFound'),
        },
      },
      delete: {
        tags: ['Favorites'],
        summary: 'הסרת מתכון מהמועדפים',
        description: 'דורש Token. מוחק רק מהמועדפים של המשתמש המחובר. מחזיר 204 גם אם לא היה במועדפים.',
        security: bearer,
        parameters: [idParam('recipeId', 'מזהה המתכון')],
        responses: {
          204: { description: 'הוסר מהמועדפים (אין גוף תשובה)' },
          400: resp('ValidationError'),
          401: resp('Unauthorized'),
        },
      },
    },
  },
};
