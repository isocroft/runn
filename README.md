# runn
This is a mini-library that makes working with JavaScript Promises less verbose and less stressful.

## Motivation

This library is strictly for experimental and teaching purposes only. It can be used to teach **Concurrency in JavaScript**.

## Getting Started

This library does 3 things well:

1. It abstracts over promises in a way that makes error handling with `.catch(...)` less verbose and compact.
2. It modifies the error `.stack` property such that it chains all errors than occured deep in the  call chain with a parent context error instance.
3. It removes the abstracts away the difference between _synchronous_ and _asynchronous_ functions. 

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

#### Using A Script Tag

```html
<script type="text/javascript" src="https://cdn.jsdelivr.net/gh/isocroft/runn@0.0.1/dist/runn.min.js"></script>
```

## Licence

MIT
