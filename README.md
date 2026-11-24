This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Password recovery cookie

A password reset keeps a short-lived `password-recovery` cookie so the reset page can tell that session from an ordinary sign-in. The cookie is signed with HMAC-SHA256. The key is the server-only variable `PASSWORD_RECOVERY_COOKIE_SECRET`.

It is not `DATABASE_URL`, and the name must not start with `NEXT_PUBLIC_`. If the variable is missing or invalid, reset links fail closed and the reset page asks for a new link. Sign-in, signup confirmation, and other sessions keep working.

Set the variable before you deploy. Use a different value for local development, Vercel Preview, and Vercel Production.

### Generate a value

On your own computer, in a terminal:

```bash
openssl rand -base64 32
```

That prints one line: 32 random bytes (256 bits), encoded as base64. Copy that line into the variable. Do not commit it, paste it into chat, or reuse `DATABASE_URL`.

The app accepts the value only when all of these hold:

- After trimming spaces and line breaks at the ends, it is 43 to 256 characters.
- It has no spaces or line breaks in the middle.
- It is not a URL, and it is not the same string as `DATABASE_URL`.
- It is not a repeated block or another low-diversity string.

`openssl rand -base64 32` meets that bar. A passphrase or a copy of the database URL does not. There is no fallback to `DATABASE_URL`.

Base64 from that command does not contain `$`. In `.env.local`, Next.js expands `$` as another variable, so do not invent a value that contains `$`.

### Local development

`.env.local` is gitignored. Add the name and paste the generated line after `=`, with no quotes and no space around it:

```bash
PASSWORD_RECOVERY_COOKIE_SECRET=
```

Restart `next dev` after saving. Local development reads `.env.local`. Tests do not.

### Vercel, before you deploy

1. Open the project in Vercel → Settings → Environment Variables.
2. Add `PASSWORD_RECOVERY_COOKIE_SECRET`.
3. Enable it for Production and for Preview. Use a separate generated value for each.
4. Leave the name without a `NEXT_PUBLIC_` prefix. Mark it Sensitive if you want the dashboard to hide it after saving.
5. Save, then deploy this change. A deployment created before the variable existed will not pick it up until you deploy again.

### Rotating the secret

Generate a new value, replace the variable in that environment, and deploy again. Recovery cookies that were already issued stop verifying. Someone who is halfway through a reset has to request a new link and open that link. The cookie lasts at most one hour.

Ordinary sign-in sessions stay as they are. Signup confirmation is unchanged. Rotating `DATABASE_URL` does not clear these cookies, and rotating this secret does not change the database password.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
