import { z } from "zod";
export const mealNames = ["Colazione", "Pranzo", "Cena", "Spuntini"] as const;
export type MealName = (typeof mealNames)[number];
export const nutrientsSchema = z.object({
  kcal: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
});
export type Nutrients = z.infer<typeof nutrientsSchema>;
export const profileSchema = z.object({
  name: z.string().trim().min(1).max(60),
  age: z.number().int().min(18).max(100),
  height: z.number().min(100).max(230),
  weight: z.number().min(35).max(300),
  sex: z.enum(["male", "female", "unspecified"]),
  activity: z.number().min(1.2).max(2.2),
  goal: z.enum(["balance", "lose", "maintain", "gain", "performance"]),
  lactoseFree: z.boolean(),
  athlete: z.boolean(),
  timezone: z.string().min(1),
  target: nutrientsSchema,
});
export type Profile = z.infer<typeof profileSchema>;
export const foodSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  basis: z.string().min(1).max(80),
  ...nutrientsSchema.shape,
});
export type Food = z.infer<typeof foodSchema>;
export const itemSchema = z.object({
  id: z.string(),
  food: foodSchema,
  grams: z.number().positive().max(3000),
});
export type MealItem = z.infer<typeof itemSchema>;
export const mealSchema = z.object({
  id: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  name: z.enum(mealNames),
  items: z.array(itemSchema).min(1),
  createdAt: z.string(),
});
export type Meal = z.infer<typeof mealSchema>;
export const workoutSchema = z.object({
  id: z.string(),
  date: z.string(),
  sport: z.string().min(1).max(80),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  duration: z.number().int().min(5).max(600),
  intensity: z.enum(["Leggera", "Moderata", "Intensa"]),
});
export type Workout = z.infer<typeof workoutSchema>;
export const stateSchema = z.object({
  version: z.literal(1),
  profile: profileSchema.nullable(),
  meals: z.array(mealSchema),
  water: z.array(
    z.object({
      id: z.string(),
      date: z.string(),
      ml: z.number().positive().max(5000),
    }),
  ),
  weights: z.array(
    z.object({
      id: z.string(),
      date: z.string(),
      kg: z.number().min(35).max(300),
    }),
  ),
  workouts: z.array(workoutSchema),
  customFoods: z.array(foodSchema),
  favorites: z.array(z.string()),
  plan: z.array(
    z.object({ id: z.string(), date: z.string(), recipeId: z.string() }),
  ),
  savedMeals: z.array(
    z.object({ id: z.string(), name: z.string(), items: z.array(itemSchema) }),
  ),
});
export type AppState = z.infer<typeof stateSchema>;
export const emptyState: AppState = {
  version: 1,
  profile: null,
  meals: [],
  water: [],
  weights: [],
  workouts: [],
  customFoods: [],
  favorites: [],
  plan: [],
  savedMeals: [],
};
export const zero: Nutrients = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
export function sumItems(items: MealItem[]): Nutrients {
  return items.reduce(
    (acc, item) => {
      for (const key of ["kcal", "protein", "carbs", "fat"] as const)
        acc[key] += (item.food[key] * item.grams) / 100;
      return acc;
    },
    { ...zero },
  );
}
export function sumMeals(meals: Meal[]): Nutrients {
  return sumItems(meals.flatMap((m) => m.items));
}
export function dayKey(date = new Date(), timezone = "Europe/Rome"): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  return `${parts.find((p) => p.type === "year")!.value}-${parts.find((p) => p.type === "month")!.value}-${parts.find((p) => p.type === "day")!.value}`;
}
export function shiftDay(key: string, offset: number) {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}
export function initialTarget(
  p: Pick<Profile, "weight" | "height" | "age" | "sex" | "activity" | "goal">,
): Nutrients {
  const sexTerm = p.sex === "male" ? 5 : p.sex === "female" ? -161 : -78;
  const bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age + sexTerm;
  const adjust = p.goal === "lose" ? -250 : p.goal === "gain" ? 200 : 0;
  const kcal = Math.round((bmr * p.activity + adjust) / 50) * 50;
  const protein = Math.round(p.weight * (p.goal === "balance" ? 1.2 : 1.6));
  const fat = Math.round((kcal * 0.28) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { kcal, protein, carbs, fat };
}
export function weightTrend(weights: AppState["weights"]) {
  const daily = new Map<string, number[]>();
  for (const w of weights) {
    const values = daily.get(w.date) ?? [];
    values.push(w.kg);
    daily.set(w.date, values);
  }
  const points = [...daily.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({
      date,
      kg: values.reduce((a, b) => a + b, 0) / values.length,
    }));
  return points.map((p) => {
    const recent = points.filter(
      (q) => q.date <= p.date && q.date >= shiftDay(p.date, -6),
    );
    return {
      ...p,
      average: recent.reduce((a, b) => a + b.kg, 0) / recent.length,
    };
  });
}
export function insight(state: AppState, date: string): string {
  const totals = sumMeals(state.meals.filter((m) => m.date === date));
  const workout = state.workouts.find((w) => w.date === date);
  if (workout)
    return `Oggi hai ${workout.sport.toLowerCase()} alle ${workout.time}. Puoi organizzare uno spuntino e la cena intorno all’allenamento.`;
  if (totals.kcal === 0)
    return "Inizia dal primo pasto: puoi cercare un alimento, scrivere o raccontare cosa hai mangiato.";
  if (totals.kcal > (state.profile?.target.kcal ?? 0))
    return "Una giornata non definisce il percorso. Guarda l’andamento della settimana con tranquillità.";
  if (
    state.water.filter((w) => w.date === date).reduce((a, b) => a + b.ml, 0) <
    1000
  )
    return "Come va con l’acqua? Registrare un bicchiere ti aiuta a ricordare quanto hai bevuto.";
  return "Continua con i tuoi ritmi. Puoi trovare un’idea per il prossimo pasto nella sezione Ricette.";
}
