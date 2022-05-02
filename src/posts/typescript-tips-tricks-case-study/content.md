# TypeScript Tips and Tricks - case study

It would seem that in 2022 it is a bit too late to talk about TypeScript - the technology is well known and popular. Despite this, some times TypeScript still used half-heartedly. Simple type annotations, null checking and nothing more. Therefore, I brought some interesting, purely practical cases to show mighty TypeScript in action!

## Narrowing primitives

Let's start simple. Imagine that we have a function that takes a key as input, extracts a translation from the dictionary by the key and returns it. What will be the type of this key? Most likely - string. But it is clear that not everyone string is a valid key - we certainly do not need the entire British Encyclopedia right? And of course we don't want to have typos.

This problem can be solved in different ways. For example, if the translation does not exist, you can throw an exception (users will be very happy to get run time exception, right?). The second option is to return the same key, and pledge the fact that the key does not exist, so that later you can find out what went wrong. In any case, we will find out that the problem has occurred somewhere later, but we would like to know in advance.

And here TypeScript has a very elegant solution - if you don't need the whole string, then be honest about it and just declare a subset:

```typescript
type TranslationKey = 'grey';
function translate(key: TranslationKey){...}
```

Thanks to this technique, we get several advantages at once:

- We are protected from typos and keys that we are not yet ready for at the build stage.
- When some key changes `( grey-> gray)`, we will immediately see all the places where we need to update the code.
- IntelliSense works - using the keys has become much easier, you don’t have to climb and look for how this one is spelled every time `landing_big_ad_imageblock_subheder` (by the way, did you notice a typo?)

The same trick can be used if we want to validate a value before using it:

```typescript
type Email = string;
const sendEmail = (email: Email)=> {...}
sendEmail('fake@email'); // fails
```

When we try to pass `sendEmail` any string to the method, TS will force us to check this string before, for example, by writing a [guard](https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards):

```typescript
// don't use in production please
const isValidEmail = (maybeEmail: unknown): maybeEmail is Email =>
  typeof maybeEmail === "string" && /^\S+@\S+$/.test(maybeEmail);
```

If you are interested in the details of how it works, here is a link to the [documentation](https://www.typescriptlang.org/docs/handbook/2/narrowing.html).

## Derived from types

We figured out the primitives, now I want to show another feature that I often use - creating a new type based on an existing one. In OOP, we usually use inheritance, but TypeScript allows you to transform one type into another. Surely you have already used the type `Partial<T>` or `Required<T>` ,which come straight out of the box. But in addition to built-in types, we can create our own, for example, like this:

```typescript
type User = { name: string };
type Dto<T> = { [key in keyof T]: unknown };
type UserDto = Dto<User>;
```

First, I described the domain model with which I am ready to work. For this example, I created a type User with a single field name that must contain a string. But since I don't want to relay on the third party service that the data comes from, I want to validate the response from the server. To do this, I created a derived type `UserDto` in which I am stating that I had no idea what they would send us. Now I, as well as everyone who comes after, will be forced to check the data before using it.

Naturally, using this approach, you can also write a validator schema.

Step 1. Let's create a generic type that contains all the same fields as the future type T, and the values ​​will be functions that take an argument of an unknown type and return a sign that the argument belongs to the given type.

```typescript
type DtoValidator<T> = {
  [key in keyof T]: (v: unknown) => v is T[key];
};
```

Step 2. Now we can write a validator in the form of a guard, in which we check the passed argument. If it satisfies the given conditions, we recognize that it belongs to the type NotEmptyString.

```typescript
const isNotEmptyString = (v: unknown): v is NotEmptyString =>
  typeof v === "string" && v.length > 0;
```

Step 3. Finally let's put it all together into a validation scheme. Please note that now TS will ensure that all fields in the scheme are described and correctly filled out. If we miss something, TypeScript will throw an error.

```typescript
const userValidator: DtoValidator<User> = {
  name: isNotEmptyString,
};
```

The great thing here is that when we extend the domain model with a new field, TS will automatically remind us that this field is also needed to check.

On my project, we use this approach for form validation. There is a form model, and a validator model is built on its basis. When form fields change (which happens periodically), TypeScript tells us where we went wrong.

## Dynamic modification of types

This trick might be especially relevant if you're using contexts in React, but the idea will work everywhere. TS allows you to infer new types on the fly based on the data you pass in. This may sound a little confusing, so let's look at an example.

Let's write a function that greets the user:

```typescript
type User = { firstName: string };
type Greetings = { greetingText: string };
const getGreetings = ({ firstName, greetingText }: User & Greetings) =>
  `${greetingText}, ${firstName}!`;
```

Obviously, the username will appear in runtime, but the text of the greeting itself can be static. You can write a higher order function that will inject `greetingText` into `getGreetings`.

```typescript
const greeterFactory = () => (user: User) =>
  getGreetings({ ...user, greetingText: "Hello" });
const greeter = greeterFactory();
greeter({ firstName: "Vitalii" });
```

Everything is fine, but this solution is not generic and I want to have a general one that would:

- Worked with arbitrary types.
- Removed from the required type those fields that are already contained in the embedded object.

A naive implementation might look like this:

```typescript
function factory<TModel, TResult, TInjected extends Partial<TModel>>(
  callback: (m: TModel) => TResult,
  inject: TInjected
) {
  return (m: Omit<TModel, keyof TInjected>) => callback({ ...inject, ...m });
}
```

However, it won't compile because I made a curious mistake:

```typescript
factory((m: { greeting: string; name: string }) => m.name, {
  greeting: "hello",
  name: "Vitalii",
})("Joker");
```

Since the type of the embedded object completely overrides the required type, the resulting type can be anything, even a string. This is clearly not what we would like. And it's good that TypeScript was smart enough to catch it. Therefore, the code will have to be [rewritten](https://stackoverflow.com/questions/70154354/higher-order-function-how-to-deduct-injected-type-from-model-without-casting/70334649#70334649):

```typescript
// I am not a monster
function factory<
  TCallback extends (arg: any) => any,
  TModel extends Parameters<TCallback>[0],
  TInjected extends Partial<TModel>
>(callback: TCallback, injected: TInjected) {
  return function <TProps extends Omit<TModel, keyof TInjected>>(
    props: TProps extends object ? TProps : never
  ): ReturnType<TCallback> {
    return callback({ ...injected, ...props });
  };
}
const greeter = (_: { greeting: string; name: string }) => "";

// "Argument of type 'string' is not assignable to parameter of type 'never'"
const failed = factory(greeter, {
  greeting: "hello",
  name: "Vitalii",
})("Joker");

// // Works with full IntelliSense support.
const working = factory(greeter, {
  greeting: "hello",
})({ name: "test" });
```

Now everything works as expected, apart from a t-i-i-iny moment. First, it's hard to read, although the idea here is pretty simple and revolves around TypeScript's ability to extract types from functions and the Omit utility type. And secondly, in runtime, both in injected, and in props, an object with a much larger number of fields can get in, and this should be borne in mind.

For us, this approach came in handy when we wrote our connectors to the data store in React. As a result, only those fields that were not in the store had to be passed to the component, it would “take” the rest itself, and TypeScript would check that we had not forgotten to forward the missing ones. Since all objects are under our control, the nuance I mentioned was not a problem.

## Summary

As you can see, TypeScript is more than just type annotation. It allows you to create subsets, projections, type inference on the fly, and much more that I didn't mention. Although there is no TypeScript at runtime, well-written types make development easier and can prevent misses.

On the other hand, seemingly obvious TypeScript solutions don't work. Mistakes are incomprehensible and not obvious, especially at the beginning of working with the language (and, to be honest, later too). The start of the project is also slower, since you need to design and describe types, and then also fix where you missed.

Still, the convenience that TypeScript provides is well worth it. Introducing new people to the project and even returning to a module that you have not worked with for at least a month is much easier and more enjoyable. The main thing is to maintain balance, as the main character of one very philosophical game said. If you see that TS complicates the support of your code, then someone has taken a wrong turn.
