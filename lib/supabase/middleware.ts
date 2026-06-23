import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/** Routes reachable while signed out. */
const PUBLIC_PATHS = ["/login", "/signup"];

/**
 * Refreshes the Supabase auth session cookie on every request, and gates
 * access: signed-out users are redirected to /login (except on public paths).
 * Role-level gating (pending / viewer / organizer) is handled in the app
 * layout + server components, where we can read the profile role.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }: CookieToSet) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }: CookieToSet) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: getUser() refreshes the token; do not run code between
  // createServerClient and getUser().
  //
  // This is the SINGLE per-request token validation (a networked Auth-server
  // check). Because it runs before every route renders, downstream Server
  // Components/actions (see getCurrentProfile) can read the session LOCALLY via
  // getSession() instead of re-validating over the network — that local read is
  // only safe because this call already validated the token here.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Signed-in users shouldn't sit on the auth screens.
  if (user && isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}
