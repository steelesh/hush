import assert from "node:assert/strict";
import { test } from "node:test";
import { alpha, argb, contrast, cover, luminance } from "../src/color.ts";

const black = "#000000";
const white = "#ffffff";
const grey = "#808080";
const red = "#ff0000";
const green = "#00ff00";
const blue = "#0000ff";

const near = (actual: number, expected: number, margin: number, label: string) =>
  assert.ok(Math.abs(actual - expected) <= margin, `${label}: ${actual} is not within ${margin} of ${expected}`);

test("relative luminance matches the wcag definition", () => {
  assert.equal(luminance(black), 0);
  near(luminance(white), 1, 1e-12, "white");
  near(luminance(red), 0.2126, 1e-12, "red");
  near(luminance(green), 0.7152, 1e-12, "green");
  near(luminance(blue), 0.0722, 1e-12, "blue");
  near(luminance(grey), 0.2158605, 1e-7, "middle grey");
});

test("contrast matches published wcag ratios and ignores order", () => {
  near(contrast(white, black), 21, 1e-9, "white on black");
  assert.equal(contrast(grey, grey), 1);
  near(contrast("#767676", white), 4.5422, 1e-4, "the lightest grey that passes aa on white");
  near(contrast("#777777", white), 4.4781, 1e-4, "the darkest grey that fails aa on white");
  near(contrast(red, white), 3.9985, 1e-4, "red on white");
  assert.equal(contrast(black, white), contrast(white, black));
});

test("alpha appends a two digit opacity and clamps it", () => {
  assert.equal(alpha(red, 0), "#ff000000");
  assert.equal(alpha(red, 0.5), "#ff000080");
  assert.equal(alpha(red, 1), "#ff0000ff");
  assert.equal(alpha(red, -1), "#ff000000");
  assert.equal(alpha(red, 2), "#ff0000ff");
});

test("cover finds the opacity at which one color laid over another comes closest to a target", () => {
  near(cover(white, grey, black), 128 / 255, 1e-12, "white over black to reach middle grey");
  assert.equal(cover(white, white, black), 1);
  assert.equal(cover(white, black, black), 0);
  assert.equal(cover(grey, white, black), 1);
  assert.equal(cover(black, grey, black), 1);
  near(cover("#ff8000", "#402000", black), 64 / 255, 1e-3, "a color along the line from the base");
});

test("argb writes an opaque 0xaarrggbb value", () => {
  assert.equal(argb("#9d9bad"), "0xff9d9bad");
});

test("anything but a lowercase #rrggbb color is rejected", () => {
  for (const bad of ["#FFFFFF", "#fff", "ffffff", "#ffffff80", "white", ""]) {
    for (const use of [luminance, argb, (color: string) => alpha(color, 1)]) {
      assert.throws(() => use(bad), /not a #rrggbb color/, `"${bad}" was accepted`);
    }
  }
});
