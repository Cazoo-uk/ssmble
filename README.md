SSMble - a handy dandy config reader for AWS Parameter Store
------------------------------------------------------------

Here at Cazoo we recommend that applications fetch config at runtime from the
parameter store in SSM. This saves us from putting secrets into environment vars
and neatly separates config from deployment.

`ssmble` is a simple wrapper for the AWS SDK that makes building configuration simpler.

Usage
-----

Authoring a Configuration Template
===================================

SSMble works by mapping SSM parameters to the fields of an object literal.

Assuming the following parameters stored in SSM:

```
/my-service
   /secretText
   /options
     /name
     /age
   /bigness
   /isEnabled
```

We might choose to build the following configuration object.

```js
import { cfg } from 'ssmble'

// This template object describes the shape of our config
const template = {

  // the `str` function describes a required string
  secretText: cfg.str(),
  
  // the `int` function describes a required integer
  bigness: cfg.int(),
  
  // the bool function describes a required boolean
  isEnabled: cfg.bool(),
  
  // template objects nest
  options: {

    // each `cfg` function has a `maybe` equivalent that takes
    // optional default, and returns `undefined` if the value
    // is missing.
    name: maybeStr(),
    age: maybeInt( { default: 38 }),
  }
}
```

Fetching configuration
=====================

The `getConfig2` function makes the call to SSM and returns either a config object, or an Error result. The `Is` type provides type guards that let us check for success or failure in a type-safe way.

```js
import { getConfig2, Is } from 'ssmble'

export async function loadConfig() {
  
  const response = await getConfig2(template, '/my-service')
  
  if (Is.missingFields(response)) {
    throw new Error(`Failed to load config due to missing fields ${response.fields}`)
  }
  
  return result 
}
```

Limitations
===========
 * Your code bundler will need to support `experimentalDecorators` and `emitDecoratorMetadata`. Currently [esbuild as of version 0.4.10](https://github.com/evanw/esbuild/blob/master/CHANGELOG.md#0410) supports the former but not the latter so you will need to switch to webpack.
 * Currently deeply nested parameters can not be fetched in a single `getConfig` call and will need to be fetched separately 
