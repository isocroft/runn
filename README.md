# runn
This is a mini-library that makes working with JavaScript Promises less verbose and stressful.

## Getting Started

This library is strictly for experimental and teaching purposes only. It can be used to teach **Concurrency in JavaScript**.

## Example Code

```javascript
const runn = require('runn');
const { doSomethingFunc, doAnotherThingFunc, doAnotherBigThingFunc } = require('----');

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
