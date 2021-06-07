# How to get performance metrics and web vitals using Puppeteer, React and TypeScript, Part 1

![How to get performance metrics and web vitals using Puppeteer, React and TypeScript, part 1](~/img/kdpv/react-performance-puppeteer-profile-kdpv.jpg)

In this article, I will demonstrate how to build the script to automate gathering performance metrics like First Contentful Paint and Core Web Vitals from the React-based application using Puppeteer and TypeScript. I will also describe how to create and extract your own performance events using the React Profiler component. This might be useful if you decide to do some performance research or implement advanced performance testing into your CI/CD pipeline.

## The Plan

Because of the large amount of material and code, I will split the content into two parts. The first one (this one) will be about gathering performance metrics and the second one will be about various test conditions like CPU and network. Here are the main points I will cover:

Part #1:

- Create a new React.JS project and install required dependencies for performance measuring
- Extract ScriptDuration, LayoutDuration, JSHeapUsedSize, and other metrics provided by Puppeteer API
- Extract First Contentful Paint and Time to First Byte from performance events
- Extract Largest Contentful Paint using the PerformanceObserver API
- Use web-vitals library to get Core Web Vitals metrics
- Emit and extract custom performance event using performance API and React Profiler component

Part #2:

- Change network and CPU conditions
- Cached and No-Cache strategy
- Emulating different devices
- Final wrap up

## Initial setup with React.JS and Puppeteer

First, we need to prepare the workspace. You can use an already existed application (better to take something React-based if you want to use Profiler component, however, all code will work for Angular, Vue, or vanilla JS application) or create something from scratch. Also, you will need to install some extra dependencies to be able to profile the application. You can also clone the [demo repository](https://github.com/Drag13/react-performance-puppeteer-profile) and use it directly.

Install the application, [puppeteer](https://www.npmjs.com/package/puppeteer) for running tests, [serve](https://www.npmjs.com/package/serve) to host the application, [start-server-and-test](https://www.npmjs.com/package/start-server-and-test) to automate launching the application, [TypeScript](https://www.typescriptlang.org/) and [ts-node](https://www.npmjs.com/package/ts-node) to run the written script. If you already using TypeScript in your project - install only the ts-node.

```cmd
npx create-react-app perf
cd perf
npm i puppeteer serve ts-node typescript start-server-and-test -O
```

Note, that I am using the `-O` flag to install performance-related dependencies as optional. This gives me the possibility to skip them using `npm ci --no-optional` command for the scenarios where they are not needed and saves me some build time.

Now create the new folder named e2e and put an empty index.ts file. Update the `package.json` with next scripts:

```json
"scripts":{
    "serve": "serve ./build",
    "ts-node": "ts-node",
    "tsc": "tsc",
    "e2e:run": "ts-node --project e2e/tsconfig.json --files e2e/index.ts" ,
    "e2e": "start-server-and-test serve http://localhost:5000 e2e:run"
}
```

Initialize new tsconfig file with `npm run tsc -- --init`, **put it into the e2e folder** and build the application using `npm run build`. Now launch the application using `npm e2e` command. At this point, your application will start and empty index.ts executed without any result. Time to fill it with some code!

## How to get default performance metrics from the Puppeteer

Getting some of the performance metrics like script duration, heap size, and couple of others is really simple because of the API that already provided by the Puppeteer. The algorithm is simple - using Puppeteer we are launching Chrome, then navigating to the page we want to profile, wait for the load, and finally, dump required metrics. From the code perspective it will look like this:

```typescript
import { launch } from "puppeteer";

// url to inspect
const pageUrl = "http://localhost:5000";

(async function (url) {
  let browser;
  try {
    // launch the Chrome browser without Sandbox (might help if puppeteer not working)
    browser = await launch({ product: "chrome", args: ["--no-sandbox"] });

    // launch the page
    const page = await browser.newPage();

    // navigate to the url and wait untill all network activity stops
    await page.goto(url, { waitUntil: "networkidle0" });

    // dump page metrics
    const metrics = await page.metrics();

    console.log(metrics);
  } catch (error) {
    console.error(error);
  } finally {
    // close the browser correctly even if something went wrong
    browser != null && (await browser.close());
  }
})(pageUrl);
```

The output will look like this:

```js
{
  Timestamp: 20956.347834,
  Documents: 5,
  Frames: 2,
  JSEventListeners: 136,
  Nodes: 51,
  LayoutCount: 3,
  RecalcStyleCount: 5,
  LayoutDuration: 0.021509,
  RecalcStyleDuration: 0.000924,
  ScriptDuration: 0.01118,
  TaskDuration: 0.054886,
  JSHeapUsedSize: 2377752,
  JSHeapTotalSize: 3198976
}
```

There are 13 different metrics but the most interesting are:

- ScriptDuration - the amount of time in milliseconds how much time the browser spent on javascript **parsing** and **executing**. If numbers here really big this means that you have either the big amount of JavaScript on the page or it runs too much, and you should consider code splitting. For the mobiles from low segments, a huge\* amount of JavaScript may be a pure disaster because parsing JavaScript is not something simple. Even if you have very fast internet, JavaScript still may block content from rendering or increase time to interact.
- LayoutDuration - the amount of time in milliseconds how much time the browser spent on construction layout. If it starts rapidly growing, this signalizes that your markup is overcomplicated or big.
- JSHeapUsedSize - the amount of memory in bytes the application is using. Again, this is important for the cheap mobiles that have a little amount of memory. If you are targeting this audience this metric is crucial for you.

Other metrics are also useful (notice RecalcStyleCount), but let's skip them at this tutorial.

\*Regarding the [latest researches](https://infrequently.org/2021/03/the-performance-inequality-gap/) done in the 2021 year current budget for mobile devices is about **100KiB of HTML/CSS/fonts and ~300-350KiB of JS**. This is bigger than we have previously but still not much, thus if you see 1MB of gzipped JavaScript it's time for some questions 🤔

However, already gathered data not even close to the list we want to have. The most popular metrics like First Contentful Paint, Largest Contentful Paint, and Time to Interactive missing. We need to go deeper.

## How to get First Contentful Paint

The First Contentful Paint event is part of the Web Vitals performance events and indicates when a user starts seeing any part of the content (text, image, canvas, etc.). Recommended value is 1.8 seconds. To get this metric we will use the browser's `performance` API:

```typescript
// Get performance entries
const rawPerfEntries = await page.evaluate(function () {
  return JSON.stringify(window.performance.getEntries());
});

// Parsing string
const allPerformanceEntries = JSON.parse(rawPerfEntries);

// Find FirstContentfulPaing
const fcp = allPerformanceEntries.find((x) => x.name === "first-contentful-paint");
console.log(fcp);
```

The variable `allPerformanceEntries` will contain the array with most (but not all) performance events that happened on the page. If you explore this array, you will see:

- Navigation event (get it using `.find(x=>x.entryType ==='navigation')`). This event contains such important timings like `domComplete`, `domContentLoadedEventEnd`, `domainLookupStart`, `domainLookupEnd` and others. It also contains server timings if your server supports them. For this example, I will use this entry to get one of the webvitals metrics - Time to First Byte.
- All timings related to each, and every resource fetched by the page. This mean you can find information about how much time it took to download your bundle or styles or calculate the size of the resources - might be useful if you want to track resources size.
- All custom performance events were logged by the application. This is extremely useful and important functionality, I will write about it a bit later.

Now let's write some code and extract the Time To First Byte event (to me it already starts sounds like a quest)

Create the new file `performance-entries.ts` with next code:

```typescript
/*Gets Time To First Byte metric*/
function getTTFB(entries: PerformanceEntry[]) {
  const navigationEvent = entries.find((x) => x.entryType === "navigation") as PerformanceNavigationTiming;
  return navigationEvent.responseStart ?? 0;
}
```

Now, let's talk about the core web vitals and new PerformanceObserver API that can give us even more data to analyze.

## Core Web Vitals and PerformanceObserver API

Might be you already heard about the [Core Web Vitals](https://web.dev/vitals/#core-web-vitals) - user centric performance metrics that reflect the real-world experience of a critical part of the user experience. In 2021 (the list is a subject to change I believe) they are:

- Largest Contentful Paint measures loading performance. To provide a good user experience, LCP should occur within 2.5 seconds of when the page first starts loading.
- First Input Delay: measures interactivity. To provide a good user experience, pages should have an FID of less than 100 milliseconds.
- Cumulative Layout Shift: measures visual stability. To provide a good user experience, pages should maintain a CLS of less than 0.1.

Right now, we didn't spot them yet and, unfortunately, the puppeteer has no API to get them simply. However we still are able to retrieve them either using [PerformanceObserver](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver) API or using [web-vitals](https://github.com/GoogleChrome/web-vitals) library that already comes with the new React applications. Today I will show both ways, but please be aware that measuring Core Web Vitals manually is more complex than at the example.

To get Largest Contenful Paint or other metrics from the Core Web Vitals we will use new PerformanceObserver API. It is used ot observe (receive and process) performance events that comes from the browser. The simplest example will be look like this:

```typescript
function installLCPObserver() {
  const lcpObserver = new PerformanceObserver((entryList) => {
    entryList.getEntries();
    const lastEntry = entries[entries.length - 1];
    console.log(lastEntry);
  });

  lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
}
```

However, to make it work in a real life we will have to make it more [complex](https://web.dev/lcp/#differences-between-the-metric-and-the-api)

Firstly, inside the e2e folder (this is important!) create new folder named `typings` and put there index.d.ts file with next content:

```typescript
declare interface Window {
  _pe: PerformanceEntry[];
}
```

This code will extend extend `window` with the new property and fix TypeScript errors. This technique described in my previous article - [TypeScript Tips and Tricks - Declarations With Examples](https://drag13.io/posts/typescript-tips-tricks-declarations/index.html). But for ts-node [this is not enough](https://github.com/TypeStrong/ts-node/issues/782), ts-node will not pickup the custom typings unless you specify the `--files` options like I did in package.json.

Then we need to install Performance Observer and store the performance results. Create new file named `lcp.ts` and put there:

```typescript
export function setupPerfromanceScripts() {
  // we will store the data here
  window._pe = [];

  // install LCP obeserver
  function installLCPObserver() {
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];

      // store the last found entry
      window._pe.push(lastEntry);
    });

    // start observing
    lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
    return lcpObserver;
  }

  const lcpObserver = installLCPObserver();

  // save data and disconnect in case page become hidden
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      lcpObserver.takeRecords();
      lcpObserver.disconnect();
    }
  });
}
```

The last point is to extract stored data:

```typescript
import { Page } from "puppeteer";

// extracts all web vitals
export function extractWebVitals() {
  function extractLCP(entries: PerformanceEntry[]) {
    const allLcp = entries.filter((x) => x.entryType === "largest-contentful-paint");
    return allLcp.length > 0 ? allLcp[allLcp.length - 1].startTime : 0;
  }

  // ignores DOM elements when serializing to avoid recursion
  const safeParser = (key: string, val: any) => (key === "element" ? null : val);

  const lcp = extractLCP(window._pe);

  return { lcp: JSON.stringify(lcp, safeParser) };
}

export async function extractWebVitals(page: Page) {
  return await page.evaluate(extractMetrics);
}
```

This code is quite simple but have a few tricks:

- I didn't use `find` as previous, because several `largest-contentful-paint` events are expected, we need the last one
- I have to wrote `safeParser` method because to avoid serializing ciruclar dependencies
- I put all code into the one function to avoid evaluation exception from puppeteer

The same way you can implement getting other Core Web Vitals - [First Input Delay](https://web.dev/fid/#measure-fid-in-javascript) and [Cumulative Layout Shift](https://web.dev/cls/#measure-cls-in-javascript).

However, these examples have some gaps. Google team warns that measuring Core Web Vitals is more complex and you might spot some pitfalls, thus you might decide to use [web-vitals](https://github.com/GoogleChrome/web-vitals) library for better precision.

## How to use use web-vitals library to get Core Web Vitals metrics

If you are using the latest version of the create-react-app, the web-vitals library already injected into your index.tsx file and almost ready to work. If you don't have it, please look into the [demo repository](https://github.com/Drag13/react-performance-puppeteer-profile/blob/master/src/index.js) for the example.

The next step is to provide a function that will store reported data from the web-vitals to some storage where we can get it later:

```javascript
function storeWebVitals(entry) {
  if (!window._cwv) {
    window._cwv = [];
  }
  window._cwv.push(entry);
}
reportWebVitals(storeWebVitals);
```

And finally we need to read stored data it from our script:

```typescript
export async function extractCoreWebVitals(page: Page) {
  const rawMetrics = await page.evaluate(function () {
    return JSON.stringify(window._cwv);
  });

  const metrics: { name: string; value: number }[] = JSON.parse(rawMetrics);

  const formattedMetrics = metrics.reduce(
    (result, entry) => ((result[entry.name] = entry.value), result),
    {} as Record<string, number>
  );

  return formattedMetrics;
}
```

As a result you will something like this (depends on how much events was gathered from the page):

```json
{
  "TTFB": 48.19999999552965,
  "FCP": 96.29999999701977
}
```

Now, it's time to talk about the most important metrics - your own custom metrics.

## How to get custom performance events from React application using Profiler

I showed how to get performance events that already exist on the browser. But for the rich application, this will be not enough, especially for the single-page application. Imagine you want to measure how much time it was taken to show your main part of the content (or menu, or sidebar) or how much time the browser spent rendering your new WYSIWYG editor or any other fancy component with animation. Luckily, exactly for such cases, custom performance events are very handy. Let me show this in the example.

I will use React profiler API to get information when the component was finally rendered and the simplest example (it requires some tuning but should be OK enough for example) will be like this

```js
function putRenderedMark(id, phase, actualDuration, baseDuration, startTime, commitTime) {
  // make it one time
  if (!putRenderedMark._done) {
    putRenderedMark._done = true;
    performance.mark("app-rendered");
  }
}

const App = () => (
  <Profiler id="app-rendered" onRender={putRenderedMark}>
    Hello from react
  </Profiler>
);
```

Retrieving is also simple:

```typescript
import { Page } from "puppeteer";

function getAppRendered(entries: PerformanceEntry[]) {
  const appRenderedEvent = entries.find((x) => x.name === "app-rendered");
  return appRenderedEvent?.startTime ?? 0;
}

export async function getCustomMetrics(page: Page) {
  const rawEntries = await page.evaluate(function () {
    return JSON.stringify(window.performance.getEntries());
  });

  const entries = JSON.parse(rawEntries);

  return {
    appRendered: getAppRendered(entries),
  };
}
```

And this is it! Now rebuild the application using `--profile` flag

```cmd
npm run build -- --profile
```

Update `index.ts` to get custom metrics:

```typescript
//dump custom metrics
const customMetris = await getCustomMetrics(page);
```

And run `e2e` script to observe the result!

That's it, this way you are able to mark and measure any timings you need to track everything that happens with your application without any external libraries and with extreme precision!
Very simple and very handy! But don't forget about the `--profile` flag it's required to enable Profiler on the Prod build for the React application.

Now let's wrap up with the first part of the article.

## Summary

In the first part of the article, I've shown how easy is to use Puppeteer to get different performance entries for your React application. We managed to get ScriptDuration, LayoutDuration, Contentful Paint, Time To First Byte, and Largest Contentful Paint event. We also found how to create a custom performance event and extract it while profiling.

The second part of the article will be dedicated to the Puppeteer setup - emulating slow network, slow CPU, emulating mobile devices to gather more information about your application.
Demo repository with all code can be found here - [https://github.com/Drag13/react-performance-puppeteer-profile](https://github.com/Drag13/react-performance-puppeteer-profile)

Special thanks to @addyosmani for the inspiration and puppeteer team for make it possible.
