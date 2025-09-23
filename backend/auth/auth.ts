import { createClerkClient, verifyToken } from "@clerk/backend";
import { Header, Cookie, APIError, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { secret } from "encore.dev/config";

const clerkSecretKey = secret("ClerkSecretKey");
const clerkClient = createClerkClient({ secretKey: clerkSecretKey() });

interface AuthParams {
  authorization?: Header<"Authorization">;
  session?: Cookie<"session">;
}

export interface AuthData {
  userID: string;
  email: string | null;
  role: string;
  tenantId?: string;
  subscriptionStatus: string;
  trialEndDate?: Date;
  imageUrl: string;
}

// Configure the authorized parties.
const AUTHORIZED_PARTIES = [
  "https://smart-kalkulator-app-d2hcstk82vjt19pmedh0.lp.dev",
];

export const auth = authHandler<AuthParams, AuthData>(
  async (data) => {
    // Resolve the authenticated user from the authorization header or session cookie.
    const token = data.authorization?.replace("Bearer ", "") ?? data.session?.value;
    if (!token) {
      throw APIError.unauthenticated("missing token");
    }

    try {
      const verifiedToken = await verifyToken(token, {
        authorizedParties: AUTHORIZED_PARTIES,
        secretKey: clerkSecretKey(),
      });

      const user = await clerkClient.users.getUser(verifiedToken.sub);
      
      // Get user role and tenant from metadata
      const role = user.publicMetadata?.role as string || 'user';
      const tenantId = user.publicMetadata?.tenantId as string;
      const subscriptionStatus = user.publicMetadata?.subscriptionStatus as string || 'trial';
      const trialEndDate = user.publicMetadata?.trialEndDate ? new Date(user.publicMetadata.trialEndDate as string) : undefined;
      
      return {
        userID: user.id,
        email: user.emailAddresses[0]?.emailAddress ?? null,
        role,
        tenantId,
        subscriptionStatus,
        trialEndDate,
        imageUrl: user.imageUrl
      };
    } catch (err) {
      throw APIError.unauthenticated("invalid token", err as Error);
    }
  }
);

// Configure the API gateway to use the auth handler.
export const gw = new Gateway({ authHandler: auth });
