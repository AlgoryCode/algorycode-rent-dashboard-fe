import { Suspense } from "react";

import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Yükleniyor…</div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
