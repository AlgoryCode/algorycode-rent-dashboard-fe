import { Suspense } from "react";

import { TalepClient } from "../talep-client";

export default function TalepLockedPage() {
  return (
    <Suspense fallback={null}>
      <TalepClient locked />
    </Suspense>
  );
}
