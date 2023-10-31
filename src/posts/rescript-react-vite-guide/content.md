# The Complete Guide to Setting up React with ReScript and Vite

If you're intrigued by the idea of exploring another strongly typed, functional language, you should definitely give ReScript a try. This guide is designed to assist you in setting up a fundamental React application using ReScript and Vite, offering you a fantastic opportunity to delve into this exciting combination of technologies. With ReScript's type safety and the speed of Vite, you'll be well on your way to building robust and highly performant web applications that are a joy to work with. So, let's embark on this journey of enhancing your web development skills by seamlessly integrating React, ReScript, and Vite into your workflow.

## Prerequisites

Before diving into the setup process, make sure you have Node.js and npm installed on your system. You'll also need a code editor, and for the purposes of this guide, we'll assume you're using Visual Studio Code.

## Step 1: Initialize a Vite Project
To get started, open your terminal and run the following command:

```bash
npm init vite retest
```

This command initializes a Vite project named "retest" template, which provides a basic structure for your project.

If you are using git, - update `.gitignore` with next two lines: 

```
*.bs.js
lib
```

## Step 2: Clean Up the Project
Upon project initialization, you may find some unnecessary files and folders created. To clean up your project, follow these steps:

* Navigate to the "retest" folder: `cd retest`
* Create a new "src" folder: `mkdir src`
* Delete the following files and folders:
* * counter.js
* * main.js
* * public
* * javascript.svg
* Move the style.css file to the "src" folder.

Your project structure should now be much cleaner and easier to use.

## Step 3: Install Dependencies
Next, install the required dependencies for React, ReScript, and Vite. Run the following commands:

```bash
npm install @rescript/react rescript -D
npm install react react-dom
```

Additionally, it's a good idea to install the [ReScript VSCode extension](https://marketplace.visualstudio.com/items?itemName=chenglou92.rescript-vscode) to enhance your development experience.

## Step 4: Update package.json
Open your `package.json` file and update the scripts section to include the following commands:

```json
"scripts": {
  "build:res": "rescript",
  "dev:res": "rescript build -w",
  "dev": "vite"
}
```

These scripts will help you build and run your ReScript and Vite development server.

## Step 5: Configure ReScript
To configure ReScript, create a bsconfig.json file in the project root and populate it with the following content:

```json
{
  "name": "your-project-name",
  "sources": [
    {
      "dir": "src",
      "subdirs": true
    }
  ],
  "package-specs": [
    {
      "module": "es6",
      "in-source": true
    }
  ],
  "suffix": ".bs.js",
  "jsx": { "version": 4, "mode": "automatic" },
  "bs-dependencies": ["@rescript/react"]
}
```

Make sure to replace "your-project-name" with your desired project name.

## Step 6: Create an index.res File
In the `src` folder, create a new file named index.res and add the following ReScript code:

```reason
switch (ReactDOM.querySelector("#app")) {
| Some(rootElement) => {
    let root = ReactDOM.Client.createRoot(rootElement)
    ReactDOM.Client.Root.render(root, <h1> {React.string("Hello world")} </h1>)
  }
| None => Js.Console.log("No root element found")
}
```

This code sets up your React app to render within the "app" element in your HTML file. If the element with id `app` will not be found, you will see an error in console. This is the first time we see a ReScript here. I am using the pattern matching to conditionally render the app if `#app` exists and what is very cool - ReScript helps me to handle unhappy cases. 

## Step 7: Connect ReScript to index.html
In the `index.html` file located in the project root, change the `<script>` tag's src attribute from `/main.js` to `./src/index.bs.js.`

This change ensures that your ReScript code will be included in your project correctly.

## Step 8: Start ReScript and Vite
To start your development environment, open two separate terminal windows and run the following commands:

```bash
npm run dev:res
npm run dev
```

This starts the ReScript compiler in watch mode and the Vite development server in parallel. Your project should now be live at http://127.0.0.1:5173/.

Open it and check the result.

## Step 9: Add Global Styles
You can import global styles into your ReScript code by adding the following line at the beginning of your index.res file:

```reason
%%raw("import './style.css'")
```

This allows you to include your global CSS styles in your project - such as `reset.css` or other styles you want to be applied globally.

## Step 10: Add a New React Component

To add a new React component, create a new file in the "src" folder named App.res. In this file, include the following code:

```reason
@react.component
let make = (~title) => <h1> {React.string(title)} </h1>
```
This code defines a basic React component named "App" with a prop for the title. Very important to follow the convention - name of the variable should be `make`. 

## Step 11: Update index.res with the New Component
In your `index.res` file, update the rendering code to include the new "App" component:

```reason
ReactDOM.Client.Root.render(root, <App title="Hello world!" />);
```

In the similar way you can add other components to build your app. Just remember to name the variable `make` and use single file per component.

## Step 12: Use CSS Modules for Component Styling
To apply styles to your `App` component using CSS modules, follow these steps:

* Create a new file in the "src" folder named `app.module.css`.
* Add the following CSS code to app.module.css:

```css
.header {
  color: #4AF626;
}
```

In your `App.res` component, import the styles using the following code:

```reason
@module external styles: {..} = "./app.module.css";
```

Apply the "header" class to the <h1> element in your "App" component using square brackets:
reason

```jsx
<h1 className={styles["header"]}> {React.string(title)} </h1>
```

With these steps, you can style your React components using CSS modules.

## Conclusion
Congratulations! You've successfully set up a development environment with React, ReScript, and Vite. This powerful combination allows you to create efficient and maintainable web applications with ease. With the basics in place, you can now start building your application and exploring the full capabilities of these technologies. Enjoy your web development journey!

You can find the code example in the [GitHub demo repository](https://github.com/Drag13/rescript-react-vite-example)