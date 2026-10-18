import { test } from "node:test";
import assert from "node:assert/strict";
import { formatRupiah, formatRupiahShort } from "./rupiah.ts";

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

test("short form uses rb, jt and M with a decimal comma", () => {
  assert.equal(formatRupiahShort(0), "Rp 0");
  assert.equal(formatRupiahShort(750), "Rp 750");
  assert.equal(formatRupiahShort(750000), "Rp 750 rb");
  assert.equal(formatRupiahShort(1500), "Rp 1,5 rb");
  assert.equal(formatRupiahShort(2500000), "Rp 2,5 jt");
  assert.equal(formatRupiahShort(5200000), "Rp 5,2 jt");
  assert.equal(formatRupiahShort(10000000), "Rp 10 jt");
  assert.equal(formatRupiahShort(1200000000), "Rp 1,2 M");
  assert.equal(formatRupiahShort(-5000000), "-Rp 5 jt");
});

test("short form moves up a unit instead of showing 1000", () => {
  assert.equal(formatRupiahShort(999950), "Rp 1 jt");
  assert.equal(formatRupiahShort(999999999), "Rp 1 M");
});
