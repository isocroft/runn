const causePropertyIsMissingConfirmed = () => {
  var testError = new Error(
    "test message",
    { cause: "[test cause]" }
  );

  return !('cause' in testError);
};

const hasWebkitMutationObserverAPI = () => {
  if (typeof window === "undefined") {
    // Not a browser environment - most likely
    return false;
  }
  /* @NOTE: This API is not present in Safari v1.0.0 till v5.1.7 */
  /* @NOTE: This API is only present in Safari v6.0.0 and above */

  try {
    /* @HINT: Check for a specific JavaScriptCore API */
    if (typeof window.WebKitMutationObserver !== 'undefined') {
      return true;
    }
  } catch {
    // Feature not available, not JavaScriptCore Engine
  }
  return false;
};

const stackPropertyIsDataPropertyOnErrorInstance = (error = null) => {
  if (error && (error instanceof Error)) {
    return "stack" in error;
  }

  /* 
    @CHECK: 
      
    https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/stack#value
  */
  const descriptor = Object.getOwnPropertyDescriptor(Error.prototype, "stack");
  return !("stack" in (new Error("test message"))) && descriptor === undefined;
};

const canPatchErrorStackPropertyWithErrorCauses = () => {
  /*
    @FIXME [Unsure Of Logic Correctness]:
    
    The logic below may not be correct - I'm unsure
  */
  return (new Error("test message"))
    .toString()
      .toLowerCase()
        .indexOf("cause") === -1;
};

const patchEventTargetOnGlobalObject = () => {
  if (typeof window === "undefined") {
    if (typeof process !== "undefined") {
      // NodeJS or Electron environment
      process.window = new EventTarget();
    }
  }
};

const patchErrorPrototypeIfCausePropertyIsMissing = () => {
  if (causePropertyIsMissingConfirmed()) {
    /* @SHIM: Polyfill the  `cause` property on every `Error` object */
    Object.defineProperty(Error.prototype, 'cause', {
      configurable: true,
      enumerable: false,
      get () {
        return this._cause;
      },
      set (anyType) {
        this._cause = anyType;
      }
    });
  }
};

const patchErrorValueOfMethodIfCauseIsMissingFromErrorStackTrace = () => {
  if (canPatchErrorStackPropertyWithErrorCauses()) {
    Error.prototype.valueOf = function valueOf () {
      let initialErrorStackTrace = this.stack;
      let currentCause = this.cause;
      let modifiedErrorStackTrace =  "";
      let tabsIndentCount = 0;
      const is_SpiderMonkey_Engine = !stackPropertyIsDataPropertyOnErrorInstance(this);
      const is_JavaScriptCore_Engine = hasWebkitMutationObserverAPI();
      const rootCallStackTraceEntryRegex = is_SpiderMonkey_Engine || is_JavaScriptCore_Engine
        ? /((?:global code)?@(?:anonymous|[a-zA-Z0-9-_)(\]\[\.]):\d{1,}:\d{1,}(?=))/m
        : /(at (?:<anonymous>|[a-zA-Z0-9-_\)\(\]\[\.]):\d{1,}:\d{1,}(?=))/m;

      while (currentCause) {
        ++tabsIndentCount;
        const tabs = (
          new Array(tabsIndentCount)
        ).fill("\t").join('');
        if (modifiedErrorStackTrace === "") {
          modifiedErrorStackTrace += initialErrorStackTrace.replace(
            rootCallStackTraceEntryRegex,
            'reason: ' + (
              currentCause instanceof Error
                ? currentCause.stack.replace(
                    rootCallStackTraceEntryRegex,
                    `${tabs}$1`
                  )
                : JSON.stringify(currentCause)
              )
            );
        } else {
          modifiedErrorStackTrace += modifiedErrorStackTrace.replace(
            rootCallStackTraceEntryRegex,
            'reason: ' + (
              currentCause instanceof Error
                ? currentCause.stack.replace(
                    rootCallStackTraceEntryRegex,
                    `${tabs}$1`
                  )
                : JSON.stringify(currentCause)
              )
            );
        }
        currentCause = currentCause instanceof Error ? currentCause.cause : null;
      }

      if (modifiedErrorStackTrace !== "") {
        this.stack = modifiedErrorStackTrace;
      }

      return this;
    }
  }
};

const isErrorObject = (mayBeError) => {
  return mayBeError && (mayBeError instanceof Error);
};

const isNotErrorObject = (mayBeError) => {
  return !mayBeError || !(mayBeError instanceof Error)
};

const isPromiseObject = (mayBePromise) => {
  if (typeof mayBePromise === 'undefined' ||
    mayBePromise === null ||
      !(mayBePromise instanceof Object)) {
    return false
  }
  return Boolean(
    (typeof mayBePromise.then === 'function' 
     && (Object.prototype.toString.call(mayBePromise) === '[object Promise]'
      || mayBePromise.constructor.name === 'Promise'))
  );
};

const isNotPromiseObject = (mayBePromise) => {
  return !isPromiseObject(mayBePromise);
};

patchEventTargetOnGlobalObject();
patchErrorPrototypeIfCausePropertyIsMissing();
patchErrorValueOfMethodIfCauseIsMissingFromErrorStackTrace();


runn.$$groupAll = function (...promises) {
  const getCallbackForListOfValue = (listOfNames) => {
    return (listOfValues) => {
      return Promise.resolve(listOfValues.reduce((valueObject, value, index) => {
        valueObject[listOfNames[index]] = value;
        return valueObject;
      }, {}));
    };
  };

  return Promise.all(promises).then(getCallbackForListOfValue(
    promise.map((promise) => {
      return isNotPromiseObject(promise) ? '_' : promise.__name
    })
  )).catch((error) => {
    const syncObject = this.$$sync;

    if (syncObject !== null && typeof syncObject === "object") {
      if (typeof syncObject['addWaitError'] === 'function') {
        syncObject.addWaitError(error);
      }
    }
  });
}

runn.$$dispatchErrorEvent = (error) => {
  const event = new Event("log.promise.error_");
  event.error = error;
  event.timestampId = Date.now();
  if (typeof window === "undefined") {
    if (typeof process !== "undefined") {
      process.window.dispatchEvent(event);
    }
  } else {
    window.dispatchEvent(event);
  }
};



class Deffered {
    constructor (promise, rootError, $$sync, taskFnName, augErr) {

      let $error = rootError;

      if (isNotErrorObject(rootError)) {
        $error = typeof rootError === "string"
          ? new Error(rootError)
          : new Error(
            "Something went wrong: " + JSON.stringify(rootError)
          );
      }

      this._promise = promise;
      this.mainError = $error;
      this._taskFnName = taskFnName;
      this.syncObject = $$sync;
      this.augumentError =  augErr;
    }

    _patchErrorObjectAndDispatchToLogger (
      reasonError
    ) {
      /* @HINT: Using events to log errors */
      const event = new Event("log.promise.error_");

      this.mainError.cause = reasonError;

      const currentStackString = this.mainError.valueOf().stack;
      const endOfErrorMessageLineIndex = currentStackString.indexOf(
        '\n'
      );

      this.mainError.stack = (this.augumentError.stack.replace(
        /^Error(?:[^\n]*)\n/,
        currentStackString.substring(
          0,
          endOfErrorMessageLineIndex
        )
      ).replace(
        /\b(?:[\s]*)(at runn \((?:<anonymous>|[a-zA-Z0-9-_\)\(\]\[\.]):\d{1,}:\d{1,}\))(?:.*)/,
        'cause' in reasonError ? "\n\t\t$1" : "\n\t$1"
      ).replace(
        'runn',
        this._taskFnName
      ).trim()) + currentStackString.substring(endOfErrorMessageLineIndex + 1);
      
      event.error = this.mainError;
      event.timestampId = Date.now();

      /* @HINT: Dispatch error for logging */
      if (typeof window === "undefined") {
        if (typeof process !== "undefined") {
          process.window.dispatchEvent(event);
        }
      } else {
        window.dispatchEvent(event);
      }

      return this.mainError;
    }

    _normalizeReturnValuesOrError (
      mayBePromise,
      error,
      callbackName
    ) {

      if (mayBePromise instanceof Deffered) {
        return mayBePromise;
      }

      if (error === "<no error>") {
        let $promise = Promise.resolve(mayBePromise);
        $promise.__name = callbackName;
        return new Deffered(
          $promise,
          this.mainError,
          this.syncObject,
          callbackName,
          this.augumentError
        );
      }

      let $error = error;

      if (isNotErrorObject(error)) {
        $error = typeof error === "string"
          ? new Error(error)
          : new Error(
            "Something went wrong: " + JSON.stringify(error)
          );
      }

      $promise = Promise.reject($error);
      $promise.__name = callbackName;
      return new Deffered(
        $promise,
        this.mainError,
        this.syncObject,
        callbackName,
        this.augumentError
      );
    }

    then (callback) {
      if (typeof callback !== "function") {
        return this._promise.catch((reason) => {
          return this._patchErrorObjectAndDispatchToLogger(
            reason
          );
        });
      }

      return new Deffered(this._promise.then((result) => {
        let mayBePromise = undefined;
        let error = "<no error>";

        try {
          mayBePromise = callback.call(
            null,
            result
          );
        } catch (syncError) {
          error = syncError;
        }

        return isPromiseObject(mayBePromise)
          ? (mayBePromise.__name = callback.name, new Deffered(
              mayBePromise,
              this.mainError,
              this.syncObject,
              callback.name,
              this.augumentError
            ))
          : this._normalizeReturnValuesOrError(
            mayBePromise,
            error,
            callback.name
          );
      }, (reason) => {
          const $promise = Promise.reject(reason);
          $promise.__name = callback.name;
          return new Deffered(
            $promise,
            this.mainError,
            this.syncObject,
            callback.name,
            this.augumentError
          );
      }), this.mainError, this.syncObject, this._taskFnName, this.augumentError);
    }

    die () {
      return this.then().catch((patchedError) => {
        let syncObject = this.syncObject;

        try  {
          /* @HINT: Terminate - with a BANG! */
          throw patchedError;
        } finally {
          /* @HINT: Release retained references for GC cleanup */
          syncObject = null;
          // this.mainError = null;
          this._promise = null;
          this._taskFnName = null;
          this.augumentError = null;
          // this = null;
        }
      });
    }

    end () {
      const $promise = this.then().catch((patchedError) => {
        let syncObject = this.syncObject;

        if (syncObject !== null && typeof syncObject === "object") {
          if (typeof syncObject['realeaseFromWait'] === 'function') {
            syncObject.addWaitError(patchedError);
            syncObject.realeaseFromWait(this._taskFnName);
          }
        }

        return patchedError;
      });
      $promise.__name = this._promise.__name;
      return $promise;
    }
  }



function runn (taskFn = (() => Promise.resolve(null))) {

  let _error = null;
  let promise = null;

  const captureStackTraceHere = () => {
    const stubObject = { name: "Error", message: "" };
    if ("captureStackTrace" in Error) {
      Error.captureStackTrace(stubObject, captureStackTraceHere);
      _error = stubObject;
    } else {
      try {
        throw new Error("");
      } catch (err) {
        _error = err;
      }
    }
  };

  captureStackTraceHere();

  let syncObject = runn.$$sync;

  if (syncObject !== null && typeof syncObject === "object") {
    if (typeof syncObject['addToWait'] === 'function') {
      syncObject.addToWait(taskFn.name);
    }
  }

  try {
    promise = taskFn();
  } catch (syncError) {
    promise = syncError
  }

  return  {
    get getResult () {
      /* 
        @FIXME [Logic Clarity]:

        The logic for this part looks unclear
        
        Might have to clean it up some more
        later on...
      */
      if (isNotPromiseObject(promise)) {
        return {
          asA: {
            get promise () {
              console.warn(`'${taskFn.name}(...)' did not return a promise`);
              promise.__name = taskFn.name;
              return Promise.resolve(promise);
            },
            get value () {
              /* @HINT: {promise} might be an error */
              if (isErrorObject(promise)) {
                const $$error  = new Error(`'${taskFn.name}(...)' did not return a valid value`);
                $$error.cause = promise.valueOf();
                throw $$error;
              }
              return promise;
            }
          },
          orThrow (error) {
            /* @HINT: {promise} might be an error */
            if (isErrorObject(promise)) {
              const $promise = Promise.reject(promise.valueOf());
              $promise.__name = taskFn.name;
              return new Deffered(
                $promise,
                error,
                runn.$$sync,
                taskFn.name,
                _error
              );
            }

            const $promise = Promise.resolve(promise);
            $promise.__name = taskFn.name;
            return new Deffered(
              $promise,
              error,
              runn.$$sync,
              taskFn.name,
              _error
            );
          }
        }
      }

      return {
        asA: {
          get promise () {
            promise.__name = taskFn.name;
            return promise;
          },
          get value () {
            throw new Error(
              `'${taskFn.name}(...)' returned a promise`
            );
          }
        },
        orThrow (error) {
          promise.__name = taskFn.name;
          return new Deffered(
            promise,
            error,
            runn.$$sync,
            taskFn.name,
            _error
          );
        }
      };
    }
  };
}
