import { RentalDetailClient } from "./rental-detail-client";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function RentalDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <RentalDetailClient rentalId={id} />;
}
