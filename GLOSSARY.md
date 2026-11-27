# Cookery

People sign up, sign in, and share recipes they own.

## Language

**User**:
A person who has signed up.
_Avoid_: account, active session, cook, profile

**Email**:
The address that identifies a user. Each user has one.
_Avoid_: username, display name

**Verified**:
A user's email after its confirmation link has been opened.
_Avoid_: active, authenticated, signed in

**Confirmation message**:
A message sent to a user's email so they can verify it.
_Avoid_: email, verification email, notification

**Reset message**:
A message sent to a verified user's email so they can set a new password.
_Avoid_: email, recovery email, password email

**Account**:
A sign-in method linked to a user.
_Avoid_: user, profile

**Session**:
A sign-in of a verified user on one browser that the server has accepted. A cookie the server rejects is not a session.
_Avoid_: active session, live session, logged-in user, cookie

**Signed in**:
A browser that has a session.
_Avoid_: authenticated, logged in, verified

**Signed out**:
A browser with no session.
_Avoid_: anonymous, guest, revoked session

**Return path**:
The Cookery page sign-in opens after a signed-out browser is sent there. Sign-in, sign-up, forgot password, and reset password are not return paths. Those, and any address outside Cookery, open home.
_Avoid_: next, redirect, callback

**Owner**:
The user who created a recipe.
_Avoid_: author, cook

**Cookbook**:
The recipes an owner created.
_Avoid_: recipe list, bookmarks, my recipes

**Display name**:
The name of a user. Every user has one.
_Avoid_: username, nickname, full name, email
