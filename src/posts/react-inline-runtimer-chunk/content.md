# How to ____ and why.

React.JS is awesome library that widely used all over the world. However, it also contains a lot of pitfalls that might negativly impact your application. And here I want to discuss one of such pitfalls - runtime chunk inlining that might affect your application security.

If you ever opened the index.html file after building, you probabaly already saw something like this:

```html

<div id="root"></div>

<script>!function (e) { function r(r) { for (var n, l, f = r[0], i = r[1], a = r[2], c = 0, s = []; c < f.length; c++)l = f[c], Object.prototype.hasOwnProperty.call(o, l) && o[l] && s.push(o[l][0]), o[l] = 0; for (n in i) Object.prototype.hasOwnProperty.call(i, n) && (e[n] = i[n]); for (p && p(r);  var f = this.webpackJsonpdemo = this.webpackJsonpdemo || [], i = f.push.bind(f); f.push = r, f = f.slice(); for (var a = 0; a < f.length; a++)r(f[a]); var p = i; t() }([])</script>

<script src="/static/js/2.1478fb8e.chunk.js"></script>
```

What is the first block? The first block is well known as runtime chunk. It is crucial to start your application and if you don't want to see your application broken - you shouldn't touch it. So, if it is so important, what's the problem here?

The problem is with security. Itself, this code is safe (at least for now, because you neve knwons). But the way it is embedded will cause security issues. For those, who already uses Content-Security-Policy header, the problem should be obvious, but if you are not yet familiar with this, I will expalin a bit more.

Long time ago when netscape was young, we don't have any mechanism to define trusted authorities for the site resources. If browser saw the script tag, it evaluated it and executed. If browser saw scrip with src, it downloded it and execute. If browser saw an image, it loaded it and show. This behavior lead to some serious troubles - like [XSS](). Bad guy embeds some malicious code and browser executes it.

However, times changed. Nowadays we can control what sources are trasted and what resources can be used by browser. This is done via HTTP Header - [Content-Security-Policy](). This header defines trusted sources, browser will use.

```
Content-Security-Policy: default-src 'self';
```

In this example, server, using Content-Security-Policy header, dictates to the browser to use resources only from the same domain index.html was loaded from. If an attacker will find XSS vulnurability and embed some script inside the page, it will just not work, because loading scripts from other domain are disalowed. Even more, if attacker embed plain javascript in a the page, it will also not work. Because, inline resources required special perfmission - unsafe-inline.

```
Content-Security-Policy: default-src 'self'; script-src 'unsafe-inline';
```

Here you can find more about Content-Security-Policy and some other useful security headers - [drag13.io/posts/security-headers].

Probably, you already see the issue. If you decide to protect your site with CSP-Header (and I highly recommend doing this), you will have to allow unsafe-inline code. Wich, leaves the door open to the script inlining from some bad guys. So, what you can do?

* #1 Option is to leave this code as it is, but add nonce attribute, to define that this exact script should be trusted. But this will cause another problem. You will need to postporocess your index.html (because runtime chunk does not present in original index.html)
* #2 Option is to runtime chunk out from the index.html and load it as normal code. Good news is that this option is already supported with INLINE_RUNTIME_CHUNK variable.

To use react without unsafe inline code, you need set INLINE_RUNTIME_CHUNK to false, like here:

```json
/*package.json*/
"build": "(SET INLINE_RUNTIME_CHUNK=false) && react-scripts build",
```

And this is it! Now you can use React.JS application with CSP header without unsafe-inline (of cource if you don't have other inlined code). (~However, you might face one more issue. React also inline all images that are smaller than~ IMAGE_INLINE_SIZE_LIMIT)

Btw, Angular doesn't have this runtime chunk, so if you are using Angular based app you should not worry.

But what about performance? If we moved it out of the index.html, don't it slow the application loading? I was also wondering about this. So, created simple web application (B1) in Azure, did couple of tests and here is what I found


## 3g network, cache enabled

![chart for 3g with cache test](./3gCache.png)

As you can see, allmost no difference present.

![chart for 4g with cache test](./4gCache.png)

For 4g it's even faster (not very much but still)

But this test was done for already cached resources. For the first visit, result might be differnt. Let's disable cache and check once more time!

## 3g, cache off

|Metric|Inline|Remote|
|--|--|--|
|FCP| 1527 | 1540 |
|LCP| 2118 |  2129 |

## 4g, cache off

|Metric|Inline|Remote|
|--|--|--|
|FCP| 313 | 351 |
|LCP| 400 |  423 |

So, for frist visit we see light performance hit. But I woldn't say it is very big.


```cmd
npm run perfrunner http://xor.azurewebsites.net/ -- --runs 5 --test-name 4g --comment inline -T 4 --network regular-4g
```