import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      tenantId: string;
      role: string;
    };
  }

  interface User {
    id: string;
    nome: string;
    email: string;
    tenantId: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    tenantId: string;
    role: string;
  }
}
