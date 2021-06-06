# How to get performance metrics and web vitals using Puppeteer, React and TypeScript, Part 1

![How to get performance metrics and web vitals using Puppeteer, React and TypeScript, part 1](~/img/kdpv/react-performance-puppeteer-profile-kdpv.jpg)

In this article, I will show how to build the script to gather main performance metrics and Core Web Vitals from the React application using Puppeteer and TypeScript. I will also describe how to create and extract your own performance events using the React Profiler component. This might be useful if you decide to do some performance research or implement advanced performance testing into your CI/CD pipeline.

## The Plan

Here are the main points I will cover in the next two articles:

- Create a new React.JS project and install required dependencies for performance measuring
- Extract ScriptDuration, LayoutDuration, JSHeapUsedSize, and other metrics provided by Puppeteer API
- Extract First Contentful Paint and Time to First Byte from performance events
- Extract Largest Contentful Paint using the PerformanceObserver API
- Use web-vitals library to get Core Web Vitals metrics
- Emit and extract custom performance event using performance API and React Profiler component
- Change network and CPU conditions
- Cached and No-Cache strategy
- Final wrap up

Because of the large amount of material and code, I will split the content into two parts. The first one (this one) will be about gathering data and the second one will be about changing test conditions like CPU and network.

## Initial setup with React.JS and Puppeteer

First, we need to prepare the workspace. You can use an already existed application (better to take something React-based if you want to use Profiler component, however, all code will work for Angular, Vue.JS, or vanilla JS application) or create something from scratch. Also, you will need to install some extra dependencies to be able to profile the application.

Install the application, [puppeteer](https://www.npmjs.com/package/puppeteer) for running tests, [serve](https://www.npmjs.com/package/serve) to host the application, [start-server-and-test](https://www.npmjs.com/package/start-server-and-test) to automate launching application , [TypeScript](https://www.typescriptlang.org/) and [ts-node](https://www.npmjs.com/package/ts-node) to run the written script. If you already using TypeScript in your project - install only the ts-node.

```cmd
npx create-react-app perf
cd perf
npm i puppeteer serve ts-node typescript start-server-and-test -O
```

Note, that I am using the `-O` flag to install performance-related dependencies as optional. This gives me the possibility to skip them using `npm ci --no-optional` command for the scenarios where they are not needed and saves me some time.

Now create a new folder named e2e and put an empty index.ts file inside and update the `package.json` with next scripts:

```json
"scripts":{
    "serve": "serve ./build",
    "ts-node": "ts-node",
    "tsc": "tsc",
    "e2e:run": "ts-node --project e2e/tsconfig.json --files e2e/index.ts" ,
    "e2e": "start-server-and-test serve http://localhost:5000 e2e:run"
}
```

Initialize new tsconfig file with `npm run tsc -- --init`, put it into the e2e folder and build the application using `npm run build`. Now launch the application using `npm e2e` command. At this point, your application will start and empty index.ts executed. Time to fill it with some code!

## How to get default performance metrics from the Puppeteer

Getting default performance metrics like script duration, heap size, and some others are straightforward with the API that already provided by the Puppeteer. The algorithm is simple - using Puppeteer we are launching Chrome, then navigating to the page we want to profile, wait for the load, and finally, dump required metrics. From the code perspective it will look like this:

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

What useful metrics can we take from this? From my point of view, the most interesting things here are:

- ScriptDuration - the amount of time in milliseconds how much time the browser spent on javascript **parsing** and **executing**. If numbers here really big this means that you have either the big amount of JavaScript on the page or it runs too much, and you should consider code splitting. For the mobiles from low segments, a huge\* amount of JavaScript may be a pure disaster because parsing JavaScript is not something simple. Even if you have very fast internet, JavaScript still may block content from rendering or increase time to interact.
- LayoutDuration - the amount of time in milliseconds how much time the browser spent on construction layout. If it starts rapidly growing, this signalizes that your markup is overcomplicated or big.
- JSHeapUsedSize - the amount of memory in bytes the application is using. Again, this is important for the cheap mobiles that have a little amount of memory. If you are targeting this audience this metric is crucial for you.

\*Regarding the [latest researches](https://infrequently.org/2021/03/the-performance-inequality-gap/) done in the 2021 year current budget for mobile devices is about **100KiB of HTML/CSS/fonts and ~300-350KiB of JS**. This is bigger than we have previosly but still not much.

However, gathered data not even close to the metrics we want to have. The most popular metrics like First Contentful Paint, Largest Contentful Paint, and Time to Interactive missing. We need to go deeper.

## How to get First Contentful Paint and custom performance events metrics

Getting First Contentful Paint is also straightforward with using the browser's `performance` API:

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

The variable `allPerformanceEntries` will contain the array with all performance entries that happened on the page. If you explore this array, you will see:

- Navigation event (get it using `performance.getEntries().find(x=>x.entryType ==='navigation')`). This event contains such timings as `domComplete`, `domContentLoadedEventEnd`, `domainLookupStart`, `domainLookupEnd` and others. It also contains server timings if your server supports them. For this example, I will use this entry to get one of the webvitals metrics - Time to First Byte.
- All timings related to each, and every resource fetched by the page. Here you can find information about how much time it took to download your bundle or styles or calculate the size of the resources.
- All custom performance events were logged by the application. This is extremely useful and important functionality, so I will write about it a bit later.

Now let's write some code and extract next portion of the web vitals (to me it already starts sounds like a quest)

Create the new file `performance-entries.ts` with next code:

```typescript
import { Page } from "puppeteer";

/*Gets First Contentful-Paint metric*/
function getFcp(entries: PerformanceEntry[]) {
  const fcpEvent = entries.find((x) => x.name === "first-contentful-paint");
  return fcpEvent?.startTime ?? 0;
}

/*Gets Time To First Byte metric*/
function getTTFB(entries: PerformanceEntry[]) {
  const navigationEvent = entries.find((x) => x.entryType === "navigation") as PerformanceNavigationTiming;
  return navigationEvent.responseStart ?? 0;
}

/*Gets performance metrics*/
export async function getPerformanceEntries(page: Page) {
  const rawPerfEntries = await page.evaluate(function () {
    return JSON.stringify(window.performance.getEntries());
  });

  const allPerformanceEntries = JSON.parse(rawPerfEntries);

  return {
    fcp: getFcp(allPerformanceEntries),
    ttfb: getTTFB(allPerformanceEntries),
  };
}
```

And update the `index.ts` file to consume newly created functionality:

```ts
//index.ts

const perfEntries = await getPerformanceEntries(page);
console.log({ ...metrics, ...perfEntries });
```

Now, let's talk about the new API that can give us even more data to analys PerformanceObserver API

## Core Web Vitals and PerformanceObserver API

Might be you already heard about the Core Web Vitals - user centric performance metrics that reflect the real-world experience of a critical part of the user experience. In 2021 (the list is a subject to change) they are:

- Largest Contentful Paint measures loading performance. To provide a good user experience, LCP should occur within 2.5 seconds of when the page first starts loading. We didn't find it yet
- First Input Delay: measures interactivity. To provide a good user experience, pages should have an FID of less than 100 milliseconds. This is also missing
- Cumulative Layout Shift: measures visual stability. To provide a good user experience, pages should maintain a CLS of less than 0.1.

Right now, we didn't meeet them yet and, unfortunately, the puppeteer has no API to get them simply. However this will not stop us and we can measure this metrics either by our own code, using [PerformanceObserver](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver) API or using [web-vitals](https://github.com/GoogleChrome/web-vitals) library that already comes with the new React applications. Today I will use the first approach, just to show the idea beneath it, but please be aware that measuring Core Web Vitals is more complex than on the example.

To get Largest Contenful Paing or Core Web Vitals we will use new PerformanceObserver API and the simplest example will be look like this:

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

However, to make it work in a real life we will have to make it more complex;

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

The same way you can implement getting other Core Web Vitals - [First Input Delay](https://web.dev/fid/#measure-fid-in-javascript) and [Cumulative Layout Shift](https://web.dev/cls/#measure-cls-in-javascript), examples provided in links.

However, these examples suitable only for the simple cases. Google team warns that measuring Core Web Vitals are more complex and you might spot some pitfals. That's why you may decide to use [web-vitals](https://github.com/GoogleChrome/web-vitals) library for better precision and less code.

Now, it's time to talk about the most important part of metrics - your own custom metrics.

## How to get custom performance events from React application using Profiler

I already shown how to get performance events that already exists on browser. But for the rich application this will definitly not enough, especially for the single page application. Imagine you want to measure how much time it was taken to show your main part of the content (or menu, or sidebar) or how much time browser spent rendering your new WYSIWYG editor (might be it's to heavy). Luckyly, exactly for such cases, custom performance events are very handy. Let me show this on the example.

I will use React profiler API to get information when the component was finally rendered and the simplest example (it requires some tuning but should be OK enough for example) will be like this

```js
let rendered = false;
const putRenderedMark = (id, phase, actualDuration, baseDuration, startTime, commitTime) => {
  if (!rendered) {
    performance.mark("app-rendered");
    rendered = true;
  }
};

function App() {
  return (
    <Profiler id="app-rendered" onRender={putRenderedMark}>
      Hello from react
    </Profiler>
  );
}
```

The code to retrieve this information is also very simple:

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

And this is it! Now rebuild the application using `profile flag`

```cmd
npm run build -- --profile
```

Update `index.ts` to get custom metrics:

```typescript
//dump custom metrics
const customMetris = await getCustomMetrics(page);
```

And observe the result! That's it, this way you may mark and measure any timings you need to track everything that happens with your application without any external libraries and with extreme precision!
Very simple and very handy! But don't forget about the `--profile` flag it's required to enable Profiler on the Prod build for the React application.

Now let's wrap up with the first part of the article.

## Summary

In the first part of the article, I've shown how easy is to use Puppeteer to get different performance entries for your React application. We managed to get ScriptDuration, LayoutDuration, Contentful Paint, Time To First Byte, and Larget Contentful Paint event. We also found how to create a custom performance event and extract it while profiling.

The second part of the article will be dedicated to the Puppeteer setup - emulating slow network, slow CPU, emulating mobile devices to gather more information about your application.

Special thanks to @addyosmani for the inspiration and puppeteer team for make it possible.