import type { APIGatewayEvent, Context } from "aws-lambda";
import type { getEnvironment } from "../getEnvironment/index.ts";

declare module "fastify" {
  interface FastifyRequest {
    // Only defined in deployed environments
    awsLambda?: {
      event: APIGatewayEvent;
      context: Context;
    };
  }
  interface FastifyReply {
    render: (
      templatePath: string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      props?: Record<string, any>,
    ) => Promise<void>;
    globals: {
      staticHash: string;
      assetsHash: string;
      publicScriptsHash: string;
      fingerprintHash: string;
      currentUrl: URL;
      lng: string | undefined;
      authFrontEndUrl: string;
      analyticsCookieDomain: string;
      ga4ContainerId: string;
      analyticsEnabled: boolean;
      env: ReturnType<typeof getEnvironment>;
      csrfToken?: string;
    };
    analytics?:
      | Partial<{
          contentId?: string;
          isPageDataSensitive?: boolean;
          taxonomyLevel1?: string;
          taxonomyLevel2?: string;
          taxonomyLevel3?: string;
          taxonomyLevel4?: string;
          taxonomyLevel5?: string;
          dynamic?: boolean;
          loggedInStatus?: boolean;
          isSelectContentTrackingEnabled?: boolean;
          reason?: string;
        }>
      | undefined;
  }
}

declare module "fastify" {
  interface Session {
    expires: number;
    _csrf: string;
    bestPet?: string;
  }
}
