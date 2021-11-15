# Performance testing on a slow network and weak CPU using Puppeteer and React

In the [previous article](https://drag13.io/posts/react-performance-puppeteer-profile) I've shown how to extract performance metrics from the React-based application using Puppeteer. We got ScriptDuration, Contentful Paint, Time To First Byte, Largest Contentful Paint, and other metrics. I also showed how to extract custom performance events using the `performance` API. 

Today we will take a look into various testing conditions you might consider applying. We will set up the network limitations to simulate a slow 3g network, and we also will limit the CPU power to get a better understanding of how our application behaves on weak devices. Also, I will show how to test cache and cache-less scenarios to get performance metrics for the first visit and the next one. As an example, I will use the same React application as previously, however, this will work the same way for Angular, Vue, or classical website.

## Testing the application on a slow network

While developing, we usually have pretty good equipment - fast and stable network, fast laptops with enough memory. However, this might do not apply to the end-users. As an example, according to the [latest statistics](https://www.opensignal.com/sites/opensignal-com/files/data/reports/pdf-only/data-2020-05/state_of_mobile_experience_may_2020_opensignal_3_0.pdf), mobile internet varies from 0.54MBit/s in Tanzania to 59.6MBit/s in Canada.

And this is something we might forget while developing. Thus, if your product will be used worldwide, performance testing with network limitations is more than crucial for you. Luckily it's a pretty easy task.

First of all, we need to define the network conditions that should be applied. Right now we can set up `downloadThroughput`, `uploadThroughput` and `latency`. For example, a slow 3g network will look something like this:

```javascript
const slow3g = {
  offline: false,
  downloadThroughput: (0.4 * 1024 * 1024) / 8,
  uploadThroughput: (0.4 * 1024 * 1024) / 8,
  latency: 2000,
};
```

The next step is to apply this configuration while testing. This task is also pretty simple and consists of  3 steps:

- Create CDP sesstion using `createCDPSession` (we will also reuse it for other purposes)
- Turn ON network using `.send("Network.enable")`
- Send configuration using `.send("Network.emulateNetworkConditions", slow3g)`

Working example:

```typescript
// create CDP session
const pageSession = await page.target().createCDPSession();

// turn ON network
await pageSession.send("Network.enable");

// configure network
await pageSession.send("Network.emulateNetworkConditions", {
  offline: false,
  downloadThroughput: (0.4 * 1024 * 1024) / 8,
  uploadThroughput: (0.4 * 1024 * 1024) / 8,
  latency: 2000,
});
```

Now, if you run `npm run e2e` you will see pretty many differences between the vanilla test and test with simulated 3g network:

| Case     | appRendered | FCP    | lcp:   | TaskDuration |
| -------- | ----------- | ------ | ------ | ------------ |
| Original | 82ms        | 123ms  | 139ms  | 0.068ms      |
| Slow3g   | 5055ms      | 5087ms | 7135ms | 0.068ms      |

As you can see, the appRendered metrics grew more than 61X. What is also worth mentioning, that TaskDuration metrics stay the same because we only limited the network and the compute power remains the same.

Of course, you may apply any network conditions (4g, WiFi) you feel are suitable for your product. Some extra examples can be found [here](https://raw.githubusercontent.com/Drag13/perfrunner/master/packages/perfrunner-cli/src/config.ts).

## Testing the application on with CPU throttling

As you might already know, 55% of the page views in 2021 were done through mobile phones. Currently, the are around 5 280 000 000 mobile devices in use around the world. And most of them are not that powerful as a developer laptop. Frankly speaking, their CPU is pretty weak and comparable to the Octa-core 1.4 GHz Cortex-A53. This leads us to the situation when the application will work slowly with perfect network conditions because of intensive CPU operations like JS parsing, JS execution, force reflows, and such other expensive stuff.

And of course, there are a bunch of cheap or outdated laptops that you also might want to cover. This leads us to the importance of testing for the weak CPU conditions, and the good news is that this is an even easier task than the previous.

All you need is to set throttling rate using `pageSession.send('Emulation.setCPUThrottlingRate', config}`. The only possible caveat is - not possible to set up exact CPU power (frequency, cache, etc), you can only throttle your current CPU in 2-3-4-X times:

```ts
await pageSession.send("Emulation.setCPUThrottlingRate", { rate: 4 });
```

Test results with the throttling will look like this:

| Case         | appRendered | FCP    | lcp:   | TaskDuration |
| ------------ | ----------- | ------ | ------ | ------------ |
| Original     | 82ms        | 123ms  | 139ms  | 0.068ms      |
| Slow3g       | 5055ms      | 5087ms | 7135ms | 0.068ms      |
| Slow3g+CPUx4 | 5201ms      | 5325ms | 7336ms | 0.332ms      |

Note that TaskDuration timing increased 4.9 times which naturally affects all other metrics.

## Testing the application with and without caching

Before this point, we worked with the cacheless scenario. However, this was done unintentionally - we used a new browser instance for each test. In the real world, you might want to run a series of tests and it might be beneficial if we could control caching strategy. For this purposes, Puppeteer has special API - `setChacheEnabled` and `Network.setCacheDisabled` command. Altogether this looks like this:

```ts
await page.setCacheEnabled(false);
await pageSession.send("Network.setCacheDisabled", { cacheDisabled: true });
```

Now you can dictate to the browser use cache or not. That's it, pretty simple, yeah? If you want to test application performance with cache - just do the extra load without measuring and then do regular testing. 

One more note - sometimes you might see huge differences between the first and others test runs. In this case, I would recommend executing a single page load to "warm-up" the browser before testing. This slightly increases overall test duration however might produce more accurate results.

## Summary

Today I've shown how to measure web application performance in various conditions - weak network conditions, slow CPU, and disabling the browser cache. As you can see, this is absolutely doable and might bring you some extra insights about your solution. For the complete example, please take a look into the [example repo](https://github.com/Drag13/react-performance-puppeteer-profile). If you have any questions - feel free to contact me via [Twitter](https://twitter.com/drag137)

Cya!