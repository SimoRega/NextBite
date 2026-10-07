import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialTarget,
  sumItems,
  dayKey,
  shiftDay,
  weightTrend,
  stateSchema,
  emptyState,
} from "../src/features/nutrition/domain";
import {
  foods,
  parseMeal,
  recipes,
  recipeItems,
} from "../src/features/foods/catalog";
test("quantities scale the declared nutrition without mutating the catalogue", () => {
  const pasta = foods.find((f) => f.id === "pasta")!;
  const actual = sumItems([{ id: "1", food: pasta, grams: 120 }]);
  assert.equal(actual.kcal, 423.6);
  assert.ok(Math.abs(actual.protein - 15.6) < 0.001);
  assert.equal(pasta.kcal, 353);
});
test("parser requires explicit grams and never invents unknown foods or densities", () => {
  const parsed = parseMeal(
    "120 g di pasta, 150 g di pollo e un cucchiaio d’olio",
  );
  assert.equal(parsed.items.length, 3);
  assert.deepEqual(
    parsed.items.map((i) => i.grams),
    [120, 150, 10],
  );
  const ambiguous = parseMeal("un panino e 200 ml di yogurt e 100 g di pizza");
  assert.equal(ambiguous.items.length, 0);
  assert.equal(ambiguous.unrecognized.length, 3);
  assert.equal(parseMeal("0 g di pasta").items.length, 0);
  assert.equal(parseMeal("4000 g di pollo").items.length, 0);
});
test("kg parsing and custom food matching", () => {
  assert.equal(parseMeal("0.2 kg di pollo").items[0].grams, 200);
});
test("target Mifflin St Jeor calculation is stable for a fixed profile", () => {
  assert.deepEqual(
    initialTarget({
      weight: 93,
      height: 183,
      age: 26,
      sex: "male",
      activity: 1.55,
      goal: "maintain",
    }),
    { kcal: 3000, protein: 149, carbs: 392, fat: 93 },
  );
});
test("date boundaries use the user timezone including DST", () => {
  assert.equal(
    dayKey(new Date("2026-10-07T22:30:00Z"), "Europe/Rome"),
    "2026-10-08",
  );
  assert.equal(
    dayKey(new Date("2026-12-07T22:30:00Z"), "Europe/Rome"),
    "2026-12-07",
  );
  assert.equal(shiftDay("2026-03-29", -1), "2026-03-28");
});
test("weight trend deduplicates a day and averages a real seven-day window", () => {
  const trend = weightTrend([
    { id: "1", date: "2026-01-01", kg: 100 },
    { id: "2", date: "2026-01-01", kg: 98 },
    { id: "3", date: "2026-01-03", kg: 97 },
    { id: "4", date: "2026-01-20", kg: 96 },
  ]);
  assert.equal(trend[0].kg, 99);
  assert.equal(trend[1].average, 98);
  assert.equal(trend[2].average, 96);
});
test("persisted state rejects invalid negative quantities and unsupported versions", () => {
  assert.ok(stateSchema.safeParse(emptyState).success);
  assert.ok(!stateSchema.safeParse({ ...emptyState, version: 2 }).success);
  assert.ok(
    !stateSchema.safeParse({
      ...emptyState,
      water: [{ id: "1", date: "2026-10-07", ml: -100 }],
    }).success,
  );
});
test("recipes use consistent portion scaling", () => {
  const one = sumItems(recipeItems(recipes[0]));
  const two = sumItems(recipeItems(recipes[0], 2));
  assert.equal(two.kcal, one.kcal * 2);
  assert.equal(two.protein, one.protein * 2);
});
test("Italian decimal comma is parsed as a quantity rather than meal separation", () => {
  const p = parseMeal("120,5 g di pasta, 150 g di pollo");
  assert.equal(p.items.length, 2);
  assert.equal(p.items[0].grams, 120.5);
});
