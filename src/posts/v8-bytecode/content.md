# How to get javascript bytecode from V8 and others in 2019

Have you ever thought about how your javascript code looks like in bytecode? If yes, just follow the white rabbit.

Install latest Node.Js or check your current version using -v command. If it's 8.3 or above, everything is ok. If no, check the second part of this article.

Then run your code with a flag --print-bytecode. It will instruct the Node to display the bytecode directly to your console.

```cmd
node --print-bytecode --eval 1+1
```

After executing this command you will see a very long list with a code like this:

```asm
Parameter count 2
Register count 3
Frame size 24
   12 E> 000002252055F082 @    0 : a5                StackCheck
   33 S> 000002252055F083 @    1 : 0b                LdaZero
         000002252055F084 @    2 : 26 fb             Star r0
```

> If you are curious about what it is and how to read this - here is a good [point to start](https://medium.com/dailyjs/understanding-v8s-bytecode-317d46c94775).

But what if you want to see only some part of the code, let's say some function? Luckily, we have one more flag to filter bytecode by function's name ---print-bytecode-filter.

```cmd
node --print-bytecode --print-bytecode-filter=func_name my_javascript_file
```

I also pointed Node.Js to read code from my_javascript_file instead of evaluation. Another useful thing is that you can dump the result into another file with pipe operator (for PowerShell), so the final command can look like this:

```cmd
node --print-bytecode --print-bytecode-filter=func_name my_javascript_file > result.txt
```

And that's it - really simple, I would say! But we can do a bit deeper because sometimes this is not enough and there are two reasons for this:

First thing is that guys from Node.Js did a really awesome job and split Node.js out from the engine. This means that in real life, your Node.Js can use not V8 from Google team, but Chakra engine from Microsoft or SpiderMonkey or even something else! And you might want to see bytecode from a selected engine.

Another point is that when you use Node.Js, you always use production build which is reasonable. But in the release version, some interesting flags are hidden from us. For example, you can't get AST tree, you get a shorter version of the bytecode (yes, it can be even more detailed). So, if you want to get all the power, you should get a debug version of Node.Js.

For quite a long time before, to achieve this you had to download all related source code for the engine you wanted and compile it by yourself. This has been a real pain, especially for Windows users. But, times changed and thanks to the [jsvu](https://github.com/GoogleChromeLabs/jsvu) team, we`ve got a really simple way to get any engine we need, even a debug version for V8. Thanks, guys, you are really awesome!

So, let's say you want to get V8's debug version. All you need is to run this simple command:

```cmd
npx jsvu
```

And that's all! You will be prompted with a few questions (about OS, engines you want to get, etc) and then you will get all already built and ready engines you want! Isn't that awesome?

## More Useful flags

* --print-ast will print Abstract Syntax Tree for your code (v8-debug only)
* --print-opt-code/--print-opt-code-filter will print optimized code (really hard to read)  (node, v8-debug)
* --trace-turbo/--trace-turbo-filter - will show optimization filter for TurboFan compiler (any)
* --print-code --print-code-verbose will print even more information for the code  but has no filter for function name (any)

If you want to see all the flags available for [v8](https://gist.github.com/Drag13/345136498ee2f2605f188f22d2258af0) and [v8-debug](https://gist.github.com/Drag13/92089a081a0056dd6872b77c2af88d94), just check the links above. (Applicable for  V8 v7.5.203)

## Useful links

* [Understanding bytecode from V8](https://medium.com/dailyjs/understanding-v8s-bytecode-317d46c94775)
* [V8 bytescodes](https://github.com/v8/v8/blob/master/src/interpreter/bytecodes.h)
* [V8 bytecodes with comments](https://github.com/v8/v8/blob/master/src/interpreter/interpreter-generator.cc)

That's it guys, thanks for your time, hope you found this fun enough.
