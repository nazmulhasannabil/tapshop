import { cn } from "@/lib/utils";

/** Public paths for default catalog food photos. */
export const DEFAULT_ITEM_IMAGES: Record<string, string> = {
  Tea: "/items/tea.webp",
  Coffee: "/items/coffee.webp",
  "Soft Drink": "/items/soft-drink.webp",
  Biscuit: "/items/biscuit.webp",
  Burger: "/items/burger.webp",
  Sandwich: "/items/sandwich.webp",
  Noodles: "/items/noodles.webp",
  Fries: "/items/fries.webp",
  Alu: "/items/alu.webp",
  Potato: "/items/alu.webp",
};

export function isItemImageSrc(value: string | null | undefined): boolean {
  if (!value) return false;
  return (
    value.startsWith("/") ||
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:")
  );
}

/** Resolve display src: stored path, name fallback, or emoji. */
export function resolveItemVisual(
  icon: string | null | undefined,
  name?: string | null,
): { type: "image"; src: string } | { type: "emoji"; value: string } {
  if (isItemImageSrc(icon)) {
    return { type: "image", src: icon! };
  }
  if (name) {
    const mapped = DEFAULT_ITEM_IMAGES[name];
    if (mapped) return { type: "image", src: mapped };
  }
  return { type: "emoji", value: icon?.trim() || "🍽️" };
}

/** Renders a catalog item photo, or emoji fallback. */
export function ItemVisual({
  icon,
  name,
  className,
  imgClassName,
  emojiClassName,
}: {
  icon?: string | null;
  name?: string | null;
  className?: string;
  imgClassName?: string;
  emojiClassName?: string;
}) {
  const visual = resolveItemVisual(icon, name);

  if (visual.type === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- static public assets / DB paths
      <img
        src={visual.src}
        alt=""
        className={cn("size-full object-cover", imgClassName, className)}
        draggable={false}
      />
    );
  }

  return (
    <span className={cn("leading-none", emojiClassName, className)} aria-hidden>
      {visual.value}
    </span>
  );
}
