# typescript-paths

[npm:latest]: https://www.npmjs.com/package/typescript-paths/v/latest
[npm:latest:badge]: https://img.shields.io/npm/v/typescript-paths/latest?style=flat-square

[![Latest Version][npm:latest:badge]][npm:latest]

Resolving tsconfig paths in runtime

```sh
npm i typescript-paths
```

rollup.config.js

```js
const { register } = require("typescript-paths")
register()
```

Example tsconfig.json

```json
{
  "compilerOptions": {
    "paths": {
      "~/*": ["./*"]
    }
  }
}
```

Then you can import alias instead of annoying path

```js
// import App from "../../../../App"
import App from "~/App"

...

```

## Options

### tsConfigPath _(string)_

Specify set where your TypeScript configuration file.

If not set:

- use Environment variable **TS_NODE_PROJECT**
- or search tsconfig.json in current working directory.

### logLevel _("warn" | "debug" | "none") (default: "warn")_

Log level when the plugin is running.

## reference

- https://www.typescriptlang.org/docs/handbook/module-resolution.html#path-mapping
- https://github.com/microsoft/TypeScript/issues/5039
