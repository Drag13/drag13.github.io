# TypeScript Tips and Tricks - Declarations With Examples

[![typescript tips and trics declarations](~/img/kdpv/ts-declarations.png)](./index.pug)

TypeScript is a very powerful language and it is becoming more and more popular. I would say that TypeScript is that kind of language that is easy to learn but difficult to master. In this article, I will show you some useful tips and tricks about TypeScript's declarations that may help you in everyday coding and will keep your code type-safe.

## Global object augmentation in TypeScript

The declaration is one of the most important parts of the TypeScript and of course, you already familiar with it. Despite this, sometimes declarations might be tricky.

Imagine that you need to extend global object (like Window) with custom properties. If you will try to do it directly, TypeScript will show an error like this: `Property 'customProperty' does not exist on type 'Window & typeof globalThis'.ts(2339)`. This happens because `customProperty` not exists in the corresponding type and TypeScript disallows you to operate with not existed properties.

The popular way to solve this (and incorrect), is to cast the desired object to `any` and then, assign or use new properties. However, in this case, we will lose IntelliSense and type safety. A much better way to extend globally declared class is to declare a new, correct interface with the same name:

```typescript
// window.d.ts
declare interface Window {
  config: {
    env: "dev" | "prod";
  };
}
```

This approach named "Global Augmentation". The good news is that you don't need to redeclare all other properties, you still can use all other. The bad news is that you can't override existing properties without manual correcting corresponding .d.ts file. If you want to track this issue, check this [link](https://github.com/microsoft/TypeScript/issues/36146)

**Trick:** You can have multiple global augmentations in a single file.

If you want not only update the type but also add new behavior to the global object, the technique will be slightly different and you need to follow the next steps:

* Create new `.ts` (not `.d.ts`) file
* Declare interface with the same name
* Add actual code
* Import this file in the entry point of your application

Simple example adding a new method to the Array:

```typescript
// array.ts
declare interface Array<T> {
  foo(): string;
}

Array.prototype.foo = function (): string {
  return "bar";
};
```

```typescript
// index.ts
import "./array.ts";

[].foo();
```

**Important note:** Extend prototype, not the class itself.

## Adding static methods to the existed class in TypeScript

Let's move further. What if you want to add a new **static** method to the existed class, like `Array`? In this case, you need to do the same as in the previous chapter but extend **constructor** of the class you want to extend:

- Declare a new interface for the **constructor** you want to extend,
- Add new property/method to the class constructor (not to the prototype!)
- Import the file in the entry point of your application

Code example:

```typescript
// array.ts
declare interface ArrayConstructor {
    foo(): string;
}

Array.foo = () => `hello from static method`;
```

```typescript
// index.ts
import "./array.ts";

[].foo();
```

**Important note:** You should avoid any import or export statements in this file or your file will be treated as module and trick will not work.

## Adding types for the third-party libraries in TypeScript

As you can see, extending global objects in the TypeScript is quite simple. But how to add custom types for the 3rd party library? In this case, you should use a module declaration statement:

```typescript
// mytestlib.d.ts
declare module "my-test-lib" {
  export function main_answer(): number;
}
```

Now, when you will import something from `my-test-lib` you will have proper IntelliSense and type checking. Don't forget to send a PR to the [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) to let other people use your types.

**Important note:** don't forget to ensure that your *.d.ts files are visible for the TypeScript. Check `files/include` option in your tsconfig.json. If you have any issues, I have some more info about [how to add custom typings into the TypeScript project](https://drag13.io/posts/custom-typings/index.html)

## Summary

In this article we discussed how to:

* Add custom properties to the global or already existed types
* Add static properties to already existed class
* Add custom types for the 3rd party code

That's is the end of the first part of the TypeScript tips and tricks for beginners. See you soon!
