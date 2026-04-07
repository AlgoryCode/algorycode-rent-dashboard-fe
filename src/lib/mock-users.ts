export type PanelUserRole = "admin" | "operator" | "viewer";

export type PanelUser = {
  id: string;
  fullName: string;
  email: string;
  role: PanelUserRole;
  /** Son giriş veya aktivite (ISO) */
  lastActiveAt: string;
  /** Hesap durumu */
  active: boolean;
};

export const ROLE_LABEL: Record<PanelUserRole, string> = {
  admin: "Yönetici",
  operator: "Operatör",
  viewer: "Görüntüleyici",
};

/** Demo panel kullanıcıları */
export const seedPanelUsers: PanelUser[] = [
  {
    id: "u1",
    fullName: "Algory Admin",
    email: "admin@algorycode.com",
    role: "admin",
    lastActiveAt: "2026-04-07T08:15:00.000Z",
    active: true,
  },
  {
    id: "u2",
    fullName: "Filo Sorumlusu",
    email: "filo@sirket.com",
    role: "operator",
    lastActiveAt: "2026-04-06T17:40:00.000Z",
    active: true,
  },
  {
    id: "u3",
    fullName: "Demo İzleyici",
    email: "viewer@demo.com",
    role: "viewer",
    lastActiveAt: "2026-04-05T11:00:00.000Z",
    active: true,
  },
  {
    id: "u4",
    fullName: "Eski Hesap",
    email: "pasif@demo.com",
    role: "operator",
    lastActiveAt: "2026-03-01T09:00:00.000Z",
    active: false,
  },
];
