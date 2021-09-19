import { doSomething } from "@xxx/abc/xxx"
import { COUNT } from "@xxx/fff"
import { rollup } from "roll"
import { doSomething as xyz } from "#m/abc"
import hello from "~/hello"
import { hello as h } from "~/qqq/hello"

hello()
h(2)
doSomething("/*/*/")
console.log(COUNT)
