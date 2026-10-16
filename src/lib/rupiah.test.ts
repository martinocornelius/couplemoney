import { test } from "node:test";
import assert from "node:assert/strict";
import { formatRupiah } from "./rupiah.ts";

test("formats whole rupiah with dot separators", () => {
  assert.equal(formatRupiah(25000), "Rp 25.000");
  assert.equal(formatRupiah(0), "Rp 0");
  assert.equal(formatRupiah(999), "Rp 999");
  assert.equal(formatRupiah(1000), "Rp 1.000");
  assert.equal(formatRupiah(1250000), "Rp 1.250.000");
});

test("rounds to whole rupiah", () => {
  assert.equal(formatRupiah(1499.6), "Rp 1.500");
});

test("puts the minus sign before Rp", () => {
  assert.equal(formatRupiah(-25000), "-Rp 25.000");
});
