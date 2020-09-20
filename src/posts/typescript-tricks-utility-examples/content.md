# TypeScript Tips and Tricks - Utility Types With Examples

[![typescript tips and trics declarations](~/img/kdpv/ts-declarations.png)](./index.pug)

TypeScript is a very powerful language, however, it heavily relies on the types. And sometimes, you may found that you write more types than actual code. In this case, you should take a look into the Utility types that will help you to write fewer types and still keep your code type-safe.

Let's start from the simple example - imagine that you have a list of events produced by the application and a list of handlers for them. So you may write (don't do this way) something like this:

```typescript
type Action = "move" | "stop";

function handleAction(action: Action) {
  if (action === "move") {
    console.log("i am moving");
  }

  if (action === "stop") {
    console.log("i am stopped");
  }
}
```

Suddenly, requirements changes (requirements always changing suddenly 😀), and now you need to handle `beep` action. You update the Action type, but might forget to update `handleAction` function which will lead to a bug. However, with help of utility types, you can be protected from such type of failer:

```typescript
type Action = "move" | "stop" | "beep";

const handlers: Record<Action, () => void> = {
  move: () => console.log("i am moving"),
  stop: () => console.log("i am stopped"),
  beep: () => console.log("beeep!"),
};

const handlerAction = (action: Action) => handlers[action]();
```

Now, when new action will come, you will be automatically notified that you need to extend your handlers. If you accidentally remove some code from handlers, you will be notified as well. Great TypeScript feature!

You can do the same trick with objects:

```typescript
type User = { name: string; age: number };
type ValidationMap = Record<keyof User, (user: User) => boolean>;

const validations: ValidationMap = {
  age: ({ age }) => age > 21,
  name: ({ name }) => name != null,
};
```

This was done with the help of the `keyof` keyword. It extracts keys from the interface or type and creates another type. Simplifying it may look like this:

```typescript
interface IPerson = {age: number, name: string};
type PersonProps = keyof IPerson; // 'age | name';
```

This tip is very useful for the validation scenarios when you want to ensure that all properties of the object are handled.

If you want to know how to extract types from the array (or tuples), it's also easy, just don't forget to use `as const` statement:

```typescript
const events = ["success", "faile"] as const;
const valueExtractors: Record<typeof roles[number], Dispatcher> = {
  success: () => dispatch("success"),
  faile: () => dispatch("faile"),
};
```

Another useful utility type, you might be already familiar with is `Partial<TModel>` type. It is very handy when you are filling a domain model from untrusted resources or do some null/undefined behavior testing. Imagine that you are fetching big objects that might be partially filled and want to avoid `Cannot read property XXX of null` type exception. In this case, you can use Partial type and TypeScript will automatically suggest you verify your data:

```typescript
// This model we are using inside the application
type DomainUser = {
  name: string;
  age: number;
};

type UserDto = Partial<DomainUser>; // This model we expect to get from API

const fetchUser = (): UserDto => ({});

console.log(fetchUser().age.toString()); // Now, TypeScript is warning about the possible error and we now that check is needed
```

`Partial<T>` is a very useful utility type, however, it has an issue. It is not working with nested objects. You can use this code to write your own DeepPartial type:

```typescript
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepPartial<U>>
    : DeepPartial<T[P]>;
};
```

The code seems a bit tricky but it uses only two technics - conditional types and inferring. Both of them will be covered in the next article.

Speaking about partial types, I can't ignore one more very helpful classes - `Omit<TModel, TKeys>`. It helps you to exclude or override some properties based on already created class:

```typescript
type User = {
  name: string;
  email: string;
  sex: NonExistedTypeFitsAll;
};

interface MultiEmailUser extends Omit<User, "email"> {
  email: string[];
}
```

As you can see, using this technique you don't need to copy-paste user type. You just transform on type into something that fits better. If you need to omit more properties, just use Union type here:

```typescript
type CuttedUser = Omit<User, "email" | "email">;
```

That is all. If you want to know more about TypeScript utility types - visit the [TypeScript handbook](https://www.typescriptlang.org/docs/handbook/utility-types.html).

See you next time!
