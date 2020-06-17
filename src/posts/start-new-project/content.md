# How to start new JS project from scratch with automated formatting, linting, testing and documentation

Keeping your code consistent and well formatted not an easy task even when you work alone. But when you work with a team or with open source project all start getting even harder. Everyone has own code style, someone doesn't run tests, and no one writes documentation. This article will help you to set up all these things and even more - automate this routine to never do it manually.

After reading you will get your own npm-ready project with next features:

* Text formatting and code style
* Automated tests with code coverage and threshold
* Unified commit style
* Documentation generated from the code and commits
* Automated publish process

Let's go!

## Prerequisites

Create a new folder, initialize new repository and project and go to the next step.

```cmd
git init
npm init
npm i -D typescript
./node_modules/.bin/tsc --init
```

## Code Formatting

Let's start with code formatting - indention types, size and so on. First tool is [.editorconfig](https://editorconfig.org/) file. It is recognized with most of IDE and helps to keep your autoformatting consistent across different IDEs and users.

Create .editorconfig in the root of the project with next content (feel free to change it for your desired style)

```yml
#root = true

[*]
indent_style = space
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
max_line_length = 100
indent_size = 4

[*.md]
trim_trailing_whitespace = false
```

But sometimes autoformatting can be not used. To ensure that all is well formatted [prettier](https://github.com/prettier/prettier) appears. If you forget to format the code, prettier will do it for you.

```cmd
npm i -D prettier
```

Add this command to the scripts section your package.json file

```json
"prettier": "prettier --config .prettierrc.json --write src/**/*.ts"
```

And add .prettierrc.json file with your settings to the root of the project

```json
{
    "tabWidth": 4,
    "useTabs": false,
    "semi": true,
    "singleQuote": true,
    "trailingComma": "es5",
    "arrowParens": "always"
}
```

Now you can write some code and try run "npm run prettier". Prettier will check src folder and autoformat your code without any help!

## Code Style

Code style - like avoiding using == instead of === or shadowing variables also needs to be check. For this purpose, we will take [tslint](https://palantir.github.io/tslint/). If you prefer javascript - take [eslint](https://eslint.org/) instead.

```cmd
npm i -D tslint
./node_modules/.bin/tslint --init
```

The last command will create tslint.json for you. It already extends tslint:recommended set of rules, but you can extend or override them whatever you want. Don't forget to add lint command to your package.json.

package.json

```json
"lint": "tslint -c tslint.json 'src/**/*.ts' 'tests/**/*.spec.ts'"
```

As you see it setup to work with src and tests folder, so all your code should be placed there.

## Testing

Now it is time to set up our tests. Install karma and other related dependencies

```cmd
npm i -D karma karma-jasmine jasmine karma-typescript karma-chrome-launcher @types/jasmine
./node_modules/.bin/karma init
```

And add new configuration block to newly created karma.conf.js

```js
karmaTypescriptConfig : {
    include: ["./src/**/*.ts", "./tests/**/*.spec.ts"],
    tsconfig: "./tsconfig.json",

    reports: {
        "html": "coverage",
        "lcovonly": {
            directory: './coverage',
            filename: '../lcov.dat'
        }
    },
    coverageOptions: {
        threshold: {
            global: {
                statements: 60,
                branches: 60,
                functions: 60,
                lines: 60
            },
            file: {
                statements: 60,
                branches: 60,
                functions: 60,
                lines: 60,
            }
        }
    },
}
```

This will setup code-coverage file and threshold level. Both are important. First one helps you to deal with your coverage and the second one keeps your coverage on a certain level.

Update package.json

```json
"test": "karma start"
```

And try to run it. Don't forget to write some code inside src folder and tests inside the tests folder.

Btw, if you plan to use continuous integration (like Travis, Jenkins or so on) it is better to change Chrome runner to HeadlessChrome with [puppeteer](https://github.com/GoogleChrome/puppeteer). For more information about HeadlessChrome and CI - check my demo [repository](https://github.com/Drag13/IsNumberStrict) on GitHub.

## Commit Style

Usually, all write commits in some "random" format. So, to keep commits good enough, [commitizen](https://github.com/commitizen/cz-cli) was invented. This tool prompt a few questions and generate commit for you. Another good point that we can generate changelog file from commits written with help of commitizen.

Install commitizen and conventional-changelog adapter

```cmd
npm i -D commitizen
npm i -D cz-conventional-changelog
```

Update scripts

```json
"commit":"git-cz"
```

Add new configuration section inside package.json for commitizen.

```json
"config": {
        "commitizen": {
            "path": "./node_modules/cz-conventional-changelog"
        }
    }
```

## Documentation

If your project is bigger than a few functions it as a good idea to have some documentation. And it is even better when you don't need to write something manually. For that purposes [typedoc](https://www.npmjs.com/package/typedoc) exists. It takes your .ts files, your jsdoc comments and creates nice and shiny documentation. If you are using javascript - you can try [esdoc](https://esdoc.org/) instead.

```cmd
npm i -D typedoc
```

package.json

```json
"doc": "typedoc --out docs/src"
```

Another good idea is to make your changelog file autogenerated too. As I mentioned before, commitizen supports conventional-changelog. So, we can take commits and convert them to the changelog file.

Install [conventional-changelog-cli](https://www.npmjs.com/package/conventional-changelog-cli)

```cmd
npm i -D conventional-changelog-cli
```

And update package.json with the new command

```json
"changelog": "conventional-changelog -p angular -i CHANGELOG.md -s"
```

Don't worry, angular means only style formatting and nothing more.

## Build

The build is quite simple and it is just a matter to add build and clean commands to the package.json

```json
"clean":"rmdir dist /S /Q",
"build": "tsc --p ./ --sourceMap false",
```

If you need bundling or minification - try [uglifyjs](https://www.npmjs.com/package/uglify-js).

## Automation

Ok, the most part already done. We created a bunch of different scripts to keep our code clean and correct. But running them each time manually is a quite boring task and can lead to mistakes. So, we need to automate them. As you know, when you make a commit few git events appear - pre-commit, post-commit and so on. We can use them to run our own scripts before the code will be committed or pushed. But there is a problem -  git hooks are not shareable. And that's why [husky](https://www.npmjs.com/package/husky) appears. This package wraps the git events and runs your scripts from package.json. If the script fails, commit will be canceled and you will get the message what's going wrong.

Install husky

```cmd
npm i -D husky
```

And describe some hooks inside package.json

```json
"precommit":"npm run prettier",
"prepush": "call npm run lint && call npm run test"
```

Now, when you try to make a commit prettier will run and fix all formatting issues. When you try to make a push - code style and tests will be done automatically. You can extend this commands whatever you need like sending notifications, extra check etc.

## Publish

Great, we are almost done. So, let's say we are ready to publish the package to npm. As you know, much work should be done before - tests, documentation update, version, and tags update. Easy to forget something, yeah? So, it is a good idea to automate this process too. For that purposes, we will use native npm hooks - preversion, version, and postversion. Add next lines to scripts section your package.json

```json
"preversion": "npm run test",
"version": "call npm run clean && call npm run build && call npm run doc && call npm run changelog && git add . && git commit -m 'changelogupdate' --no-verify",
"postversion": "git add . && git push && git push --tags"
```

When you will run npm version command, preversion script will run tests, version script will build your code and generate all documents. Then version will be increased and then all will be commited and pushed out. Now all you need is to run npm publish command and that's all. Just to commands and everything else will be done without any efforts from your side.

At last, we need to specify what folders should be included in the project and where entry point can be located. Update package.json last time

```json
"main": "./dist/index.min.js",
"types": "./dist/index.d.ts",
"files": [
        "dist/",
        "src/",
        "tests/"
    ]
```

That's all, your awesome project is ready to go! Thanks for reading. If you have questions, please check my demo project [here](https://github.com/Drag13/IsNumberStrict).

## Useful links

* [.editorconfig](https://editorconfig.org/)
* [prettier](https://github.com/prettier/prettier)
* [tslint](https://palantir.github.io/tslint/)
* [eslint](https://eslint.org/)
* [typedoc](https://www.npmjs.com/package/typedoc)
* [esdoc](https://esdoc.org/)
* [commitizen](https://github.com/commitizen/cz-cli)
* [conventional-changelog-cli](https://www.npmjs.com/package/conventional-changelog-cli)
* [husky](https://www.npmjs.com/package/husky)
* [demo](https://github.com/Drag13/IsNumberStrict)
