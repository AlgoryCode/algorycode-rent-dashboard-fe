"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      richColors
      position="top-right"
      closeButton
      toastOptions={{
        classNames: {
          toast: "group border border-border bg-background text-foreground shadow-md",
          description: "text-muted-foreground",
        },
      }}
    />
  );
}
