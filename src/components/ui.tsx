"use client";
import { useEffect, useRef } from "react";
import { X, Flame, Beef, Wheat, Droplet } from "lucide-react";
import type { Nutrients } from "@/features/nutrition/domain";
import { formatNumber, macroLabels } from "@/features/foods/catalog";
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prior = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          "button,input,select,textarea,a[href]",
        ) ?? [],
      ).filter((e) => !e.hasAttribute("disabled"));
    focusables()[0]?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const els = focusables();
        const first = els[0],
          last = els.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = previous;
      prior?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="icon-button" aria-label="Chiudi" onClick={onClose}>
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function FoodImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <img
      className={className}
      src={src}
      alt={alt}
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = "/food-placeholder.svg";
      }}
    />
  );
}
const icons = { protein: Beef, carbs: Wheat, fat: Droplet };
export function Macros({
  totals,
  target,
}: {
  totals: Nutrients;
  target?: Nutrients;
}) {
  return (
    <div className="macro-stack">
      {(["protein", "carbs", "fat"] as const).map((key) => {
        const Icon = icons[key];
        return (
          <div className={`macro ${key}`} key={key}>
            <span className="macro-icon">
              <Icon size={20} />
            </span>
            <div>
              <div className="macro-top">
                <span>{macroLabels[key]}</span>
                <strong>
                  {formatNumber(totals[key])}
                  <small>
                    {target ? ` / ${formatNumber(target[key])}` : ""} g
                  </small>
                </strong>
              </div>
              {target && (
                <div className="track">
                  <span
                    style={{
                      width: `${Math.min(100, (totals[key] / Math.max(1, target[key])) * 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
export function Energy({
  totals,
  target,
}: {
  totals: Nutrients;
  target: Nutrients;
}) {
  const percentage = Math.min(
    100,
    (totals.kcal / Math.max(1, target.kcal)) * 100,
  );
  return (
    <div className="card energy-card">
      <h3>Energia di oggi</h3>
      <div
        className="energy-ring"
        style={{
          background: `conic-gradient(var(--green) ${percentage}%,var(--line) 0)`,
        }}
      >
        <div>
          <strong>{formatNumber(totals.kcal)}</strong>
          <span>di {formatNumber(target.kcal)} kcal</span>
        </div>
      </div>
      <b>
        {totals.kcal <= target.kcal
          ? `${formatNumber(target.kcal - totals.kcal)} kcal disponibili`
          : `${formatNumber(totals.kcal - target.kcal)} kcal oltre il target`}
      </b>
    </div>
  );
}
export function NutritionSummary({ totals }: { totals: Nutrients }) {
  return (
    <div className="nutrition-summary">
      <div>
        <Flame size={19} />
        <strong>{formatNumber(totals.kcal)}</strong>
        <small>kcal stimate</small>
      </div>
      {(["protein", "carbs", "fat"] as const).map((k) => (
        <div className={k} key={k}>
          <strong>{formatNumber(totals[k])} g</strong>
          <small>{macroLabels[k]}</small>
        </div>
      ))}
    </div>
  );
}
