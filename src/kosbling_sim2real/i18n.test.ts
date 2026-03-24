import assert from "node:assert/strict";
import test from "node:test";

import { getI18n, resolveUiLocale } from "./i18n.js";

test("resolveUiLocale maps Chinese locales to zh-CN", () => {
  assert.equal(resolveUiLocale("zh-CN"), "zh-CN");
  assert.equal(resolveUiLocale("zh-Hans"), "zh-CN");
});

test("getI18n returns Chinese copy when locale is zh", () => {
  const t = getI18n("zh-CN");

  assert.equal(t.ideaPrompt, "请输入你的产品想法");
  assert.equal(t.direction("up"), "上升");
});
