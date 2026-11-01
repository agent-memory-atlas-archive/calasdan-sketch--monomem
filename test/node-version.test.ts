// Which Node versions OneMemory accepts.
//
// OneMemory stores notes in SQLite through Node's built-in `node:sqlite`.
// That module landed in Node 22.5.0 and is importable without a flag from
// then on, so 22.5.0 is the real floor -- not 24. Requiring 24 locked out
// every user on the current Node 22 LTS line for no technical reason, which
// is the single biggest install barrier this package had.
//
// The check has to read the MINOR version too: Node 22.4.0 has no
// `node:sqlite` at all, so a major-only comparison would wave it through
// and the first database call would crash.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { nodeIsOk, MIN_NODE_TEXT } from "../src/setup.js";

describe("the Node version floor is 22.5.0, not 24", () => {
  test("every Node that ships node:sqlite is accepted", () => {
    for (const v of ["22.5.0", "22.6.0", "22.23.1", "23.0.0", "23.11.0", "24.0.0", "24.18.0", "25.1.0"]) {
      assert.equal(nodeIsOk(v), true, `${v} ships node:sqlite and must be accepted`);
    }
  });

  test("Node 22 before 22.5.0 is refused: node:sqlite does not exist yet", () => {
    for (const v of ["22.0.0", "22.1.0", "22.4.0", "22.4.9"]) {
      assert.equal(nodeIsOk(v), false, `${v} has no node:sqlite and must be refused`);
    }
  });

  test("older lines are refused", () => {
    for (const v of ["18.20.0", "20.0.0", "20.19.5", "21.7.3"]) {
      assert.equal(nodeIsOk(v), false, `${v} must be refused`);
    }
  });

  test("a version string with a prerelease or v prefix still parses", () => {
    assert.equal(nodeIsOk("v22.5.0"), true);
    assert.equal(nodeIsOk("24.0.0-nightly20240101"), true);
    assert.equal(nodeIsOk("v22.4.0"), false);
  });

  test("junk is refused rather than treated as new enough", () => {
    for (const v of ["", "abc", "x.y.z", "22", "22.x"]) {
      assert.equal(nodeIsOk(v), false, `${JSON.stringify(v)} must not pass the gate`);
    }
  });

  test("the message users see names the real floor", () => {
    // Printed by setup and by the CLI guard; must not say 24 any more.
    assert.match(MIN_NODE_TEXT, /^22\.5\.0$/);
  });
});
