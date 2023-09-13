# How to create and configure Next.JS v.13 application with Prettier, Eslint, Husky and Jest

This short instruction will guide you through creating a Next.js app, complete with Prettier, ESLint, Husky, and Jest configurations, and deployment on Azure. Learn how to set up a new project, configure Prettier and ESLint, use Husky for pre-commit hooks, write tests with Jest, and deploy your app to Azure for an optimized production environment.

## Table of Content

- Create new Next.JS application
- Setup Prettier
- Configure Eslint
- Setup Husky with LintStaged
- Setup tests with Jest
- Deployment notes
- Extra options

## Before you start

- Use the console for a better debugging experience, especially for the commit and push phases with Husky.
- You may require extra steps depending on your needs and tools.

## Create a new NextJS project

- Create an **EMPTY** remote repository (GitHub, GitLab, etc)

* Create s new project locally:

```bash
npx create-next-app@latest dev-blog
```

- Connect local repo with the remote and push the master branch:

```bash
git remote add origin https://github.com/Drag13/NextJS-express-course-app-mirror.git
git branch -M master
git push -u origin master
```

- Fix dev dependencies, moving them to the dev section:

```bash
npm i @types/node @types/react @types/react-dom eslint eslint-config-next typescript -D
```

- Commit the code and push the results to the remote with `git push`

## Setup Prettier

- Add prettier

```bash
 npm i prettier eslint-config-prettier eslint-plugin-prettier -D
```

- Configure prettier, add `prettierrc.json` to the root

```json
{
  "trailingComma": "es5",
  "tabWidth": 2,
  "semi": true,
  "singleQuote": true
}
```

- Include prettier to `.eslintrc.json`

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

- Commit the code and push the results to the remote with `git push`

## Configure EsLint

- Install parser and plugin

```bash
npm i -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

- Configure EsLint to recommended

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

- Verify the eslint with `npx eslint .`
- Commit the code and push the results to the remote with `git push`

## Configure Husky and lint-staged

Install husky and lint-staged

```bash
npm i husky lint-staged -D
```

- Add `lintstagedrc.json` to the root and configure:

```json
{
  "**/*.ts?(x)": ["prettier --write", "eslint"],
  "**/*.(ts)?(x)": "npm run type-check",
  "./*.md": ["prettier --write"]
}
```

_Note - The first and second points are similar, but they run in parallel to speed up the process._

- Add new commands to the `package.json`

```json
{
  "lint-staged": "lint-staged",
  "type-check": "tsc --project tsconfig.json --pretty --noEmit && echo "
}
```

- Setup the pre-commit hook with lint-staged

```bash
npx husky add .husky/pre-commit "npm run lint-staged"
```

- Change Prettier errors to warnings (from now on, they will be fixed automatically)

.eslintrc.json:

```json
 "prettier/prettier": [
      "warn",
      {
        "endOfLine": "auto"
      }
    ]
```

- Commit the code and push the results to the remote with `git push`

## Configure Jest

- Install Jest and other dependencies for testing

```bash
npm i -D @types/jest jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom
```

- Create `jest.config.mjs` file in the root:`

```js
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

/** @type {import('jest').Config} */
const config = {
  collectCoverageFrom: [
    "app/**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
};

export default createJestConfig(config);
```

- Create `jest.setup.js` file in the root and configure:

```js
import "@testing-library/jest-dom";
```

- Update `tsconfig` file with

```json
 "include": [ "jest.setup.js"]
```

- Update `package.json` with new test scripts

```json
{
  "test": "jest --coverage",
  "test:w": "jest --watch"
}
```

- Write a simple test and verify that test works fine
- Optionally setup husky to support testing on push:

```bash
npx husky add .husky/pre-push "npm test"
```

- Push the changes and observe the results
- Commit the code and push the results to the remote with `git push`

## Deploy

Azure deployment helpers.

- Update `next.config.js`:

```js
const nextConfig = {
  output: "standalone",
};
```

- Update the pipeline with a copy step (standalone mode does not include copying all the important files for an unknown reason).

```yaml
 - name: copy files
        run: |
          cp -R .next/static .next/standalone/.next/static
          cp -R ./public .next/standalone/public
```

- Update pipeline with propper path to the build:

```yaml
 - name: Upload artifact for deployment job
        uses: actions/upload-artifact@v2
        with:
          name: node-app
          path: .next/standalone
```

- Update `package.json` with command to start the server

```json
{
  "start:azure": "node server"
}
```

- Update Azure to use `npm run start:azure` command to start the app on Prod

## Extra options

- Build on push - `npm run build`
- Calculate [bundlesize](https://www.npmjs.com/package/bundlesize)
- Install [webpackbundle analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer)
- Setup E2E tests - [instruction](https://nextjs.org/docs/pages/building-your-application/optimizing/testing)

[Ukrainian version](../create-new-nextjs-app-with-prettier-eslint-tests-ua/index.pug)
