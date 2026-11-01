// Polarity must survive keyword extraction.
//
// The stop-word list used to drop "not", "never", "no", "nor", "none" AND
// "always", so a note saying "never use the legacy client" and one saying
// "always use the legacy client" produced an identical keyword set and were
// therefore indistinguishable to search. For a memory store whose whole job is
// recalling the user's rules, that is the worst possible failure: it is silent,
// and it returns a confident answer meaning the opposite of what was stored.
//
// The FTS index covers the raw title/body/tags (content='notes'), so these
// words are present in the index already -- only the query-side extraction was
// throwing them away. Keeping them needs no reindex.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { extractKeywords } from "../src/keywords.js";

describe("negation and emphasis survive keyword extraction", () => {
  test("'never' is kept", () => {
    assert.ok(extractKeywords("never use the legacy client").includes("never"));
  });

  test("'always' is kept", () => {
    assert.ok(extractKeywords("always use the legacy client").includes("always"));
  });

  test("opposite rules do not produce the same keywords", () => {
    const never = extractKeywords("never use the legacy client");
    const always = extractKeywords("always use the legacy client");
    assert.notDeepEqual(
      never,
      always,
      "'never use X' and 'always use X' must not be indistinguishable"
    );
  });

  test("every polarity word we rely on is searchable", () => {
    for (const w of ["not", "never", "no", "nor", "none", "always", "only", "cannot"]) {
      assert.ok(
        extractKeywords(`you should ${w} deploy on friday`).includes(w),
        `"${w}" carries meaning and must not be dropped`
      );
    }
  });

  test("negated contractions keep their negation", () => {
    // FTS5 splits "don't" into "don" + "t", so "don" is what is in the index.
    const k = extractKeywords("don't deploy on friday");
    assert.ok(k.includes("don"), "the negation half of a contraction must survive");
  });

  test("ordinary filler is still dropped", () => {
    const k = extractKeywords("the and of to a an is it with for");
    assert.deepEqual(k, [], "common filler carries no meaning and must still be stripped");
  });

  test("a real rule keeps its subject as well as its polarity", () => {
    const k = extractKeywords("never commit secrets to the repo");
    assert.ok(k.includes("never"));
    assert.ok(k.includes("secrets"), "the subject must survive too");
  });
});
