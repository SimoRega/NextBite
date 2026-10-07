import { test, expect } from "@playwright/test";
test("onboard, confirm a natural-language meal, log water and weight, reload persistence", async ({
  page,
}, testInfo) => {
  page.on("pageerror", (error) =>
    console.error("Browser error:", error.message),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Continua", exact: true }).click();
  await page.getByLabel("Come ti chiami?").fill("Test");
  await page.getByRole("button", { name: "Continua", exact: true }).click();
  await page.getByRole("button", { name: "Inizia", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Ciao, Test" })).toBeVisible();
  const command = page.getByRole("textbox", {
    name: "Descrivi un pasto o chiedi un’azione",
  });
  await command.fill("100 g di pasta e 150 g di pollo");
  await page.getByRole("button", { name: "Invia richiesta" }).click();
  const modal = page.getByRole("dialog");
  await expect(
    modal.getByText("Pasta di semola", { exact: true }).last(),
  ).toBeVisible();
  await modal.getByRole("button", { name: "Conferma e salva" }).click();
  await expect(
    page.getByText("Pasto salvato. Calorie e macro aggiornati."),
  ).toBeVisible();
  await command.fill("aggiungi 250 ml di acqua");
  await page.getByRole("button", { name: "Invia richiesta" }).click();
  await command.fill("peso 92.5");
  await page.getByRole("button", { name: "Invia richiesta" }).click();
  await page.getByRole("button", { name: "Salva pesata" }).click();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Ciao, Test" })).toBeVisible();
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("nextbite:v1")!),
  );
  expect(stored.meals).toHaveLength(1);
  expect(stored.meals[0].items).toHaveLength(2);
  expect(stored.water[0].ml).toBe(250);
  expect(stored.weights.at(-1).kg).toBe(92.5);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/home-${testInfo.project.name}.png`,
    fullPage: true,
  });
});
test("meal dialog can be dismissed with escape, recipes open and plan stays separate from diary", async ({
  page,
}) => {
  page.on("pageerror", (error) =>
    console.error("Browser error:", error.message),
  );
  await page.goto("/");
  await page
    .getByRole("button", { name: "Esplora con dati di esempio" })
    .click();
  await page.getByRole("button", { name: "Aggiungi", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.goto("/#discover");
  await page
    .getByRole("button", { name: "Riso con pollo e zucchine", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Aggiungi al piano", exact: true })
    .click();
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("nextbite:v1")!),
  );
  expect(state.plan).toHaveLength(1);
  expect(state.meals).toHaveLength(2);
});
