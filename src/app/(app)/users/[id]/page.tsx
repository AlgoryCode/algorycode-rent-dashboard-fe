import { UserDetailClient } from "./user-detail-client";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function UserDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <UserDetailClient userId={id} />;
}
