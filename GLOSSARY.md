# Cookery

People sign up, sign in, and share recipes they own.

## Language

**Active session**:
A signed-in person on this browser. Their account still exists, this sign-in still exists, and their email is known.
_Avoid_: live session, logged-in user

**Revoked session**:
A sign-in whose account or browser session no longer exists.
_Avoid_: signed out, anonymous

**Signed out**:
No active session. This includes a person who never signed in, a revoked session, and a token that names an account but carries no email.
_Avoid_: anonymous, guest, live session

**Display name**:
The name shown for a signed-in person. The name on their account, or their email when that name is empty.
_Avoid_: username, nickname, full name
