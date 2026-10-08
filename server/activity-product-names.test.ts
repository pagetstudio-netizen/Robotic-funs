import assert from "node:assert/strict";
import test from "node:test";
import {
  formatActivityProductName,
  getNextActivityProductNumber,
} from "../shared/activity-product-names";

test("activity product names start at AVC1 when there are no activities", () => {
  assert.equal(formatActivityProductName(getNextActivityProductNumber([])), "Robotics-fund AVC1");
});

test("activity product numbering ignores stable products", () => {
  assert.equal(getNextActivityProductNumber([
    { name: "Produit stable", productType: "stable" },
  ]), 1);
});

test("activity product numbering continues after the largest existing AVC number", () => {
  assert.equal(getNextActivityProductNumber([
    { name: "Robotics-fund AVC1", productType: "activity" },
    { name: "Robotics-fund AVC4", productType: "activity" },
  ]), 5);
});

test("legacy activity names still reserve a sequence number", () => {
  assert.equal(getNextActivityProductNumber([
    { name: "Ancien nom", productType: "activity" },
    { name: "Robotics-fund AVC1", productType: "activity" },
  ]), 3);
});

test("activity product names reject invalid sequence numbers", () => {
  assert.throws(() => formatActivityProductName(0), RangeError);
});
