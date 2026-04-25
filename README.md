# runn
This is a mini-library that makes working with JavaScript Promises less verbose and less stressful.

## Motivation

This library is strictly for experimental and teaching purposes only. It can be used to teach **Concurrency in JavaScript**.

## Getting Started

This library does 3 things well:

1. It abstracts over promises in a way that makes error handling with `.catch(...)` less verbose and more compact.
2. It modifies the error stacktrace (`.stack` property) such that it chains all errors than occured deep in the call chain with all parent contexts intact.
3. It removes or abstracts away the difference between _synchronous_ and _asynchronous_ functions. 

## Example Code  (NodeJS)

```javascript
const runn = require('runn');
const { doSomethingFunc, doAnotherThingFunc, doAnotherBigThingFunc } = require('./tasks');

const __main__ = async () => {
  runn.$$sync = {};
  try {
    const { value: output } = await (
      runn(main)
        .getResult
          .orThrow(
            "This program crashed!!"
          )
          .die()
    );
    return output;
  } catch (error) {
    runn.$$dispatchErrorEvent(error);
    throw error;
  } finally {
    runn.$$sync = null;
  }
};

module.exports = __main__;

function main () {
  if (process.env.NODE_ENV === "TEST") {
    return (
      runn(doSomethingFunc)
        .getResult
          .asA
          .promise
    );
  }

  return (
    runn(doSomethingFunc)
      .getResult
        .orThrow(
          new Error("The `main` function failed");
        )
        .then(doAnotherThingFunc)
        .then(doAnotherBigThingFunc)
        .end()
  );
}
```

## Example Code (Browser)

><img width="513" alt="Screenshot 2025-06-05 at 11 38 00 PM" src="https://github.com/user-attachments/assets/e242f159-2311-4f97-86db-85248c80aef5" />

><img width="1680" height="470" alt="Screenshot 2026-04-25 at 6 12 01 PM" src="https://github.com/user-attachments/assets/36948da3-a3a6-4d9c-a8b8-beb61a5b4d13" />


#### Using A Script Tag

```html
<script type="text/javascript" src="https://cdn.jsdelivr.net/gh/isocroft/runn@0.0.2/dist/runn.min.js"></script>
```

## Licence

MIT
