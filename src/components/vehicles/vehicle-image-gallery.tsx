"use client";

import { VEHICLE_IMAGE_SLOTS, type VehicleImages } from "@/lib/vehicle-images";

type Props = {
  images?: VehicleImages;
};

export function VehicleImageGallery({ images }: Props) {
  if (!images) return null;
  const filled = VEHICLE_IMAGE_SLOTS.filter(({ key }) => images[key]);
  if (filled.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {filled.map(({ key, label }) => {
        const src = images[key];
        if (!src) return null;
        return (
          <figure key={key} className="overflow-hidden rounded-lg border bg-muted/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={label} className="aspect-[4/3] h-auto w-full object-cover" />
            <figcaption className="border-t bg-card px-1.5 py-1 text-center text-[10px] font-medium text-muted-foreground">
              {label}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
