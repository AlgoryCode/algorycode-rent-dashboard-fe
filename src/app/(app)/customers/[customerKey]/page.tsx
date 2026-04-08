import { CustomerDetailClient } from "./customer-detail-client";

type PageProps = {
  params: Promise<{ customerKey: string }>;
};

export default async function CustomerDetailPage({ params }: PageProps) {
  const { customerKey } = await params;
  return <CustomerDetailClient customerKey={customerKey} />;
}
