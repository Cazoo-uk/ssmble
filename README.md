SSMble - a handy dandy config reader for AWS Parameter Store
------------------------------------------------------------

Here at Cazoo we recommend that applications fetch config at runtime from the
parameter store in SSM. This saves us from putting secrets into environment vars
and neatly separates config from deployment.

`ssmble` is a simple wrapper for the AWS SDK that makes building configuration
simpler.

Using Typescript decorators, we can automagically bind SSM parameter trees into
strongly-typed objects at runtime.

Usage
-----

Configuring The Typescript Compiler
===================================

SSMble requires that the flags `experimentalDecorators` and
`emitDecoratorMetadata` are enabled in your tsconfig.json. This allows the
library to inspect the types of your config class and bind them appropriately.

```
//tsconfig.json

{
  "compilerOptions": {
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
  },
}
```

Authoring a Configuration Class
===============================

SSMble works by mapping SSM parameters to the fields of a class.

Assuming the following parameters stored in SSM:

/my-service
   /secretText
   /endpoint
   /bigness
   /isEnabled

We might choose to build the following configuration object.

```
import {store, param, Is, getConfig} from 'ssmble'

// the `store` decorator binds this class to an SSM hierarchy

@store('/my-service')
class MyConfiguration {

  // the `param` decorator binds a class property to an SSM parameter

  @param()
  secretText: string
  
  @param()
  endpoint: string
  
  @param()
  bigness: number
  
  @param()
  isEnabled: boolean

}

```

Fetching configuration
=====================

The `getConfig` function makes the call to SSM and returns either a config object, or an Error result. The `Is` type provides type guards that let us check for success or failure in a type-safe way.

```
export async function loadConfig() {
    
    const response = getConfig(MyConfiguration)
    
    if (Is.result(response)) {
        return result
    }
}

```
