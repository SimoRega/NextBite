"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CalendarDays,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  Droplets,
  Dumbbell,
  Home,
  Leaf,
  Lightbulb,
  LogOut,
  MessageCircle,
  Mic,
  Plus,
  Search,
  Send,
  Settings,
  ShoppingBasket,
  Sparkles,
  Trash2,
  TrendingUp,
  User,
  Utensils,
  X,
  Moon,
  Sun,
} from "lucide-react";
import {
  type AppState,
  type Profile,
  type MealItem,
  type Food,
  type MealName,
  mealNames,
  emptyState,
  dayKey,
  shiftDay,
  initialTarget,
  profileSchema,
  stateSchema,
  sumItems,
  sumMeals,
  weightTrend,
  insight,
} from "@/features/nutrition/domain";
import {
  foods,
  recipes,
  recipeItems,
  parseMeal,
  formatNumber,
  type Recipe,
} from "@/features/foods/catalog";
import { supabase } from "@/lib/supabase";
import { loadState, saveState, storageKey } from "@/lib/storage";
import { Energy, Macros, Modal, FoodImage, NutritionSummary } from "./ui";
type View =
  | "today"
  | "diary"
  | "progress"
  | "discover"
  | "coach"
  | "workouts"
  | "profile";
type Dialog = "meal" | "weight" | "workout" | "food" | "auth" | null;
const navigation = [
  { id: "today", label: "Oggi", icon: Home },
  { id: "diary", label: "Diario", icon: CalendarDays },
  { id: "progress", label: "Progressi", icon: TrendingUp },
  { id: "discover", label: "Scopri", icon: Utensils },
  { id: "coach", label: "Coach", icon: MessageCircle },
  { id: "workouts", label: "Allenamenti", icon: Dumbbell },
] as const;
const defaultDraft = {
  name: "",
  age: 30,
  height: 175,
  weight: 75,
  sex: "male" as Profile["sex"],
  activity: 1.55,
  goal: "maintain" as Profile["goal"],
  lactoseFree: false,
  athlete: false,
  timezone: "Europe/Rome",
  target: { kcal: 0, protein: 0, carbs: 0, fat: 0 },
};
interface SpeechResult {
  0: { transcript: string };
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: SpeechResult[] }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
export function NextBite() {
  const [state, setState] = useState<AppState>(structuredClone(emptyState));
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [view, setView] = useState<View>("today");
  const [date, setDate] = useState(dayKey());
  const [dialog, setDialog] = useState<Dialog>(null);
  const [toast, setToast] = useState("");
  const [undo, setUndo] = useState<AppState | null>(null);
  const [dark, setDark] = useState(false);
  const [profileDraft, setProfileDraft] = useState<Profile>(defaultDraft);
  const [step, setStep] = useState(0);
  const [command, setCommand] = useState("");
  const [listening, setListening] = useState(false);
  const speech = useRef<Recognition | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [mealName, setMealName] = useState<MealName>("Pranzo");
  const [mealItems, setMealItems] = useState<MealItem[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [mealTab, setMealTab] = useState<"search" | "describe" | "photo">(
    "search",
  );
  const [search, setSearch] = useState("");
  const [description, setDescription] = useState("");
  const [unrecognized, setUnrecognized] = useState<string[]>([]);
  const [weight, setWeight] = useState("");
  const [workout, setWorkout] = useState({
    sport: "Pallavolo",
    time: "19:30",
    duration: 90,
    intensity: "Moderata" as "Leggera" | "Moderata" | "Intensa",
  });
  const [editingWorkout, setEditingWorkout] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [portions, setPortions] = useState(1);
  const [discoverTab, setDiscoverTab] = useState<
    "recipes" | "plan" | "shopping"
  >("recipes");
  const [recipeSearch, setRecipeSearch] = useState("");
  const [fast, setFast] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [messages, setMessages] = useState<
    { role: "user" | "coach"; text: string }[]
  >([]);
  const [coachRecipes, setCoachRecipes] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<
    "login" | "signup" | "reset" | "recovery"
  >("login");
  const [busy, setBusy] = useState(false);
  const [cloudStatus, setCloudStatus] = useState("");
  const [foodDraft, setFoodDraft] = useState({
    name: "",
    basis: "Valori per 100 g",
    kcal: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });
  const notify = useCallback((text: string) => setToast(text), []);
  useEffect(() => {
    try {
      setState(loadState());
    } catch {
      setStorageError(true);
      setToast(
        "Non riesco a leggere i dati salvati. Puoi esportarli o reimpostarli dal profilo.",
      );
    }
    setReady(true);
    const chosen = window.location.hash.slice(1);
    if ([...navigation.map((n) => n.id), "profile"].includes(chosen))
      setView(chosen as View);
    setDark(localStorage.getItem("nextbite:theme") === "dark");
    const change = () => {
      const id = window.location.hash.slice(1);
      if ([...navigation.map((n) => n.id), "profile"].includes(id))
        setView(id as View);
    };
    window.addEventListener("hashchange", change);
    return () => {
      window.removeEventListener("hashchange", change);
      speech.current?.stop();
    };
  }, []);
  useEffect(() => {
    if (!ready || storageError) return;
    try {
      saveState(state);
    } catch {
      setStorageError(true);
      setToast(
        "Salvataggio sul dispositivo non riuscito. Esporta i dati prima di chiudere.",
      );
    }
  }, [state, ready, storageError]);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    if (ready) localStorage.setItem("nextbite:theme", dark ? "dark" : "light");
  }, [dark, ready]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 6500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
      setUserEmail(data.session?.user.email ?? "");
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user.id ?? null);
      setUserEmail(session?.user.email ?? "");
      setCloudStatus("");
      if (event === "PASSWORD_RECOVERY") {
        setAuthMode("recovery");
        setDialog("auth");
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    return () => {
      if (photo) URL.revokeObjectURL(photo);
    };
  }, [photo]);
  const navigate = (id: View) => {
    setView(id);
    window.location.hash = id;
  };
  const closeDialog = useCallback(() => setDialog(null), []);
  const change = (fn: (s: AppState) => AppState, allowUndo = false) => {
    if (storageError) {
      notify("Salvataggio bloccato: esporta o reimposta i dati dal profilo.");
      return;
    }
    if (allowUndo) setUndo(structuredClone(state));
    setState(fn);
  };
  const dailyMeals = state.meals.filter((m) => m.date === date);
  const totals = sumMeals(dailyMeals);
  const target = state.profile?.target ?? {
    kcal: 2500,
    protein: 150,
    carbs: 300,
    fat: 70,
  };
  const water = state.water
    .filter((w) => w.date === date)
    .reduce((sum, w) => sum + w.ml, 0);
  const dailyWorkouts = state.workouts.filter((w) => w.date === date);
  const catalog = [...foods, ...state.customFoods];
  const trend = weightTrend(state.weights);
  const dateLabel = new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00Z`));
  function openMeal(
    items: MealItem[] = [],
    name: MealName = "Pranzo",
    id: string | null = null,
  ) {
    setMealItems(items.map((i) => ({ ...i, id: crypto.randomUUID() })));
    setMealName(name);
    setEditId(id);
    setSearch("");
    setDescription("");
    setUnrecognized([]);
    setMealTab("search");
    setDialog("meal");
  }
  function interpret(text: string) {
    const parsed = parseMeal(text, catalog);
    setMealItems(parsed.items);
    setUnrecognized(parsed.unrecognized);
    if (!parsed.items.length)
      notify(
        "Indica le quantità in grammi, per esempio: 80 g di pasta e 150 g di pollo.",
      );
  }
  function submitMeal() {
    if (
      !mealItems.length ||
      mealItems.some(
        (i) => !Number.isFinite(i.grams) || i.grams <= 0 || i.grams > 3000,
      )
    ) {
      notify(
        "Aggiungi almeno un alimento con quantità valida tra 1 e 3.000 g.",
      );
      return;
    }
    const meal = {
      id: editId ?? crypto.randomUUID(),
      date,
      name: mealName,
      items: mealItems,
      createdAt: new Date().toISOString(),
    };
    change(
      (s) => ({
        ...s,
        meals: [...s.meals.filter((m) => m.id !== editId), meal],
      }),
      true,
    );
    setDialog(null);
    setPhoto(null);
    notify("Pasto salvato. Calorie e macro aggiornati.");
  }
  function addWater(ml = 250) {
    change(
      (s) => ({
        ...s,
        water: [...s.water, { id: crypto.randomUUID(), date, ml }],
      }),
      true,
    );
    notify(`${ml} ml di acqua registrati.`);
  }
  function handleCommand(text = command) {
    if (!text.trim()) return;
    const normalized = text.toLowerCase();
    setCommand("");
    if (
      /acqua/.test(normalized) &&
      /\d+\s*(ml|litri|litro|l)\b/.test(normalized)
    ) {
      const m = normalized.match(/(\d+(?:[.,]\d+)?)\s*(ml|litri|litro|l)\b/)!;
      const amount =
        Number(m[1].replace(",", ".")) * (m[2] === "ml" ? 1 : 1000);
      if (amount > 0 && amount <= 5000) addWater(amount);
      else notify("Indica una quantità di acqua tra 1 e 5.000 ml.");
      return;
    }
    if (/peso|pesato|peso oggi/.test(normalized)) {
      setWeight(
        normalized.match(/\d+(?:[.,]\d+)?/)?.[0].replace(",", ".") ?? "",
      );
      setDialog("weight");
      return;
    }
    if (
      /^(aggiungi|registra).*allenamento|^allenamento\b|aggiungi.*pallavolo/.test(
        normalized,
      )
    ) {
      setEditingWorkout(null);
      setDialog("workout");
      return;
    }
    if (
      /cosa|consigli|idea|idee|suggerisci|come sta|prima|dopo|ho solo|minuti|salato/.test(
        normalized,
      )
    ) {
      navigate("coach");
      setMessages((m) => [
        ...m,
        { role: "user", text },
        {
          role: "coach",
          text:
            insight(state, date) +
            " Posso proporti qualche ricetta semplice: controlla ingredienti e porzioni in base alle tue preferenze.",
        },
      ]);
      setCoachRecipes(true);
      return;
    }
    openMeal(
      [],
      /colazione/.test(normalized)
        ? "Colazione"
        : /cena/.test(normalized)
          ? "Cena"
          : /spuntino/.test(normalized)
            ? "Spuntini"
            : "Pranzo",
    );
    setMealTab("describe");
    setDescription(text);
    interpret(text);
  }
  function startVoice() {
    if (listening) {
      speech.current?.stop();
      return;
    }
    const browser = window as unknown as {
      SpeechRecognition?: new () => Recognition;
      webkitSpeechRecognition?: new () => Recognition;
    };
    const Ctor = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!Ctor) {
      notify(
        "Il tuo browser non supporta la dettatura. Puoi usare la tastiera.",
      );
      return;
    }
    const rec = new Ctor();
    rec.lang = "it-IT";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setCommand(transcript);
      notify("Testo trascritto: controllalo e premi Invio.");
    };
    rec.onerror = (e) => {
      setListening(false);
      notify(
        e.error === "not-allowed"
          ? "Accesso al microfono negato. Puoi scrivere nella barra."
          : "Dettatura interrotta. Riprova o scrivi il testo.",
      );
    };
    rec.onend = () => setListening(false);
    speech.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      notify("Microfono non disponibile.");
    }
  }
  function selectPhoto(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) {
      notify("Scegli un’immagine fino a 8 MB.");
      return;
    }
    setPhoto(URL.createObjectURL(file));
    openMeal();
    setMealTab("photo");
    notify(
      "Foto allegata. In questa versione aggiungi e conferma gli alimenti manualmente.",
    );
  }
  function completeOnboarding() {
    const draft = { ...profileDraft, target: initialTarget(profileDraft) };
    const validated = profileSchema.safeParse(draft);
    if (!validated.success) {
      notify(
        "Controlla nome, età, altezza e peso. La versione iniziale è dedicata agli adulti.",
      );
      return;
    }
    change((s) => ({
      ...s,
      profile: validated.data,
      weights: [
        ...s.weights,
        { id: crypto.randomUUID(), date, kg: draft.weight },
      ],
    }));
    notify(
      "Il tuo punto di partenza è pronto. Puoi modificare i target nel profilo.",
    );
  }
  function exportData(raw = false) {
    const text = raw
      ? (localStorage.getItem(storageKey) ?? JSON.stringify(state))
      : JSON.stringify(state, null, 2);
    const url = URL.createObjectURL(
      new Blob([text], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `nextbite-${dayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  async function auth() {
    if (!supabase) return;
    setBusy(true);
    try {
      let error;
      if (authMode === "login")
        ({ error } = await supabase.auth.signInWithPassword({
          email,
          password,
        }));
      else if (authMode === "signup")
        ({ error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        }));
      else if (authMode === "recovery")
        ({ error } = await supabase.auth.updateUser({ password }));
      else
        ({ error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        }));
      if (error) throw error;
      notify(
        authMode === "signup"
          ? "Controlla l’email per confermare l’account."
          : authMode === "reset"
            ? "Controlla l’email per reimpostare la password."
            : "Operazione completata.",
      );
      setDialog(null);
    } catch {
      notify(
        "Operazione non riuscita. Controlla i dati e la configurazione del servizio.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function sync(direction: "load" | "save") {
    if (!supabase || !userId || storageError) return;
    setBusy(true);
    try {
      if (direction === "save") {
        const { error } = await supabase.from("user_states").upsert({
          user_id: userId,
          data: state,
          updated_at: new Date().toISOString(),
        });
        if (error) throw error;
        setCloudStatus("Copia cloud aggiornata.");
      } else {
        const { data, error } = await supabase
          .from("user_states")
          .select("data")
          .eq("user_id", userId)
          .maybeSingle();
        if (error) throw error;
        if (!data) {
          notify(
            "Nessuna copia cloud presente. Salva prima i dati di questo dispositivo.",
          );
          return;
        }
        const parsed = stateSchema.parse(data.data);
        change(() => parsed, true);
        setCloudStatus(
          "Dati cloud caricati. Puoi annullare per ripristinare i dati precedenti.",
        );
      }
    } catch {
      notify(
        "Sincronizzazione non riuscita. I dati sul dispositivo restano disponibili.",
      );
    } finally {
      setBusy(false);
    }
  }
  function Demo() {
    const profile = {
      ...defaultDraft,
      name: "Demo",
      lactoseFree: true,
      athlete: true,
      target: { kcal: 2650, protein: 175, carbs: 310, fat: 80 },
    };
    const stamp = dayKey();
    change((s) => ({
      ...s,
      profile,
      meals: [
        {
          id: crypto.randomUUID(),
          date: stamp,
          name: "Colazione",
          createdAt: new Date().toISOString(),
          items: [
            {
              id: crypto.randomUUID(),
              food: foods.find((f) => f.id === "yogurt")!,
              grams: 200,
            },
            {
              id: crypto.randomUUID(),
              food: foods.find((f) => f.id === "oats")!,
              grams: 60,
            },
            {
              id: crypto.randomUUID(),
              food: foods.find((f) => f.id === "banana")!,
              grams: 120,
            },
          ],
        },
        {
          id: crypto.randomUUID(),
          date: stamp,
          name: "Pranzo",
          createdAt: new Date().toISOString(),
          items: recipeItems(recipes[0]),
        },
      ],
      water: [{ id: crypto.randomUUID(), date: stamp, ml: 1500 }],
      weights: Array.from({ length: 12 }, (_, i) => ({
        id: crypto.randomUUID(),
        date: shiftDay(stamp, -22 + i * 2),
        kg: 76 - i * 0.1 + (i % 3) * 0.1,
      })),
      workouts: [
        {
          id: crypto.randomUUID(),
          date: stamp,
          sport: "Pallavolo",
          time: "19:30",
          duration: 90,
          intensity: "Moderata",
        },
      ],
    }));
    setDate(stamp);
    notify(
      "Modalità demo: i dati di esempio sono salvati solo su questo dispositivo.",
    );
  }
  if (!ready)
    return (
      <main className="loading">
        <Leaf />
        <h1>NextBite</h1>
        <p>Prepariamo la tua giornata…</p>
      </main>
    );
  const dateControl = (
    <div className="date-control">
      <button
        aria-label="Giorno precedente"
        onClick={() => setDate(shiftDay(date, -1))}
      >
        <ChevronLeft size={18} />
      </button>
      <label>
        <CalendarDays size={17} />
        <input
          aria-label="Data del diario"
          type="date"
          value={date}
          onChange={(e) => {
            if (e.target.value) setDate(e.target.value);
          }}
        />
      </label>
      <button
        aria-label="Giorno successivo"
        onClick={() => setDate(shiftDay(date, 1))}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
  const commandBar = (
    <form
      className="command-bar"
      onSubmit={(e) => {
        e.preventDefault();
        handleCommand();
      }}
    >
      <button
        type="button"
        aria-label="Allega foto del pasto"
        onClick={() => photoInput.current?.click()}
      >
        <Camera size={21} />
      </button>
      <input
        aria-label="Descrivi un pasto o chiedi un’azione"
        placeholder="Scrivi cosa hai mangiato o chiedimi cosa fare…"
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        maxLength={2000}
      />
      <button
        type="button"
        className={listening ? "recording" : ""}
        aria-label={listening ? "Ferma dettatura" : "Detta con il microfono"}
        aria-pressed={listening}
        onClick={startVoice}
      >
        <Mic size={21} />
      </button>
      <button
        className="send-button"
        aria-label="Invia richiesta"
        disabled={!command.trim()}
      >
        <Send size={19} />
      </button>
    </form>
  );
  const waterCard = (
    <div className="card water-card">
      <span className="water-icon">
        <Droplets />
      </span>
      <div>
        <h3>Acqua</h3>
        <strong>
          {(water / 1000).toLocaleString("it-IT")} L <small>registrati</small>
        </strong>
        <div className="track">
          <span style={{ width: `${Math.min(100, (water / 2500) * 100)}%` }} />
        </div>
        <small>Promemoria indicativo: 2,5 L</small>
      </div>
      <button className="secondary" onClick={() => addWater()}>
        + 250 ml
      </button>
    </div>
  );
  const recipeCard = (r: Recipe) => (
    <article className="card recipe-card" key={r.id}>
      <div className="recipe-image">
        <FoodImage src={r.image} alt={`Proposta per ${r.name.toLowerCase()}`} />
        <button
          className={
            state.favorites.includes(r.id) ? "favorite selected" : "favorite"
          }
          aria-label={`${state.favorites.includes(r.id) ? "Rimuovi" : "Salva"} ${r.name} dai preferiti`}
          aria-pressed={state.favorites.includes(r.id)}
          onClick={() =>
            change((s) => ({
              ...s,
              favorites: s.favorites.includes(r.id)
                ? s.favorites.filter((id) => id !== r.id)
                : [...s.favorites, r.id],
            }))
          }
        >
          <Bookmark size={19} />
        </button>
      </div>
      <div className="recipe-body">
        <button
          className="text-heading"
          onClick={() => {
            setRecipe(r);
            setPortions(1);
          }}
        >
          {r.name}
        </button>
        <p>{r.description}</p>
        <div className="recipe-meta">
          <span>{r.minutes} min</span>
          <span>{formatNumber(sumItems(recipeItems(r)).kcal)} kcal</span>
        </div>
        <button
          className="primary full"
          onClick={() => {
            change(
              (s) => ({
                ...s,
                plan: [
                  ...s.plan,
                  { id: crypto.randomUUID(), date, recipeId: r.id },
                ],
              }),
              true,
            );
            notify("Ricetta aggiunta al piano, non al diario.");
          }}
        >
          <Plus size={17} /> Aggiungi al piano
        </button>
      </div>
    </article>
  );
  return (
    <>
      <input
        ref={photoInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          selectPhoto(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {!state.profile && !storageError ? (
        <main className="onboarding">
          <header className="brand">
            <Leaf />
            NextBite
          </header>
          <div className="onboarding-card card">
            <div className="step-indicator">
              Passo {step + 1} di 3
              <div className="track">
                <span style={{ width: `${((step + 1) / 3) * 100}%` }} />
              </div>
            </div>
            {step === 0 ? (
              <>
                <h1>Qual è il tuo obiettivo?</h1>
                <p className="muted">Partiamo da ciò che conta per te.</p>
                <div className="goal-list">
                  {(
                    [
                      [
                        "balance",
                        "Mangiare meglio",
                        "Scelte più consapevoli ogni giorno.",
                      ],
                      [
                        "lose",
                        "Perdere peso",
                        "Un percorso graduale, con i tuoi ritmi.",
                      ],
                      [
                        "maintain",
                        "Mantenere il peso",
                        "Equilibrio e abitudini sostenibili.",
                      ],
                      [
                        "gain",
                        "Aumentare la massa",
                        "Alimentazione e allenamento insieme.",
                      ],
                      [
                        "performance",
                        "Migliorare la performance",
                        "Energia per le attività che ami.",
                      ],
                    ] as const
                  ).map(([id, label, description]) => (
                    <button
                      className={`goal ${profileDraft.goal === id ? "selected" : ""}`}
                      key={id}
                      onClick={() =>
                        setProfileDraft((p) => ({ ...p, goal: id }))
                      }
                    >
                      <span>
                        <strong>{label}</strong>
                        <small>{description}</small>
                      </span>
                      {profileDraft.goal === id ? <Check /> : <ChevronRight />}
                    </button>
                  ))}
                </div>
                <button className="primary full" onClick={() => setStep(1)}>
                  Continua <ArrowRight size={18} />
                </button>
                <button className="text-button full" onClick={Demo}>
                  Esplora con dati di esempio
                </button>
              </>
            ) : step === 1 ? (
              <>
                <h1>Parlaci di te</h1>
                <p className="muted">
                  Questi dati ci aiutano a stimare un punto di partenza.
                </p>
                <div className="form-grid">
                  <label className="wide">
                    Come ti chiami?
                    <input
                      value={profileDraft.name}
                      onChange={(e) =>
                        setProfileDraft((p) => ({ ...p, name: e.target.value }))
                      }
                      maxLength={60}
                    />
                  </label>
                  <label>
                    Età
                    <input
                      type="number"
                      min={18}
                      max={100}
                      value={profileDraft.age}
                      onChange={(e) =>
                        setProfileDraft((p) => ({
                          ...p,
                          age: Number(e.target.value),
                        }))
                      }
                    />
                  </label>
                  <label>
                    Altezza (cm)
                    <input
                      type="number"
                      min={100}
                      max={230}
                      value={profileDraft.height}
                      onChange={(e) =>
                        setProfileDraft((p) => ({
                          ...p,
                          height: Number(e.target.value),
                        }))
                      }
                    />
                  </label>
                  <label>
                    Peso (kg)
                    <input
                      type="number"
                      step="0.1"
                      min={35}
                      max={300}
                      value={profileDraft.weight}
                      onChange={(e) =>
                        setProfileDraft((p) => ({
                          ...p,
                          weight: Number(e.target.value),
                        }))
                      }
                    />
                  </label>
                  <label>
                    Sesso per la stima
                    <select
                      value={profileDraft.sex}
                      onChange={(e) =>
                        setProfileDraft((p) => ({
                          ...p,
                          sex: e.target.value as Profile["sex"],
                        }))
                      }
                    >
                      <option value="male">Maschile</option>
                      <option value="female">Femminile</option>
                      <option value="unspecified">
                        Preferisco non indicarlo
                      </option>
                    </select>
                  </label>
                </div>
                <p className="fine-print">
                  Stima indicativa per adulti. Puoi modificare i target. Se non
                  indichi il sesso, la formula usa una media dei due
                  coefficienti.
                </p>
                <div className="actions">
                  <button className="secondary" onClick={() => setStep(0)}>
                    Indietro
                  </button>
                  <button
                    className="primary"
                    onClick={() => {
                      if (
                        profileDraft.name.trim() &&
                        profileDraft.age >= 18 &&
                        profileDraft.age <= 100 &&
                        profileDraft.height >= 100 &&
                        profileDraft.height <= 230 &&
                        profileDraft.weight >= 35 &&
                        profileDraft.weight <= 300
                      )
                        setStep(2);
                      else notify("Controlla i dati prima di continuare.");
                    }}
                  >
                    Continua
                  </button>
                </div>
              </>
            ) : (
              <>
                <h1>La tua vita, i tuoi ritmi</h1>
                <label>
                  Attività quotidiana
                  <select
                    value={profileDraft.activity}
                    onChange={(e) =>
                      setProfileDraft((p) => ({
                        ...p,
                        activity: Number(e.target.value),
                      }))
                    }
                  >
                    <option value={1.2}>Prevalentemente sedentario</option>
                    <option value={1.375}>Leggermente attivo</option>
                    <option value={1.55}>Moderatamente attivo</option>
                    <option value={1.725}>Molto attivo</option>
                  </select>
                </label>
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={profileDraft.lactoseFree}
                    onChange={(e) =>
                      setProfileDraft((p) => ({
                        ...p,
                        lactoseFree: e.target.checked,
                      }))
                    }
                  />{" "}
                  Preferisco ricette senza lattosio
                </label>
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={profileDraft.athlete}
                    onChange={(e) =>
                      setProfileDraft((p) => ({
                        ...p,
                        athlete: e.target.checked,
                      }))
                    }
                  />{" "}
                  Voglio collegare pasti e allenamenti
                </label>
                <div className="estimate">
                  <span>Il tuo punto di partenza</span>
                  <strong>
                    ≈ {formatNumber(initialTarget(profileDraft).kcal)} kcal
                  </strong>
                  <p>
                    Una stima iniziale, da valutare in base alle tue esigenze e
                    al tuo storico.
                  </p>
                </div>
                <div className="actions">
                  <button className="secondary" onClick={() => setStep(1)}>
                    Indietro
                  </button>
                  <button className="primary" onClick={completeOnboarding}>
                    Inizia
                  </button>
                </div>
              </>
            )}
          </div>
          <p className="fine-print">
            I dati restano su questo dispositivo. Puoi collegare un account dal
            profilo.
          </p>
        </main>
      ) : (
        <div className="app-shell">
          <aside className="sidebar">
            <a
              className="brand"
              href="#today"
              onClick={() => navigate("today")}
            >
              <Leaf />
              NextBite
            </a>
            <nav aria-label="Navigazione principale">
              {navigation.map((n) => (
                <a
                  href={`#${n.id}`}
                  key={n.id}
                  className={view === n.id ? "active" : ""}
                  onClick={() => navigate(n.id)}
                >
                  <n.icon size={21} />
                  <span>{n.label}</span>
                </a>
              ))}
            </nav>
            <div className="sidebar-bottom">
              <button onClick={() => setDark((d) => !d)}>
                {dark ? <Sun size={20} /> : <Moon size={20} />}
                <span>Tema {dark ? "chiaro" : "scuro"}</span>
              </button>
              <a
                href="#profile"
                className={view === "profile" ? "active" : ""}
                onClick={() => navigate("profile")}
              >
                <div className="avatar">
                  {state.profile?.name.charAt(0) || "N"}
                </div>
                <span>{state.profile?.name || "Profilo"}</span>
                <ChevronRight size={16} />
              </a>
            </div>
          </aside>
          <main className="main-content">
            <header className="mobile-header">
              <a
                className="brand"
                href="#today"
                onClick={() => navigate("today")}
              >
                <Leaf />
                NextBite
              </a>
              <button
                className="icon-button"
                aria-label="Apri profilo"
                onClick={() => navigate("profile")}
              >
                <User />
              </button>
            </header>
            {view === "today" && (
              <>
                <div className="page-header">
                  <div>
                    <span className="eyebrow">
                      LA TUA GIORNATA, IN EQUILIBRIO
                    </span>
                    <h1>Ciao, {state.profile?.name || "benvenuto"}</h1>
                    <p>
                      {dailyWorkouts.length
                        ? `${dailyWorkouts[0].sport} oggi alle ${dailyWorkouts[0].time}`
                        : "Un piccolo passo alla volta, con i tuoi ritmi."}
                    </p>
                  </div>
                  <button className="primary" onClick={() => openMeal()}>
                    <Plus size={19} /> Aggiungi
                  </button>
                </div>
                <div className="today-layout">
                  <Energy totals={totals} target={target} />
                  <div className="card">
                    <h3>I tuoi macronutrienti</h3>
                    <Macros totals={totals} target={target} />
                  </div>
                  <div className="card insight-card">
                    <Lightbulb size={26} />
                    <h3>Il consiglio di adesso</h3>
                    <p>{insight(state, date)}</p>
                    <button
                      className="primary"
                      onClick={() => {
                        navigate("coach");
                        setCoachRecipes(true);
                      }}
                    >
                      Suggeriscimi qualcosa <ArrowRight size={16} />
                    </button>
                  </div>
                  <div className="card timeline-card">
                    <div className="section-heading">
                      <h3>La tua giornata</h3>
                      <button
                        className="text-button"
                        onClick={() => navigate("diary")}
                      >
                        Vedi diario <ChevronRight size={15} />
                      </button>
                    </div>
                    {mealNames.map((name) => (
                      <button
                        className="timeline-row"
                        key={name}
                        onClick={() => openMeal([], name)}
                      >
                        <span
                          className={
                            dailyMeals.some((m) => m.name === name)
                              ? "dot done"
                              : "dot"
                          }
                        />
                        <Utensils size={17} />
                        <span>{name}</span>
                        <small>
                          {dailyMeals.some((m) => m.name === name)
                            ? `${formatNumber(sumMeals(dailyMeals.filter((m) => m.name === name)).kcal)} kcal`
                            : "Da aggiungere"}
                        </small>
                      </button>
                    ))}
                    {dailyWorkouts.map((w) => (
                      <button
                        className="timeline-row"
                        key={w.id}
                        onClick={() => navigate("workouts")}
                      >
                        <span className="dot sport" />
                        <Dumbbell size={17} />
                        <span>{w.sport}</span>
                        <small>{w.time}</small>
                      </button>
                    ))}
                  </div>
                  {waterCard}
                  <button
                    className="card daily-recipe"
                    onClick={() => {
                      setRecipe(recipes[0]);
                      setPortions(1);
                    }}
                  >
                    <FoodImage
                      src={recipes[0].image}
                      alt="Idea per il tuo prossimo pasto"
                    />
                    <div>
                      <small>Ricetta del giorno</small>
                      <strong>{recipes[0].name}</strong>
                      <span>
                        {recipes[0].minutes} min ·{" "}
                        {formatNumber(sumItems(recipeItems(recipes[0])).kcal)}{" "}
                        kcal
                      </span>
                    </div>
                    <ChevronRight size={18} />
                  </button>
                </div>
                <div className="section-heading">
                  <h2>Il tuo diario</h2>
                  {dateControl}
                </div>
                <div className="card diary-preview">
                  {mealNames.map((name) => (
                    <button
                      key={name}
                      onClick={() => {
                        navigate("diary");
                      }}
                    >
                      <Utensils size={20} />
                      <strong>{name}</strong>
                      <span>
                        {dailyMeals.some((m) => m.name === name)
                          ? `${formatNumber(sumMeals(dailyMeals.filter((m) => m.name === name)).kcal)} kcal`
                          : "Da aggiungere"}
                      </span>
                      <ChevronRight size={17} />
                    </button>
                  ))}
                </div>
              </>
            )}
            {view === "diary" && (
              <>
                <div className="page-header">
                  <div>
                    <h1>Il tuo diario</h1>
                    <p>{dateLabel}</p>
                  </div>
                  <button className="primary" onClick={() => openMeal()}>
                    <Plus size={18} /> Aggiungi pasto
                  </button>
                </div>
                <div className="section-heading">
                  {dateControl}
                  <button
                    className="secondary"
                    onClick={() => {
                      const yesterday = state.meals.filter(
                        (m) => m.date === shiftDay(date, -1),
                      );
                      if (!yesterday.length) {
                        notify(
                          "Nessun pasto da copiare dal giorno precedente.",
                        );
                        return;
                      }
                      change(
                        (s) => ({
                          ...s,
                          meals: [
                            ...s.meals,
                            ...yesterday.map((m) => ({
                              ...m,
                              id: crypto.randomUUID(),
                              date,
                              createdAt: new Date().toISOString(),
                            })),
                          ],
                        }),
                        true,
                      );
                      notify("Pasti di ieri copiati. Puoi annullare.");
                    }}
                  >
                    Copia da ieri
                  </button>
                </div>
                <div className="two-columns">
                  <div className="meal-groups">
                    {mealNames.map((name) => (
                      <section className="card meal-group" key={name}>
                        <div className="section-heading">
                          <h3>
                            <Utensils size={19} /> {name}
                          </h3>
                          <span>
                            {formatNumber(
                              sumMeals(
                                dailyMeals.filter((m) => m.name === name),
                              ).kcal,
                            )}{" "}
                            kcal
                          </span>
                        </div>
                        {dailyMeals
                          .filter((m) => m.name === name)
                          .map((m) => (
                            <div className="logged-meal" key={m.id}>
                              {m.items.map((i) => (
                                <div className="food-row" key={i.id}>
                                  <span className="food-mark">
                                    <Utensils size={18} />
                                  </span>
                                  <div>
                                    <strong>{i.food.name}</strong>
                                    <small>
                                      {i.grams} g · {i.food.basis}
                                    </small>
                                  </div>
                                  <span>
                                    {formatNumber(
                                      (i.food.kcal * i.grams) / 100,
                                    )}{" "}
                                    kcal
                                  </span>
                                </div>
                              ))}
                              <div className="meal-actions">
                                <button
                                  className="text-button"
                                  onClick={() =>
                                    openMeal(m.items, m.name, m.id)
                                  }
                                >
                                  Modifica
                                </button>
                                <button
                                  className="text-button"
                                  onClick={() => {
                                    change((s) => ({
                                      ...s,
                                      savedMeals: [
                                        ...s.savedMeals,
                                        {
                                          id: crypto.randomUUID(),
                                          name: `${name} abituale`,
                                          items: m.items,
                                        },
                                      ],
                                    }));
                                    notify("Pasto salvato come routine.");
                                  }}
                                >
                                  Salva come routine
                                </button>
                                <button
                                  className="icon-button danger"
                                  aria-label={`Elimina ${name}`}
                                  onClick={() => {
                                    change(
                                      (s) => ({
                                        ...s,
                                        meals: s.meals.filter(
                                          (x) => x.id !== m.id,
                                        ),
                                      }),
                                      true,
                                    );
                                    notify("Pasto eliminato.");
                                  }}
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                          ))}
                        {!dailyMeals.some((m) => m.name === name) && (
                          <p className="empty-note">
                            Non hai ancora registrato questo pasto.
                          </p>
                        )}
                        <button
                          className="secondary"
                          onClick={() => openMeal([], name)}
                        >
                          <Plus size={16} /> Alimento
                        </button>
                      </section>
                    ))}
                  </div>
                  <aside className="side-panels">
                    <Energy totals={totals} target={target} />
                    <div className="card">
                      <h3>I tuoi macronutrienti</h3>
                      <Macros totals={totals} target={target} />
                    </div>
                    <div className="card">
                      <h3>Pasti abituali</h3>
                      {state.savedMeals.length ? (
                        state.savedMeals.map((m) => (
                          <div className="saved-row" key={m.id}>
                            <button
                              className="text-button"
                              onClick={() => openMeal(m.items)}
                            >
                              <Plus size={15} />
                              {m.name}
                            </button>
                            <button
                              className="icon-button"
                              aria-label={`Elimina routine ${m.name}`}
                              onClick={() =>
                                change(
                                  (s) => ({
                                    ...s,
                                    savedMeals: s.savedMeals.filter(
                                      (x) => x.id !== m.id,
                                    ),
                                  }),
                                  true,
                                )
                              }
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="muted">
                          Salva un pasto dal diario per ritrovarlo qui.
                        </p>
                      )}
                    </div>
                  </aside>
                </div>
              </>
            )}
            {view === "progress" && (
              <>
                <div className="page-header">
                  <div>
                    <h1>I tuoi progressi</h1>
                    <p>Conta l’andamento, non il singolo giorno.</p>
                  </div>
                  <button
                    className="primary"
                    onClick={() => {
                      setWeight("");
                      setDialog("weight");
                    }}
                  >
                    <Plus size={18} /> Registra peso
                  </button>
                </div>
                <div className="metrics">
                  <div className="card">
                    <small>Peso medio · ultime 7 pesate</small>
                    <strong>
                      {trend.length
                        ? (
                            trend.slice(-7).reduce((s, p) => s + p.kg, 0) /
                            Math.min(7, trend.length)
                          )
                            .toFixed(1)
                            .replace(".", ",")
                        : "—"}{" "}
                      <small>kg</small>
                    </strong>
                  </div>
                  <div className="card">
                    <small>Media calorie · ultimi 30 giorni registrati</small>
                    <strong>
                      {(() => {
                        const ms = state.meals.filter(
                          (m) =>
                            m.date >= shiftDay(dayKey(), -29) &&
                            m.date <= dayKey(),
                        );
                        const days = new Set(ms.map((m) => m.date)).size;
                        return days
                          ? formatNumber(sumMeals(ms).kcal / days)
                          : "—";
                      })()}{" "}
                      <small>kcal</small>
                    </strong>
                  </div>
                  <div className="card">
                    <small>Giorni registrati · ultimi 30 giorni</small>
                    <strong>
                      {
                        new Set(
                          state.meals
                            .filter(
                              (m) =>
                                m.date >= shiftDay(dayKey(), -29) &&
                                m.date <= dayKey(),
                            )
                            .map((m) => m.date),
                        ).size
                      }
                      <small> / 30</small>
                    </strong>
                  </div>
                </div>
                <div className="two-columns">
                  <div className="card chart-card">
                    <h3>Andamento del peso</h3>
                    {trend.length >= 2 ? (
                      <WeightChart points={trend.slice(-30)} />
                    ) : (
                      <div className="empty-state">
                        <TrendingUp />
                        <h3>Il tuo andamento prende forma</h3>
                        <p>Registra almeno due pesate per vedere il grafico.</p>
                      </div>
                    )}
                    <p className="fine-print">
                      Punti: media delle pesate del giorno. Linea: media mobile
                      degli ultimi 7 giorni.
                    </p>
                  </div>
                  <div className="card insight-card">
                    <Sparkles />
                    <h3>Fabbisogno adattivo</h3>
                    <p>
                      Le modifiche automatiche dei target arriveranno in una
                      release successiva. Per ora il tuo target resta quello
                      scelto nel profilo.
                    </p>
                    <strong className="big-number">
                      {formatNumber(target.kcal)} kcal
                    </strong>
                    <button
                      className="secondary"
                      onClick={() => navigate("profile")}
                    >
                      Valuta il tuo target
                    </button>
                  </div>
                </div>
                <section className="card">
                  <h3>Le tue pesate</h3>
                  {state.weights.length ? (
                    state.weights
                      .slice()
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .slice(0, 15)
                      .map((w) => (
                        <div className="list-row" key={w.id}>
                          <span>{w.date}</span>
                          <strong>{w.kg.toLocaleString("it-IT")} kg</strong>
                          <button
                            aria-label={`Elimina pesata del ${w.date}`}
                            className="icon-button danger"
                            onClick={() => {
                              change(
                                (s) => ({
                                  ...s,
                                  weights: s.weights.filter(
                                    (x) => x.id !== w.id,
                                  ),
                                }),
                                true,
                              );
                              notify("Pesata eliminata.");
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                  ) : (
                    <p className="muted">Nessuna pesata ancora.</p>
                  )}
                </section>
              </>
            )}
            {view === "discover" && (
              <>
                <div className="page-header">
                  <div>
                    <h1>Cosa ti va di mangiare?</h1>
                    <p>Idee semplici per i tuoi ritmi.</p>
                  </div>
                  {dateControl}
                </div>
                <div
                  className="tabs"
                  role="tablist"
                  aria-label="Ricette e pianificazione"
                >
                  {(
                    [
                      ["recipes", "Ricette"],
                      ["plan", "Piano settimanale"],
                      ["shopping", "Lista della spesa"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      role="tab"
                      aria-selected={discoverTab === id}
                      className={discoverTab === id ? "selected" : ""}
                      onClick={() => setDiscoverTab(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {discoverTab === "recipes" ? (
                  <>
                    <div className="search-box">
                      <Search size={19} />
                      <input
                        aria-label="Cerca una ricetta"
                        placeholder="Cerca una ricetta…"
                        value={recipeSearch}
                        onChange={(e) => setRecipeSearch(e.target.value)}
                      />
                    </div>
                    <div className="chips">
                      <button
                        className={fast ? "selected" : ""}
                        onClick={() => setFast((v) => !v)}
                        aria-pressed={fast}
                      >
                        Pronte in 20 min
                      </button>
                      <button
                        className={onlyFavorites ? "selected" : ""}
                        onClick={() => setOnlyFavorites((v) => !v)}
                        aria-pressed={onlyFavorites}
                      >
                        <Bookmark size={15} /> Preferiti
                      </button>
                      {state.profile?.lactoseFree && (
                        <span className="chip">Senza lattosio</span>
                      )}
                    </div>
                    <div className="recipe-grid">
                      {recipes
                        .filter(
                          (r) =>
                            r.name
                              .toLowerCase()
                              .includes(recipeSearch.toLowerCase()) &&
                            (!fast || r.minutes <= 20) &&
                            (!onlyFavorites ||
                              state.favorites.includes(r.id)) &&
                            (!state.profile?.lactoseFree || r.lactoseFree),
                        )
                        .map(recipeCard)}
                    </div>
                    {!recipes.some(
                      (r) =>
                        r.name
                          .toLowerCase()
                          .includes(recipeSearch.toLowerCase()) &&
                        (!fast || r.minutes <= 20) &&
                        (!onlyFavorites || state.favorites.includes(r.id)),
                    ) && (
                      <div className="empty-state">
                        <Search />
                        <p>
                          Nessuna ricetta corrisponde ai filtri. Prova a
                          cambiarli.
                        </p>
                      </div>
                    )}
                  </>
                ) : discoverTab === "plan" ? (
                  <>
                    <p className="muted">
                      Le ricette pianificate non vengono registrate
                      automaticamente nel diario.
                    </p>
                    <div className="week-plan">
                      {Array.from({ length: 7 }, (_, i) =>
                        shiftDay(date, i),
                      ).map((d) => (
                        <section className="card" key={d}>
                          <h3>
                            {new Intl.DateTimeFormat("it-IT", {
                              weekday: "short",
                              day: "numeric",
                            }).format(new Date(`${d}T12:00:00Z`))}
                          </h3>
                          {state.plan
                            .filter((p) => p.date === d)
                            .map((p) => {
                              const r = recipes.find(
                                (r) => r.id === p.recipeId,
                              );
                              if (!r) return null;
                              return (
                                <div className="plan-item" key={p.id}>
                                  <FoodImage src={r.image} alt={r.name} />
                                  <strong>{r.name}</strong>
                                  <div className="actions">
                                    <button
                                      className="text-button"
                                      onClick={() => {
                                        setDate(d);
                                        openMeal(recipeItems(r), "Cena");
                                      }}
                                    >
                                      Registra pasto
                                    </button>
                                    <button
                                      className="icon-button"
                                      aria-label="Rimuovi dal piano"
                                      onClick={() =>
                                        change(
                                          (s) => ({
                                            ...s,
                                            plan: s.plan.filter(
                                              (x) => x.id !== p.id,
                                            ),
                                          }),
                                          true,
                                        )
                                      }
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          <button
                            className="text-button"
                            onClick={() => {
                              setDate(d);
                              setDiscoverTab("recipes");
                            }}
                          >
                            <Plus size={16} /> Ricetta
                          </button>
                        </section>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="card">
                    <h3>Da acquistare nei prossimi 7 giorni</h3>
                    <p className="muted">
                      Ingredienti delle ricette pianificate: una porzione per
                      ricetta.
                    </p>
                    {(() => {
                      const quantities = new Map<string, number>();
                      state.plan
                        .filter(
                          (p) => p.date >= date && p.date <= shiftDay(date, 6),
                        )
                        .forEach((p) =>
                          recipes
                            .find((r) => r.id === p.recipeId)
                            ?.ingredients.forEach((i) =>
                              quantities.set(
                                i.foodId,
                                (quantities.get(i.foodId) ?? 0) + i.grams,
                              ),
                            ),
                        );
                      return quantities.size ? (
                        [...quantities].map(([id, grams]) => (
                          <label className="shopping-row" key={`${date}-${id}`}>
                            <input type="checkbox" />
                            <span>{foods.find((f) => f.id === id)?.name}</span>
                            <strong>{grams} g</strong>
                          </label>
                        ))
                      ) : (
                        <div className="empty-state">
                          <ShoppingBasket />
                          <p>
                            Aggiungi una ricetta al piano per creare la lista.
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </>
            )}
            {view === "coach" && (
              <>
                <div className="page-header">
                  <div>
                    <h1>Il tuo coach</h1>
                    <p>Consigli che seguono la tua giornata.</p>
                  </div>
                  <span className="badge">Suggerimenti di base</span>
                </div>
                <div className="two-columns">
                  <section className="card coach-panel">
                    <div className="coach-message">
                      <Leaf />
                      <p>{insight(state, date)}</p>
                    </div>
                    {messages.map((m, i) => (
                      <div key={i} className={`message ${m.role}`}>
                        {m.text}
                      </div>
                    ))}
                    <div className="chips">
                      {[
                        "Cosa mangio stasera?",
                        "Ho solo 10 minuti",
                        "Prima dell’allenamento",
                      ].map((text) => (
                        <button key={text} onClick={() => handleCommand(text)}>
                          {text}
                        </button>
                      ))}
                    </div>
                    {coachRecipes && (
                      <div className="coach-recipes">
                        {recipes
                          .filter((r) => r.minutes <= 25)
                          .slice(0, 3)
                          .map((r) => (
                            <button
                              className="coach-recipe"
                              key={r.id}
                              onClick={() => {
                                setRecipe(r);
                                setPortions(1);
                              }}
                            >
                              <FoodImage src={r.image} alt={r.name} />
                              <div>
                                <strong>{r.name}</strong>
                                <small>
                                  {r.minutes} min ·{" "}
                                  {formatNumber(sumItems(recipeItems(r)).kcal)}{" "}
                                  kcal
                                </small>
                              </div>
                              <ChevronRight size={17} />
                            </button>
                          ))}
                      </div>
                    )}
                    <p className="fine-print">
                      Suggerimenti generali basati su regole semplici, non su un
                      servizio AI. Non sostituiscono un professionista.
                    </p>
                  </section>
                  <aside className="card context-card">
                    <h3>Il contesto di oggi</h3>
                    <div className="list-row">
                      <Dumbbell size={19} />
                      <span>
                        {dailyWorkouts[0]
                          ? `${dailyWorkouts[0].sport} · ${dailyWorkouts[0].time}`
                          : "Nessun allenamento"}
                      </span>
                    </div>
                    <div className="list-row">
                      <Activity size={19} />
                      <span>
                        {formatNumber(Math.max(0, target.kcal - totals.kcal))}{" "}
                        kcal disponibili
                      </span>
                    </div>
                    <div className="list-row">
                      <Utensils size={19} />
                      <span>
                        {state.profile?.lactoseFree
                          ? "Preferenza: senza lattosio"
                          : "Nessuna preferenza alimentare"}
                      </span>
                    </div>
                    <details>
                      <summary>Perché questo consiglio?</summary>
                      <p>
                        Consideriamo i pasti registrati, l’acqua e gli
                        allenamenti del giorno. Le ricette sono esempi da
                        adattare alle tue esigenze.
                      </p>
                    </details>
                  </aside>
                </div>
              </>
            )}
            {view === "workouts" && (
              <>
                <div className="page-header">
                  <div>
                    <h1>I tuoi allenamenti</h1>
                    <p>Collega alimentazione e attività.</p>
                  </div>
                  <button
                    className="primary"
                    onClick={() => {
                      setEditingWorkout(null);
                      setDialog("workout");
                    }}
                  >
                    <Plus size={18} /> Allenamento
                  </button>
                </div>
                {dateControl}
                <div className="two-columns">
                  <div>
                    {dailyWorkouts.length ? (
                      dailyWorkouts.map((w) => (
                        <article className="card workout-card" key={w.id}>
                          <div className="workout-icon">
                            <Dumbbell />
                          </div>
                          <div>
                            <h2>{w.sport}</h2>
                            <p>
                              {w.time} · {w.duration} min
                            </p>
                            <span className="badge">
                              Intensità {w.intensity.toLowerCase()}
                            </span>
                          </div>
                          <button
                            className="secondary"
                            onClick={() => {
                              setWorkout(w);
                              setEditingWorkout(w.id);
                              setDialog("workout");
                            }}
                          >
                            Modifica
                          </button>
                          <button
                            className="icon-button danger"
                            aria-label={`Elimina allenamento ${w.sport}`}
                            onClick={() => {
                              change(
                                (s) => ({
                                  ...s,
                                  workouts: s.workouts.filter(
                                    (x) => x.id !== w.id,
                                  ),
                                }),
                                true,
                              );
                              notify("Allenamento eliminato.");
                            }}
                          >
                            <Trash2 size={18} />
                          </button>
                        </article>
                      ))
                    ) : (
                      <div className="card empty-state">
                        <Dumbbell />
                        <h3>Una giornata con i tuoi ritmi</h3>
                        <p>
                          Nessun allenamento registrato. Puoi aggiungerlo quando
                          vuoi.
                        </p>
                      </div>
                    )}
                    <div className="card">
                      <h3>Nutrizione intorno all’allenamento</h3>
                      <p className="muted">
                        Puoi pianificare uno spuntino leggero prima e un pasto
                        dopo l’attività, secondo i tuoi tempi e la tua
                        tolleranza.
                      </p>
                      <button
                        className="secondary"
                        onClick={() =>
                          handleCommand("Cosa mangio prima dell’allenamento?")
                        }
                      >
                        Vedi idee
                      </button>
                    </div>
                  </div>
                  <aside>
                    <div className="card insight-card">
                      <h3>Target di oggi</h3>
                      <strong className="big-number">
                        {formatNumber(target.kcal)} kcal
                      </strong>
                      <p>
                        Il target del profilo comprende il tuo livello abituale
                        di attività. Non aggiungiamo automaticamente calorie per
                        gli allenamenti.
                      </p>
                    </div>
                    {waterCard}
                  </aside>
                </div>
              </>
            )}
            {view === "profile" && (
              <>
                <div className="page-header">
                  <div>
                    <h1>Il tuo profilo</h1>
                    <p>Sei tu a scegliere il tuo punto di partenza.</p>
                  </div>
                  <button
                    className="secondary"
                    onClick={() => setDark((d) => !d)}
                  >
                    {dark ? <Sun size={17} /> : <Moon size={17} />} Cambia tema
                  </button>
                </div>
                {storageError && (
                  <section className="card error-card">
                    <h3>Salvataggio non disponibile</h3>
                    <p>
                      I dati precedenti non verranno sovrascritti. Esportali
                      prima di reimpostarli.
                    </p>
                    <button
                      className="secondary"
                      onClick={() => exportData(true)}
                    >
                      Esporta dati originali
                    </button>
                    <button
                      className="danger-button"
                      onClick={() => {
                        if (
                          window.confirm(
                            "Reimpostare i dati di questo dispositivo?",
                          )
                        ) {
                          localStorage.removeItem(storageKey);
                          setStorageError(false);
                          setState(structuredClone(emptyState));
                        }
                      }}
                    >
                      Reimposta dispositivo
                    </button>
                  </section>
                )}
                <div className="two-columns">
                  <section className="card">
                    <h3>Obiettivi e preferenze</h3>
                    {state.profile && (
                      <ProfileEditor
                        profile={state.profile}
                        onSave={(p) => {
                          change((s) => ({ ...s, profile: p }));
                          notify("Profilo aggiornato.");
                        }}
                      />
                    )}
                  </section>
                  <div className="side-panels">
                    <section className="card">
                      <h3>Il tuo account</h3>
                      {!supabase ? (
                        <>
                          <p className="muted">
                            Modalità locale: i dati sono salvati in questo
                            browser. Il cloud si attiva configurando Supabase.
                          </p>
                          <span className="badge">
                            Nessun account necessario
                          </span>
                        </>
                      ) : userId ? (
                        <>
                          <p>{userEmail}</p>
                          <p className="muted">
                            Salva una copia cloud o caricala su un altro
                            dispositivo. Le operazioni sono manuali.
                          </p>
                          <div className="actions">
                            <button
                              className="primary"
                              disabled={busy || storageError}
                              onClick={() => sync("save")}
                            >
                              Salva nel cloud
                            </button>
                            <button
                              className="secondary"
                              disabled={busy || storageError}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Sostituire i dati del dispositivo con la copia cloud? Potrai annullare.",
                                  )
                                )
                                  void sync("load");
                              }}
                            >
                              Carica dal cloud
                            </button>
                          </div>
                          <p role="status">{cloudStatus}</p>
                          <button
                            className="text-button"
                            onClick={async () => {
                              const { error } = await supabase!.auth.signOut();
                              if (error)
                                notify("Uscita non riuscita. Riprova.");
                              else
                                notify(
                                  "Account disconnesso. I dati locali restano sul dispositivo.",
                                );
                            }}
                          >
                            <LogOut size={16} /> Esci dall’account
                          </button>
                        </>
                      ) : (
                        <button
                          className="primary"
                          onClick={() => {
                            setAuthMode("login");
                            setDialog("auth");
                          }}
                        >
                          Accedi o crea account
                        </button>
                      )}
                    </section>
                    <section className="card">
                      <h3>I tuoi dati</h3>
                      <p className="muted">
                        Puoi esportare un backup JSON o eliminarli dal
                        dispositivo.
                      </p>
                      <button
                        className="secondary"
                        onClick={() => exportData()}
                      >
                        <Download size={17} /> Esporta dati
                      </button>
                      <label className="import-label">
                        Importa backup JSON
                        <input
                          type="file"
                          accept="application/json,.json"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            try {
                              if (f.size > 5 * 1024 * 1024) throw new Error();
                              const loaded = stateSchema.parse(
                                JSON.parse(await f.text()),
                              );
                              if (
                                window.confirm(
                                  "Sostituire i dati locali con questo backup?",
                                )
                              ) {
                                change(() => loaded, true);
                                notify("Backup importato.");
                              }
                            } catch {
                              notify(
                                "Backup non valido. Nessun dato modificato.",
                              );
                            }
                            e.target.value = "";
                          }}
                        />
                      </label>
                      <button
                        className="danger-button"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Eliminare tutti i dati dal dispositivo? La copia cloud non sarà eliminata.",
                            )
                          ) {
                            change(() => structuredClone(emptyState));
                            setStep(0);
                            notify("Dati locali eliminati.");
                          }
                        }}
                      >
                        Elimina dati locali
                      </button>
                    </section>
                    <section className="card">
                      <h3>NextBite · 0.1.0</h3>
                      <p className="muted">
                        Prima release. Riconoscimento foto AI, barcode, target
                        adattivi e integrazioni sportive arriveranno nelle
                        prossime versioni.
                      </p>
                    </section>
                  </div>
                </div>
              </>
            )}
            <div className="command-container">
              {commandBar}
              <small className="command-hint">
                Prova: “80 g di pasta e 150 g di pollo” oppure “aggiungi 250 ml
                di acqua”
              </small>
            </div>
          </main>
          <nav className="mobile-nav" aria-label="Navigazione mobile">
            {(["today", "diary", "add", "progress", "coach"] as const).map(
              (id) =>
                id === "add" ? (
                  <button
                    key={id}
                    className="quick-add"
                    aria-label="Aggiungi pasto"
                    onClick={() => openMeal()}
                  >
                    <Plus />
                  </button>
                ) : (
                  <a
                    href={`#${id}`}
                    key={id}
                    className={view === id ? "active" : ""}
                    onClick={() => navigate(id)}
                  >
                    {id === "today" ? (
                      <Home />
                    ) : id === "diary" ? (
                      <CalendarDays />
                    ) : id === "progress" ? (
                      <TrendingUp />
                    ) : (
                      <MessageCircle />
                    )}
                    <small>{navigation.find((n) => n.id === id)?.label}</small>
                  </a>
                ),
            )}
          </nav>
        </div>
      )}
      {dialog === "meal" && (
        <Modal
          title={editId ? "Modifica pasto" : "Aggiungi un pasto"}
          onClose={closeDialog}
        >
          <div className="meal-dialog-top">
            <label>
              Pasto
              <select
                value={mealName}
                onChange={(e) => setMealName(e.target.value as MealName)}
              >
                {mealNames.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <label>
              Giorno
              <input
                aria-label="Data del pasto"
                type="date"
                value={date}
                onChange={(e) => {
                  if (e.target.value) setDate(e.target.value);
                }}
              />
            </label>
          </div>
          <div className="tabs">
            {(
              [
                ["search", "Cerca"],
                ["describe", "Descrivi"],
                ["photo", "Foto"],
              ] as const
            ).map(([id, label]) => (
              <button
                className={mealTab === id ? "selected" : ""}
                key={id}
                onClick={() => setMealTab(id)}
              >
                {label}
              </button>
            ))}
          </div>
          {mealTab === "describe" && (
            <>
              <label>
                Descrivi alimenti e quantità
                <textarea
                  placeholder="80 g di pasta e 150 g di pollo"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={2000}
                />
              </label>
              <button
                className="secondary"
                onClick={() => interpret(description)}
              >
                Prepara il pasto
              </button>
              {unrecognized.length > 0 && (
                <p className="notice">
                  Da completare manualmente: {unrecognized.join("; ")}. Non
                  verranno salvati finché non li aggiungi.
                </p>
              )}
            </>
          )}
          {mealTab === "photo" && (
            <div className="photo-preview">
              {photo && <img src={photo} alt="Foto del pasto da controllare" />}
              <p>
                In questa release la foto è un riferimento visivo: alimenti e
                quantità vanno inseriti manualmente. La foto non viene salvata o
                caricata.
              </p>
              <button
                className="secondary"
                onClick={() => photoInput.current?.click()}
              >
                <Camera size={17} /> Scegli una foto
              </button>
            </div>
          )}
          <div className="search-box">
            <Search size={19} />
            <input
              aria-label="Cerca alimento"
              placeholder="Cerca alimento o piatto…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="food-search-results">
            {catalog
              .filter((f) =>
                f.name.toLowerCase().includes(search.toLowerCase()),
              )
              .slice(0, search ? 10 : 5)
              .map((f) => (
                <button
                  key={f.id}
                  onClick={() =>
                    setMealItems((items) => [
                      ...items,
                      { id: crypto.randomUUID(), food: f, grams: 100 },
                    ])
                  }
                >
                  <div>
                    <strong>{f.name}</strong>
                    <small>
                      {f.kcal} kcal / 100 g · {f.basis}
                    </small>
                  </div>
                  <Plus size={18} />
                </button>
              ))}
          </div>
          <button
            className="text-button"
            onClick={() => {
              setDialog("food");
            }}
          >
            Crea alimento personalizzato
          </button>
          <div className="selected-foods">
            {mealItems.map((item) => (
              <div className="food-row" key={item.id}>
                <div>
                  <strong>{item.food.name}</strong>
                  <small>{item.food.basis}</small>
                </div>
                <label className="quantity">
                  <input
                    aria-label={`Grammi di ${item.food.name}`}
                    type="number"
                    min={1}
                    max={3000}
                    value={item.grams || ""}
                    onChange={(e) =>
                      setMealItems((items) =>
                        items.map((i) =>
                          i.id === item.id
                            ? { ...i, grams: Number(e.target.value) }
                            : i,
                        ),
                      )
                    }
                  />{" "}
                  g
                </label>
                <button
                  className="icon-button"
                  aria-label={`Rimuovi ${item.food.name}`}
                  onClick={() =>
                    setMealItems((items) =>
                      items.filter((i) => i.id !== item.id),
                    )
                  }
                >
                  <X size={17} />
                </button>
              </div>
            ))}
          </div>
          {!!mealItems.length && (
            <NutritionSummary totals={sumItems(mealItems)} />
          )}
          <p className="fine-print">
            Valori indicativi. Controlla quantità e stato crudo/cotto prima di
            salvare.
          </p>
          <div className="actions end">
            <button className="secondary" onClick={closeDialog}>
              Annulla
            </button>
            <button
              className="primary"
              disabled={!mealItems.length}
              onClick={submitMeal}
            >
              Conferma e salva
            </button>
          </div>
        </Modal>
      )}
      {dialog === "food" && (
        <Modal title="Crea alimento personalizzato" onClose={closeDialog}>
          <p className="muted">
            Trascrivi l’etichetta nutrizionale. Tutti i valori sono per 100 g.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (
                !foodDraft.name.trim() ||
                Object.values(foodDraft).some(
                  (v) =>
                    typeof v === "number" && (!Number.isFinite(v) || v < 0),
                ) ||
                foodDraft.kcal > 1000
              ) {
                notify("Controlla i valori inseriti.");
                return;
              }
              const food: Food = { ...foodDraft, id: crypto.randomUUID() };
              change((s) => ({ ...s, customFoods: [...s.customFoods, food] }));
              setMealItems((items) => [
                ...items,
                { id: crypto.randomUUID(), food, grams: 100 },
              ]);
              setDialog("meal");
              notify("Alimento creato.");
            }}
          >
            <div className="form-grid">
              <label className="wide">
                Nome
                <input
                  required
                  maxLength={100}
                  value={foodDraft.name}
                  onChange={(e) =>
                    setFoodDraft((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </label>
              <label className="wide">
                Stato (es. a crudo)
                <input
                  required
                  value={foodDraft.basis}
                  onChange={(e) =>
                    setFoodDraft((f) => ({ ...f, basis: e.target.value }))
                  }
                />
              </label>
              {(
                [
                  ["kcal", "Calorie"],
                  ["protein", "Proteine (g)"],
                  ["carbs", "Carboidrati (g)"],
                  ["fat", "Grassi (g)"],
                ] as const
              ).map(([key, label]) => (
                <label key={key}>
                  {label}
                  <input
                    type="number"
                    min={0}
                    max={key === "kcal" ? 1000 : 100}
                    step="0.1"
                    value={foodDraft[key]}
                    onChange={(e) =>
                      setFoodDraft((f) => ({
                        ...f,
                        [key]: Number(e.target.value),
                      }))
                    }
                  />
                </label>
              ))}
            </div>
            <button className="primary full">Salva alimento</button>
          </form>
        </Modal>
      )}
      {dialog === "weight" && (
        <Modal title="Registra il tuo peso" onClose={closeDialog}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const kg = Number(weight);
              if (kg < 35 || kg > 300 || !Number.isFinite(kg)) {
                notify("Inserisci un peso tra 35 e 300 kg.");
                return;
              }
              change(
                (s) => ({
                  ...s,
                  weights: [
                    ...s.weights,
                    { id: crypto.randomUUID(), date, kg },
                  ],
                }),
                true,
              );
              setDialog(null);
              notify("Pesata registrata.");
            }}
          >
            <label>
              Giorno
              <input
                type="date"
                required
                value={date}
                onChange={(e) => {
                  if (e.target.value) setDate(e.target.value);
                }}
              />
            </label>
            <label>
              Peso (kg)
              <input
                type="number"
                required
                min={35}
                max={300}
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="93,4"
              />
            </label>
            <button className="primary full">Salva pesata</button>
          </form>
        </Modal>
      )}
      {dialog === "workout" && (
        <Modal
          title={
            editingWorkout ? "Modifica allenamento" : "Aggiungi allenamento"
          }
          onClose={closeDialog}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (
                !workout.sport.trim() ||
                workout.duration < 5 ||
                workout.duration > 600
              ) {
                notify("Controlla sport e durata.");
                return;
              }
              change(
                (s) => ({
                  ...s,
                  workouts: [
                    ...s.workouts.filter((w) => w.id !== editingWorkout),
                    {
                      ...workout,
                      id: editingWorkout ?? crypto.randomUUID(),
                      date,
                    },
                  ],
                }),
                true,
              );
              setDialog(null);
              notify("Allenamento salvato.");
            }}
          >
            <div className="form-grid">
              <label className="wide">
                Sport
                <input
                  required
                  value={workout.sport}
                  maxLength={80}
                  onChange={(e) =>
                    setWorkout((w) => ({ ...w, sport: e.target.value }))
                  }
                />
              </label>
              <label>
                Giorno
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => {
                    if (e.target.value) setDate(e.target.value);
                  }}
                />
              </label>
              <label>
                Ora
                <input
                  type="time"
                  required
                  value={workout.time}
                  onChange={(e) =>
                    setWorkout((w) => ({ ...w, time: e.target.value }))
                  }
                />
              </label>
              <label>
                Durata (minuti)
                <input
                  type="number"
                  required
                  min={5}
                  max={600}
                  value={workout.duration}
                  onChange={(e) =>
                    setWorkout((w) => ({
                      ...w,
                      duration: Number(e.target.value),
                    }))
                  }
                />
              </label>
              <label>
                Intensità
                <select
                  value={workout.intensity}
                  onChange={(e) =>
                    setWorkout((w) => ({
                      ...w,
                      intensity: e.target.value as typeof workout.intensity,
                    }))
                  }
                >
                  <option>Leggera</option>
                  <option>Moderata</option>
                  <option>Intensa</option>
                </select>
              </label>
            </div>
            <button className="primary full">Salva allenamento</button>
          </form>
        </Modal>
      )}
      {dialog === "auth" && supabase && (
        <Modal
          title={
            authMode === "signup"
              ? "Crea account"
              : authMode === "reset"
                ? "Recupera password"
                : authMode === "recovery"
                  ? "Scegli una nuova password"
                  : "Accedi a NextBite"
          }
          onClose={closeDialog}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void auth();
            }}
          >
            {authMode !== "recovery" && (
              <label>
                Email
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </label>
            )}
            {authMode !== "reset" && (
              <label>
                Password
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={
                    authMode === "login" ? "current-password" : "new-password"
                  }
                />
              </label>
            )}
            <button className="primary full" disabled={busy}>
              {busy ? "Attendi…" : authMode === "login" ? "Accedi" : "Continua"}
            </button>
          </form>
          {authMode !== "recovery" && (
            <>
              <button
                className="secondary full"
                onClick={async () => {
                  const { error } = await supabase!.auth.signInWithOAuth({
                    provider: "google",
                    options: { redirectTo: window.location.origin },
                  });
                  if (error)
                    notify(
                      "Accesso Google non disponibile. Controlla la configurazione del provider.",
                    );
                }}
              >
                Continua con Google
              </button>
              <div className="actions">
                <button
                  className="text-button"
                  onClick={() =>
                    setAuthMode(authMode === "signup" ? "login" : "signup")
                  }
                >
                  {authMode === "signup" ? "Ho già un account" : "Crea account"}
                </button>
                <button
                  className="text-button"
                  onClick={() => setAuthMode("reset")}
                >
                  Password dimenticata?
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
      {recipe && (
        <Modal title="Dettaglio ricetta" onClose={() => setRecipe(null)}>
          <FoodImage
            className="recipe-hero"
            src={recipe.image}
            alt={recipe.name}
          />
          <h2>{recipe.name}</h2>
          <div className="chips">
            <span className="chip">{recipe.minutes} min</span>
            <span className="chip">Senza lattosio</span>
          </div>
          <NutritionSummary totals={sumItems(recipeItems(recipe, portions))} />
          <div className="section-heading">
            <h3>Ingredienti</h3>
            <div className="stepper">
              <button
                aria-label="Riduci porzioni"
                disabled={portions <= 1}
                onClick={() => setPortions((p) => p - 1)}
              >
                −
              </button>
              <span>
                {portions} {portions === 1 ? "porzione" : "porzioni"}
              </span>
              <button
                aria-label="Aumenta porzioni"
                disabled={portions >= 10}
                onClick={() => setPortions((p) => p + 1)}
              >
                +
              </button>
            </div>
          </div>
          {recipe.ingredients.map((i) => (
            <div className="list-row" key={i.foodId}>
              <div>
                <strong>{foods.find((f) => f.id === i.foodId)?.name}</strong>
                <small>{foods.find((f) => f.id === i.foodId)?.basis}</small>
              </div>
              <span>{i.grams * portions} g</span>
            </div>
          ))}
          <details className="preparation">
            <summary>Preparazione</summary>
            <ol>
              {recipe.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </details>
          <div className="actions">
            <button
              className="primary"
              onClick={() => {
                const items = recipeItems(recipe, portions);
                setRecipe(null);
                openMeal(items, "Cena");
              }}
            >
              Aggiungi al diario
            </button>
            <button
              className="secondary"
              onClick={() => {
                if (portions !== 1) {
                  notify(
                    "Il piano attuale supporta una porzione per ricetta. Per quantità diverse usa il diario.",
                  );
                  return;
                }
                change(
                  (s) => ({
                    ...s,
                    plan: [
                      ...s.plan,
                      { id: crypto.randomUUID(), date, recipeId: recipe.id },
                    ],
                  }),
                  true,
                );
                notify("Ricetta aggiunta al piano.");
                setRecipe(null);
              }}
            >
              Aggiungi al piano
            </button>
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <span>{toast}</span>
          {undo && (
            <button
              onClick={() => {
                setState(undo);
                setUndo(null);
                notify("Ultima operazione annullata.");
              }}
            >
              Annulla
            </button>
          )}
          <button aria-label="Chiudi messaggio" onClick={() => setToast("")}>
            <X size={16} />
          </button>
        </div>
      )}
    </>
  );
}
function WeightChart({ points }: { points: ReturnType<typeof weightTrend> }) {
  const min = Math.floor(Math.min(...points.map((p) => p.kg)) - 1),
    max = Math.ceil(Math.max(...points.map((p) => p.kg)) + 1);
  const x = (i: number) => 50 + (i / (points.length - 1)) * 660;
  const y = (kg: number) => 230 - ((kg - min) / (max - min)) * 190;
  return (
    <svg
      className="weight-chart"
      viewBox="0 0 760 280"
      role="img"
      aria-label={`Andamento da ${points[0].kg.toFixed(1)} a ${points.at(-1)!.kg.toFixed(1)} kg`}
    >
      <title>Andamento del peso e media settimanale</title>
      {Array.from({ length: 5 }, (_, i) => {
        const kg = min + ((max - min) * i) / 4;
        return (
          <g key={i}>
            <line x1={50} x2={710} y1={y(kg)} y2={y(kg)} stroke="var(--line)" />
            <text x={12} y={y(kg) + 4}>
              {kg.toFixed(1)}
            </text>
          </g>
        );
      })}
      <polyline
        points={points.map((p, i) => `${x(i)},${y(p.average)}`).join(" ")}
        fill="none"
        stroke="var(--green)"
        strokeWidth={3}
      />
      {points.map((p, i) => (
        <circle
          key={p.date}
          cx={x(i)}
          cy={y(p.kg)}
          r={4}
          fill="var(--muted)"
          opacity={0.5}
        />
      ))}
      <text x={50} y={265}>
        {points[0].date}
      </text>
      <text x={620} y={265}>
        {points.at(-1)!.date}
      </text>
    </svg>
  );
}
function ProfileEditor({
  profile,
  onSave,
}: {
  profile: Profile;
  onSave: (p: Profile) => void;
}) {
  const [draft, setDraft] = useState(profile);
  const [error, setError] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const result = profileSchema.safeParse(draft);
        if (!result.success) {
          setError("Controlla i dati e i target, che devono essere positivi.");
          return;
        }
        if (draft.target.kcal < 1000 || draft.target.kcal > 7000) {
          setError(
            "Indica un target tra 1.000 e 7.000 kcal. Per esigenze specifiche confrontati con un professionista.",
          );
          return;
        }
        setError("");
        onSave(result.data);
      }}
    >
      <label>
        Nome
        <input
          required
          value={draft.name}
          onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
        />
      </label>
      <div className="form-grid">
        {(
          [
            ["kcal", "Calorie (kcal)"],
            ["protein", "Proteine (g)"],
            ["carbs", "Carboidrati (g)"],
            ["fat", "Grassi (g)"],
          ] as const
        ).map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              type="number"
              required
              min={key === "kcal" ? 1000 : 0}
              max={key === "kcal" ? 7000 : 1000}
              value={draft.target[key]}
              onChange={(e) =>
                setDraft((p) => ({
                  ...p,
                  target: { ...p.target, [key]: Number(e.target.value) },
                }))
              }
            />
          </label>
        ))}
      </div>
      <label className="check-label">
        <input
          type="checkbox"
          checked={draft.lactoseFree}
          onChange={(e) =>
            setDraft((p) => ({ ...p, lactoseFree: e.target.checked }))
          }
        />{" "}
        Ricette senza lattosio
      </label>
      <label className="check-label">
        <input
          type="checkbox"
          checked={draft.athlete}
          onChange={(e) =>
            setDraft((p) => ({ ...p, athlete: e.target.checked }))
          }
        />{" "}
        Modalità atleta
      </label>
      <p className="fine-print">
        Puoi cambiare i target manualmente. Le calorie degli alimenti derivano
        dai valori dichiarati, non dalla somma arrotondata dei macro.
      </p>
      {error && (
        <p role="alert" className="notice">
          {error}
        </p>
      )}
      <button className="primary">Salva preferenze</button>
    </form>
  );
}
