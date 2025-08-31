// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// ✅ Define your public routes
const isPublicRoute = createRouteMatcher([
  "/",                        // Home
  "/sign-in(.*)",             // Sign-in (catch-all)
  "/sign-up(.*)",             // Sign-up (catch-all)
  "/api/webhooks/clerk",      // Clerk webhook
  "/api/webhooks/stripe",     // Stripe webhook
]);

export default clerkMiddleware((auth, req) => {
  if (isPublicRoute(req)) {
    return; // Allow public routes
  }

  // ✅ Protect everything else
   auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
