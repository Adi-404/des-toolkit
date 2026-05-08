import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Only the data-storing routes need a session. Stateless tools stay public.
const isProtectedRoute = createRouteMatcher([
    '/moodboard(.*)',
    '/fonts(.*)',
    '/clipboard(.*)',
    '/notes-pad(.*)',
    '/notes(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
    if (isProtectedRoute(req)) {
        await auth.protect();
    }
});

export const config = {
    matcher: [
        // Run on every route except Next internals + static files.
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run on API routes.
        '/(api|trpc)(.*)',
    ],
};
