# vite-plugin-tsconfig-paths

[npm:latest]: https://www.npmjs.com/package/vite-plugin-tsconfig-paths/v/latest
[npm:latest:badge]: https://img.shields.io/npm/v/vite-plugin-tsconfig-paths/latest?style=flat-square

[![Latest Version][npm:latest:badge]][npm:latest]

Vite plugin for resolving tsconfig paths

```js
import { defineConfig } from "vite"
import { tsConfigPaths } from "vite-plugin-tsconfig-paths"

export default defineConfig({
	plugins: [tsConfigPaths()],
})
```

## reference

- https://www.typescriptlang.org/docs/handbook/module-resolution.html#path-mapping
- https://github.com/microsoft/TypeScript/issues/5039
