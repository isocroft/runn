# runn
This is a mini-library that makes working with JavaScript Promises less verbose and stressful.

## Getting Started

This library is strictly for experimental and teaching purposes only. It can be used to teach **Concurrency in JavaScript**.

## Example Code

```javascript
const { doSomethingFunc, doAnotherThingFunc, doAnotherBigThingFunc } = require('----');

const __main__ = async () => {
  run.$$sync = {};
  try {
    const { value: output } = await (
      run(main)
        .getResult
          .orThrow(
            "This program crashed!!"
          )
          .die()
    );
    return output;
  } catch (error) {
    run.$$dispatchErrorEvent(error);
    throw error;
  } finally {
    run.$$sync = null;
  }
};

module.exports = __main__;

function main () {
  if (process.env.NODE_ENV === "PROD") {
    return (
      run(doSomethingFunc)
        .getResult
          .asA
          .promise
    );
  }

  return (
    run(doSomethingFunc)
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
