# ts-paths-resolve-plugin

[npm:latest]: https://www.npmjs.com/package/ts-paths-resolve-plugin/v/latest
[npm:latest:badge]: https://img.shields.io/npm/v/ts-paths-resolve-plugin/latest?style=flat-square

[![Latest Version][npm:latest:badge]][npm:latest]

A webpack resolve plugin for resolving tsconfig paths.

```sh
npm install --save-dev ts-paths-resolve-plugin
```

Configurate in `webpack.config.js`:

```js

const { TsPathsResolvePlugin } = require('ts-paths-resolve-plugin');

module.exports = {
  plugins: [new TsPathsResolvePlugin()],
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
  }
}
```

`tsconfig.json` example:

```json
{
  "compilerOptions": {
    "paths": {
      "~/*": ["./*"]
    }
  }
}

```

And you can import with alias instead of annoying path

```js
// import App from "../../../../App"
import App from "~/App"

...

```

## Options

### tsConfigPath _(string | string[])_

Specify set where your TypeScript configuration file.

If not set:

- use Environment variable **TS_NODE_PROJECT**
- or search tsconfig.json in current working directory.

### logLevel _("none" | "error" | "warn" | "info" | "debug" | "trace") (default: "info")_

Log level when the plugin is running.

## reference

- https://www.typescriptlang.org/docs/handbook/module-resolution.html#path-mapping
- https://github.com/microsoft/TypeScript/issues/5039
