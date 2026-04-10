import { Suspense } from "react";

import { TalepClient } from "./rental-request-form-client";

export default function RentalRequestFormPage() {
  return (
    <Suspense fallback={null}>
      <TalepClient />
    </Suspense>
  );
}
