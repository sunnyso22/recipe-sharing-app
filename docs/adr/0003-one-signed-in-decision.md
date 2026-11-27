# One signed-in decision

Signed in was three answers. A session cookie was enough for the gate, and that gate stored a return path only when the cookie was missing. A page that asked for a user then sent a rejected cookie to sign-in with the return path dropped. Like and bookmark built their own sign-in URL. A cookie is not a session. Better Auth's session counts only after the server verifies the cookie and returns the user, and a Cookery session is that sign-in for a verified user. No cookie, a cookie the server rejects, and an unverified email are signed out.

One module decides whether this browser is signed in. A caller asks who is signed in, or asks the module to send this browser to sign-in for a return path. Public pages stay up when the browser is signed out. The cookbook, bookmarks, settings, a new recipe, and a recipe edit send a signed-out browser to sign-in and come back to that page, query included. A signed-out save on settings or a new recipe does the same. An address outside Cookery opens home. Sign-in, sign-up, forgot password, and reset password are not return paths, so signing in from the sign-in page opens home. A signed-in browser that opens sign-in goes to the return path, or home when there is none, and the form stays hidden. A signed-in browser that opens sign-up goes home. A rejected cookie still shows the sign-in form. The header's Sign in link uses the page the browser is on.

A signed-out visit to a recipe edit goes to sign-in even when the recipe is missing or belongs to someone else. After sign-in, a missing recipe or a recipe they do not own is a 404. A signed-in browser that does not own it gets that 404 directly. A signed-out update goes to sign-in for that edit page, and the unsaved text is dropped. "This recipe could not be updated" means the save failed. Like and bookmark send that click to sign-in and come back to the recipe. A signed-out delete keeps "This recipe could not be deleted." A successful delete opens the cookbook, with no search query and no other destination. Where a confirmation link or a reset link sends the browser is unchanged.

## Considered options

One function that returns the user or always redirects. The header and a public recipe would need a second way to ask, which is the split this removes.

Treat a cookie as signed in. A rejected cookie would pass the gate, and the sign-in form would send that browser home.

Leave each caller to build its own sign-in URL. Like, bookmark, and the pages that require a session would keep dropping or rewriting the return path.

Allow sign-in, sign-up, forgot password, and reset password as return paths. Signing in from the sign-in page would open sign-in again.

Keep a signed-out update on the form with "This recipe could not be updated." That sentence would mean both a failed save and a signed-out browser. The edit page already sends a signed-out browser to sign-in, so the save does too.

Send a successful delete to the public recipe list, or to a destination chosen on the button. The owner manages their recipes in the cookbook. Delete does not grow a return path of its own.
