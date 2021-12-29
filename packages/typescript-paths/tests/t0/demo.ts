import { doSomething } from "@xxx/abc/xxx"
import { COUNT } from "@xxx/fff"
import { rollup } from "roll"
import { doSomething as xyz } from "#m/abc"
import hello from "~/hello"
import { hello as h } from "~/qqq/hello"
import xx from "@q"

import { normalize } from "@p"
normalize
// @ts-expect-error
import { escape } from "@p"

import { setV } from "#v"
hello()
h(2)
doSomething("/*/*/")
console.log(COUNT)
xyz
rollup
xx
setV
escape
