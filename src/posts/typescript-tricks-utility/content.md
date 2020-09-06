# TypeScript Tips and Tricks for beginners - Utility Types

Utility types are very useful in TypeScript. They help us to write less code that is really great and built types that depend on other types.

Imagine that you have a list of actions: `move | stop`; And now you need to write some handlers for this actions. So you write something like this:

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

Suddenly requirements changed (requirements always changing suddenly 😀) and now you need to handle `beep` action. You update Action type, but forget to update `handleAction` function. This is not great. However, with help of utility types, you can be protected from this failer:

```typescript
type Action = "move" | "stop" | "beep";
const handlers: Record<Action, () => void> = {
  move: () => console.log("i am moving"),
  stop: () => console.log("i am stopped"),
  beep: () => console.log("beeep!"),
};
const handlerAction = (action: Action) => handlers[action]();
```

And that is it! Now, when new action will come, you will be automatically notified that you need to update handlers. If you accidentally remove some code from handlers, you will be notified as well. Great TypeScript feature!

Same trick you can do using objects;

```typescript
type User = { name: string; age: number };
type ValidationMap = Record<keyof User, (user: User) => boolean>;

const validations: ValidationMap = {
  age: ({ age }) => age > 21,
  name: ({ name }) => name != null,
};
```

This was done with the help of the `keyof` keyword. It simply extracts keys from the interface or type and creates another type. Simply saying it looks like this:

```typescript
interface IPerson = {age: number, name: string};
type PersonProps = keyof IPerson; // 'age | name';
```

This tip is very useful for the validations when you want to ensure that all properties of the object are validated correctly.

You can extract types not only from object, but from array aswell:

```typescript
const roles = ["user", "admin"] as const;
const y: Record<typeof roles[number], boolean> = {
  user: true,
  admin: false,
};
```

But don't forget to use keyword `const` after the array declaration. This will ensure that your array is immutable and TypeScript can infer types safely.

Another useful utility type, you might be already familiar with is `Partial<T>` type. It is very handy when you have big domain models, that are filled from the API or user input and might be partially filled. In this case, you can use Partial type and TypeScript will suggest you verify input and saves you from `Cannot read property toString of null`:

```typescript
type User = {
  name: string;
  age: number;
};

type UntrustedUser = Partial<User>;

const fetchUser = (): UntrustedUser => ({});

console.log(fetchUser().age.toString()); // here TypeScript will throw an error: Object is possibly 'undefined'.(2532).
```

`Partial<T>` is a very useful utility type, however it has on issue. It is not populated for the nested objects. So you can use this code to write your own DeepPartial type:

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

Speaking about partial types, I can't ignore two more helpful classes - `Omit` and `Exclude`. It helps you to exclude or override some properties based on already created class:

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

As you can see, using this technique you don't need to copy-paste user type. You just transform it into something that fits better. If you need to omit more properties, just use Union type here:

```typescript
type CuttedUser =  Omit<User, "email" | "email">;
```

`Exclude` type used for the same purposes, but it deals with types, instead of key:

```typescript
type UserType = "user" | "admin";
type AdminType = "admin";

type RegularUser = Exclude<UserType, AdminType>;

const user: RegulerUser = "user"; // const user: RegulerUser = "admin" will produce an error: Type '"admin"' is not assignable to type '"user"'
```

That is all. See you next time!
