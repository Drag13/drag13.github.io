# Getting performance metrics and web vitals using Puppetter, React and TypeScript

In this article we will build our own script to get main performance metrics from the React application using Puppetter and typescript, however the idea is applicable for javascript aswell.This may be useful if you decide to do some performance research or implement advanced performance testing in your CI/CD piplane.

## The idea

The very basic idea is super simple. All we need can be described in the next steps:

- Start the application on some server (we will use [serve]()),
- Luanch the puppetter and open the page we want to gather metrics from
- Use puppeteer API to gather web vitals and other performance data
- Compare gathered metrics with the budget from the config

Despite of such simplicity, there are are few tips that need to considered. We will look into caching, different network conditions, throttling simulation , different metrics and performance events and many other performance related staff. We will do a lot of things, don't forget to grab the pot of coffee and let's start.

## Inital setup with React.JS and Puppetter

First of all we need to prepare the workspace. You need to create the application (or use already existed), install extra dependencies and do simple configurtaion.

Create simple application and install additional dependencies (TypeScript and ts-node are not required, however I prefer more strict types)

```cmd
npx create-react-app perf
cd perf
npm i puppeteer serve ts-node typescript -D
```

Create a new folder named e2e and put an empty index.ts file inside. Update the `package.json` with next scripts:

```json
"scripts":{
    "serve": "serve ./build",
    "ts-node": "ts-node",
    "tsc:": "tsc",
    "e2e": "ts-node --project e2e/tsconfig.json e2e/index.ts"
}
```

And finally luanch the application using `npm run serve` command. Now your application should be running on the http://localhost:5000. Check this and let's start coding.

## How to get default performance metrics from the Pupetter

The alghorith is very simple. Using puppetter we luanching the Chrome, then navigating to the page we want to profile, wait for the load and finally dump required metrics. From the code it will looks like this:

```typescript
import { launch } from "puppeteer";

const pageUrl = "http://localhost:5000"; // url to open

(async function (url) {
  let browser;
  try {
    browser = await launch({ product: "chrome" }); // launch the Chrome browser
    const page = await browser.newPage(); // launch the page
    await page.goto(url, { waitUntil: "networkidle0" }); // navigate to the url and wait untill all network activity stops

    const metrics = await page.metrics(); // dump page metrics

    console.log(metrics);
  } catch (error) {
    console.error(error);
  } finally {
    browser != null && (await browser.close()); // close the browser correctly even if something went wrong
  }
})(pageUrl);
```

Wich will bring us something like this:

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

From my point of view, the most important things here are:

- ScriptDuration - the amount of time in miliseconds how much time browser spent on javascript **parsing** and **executing**. If numbers here are really big then you have massive amount of JavaScript and should consider about the code splitting or tree shaking. For the mobiles from low segments big amount of JavaScript may be a pure disaster because parsing JavaScript is not a simple task. Even if you have very fast internet, blocking script will delay showing the content.
- LayoutDuration - the amount of time in miliseconds how much time browser spent on construction layout. If it starts rapidly growth, this signalize that your markup is overcomplicated or big.
- JSHeapUsedSize - the amount of memory in bytes the application are using. Again, this is important for the cheap mobiles that have little amount of memory. If you targeting to this audience this metric is crucial for you.

However, it's not even close the web vitals we want to get. The most popular metrics like First Contentful Paint, Largest Contentfull Paint, and Time to Interactive missing. We need to go deeper.

## How to get First Contentful Paint and custom performance events metrics

Getting First Content Paint is pretty straight forward. Despite the fact that puppetter doesn't expose it directly, we can use `window.performance` API to get them, and the simple example will looks like this:

```typescript
const rawPerfEntries = await page.evaluate(function () {
  return JSON.stringify(window.performance.getEntries());
});

const allPerformanceEntries = JSON.parse(rawPerfEntries);
```

The variable allPerformanceEntries will contain the array with all performance entries that happened on the page. If you explore this array, you will be able to find:

- Navigation event (get it using `performance.getEntries().find(x=>x.entryType ==='navigation')`). This event contains such timings as `domComplete`, `domContentLoadedEventEnd`, `domainLookupStart`, `domainLookupEnd` and others. It also contains server timings if your server supports them. For this example we will use this entry to get one of the webvitals metrics - Time To First Byte.
- All timings releated to each and every resource fetched by the page. Here you can find information about how much time it took to download your bundle or styles or calculate size of the resources.
- All custom performance events that was logged by the application. This is extremly useful and important functionality, so I will write about it a bit later.

Now let's write some code and extract next portion of the web vitals (to me it already start sounds like a quest)

Create the new file `performance-entries.ts` with next code:

```typescript
import { Page } from "puppeteer";

function getFcp(entries: PerformanceEntry[]) {
  const fcpEvent = entries.find((x) => x.name === "first-contentful-paint");
  return fcpEvent?.startTime ?? 0;
}

function getTTFB(entries: PerformanceEntry[]) {
  const navigationEvent = entries.find((x) => x.entryType === "navigation") as PerformanceNavigationTiming;
  return navigationEvent.responseStart ?? 0;
}

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

Now, let's talk about one of the most important thing in this article - custom performance event.

## How to get custom performance events from React application

I already shown how to get performance events that already exists on browser. But for the rich application this may not be enough especially for the SPA. Imagine you want to measure how much time it was taken to show your main part of the content or how much time browser spent rendering your new WYSIWYG editor. Luckyly, exactly for such cases, custom performance events exists. Let me show this on the example.

I will use React profiler API to get information when the component was finally rendered and the most simple example (it's require some tuning but should be OK enought for example) will be like this

```jsx
let rendered = false;
const putRenderedMark = (id, phase, actualDuration, baseDuration, startTime, commitTime) => {
  if (!rendered) {
    performance.mark("app-rendered");
    rendered = true;
  }
};

function App() {
  return <Profiler onRender={putRenderedMark}>Hello from react</Profiler>;
}
```

The code to retrieve this information is also very simple:

```typescript
function getAppRendered(entries: PerformanceEntry[]) {
  const appRenderedEvent = entries.find((x) => x.name === "app-rendered");
  return appRenderedEvent?.startTime ?? 0;
}
```

And this is it! Now rebuild the application

```cmd
npm run build -- --profile
```

And observe the result:

```json
{
  "fcp": 91.08500000729691,
  "ttfb": 5.095000000437722,
  "appRendered": 54.01999999594409
}
```

Please note, that using `--profile` flag is required to enable Profiler on the Prod build for the React application.

This way you may mark and measure any timings you need to track everything what happening with your application without any external libraries and with extreme precision! But, after Google introduced Core Web Vitals which affects the search ranking it's not longer enough.

## Core Web Vitals

The Core Web Vitals are user centric performance metrics that reflect the real-world experience of a critical part of the user experience. In 2021 (the list is a subject to change) they are:

- Largest Contentful Paint measures loading performance. To provide a good user experience, LCP should occur within 2.5 seconds of when the page first starts loading. We didn't find it yet
- First Input Delay: measures interactivity. To provide a good user experience, pages should have a FID of less than 100 milliseconds. This is also missing
- Cumulative Layout Shift: measures visual stability. To provide a good user experience, pages should maintain a CLS of less than 0.1.

Unfortunatly, puppeteer hasn't straightforward API to get this vital metrics. However, we can measure this metrics by ourself, using [PerformanceObserver]() API or using [web-vitals](https://github.com/GoogleChrome/web-vitals) library that already comes with the new React applications. Today I will use the first approach, just to show the idea beneath it, but please be aware that measuring Core Web Vitals is more complex than on the example.

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

However, to make it work in a real life we will have to make it a bit more complex.

Firstly, create new folder named typings and put there index.d.ts file with next content:

```typescript
declare interface Window {
  _pe: PerformanceEntry[];
}
```

This code will extend extend `window` with the new property and fix TypeScript errors. This techique described in my previous article - [TypeScript Tips and Tricks - Declarations With Examples](https://drag13.io/posts/typescript-tips-tricks-declarations/index.html). But this is not enough for ts-node, it will not pickup the custom typings unless you specify the `--files` options.

Than we need to install Performance Observer and store the data it will produce:

```typescript
export function setupPerfromanceScripts() {
  // we will push data here
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
export function extractWebVitals() {
  function extractLCP(entries: PerformanceEntry[]) {
    const allLcp = entries.filter((x) => x.entryType === "largest-contentful-paint");
    return allLcp.length > 0 ? allLcp[allLcp.length - 1].startTime : 0;
  }

  const safeParser = (key: string, val: any) => (key === "element" ? null : val);

  const lcp = extractLCP(window._pe);

  return { lcp: JSON.stringify(lcp, safeParser) };
}
```

This is quite simple except a few tricks:

- I didn't use `find` as previous, because several `largest-contentful-paint` events are expected
- I have to wrote `safeParser` method because to avoid serializing ciruclar dependencies
- I put all code into the one function to avoid evaluation exception from puppeteer

The same way you can implement getting other Core Web Vitals like FID or CLS.

Another option is to use `web-vtals` library from Google which is more recommended right now (at least because of support and better precision).
Now, when we logged all data we need, it's time to change the rules!
