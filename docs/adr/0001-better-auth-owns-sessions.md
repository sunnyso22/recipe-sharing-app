# better-auth owns sessions

Cookery's server never set `auth.uid()` on its database connection, so row-level security was a second ownership check the app did not use. better-auth sessions are rows looked up from a cookie, not Supabase Auth tokens, so those policies would not see the signed-in user.

We use better-auth for users, accounts, and sessions, stored in Supabase Postgres. Supabase Auth is removed, and the existing rows are dropped. A session is one browser sign-in. Email and password is the only sign-in method in this version, a user's email stays fixed in this version, and a session exists only after the email is verified. Opening the verification link verifies the email, creates the session, and redirects to the home page. A second confirm step on that page was rejected: a mail scanner that fetches the link can consume it, and the user then signs in with the password from sign-up. The server enforces ownership by comparing the session's user id with the row's user id. We do not use better-auth's admin access control for recipes, and we do not carry forward policies that call `auth.uid()`. The Supabase Data API roles have no privileges on these tables. The Next.js server is the only database client, which is also how signed-out visitors still read recipes.

## Considered options

Keep Supabase Auth and delete the duplicate checks. That keeps a token the server has to re-check against `auth.users` and `auth.sessions`, which is the split that made the auth code hard to follow.

Permit "update recipe" through better-auth's admin roles. The user role would then be allowed to update every recipe. Ownership is per recipe.

Keep row-level security by setting the user id on the database connection for each request. That builds the second authorization mechanism again.

Leave the Data API in place and keep row-level security for it. The server would still check ownership itself, so authorization would live in two places again.
