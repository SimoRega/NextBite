import type { Food, MealItem, Nutrients } from "../nutrition/domain";
export const foods: Food[] = [
  {
    id: "pasta",
    name: "Pasta di semola",
    basis: "Peso a crudo",
    kcal: 353,
    protein: 13,
    carbs: 71,
    fat: 1.5,
  },
  {
    id: "chicken",
    name: "Petto di pollo",
    basis: "Cotto, senza condimenti",
    kcal: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
  },
  {
    id: "oil",
    name: "Olio extravergine di oliva",
    basis: "Come consumato",
    kcal: 900,
    protein: 0,
    carbs: 0,
    fat: 100,
  },
  {
    id: "rice",
    name: "Riso basmati",
    basis: "Peso a crudo",
    kcal: 355,
    protein: 8,
    carbs: 78,
    fat: 1,
  },
  {
    id: "zucchini",
    name: "Zucchine",
    basis: "Peso a crudo",
    kcal: 17,
    protein: 1.2,
    carbs: 2,
    fat: 0.3,
  },
  {
    id: "banana",
    name: "Banana",
    basis: "Parte edibile",
    kcal: 89,
    protein: 1.1,
    carbs: 23,
    fat: 0.3,
  },
  {
    id: "bread",
    name: "Pane integrale",
    basis: "Come consumato",
    kcal: 247,
    protein: 9,
    carbs: 41,
    fat: 4,
  },
  {
    id: "turkey",
    name: "Fesa di tacchino",
    basis: "Affettato",
    kcal: 110,
    protein: 22,
    carbs: 2,
    fat: 1.5,
  },
  {
    id: "apple",
    name: "Mela",
    basis: "Parte edibile",
    kcal: 52,
    protein: 0.3,
    carbs: 14,
    fat: 0.2,
  },
  {
    id: "chickpeas",
    name: "Ceci cotti",
    basis: "Cotti e scolati",
    kcal: 164,
    protein: 8.9,
    carbs: 27,
    fat: 2.6,
  },
  {
    id: "tomato",
    name: "Pomodorini",
    basis: "Peso a crudo",
    kcal: 18,
    protein: 0.9,
    carbs: 3.9,
    fat: 0.2,
  },
  {
    id: "salmon",
    name: "Salmone",
    basis: "Peso a crudo",
    kcal: 208,
    protein: 20,
    carbs: 0,
    fat: 13,
  },
  {
    id: "potato",
    name: "Patate",
    basis: "Peso a crudo",
    kcal: 77,
    protein: 2,
    carbs: 17,
    fat: 0.1,
  },
  {
    id: "yogurt",
    name: "Yogurt greco senza lattosio",
    basis: "Come consumato",
    kcal: 60,
    protein: 10,
    carbs: 4,
    fat: 0,
  },
  {
    id: "oats",
    name: "Fiocchi di avena",
    basis: "Peso a secco",
    kcal: 370,
    protein: 13,
    carbs: 60,
    fat: 7,
  },
  {
    id: "egg",
    name: "Uovo",
    basis: "Parte edibile, senza guscio",
    kcal: 143,
    protein: 13,
    carbs: 1,
    fat: 10,
  },
];
export type Recipe = {
  id: string;
  name: string;
  description: string;
  minutes: number;
  image: string;
  lactoseFree: boolean;
  ingredients: { foodId: string; grams: number }[];
  steps: string[];
};
export const recipes: Recipe[] = [
  {
    id: "rice-chicken",
    name: "Riso con pollo e zucchine",
    description: "Semplice, completo e pronto per la tua giornata.",
    minutes: 25,
    image: "/images/rice.jpg",
    lactoseFree: true,
    ingredients: [
      { foodId: "rice", grams: 80 },
      { foodId: "chicken", grams: 120 },
      { foodId: "zucchini", grams: 200 },
      { foodId: "oil", grams: 10 },
    ],
    steps: [
      "Cuoci il riso in acqua seguendo i tempi sulla confezione.",
      "Taglia le zucchine e cuocile in padella con parte dell’olio.",
      "Cuoci completamente il pollo, unisci al riso e alle zucchine e condisci. Il peso del pollo indicato è da cotto.",
    ],
  },
  {
    id: "pasta-chickpeas",
    name: "Pasta con ceci e pomodorini",
    description: "Una proposta vegetale, pratica e ricca di gusto.",
    minutes: 20,
    image: "/images/pasta.jpg",
    lactoseFree: true,
    ingredients: [
      { foodId: "pasta", grams: 80 },
      { foodId: "chickpeas", grams: 100 },
      { foodId: "tomato", grams: 150 },
      { foodId: "oil", grams: 8 },
    ],
    steps: [
      "Cuoci la pasta.",
      "Scalda in padella i ceci scolati con i pomodorini e l’olio.",
      "Unisci la pasta e mescola con un poco di acqua di cottura.",
    ],
  },
  {
    id: "salmon-potato",
    name: "Salmone con patate",
    description: "Una cena semplice, con pochi ingredienti.",
    minutes: 30,
    image: "/food-placeholder.svg",
    lactoseFree: true,
    ingredients: [
      { foodId: "salmon", grams: 150 },
      { foodId: "potato", grams: 250 },
      { foodId: "zucchini", grams: 150 },
      { foodId: "oil", grams: 8 },
    ],
    steps: [
      "Taglia le patate a piccoli pezzi e cuocile in forno.",
      "Aggiungi zucchine e salmone, condisci con l’olio.",
      "Completa la cottura e servi.",
    ],
  },
  {
    id: "toast-banana",
    name: "Pane tostato e banana",
    description: "Uno spuntino veloce da preparare.",
    minutes: 5,
    image: "/images/toast.jpg",
    lactoseFree: true,
    ingredients: [
      { foodId: "bread", grams: 60 },
      { foodId: "banana", grams: 120 },
    ],
    steps: ["Tosta il pane.", "Servi con la banana a fette."],
  },
];
export function recipeItems(recipe: Recipe, portions = 1): MealItem[] {
  return recipe.ingredients.map((i) => ({
    id: crypto.randomUUID(),
    food: foods.find((f) => f.id === i.foodId)!,
    grams: i.grams * portions,
  }));
}
const aliases: Record<string, string[]> = {
  pasta: ["pasta", "spaghetti"],
  chicken: ["pollo", "petto di pollo"],
  oil: ["olio", "olio extravergine"],
  rice: ["riso", "riso basmati"],
  banana: ["banana"],
  bread: ["pane", "pane integrale", "panino"],
  turkey: ["tacchino", "fesa di tacchino"],
  apple: ["mela"],
  chickpeas: ["ceci"],
  tomato: ["pomodori", "pomodorini"],
  yogurt: ["yogurt"],
  oats: ["avena"],
  egg: ["uovo", "uova"],
  salmon: ["salmone"],
  potato: ["patate"],
  zucchini: ["zucchine"],
};
export function parseMeal(
  text: string,
  catalog: Food[] = foods,
): { items: MealItem[]; unrecognized: string[] } {
  const normalized = text
    .toLowerCase()
    .replace(
      /(ho mangiato|ho bevuto|registra|aggiungi|al pranzo|a cena|per colazione)/g,
      "",
    )
    .trim();
  const chunks = normalized
    .split(/(?<!\d),|,(?!\d)|\s+e\s+|;/)
    .map((s) => s.trim())
    .filter(Boolean);
  const items: MealItem[] = [];
  const unrecognized: string[] = [];
  for (const chunk of chunks) {
    const match = chunk.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|grammi|ml)\b/);
    const spoon = /un cucchiaio|1 cucchiaio/.test(chunk);
    const food = catalog.find((f) =>
      [f.name.toLowerCase(), ...(aliases[f.id] ?? [])].some((alias) =>
        chunk.split(/\s+/).join(" ").includes(alias),
      ),
    );
    if (
      !food ||
      (!match && !(spoon && food.id === "oil")) ||
      match?.[2] === "ml"
    ) {
      unrecognized.push(chunk);
      continue;
    }
    const grams =
      spoon && food.id === "oil" && !match
        ? 10
        : Number(match![1].replace(",", ".")) * (match![2] === "kg" ? 1000 : 1);
    if (grams > 0 && grams <= 3000)
      items.push({ id: crypto.randomUUID(), food, grams });
    else unrecognized.push(chunk);
  }
  return { items, unrecognized };
}
export function formatNumber(value: number) {
  return Math.round(value).toLocaleString("it-IT");
}
export const macroLabels: Record<keyof Omit<Nutrients, "kcal">, string> = {
  protein: "Proteine",
  carbs: "Carboidrati",
  fat: "Grassi",
};
