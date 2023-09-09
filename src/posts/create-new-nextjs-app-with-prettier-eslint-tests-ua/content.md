# Як створити та налаштувати додаток Next.JS v.13 з Prettier, Eslint, Husky та Jest

Ця коротка інструкція допоможе вам створити додаток Next.js з конфігураціями Prettier, ESLint, Husky та Jest, а також розгорнути його на Azure. Дізнайтеся, як налаштувати новий проект, налаштувати Prettier та ESLint, використовувати Husky для перевірки перед комітом, писати тести з Jest та розгортати ваш додаток на Azure для оптимізованого середовища виробництва.

## Зміст

- Створіть новий додаток Next.JS
- Налаштуйте Prettier
- Налаштуйте Eslint
- Налаштуйте Husky з lint-staged
- Налаштуйте тести з Jest
- Примітки щодо розгортання
- Додаткові опції

## Перед початком

- Використовуйте консоль для кращого досвіду налагодження, особливо для фаз коміту та надсилання з Husky.
- Вам можуть знадобитися додаткові кроки в залежності від ваших потреб та інструментів.

## Створення нового проекту NextJs

- Створіть ПУСТИЙ віддалений репозиторій (GitHub, GitLab тощо)
- Створіть новий проект локально:

```bash
npx create-next-app@latest dev-blog
```

- Підключіть локальний репозиторій до віддаленого та надішліть гілку master:

```bash
git remote add origin https://github.com/Drag13/NextJS-express-course-app-mirror.git
git branch -M master
git push -u origin master
```

- Виправте залежності розробника, перемістивши їх у розділ розробника:

```bash
npm i @types/node @types/react @types/react-dom eslint eslint-config-next typescript -D
```

- Закомітьте код та надішліть результати до віддаленого репозиторію за допомогою git push

## Налаштування Prettier

- Додайте prettier

```bash
 npm i prettier eslint-config-prettier eslint-plugin-prettier -D
```

- Налаштуйте prettier, додайте `prettierrc.json` в рутову папку

```json
{
  "trailingComma": "es5",
  "tabWidth": 2,
  "semi": true,
  "singleQuote": true
}
```

- Додайте prettier до `.eslintrc.json`

```json
{
  "extends": ["next/core-web-vitals", "prettier"],
  "plugins": ["prettier"],
  "rules": {
    "prettier/prettier": [
      "error",
      {
        "endOfLine": "auto"
      }
    ]
  }
}
```

- Закомітьте код та надішліть результати до віддаленого репозиторію за допомогою `git push`

## Налаштування EsLint

- Встановіть парсер та плагін

```bash
npm i -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

- Налаштуйте EsLint на рекомендовані

```json
{
  "extends": [
    "next/core-web-vitals",
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "plugins": ["prettier", "@typescript-eslint"],
  "parser": "@typescript-eslint/parser",
  "rules": {
    "prettier/prettier": [
      "error",
      {
        "endOfLine": "auto"
      }
    ]
  },
  "root": true
}
```

- Перевірте eslint за допомогою npx `eslint .`
- Закомітьте код та надішліть результати до віддаленого репозиторію за допомогою `git push`

## Налаштування Husky та lint-staged

- Встановіть husky та lint-staged

```bash
npm i husky lint-staged -D
```

- Додайте `lintstagedrc.json` до кореня та налаштуйте:

```json
{
  "**/*.ts?(x)": ["prettier --write", "eslint"],
  "**/*.(ts)?(x)": "npm run type-check",
  "./*.md": ["prettier --write"]
}
```

_Примітка - перший та другий пункти мають однакові правила вибору розширення умисно, для прискорення процесу._

- Додайте нові команди до package.json

```json
{
  "lint-staged": "lint-staged",
  "type-check": "tsc --project tsconfig.json --pretty --noEmit && echo "
}
```

- Налаштуйте перевірку перед комітом з lint-staged

```bash
npx husky add .husky/pre-commit "npm run lint-staged"
```

- Змініть помилки Prettier на попередження (відтепер вони будуть виправлятися автоматично)

.eslintrc.json:

```json
 "prettier/prettier": [
      "warn",
      {
        "endOfLine": "auto"
      }
    ]
```

- Закомітьте код та надішліть результати до віддаленого репозиторію за допомогою git push

## Налаштування Jest

- Встановіть Jest та інші залежності для тестування

```bash
npm i -D @types/jest jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom
```

- Створіть файл `jest.config.mjs` у кореневій теці:

```js
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

/** @type {import('jest').Config} */
const config = {
  collectCoverageFrom: [
    "**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
};

export default createJestConfig(config);
```

- Створіть файл `jest.setup.js` у корені та налаштуйте:

```js
import "@testing-library/jest-dom";
```

- Оновіть файл `tsconfig`:

```json
 "include": [ "jest.setup.js"]
```

- Оновіть `package.json` з новими скриптами тестування

```json
{
  "test": "jest",
  "test:w": "jest --watch"
}
```

- Напишіть простий тест та перевірте, що тест працює правильно
- Додатково налаштуйте husky для підтримки тестування при надсиланні:

```bash
npx husky add .husky/pre-push "npm test"
```

- Надішліть зміни та спостерігайте за результатами
- Закомітьте код та надішліть результати до віддаленого репозиторію за допомогою `git push`:

## Розгортання

Допоміжні засоби розгортання Azure

- Оновіть `next.config.js`:

```js
const nextConfig = {
  output: "standalone",
};
```

- Оновіть конвеєр з кроком копіювання (режим автономної роботи не передбачає копіювання всіх важливих файлів з невідомих причин).

```yaml
 - name: copy files
        run: |
          cp -R .next/static .next/standalone/.next/static
          cp -R ./public .next/standalone/public
```

- Оновіть package.json з командою для запуску сервера:

```yaml
 - name: Upload artifact for deployment job
        uses: actions/upload-artifact@v2
        with:
          name: node-app
          path: .next/standalone
```

- Оновіть `package.json` з командою для запуску сервера

```json
{
  "start:azure": "node server"
}
```

- Оновіть Azure, щоб використовувати команду npm run start:azure для запуску додатку на Prod

## Додаткові опції

- Контрольна збірка перед надсиланням
- Контроль розміру бандлу з [bundlesize](https://www.npmjs.com/package/bundlesize)
- Вебпак Bundle Analyzer [webpackbundle analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer)
- E2E тести - [інструкція](https://nextjs.org/docs/pages/building-your-application/optimizing/testing)
