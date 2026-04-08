import { Suspense } from "react";

import { VehicleDetailRoute } from "./vehicle-detail-route";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function VehicleDetailPage({ params }: PageProps) {
  return (
    <Suspense fallback={null}>
      <VehicleDetailRoute params={params} />
    </Suspense>
  );
}
