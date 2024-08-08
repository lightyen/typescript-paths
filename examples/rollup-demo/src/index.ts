import { value } from "he"
console.log("value", value)

import cx from "cx"
console.log(cx("hello", null, "world"))

import { check } from "./common/helper"

console.log("check", check(127))
