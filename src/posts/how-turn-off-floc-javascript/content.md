# How to opt-out Federated Learning of Cohorts (FLoC) using JavaScript

![how to turn off FLoC using JavaScript](~/img/kdpv/how-to-optout-floc.png)

## Federated Learning of Cohorts and default way to opt-out

Federated Learning of Cohorts (FLoC) - is the [new way proposed by Google](https://github.com/WICG/floc) that allows Chrome to collect and share customer's personal information without the need for cookies. It uses the browser's history (which had never opened) and some other methods to group people into cohorts based on their interests and show them some ads which rise [some questions](https://www.eff.org/ru/deeplinks/2021/03/googles-floc-terrible-idea) about privacy.

Introducing this technology Google states, that [FLoC will keep your privacy](https://github.com/WICG/floc#privacy-and-security-considerations), however some [concerns](https://brave.com/why-brave-disables-floc/) still exists. To give an option to fix this, Google provides the way to opt-out the FLoC by using HTTP Header `Permissions-Policy` with value `interest-cohort=()`.

Unfortunately, this solution has few issues:

- Sometimes you are not able to manipulate HTTP headers at all. As an example - using GitHub Pages you are not able to set any custom HTTP header. Recently, GitHub added `Permissions-Policy` but only for the github.com domain. Disabling FLoC for GitHub pages with custom domains is still impossible (`meta-equiv` is not working for the `Permissions-Policy`).
- The second issue is much more controversial, however, it's still not null. The fact is that mechanism turning FLoC on/off belongs to the organization whose one of the biggest [income](https://abc.xyz/investor/static/pdf/2019Q4_alphabet_earnings_release.pdf?cache=79552b8) comes from the ad. This is not bad, but this simply means that at some point Google may decide to change the mechanism turning FLoC off, ignore it or even remove it. I am not stating this will happen, but this seems possible.

This leads us to the necessity to have another way to turn FLoC off and JavaScript is a perfect candidate.

## How to Turn OFF FLoC using the JavaScript

Luckily in the Web world, we are capable to change a lot of things, and FLoC API is one of them. When someone needs to get the user's cohort, the `document.interestCohort()` method should be called. This method exists in the `Document` prototype and can be overridden. If you get the descriptor of this property using `Object.getOwnPropertyDescriptor` you should notice that it is writable and we can substiture this property

Thus, an algorithm looks pretty simple:

- Check if `interestCohort` API supported
- If yes and rewriting is possible
- - Create a proxy that will return rejected promise
- - Substitute the original function with a newly created proxy
- - Disable reconfiguring of the interestCohort property to disable recovering
- If no - do nothing

In JavaScript this might look something like this:

```js
const cohorts = "interestCohort";
const documentProto = Document.prototype;
const flocSupported = cohorts in documentProto;

if (!flocSupported) {
  return;
}

const descriptor = Object.getOwnPropertyDescriptor(documentProto, cohorts);
const writable = descriptor && descriptor.writable;
if (writable) {
  const proxy = new Proxy(documentProto[cohorts], { apply: () => Promise.reject() });
  const config = {
    writable: false,
    value: proxy,
    configurable: false,
    enumerable: false,
  };
  Object.defineProperty(documentProto, cohorts, config);
}
```

You can find the full version [here](https://github.com/Drag13/floc-off/blob/master/src/index.js).

Of course, we can completely remove this method from the Document prototype but this may lead to errors for those who will use it, so I suggest fake it instead of deleting it.

## Use case

I found two cases when using this technic might be useful.

- You are not able to add HTTP headers. GitHub Pages for a custom domain is a perfect example for now. This [will change](https://twitter.com/drag137/status/1387425202125033476), I believe, but now you can disable FLoC only using JavaScript.
- You don't trust that putting the Permissions-Policy HTTP header will prevent getting user's data (as it was with the Do Not Track header).
- You simply dislike Google 😊

For those who found these points reasonable, I wrote the very small npm package named - [floc-off](https://www.npmjs.com/package/floc-off). It's really tiny (287 bytes) and safe to use.
Simply install it using `npm i floc-off` and import it at the top of your entry file

```javascript
import "floc-off";
```

That's it. The code is open-source and can be found in my [GitHub](https://github.com/Drag13/floc-off)

As for my blog - I've disabled JavaScript completely using the [Content-Security-Policy](https://drag13.io/posts/security-headers/index.html) so your privacy already in safe here 😊

## Another opinion

I also couldn't omit to mention another opinion about how to turn off the FLoC, described [in this article](https://seirdy.one/2021/04/16/permissions-policy-floc-misinfo.html) by Rohan Kumar. This article proposes a better option to turn off the FLoC:

- Don’t load untrusted third-party content that might get classified as an ad (only applies during the origin trial)
- Don’t call document.interestCohort(), and don’t load third-party scripts that might call it either.

Which is basically fair and will work in an ideal world. However, in the real world, you may have the Google Tag Manager script, some scripts from partners, or anything else that is out of your control. And yes, having all of this you may still want to turn off the FLoC, why not? Using ads doesn't automatically means that you allow them to show this ugly popup jumping right into the user's face, right? This case is similar - I still want to show ads, but I don't want to breach the user's privacy. For this case, this package can also help.
