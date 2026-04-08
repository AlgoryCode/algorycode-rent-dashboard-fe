import { Suspense } from "react";

import { TalepClient } from "./talep-client";

export default function TalepPage() {
  return (
    <Suspense fallback={null}>
      <TalepClient />
    </Suspense>
  );
}
