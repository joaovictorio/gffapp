import { getServerSession } from "next-auth";
import { authOptions } from "./auth-options";

export async function getAuthenticatedTenant() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { user: null, tenantId: null, role: null };
  }

  return {
    user: session.user,
    tenantId: session.user.tenantId,
    role: session.user.role,
  };
}
