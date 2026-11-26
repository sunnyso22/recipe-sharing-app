# Resend sends Cookery's messages

Confirmation messages and reset messages go out through Resend, from `Cookery <noreply@cookery.sunnyso22.dev>`. Supabase Auth was the only mailer, and it is being removed. The messages are React Email templates. The link points at the environment that created the user: localhost on a machine, the preview's own URL on a preview, and `https://cookery.sunnyso22.dev` in production. A failed send leaves no live link. The automated tests read a captured mailbox.

## Considered options

Keep Supabase Auth's mailer. That mailer leaves with Supabase Auth.

Capture every message outside production. A local or preview sign-up would then have no inbox to open. Resend sends in those environments too, and the link points at that same environment.

Send plain text only. React Email carries the layout. The words, the button address, and the visible URL stay the ones already agreed.
