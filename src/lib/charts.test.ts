import { test } from "node:test";
import assert from "node:assert/strict";
import { axisTicks, EVERYTHING_ELSE, percentages, pieSlices, shouldShowPie } from "./charts.ts";

const row = (label: string, amount: number) => ({ key: label, label, amount });

test("up to six categories each get their own slice, largest first", () => {
  const slices = pieSlices([row("a", 10), row("b", 60), row("c", 30), row("d", 5), row("e", 1), row("f", 2)]);
  assert.deepEqual(
    slices.map((s) => s.label),
    ["b", "c", "a", "d", "f", "e"],
  );
  assert.deepEqual(
    slices.map((s) => s.colorIndex),
    [0, 1, 2, 3, 4, 5],
  );
});

test("more than six categories: five slices plus Everything else", () => {
  const slices = pieSlices([70, 60, 50, 40, 30, 20, 10].map((a, i) => row(`c${i}`, a)));
  assert.equal(slices.length, 6);
  const last = slices[5];
  assert.equal(last.label, EVERYTHING_ELSE);
  assert.equal(last.colorIndex, null);
  assert.equal(last.amount, 30);
  assert.deepEqual(
    last.members.map((m) => m.label),
    ["c5", "c6"],
  );
});

test("zero amounts are left out", () => {
  assert.equal(pieSlices([row("a", 0), row("b", 5)]).length, 1);
});

test("only shows a pie with three or more categories", () => {
  assert.equal(shouldShowPie([row("a", 1), row("b", 2)]), false);
  assert.equal(shouldShowPie([row("a", 1), row("b", 2), row("c", 3)]), true);
});

test("percentages always add up to 100", () => {
  assert.deepEqual(percentages([1, 1, 1]), [34, 33, 33]);
  assert.deepEqual(percentages([1150, 900, 550, 300, 230, 70, 50]).reduce((a, b) => a + b, 0), 100);
  assert.deepEqual(percentages([0, 0]), [0, 0]);
});

test("axis ticks are round numbers covering the maximum", () => {
  assert.deepEqual(axisTicks(9000000), [0, 2500000, 5000000, 7500000, 10000000]);
  assert.deepEqual(axisTicks(2300000), [0, 1000000, 2000000, 3000000]);
  assert.deepEqual(axisTicks(0), [0, 1000]);
});
