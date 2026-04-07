"use client";

import { VEHICLE_IMAGE_SLOTS, type VehicleImages } from "@/lib/vehicle-images";
import { cn } from "@/lib/utils";

type Props = {
  images?: VehicleImages;
  /** Küçük küçük önizleme (detay sayfası) */
  compact?: boolean;
};

export function VehicleImageGallery({ images, compact }: Props) {
  if (!images) return null;
  const filled = VEHICLE_IMAGE_SLOTS.filter(({ key }) => images[key]);
  if (filled.length === 0) return null;

  return (
    <div
      className={cn(
        "grid gap-1.5 sm:gap-2",
        compact ? "grid-cols-3 sm:grid-cols-6" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
      )}
    >
      {filled.map(({ key, label }) => {
        const src = images[key];
        if (!src) return null;
        return (
          <figure
            key={key}
            className={cn(
              "overflow-hidden rounded-md border bg-muted/20",
              compact && "rounded border-border/80",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={label}
              loading="lazy"
              decoding="async"
              className={cn(
                "w-full object-cover",
                compact ? "aspect-[4/3] max-h-[5rem] sm:max-h-[5.5rem]" : "aspect-[4/3] h-auto",
              )}
            />
            <figcaption
              className={cn(
                "border-t bg-card text-center font-medium text-muted-foreground",
                compact ? "px-1 py-0.5 text-[9px] leading-tight sm:text-[10px]" : "px-1.5 py-1 text-[10px]",
              )}
            >
              {label}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
