# Google Sign-In Setup Guide

This guide connects PawMart's **"Continue with Google"** button to your own Google Cloud project. It's free and takes about 10 minutes. You only need a normal Google (Gmail) account.

> **You don't need Google sign-in to run PawMart.** Without it, the login page simply shows the normal email and password form. Follow this guide only if you want the Google button.

---

## Contents

1. [How it works](#1-how-it-works)
2. [Create a Google Cloud project](#2-create-a-google-cloud-project)
3. [Set up the consent screen (Google Auth Platform)](#3-set-up-the-consent-screen-google-auth-platform)
4. [Choose who can sign in](#4-choose-who-can-sign-in)
5. [Create the OAuth client ID](#5-create-the-oauth-client-id)
6. [Add the Client ID to PawMart](#6-add-the-client-id-to-pawmart)
7. [Test it](#7-test-it)
8. [How PawMart handles accounts](#8-how-pawmart-handles-accounts)
9. [Troubleshooting](#9-troubleshooting)
10. [When you deploy](#10-when-you-deploy)

---

## 1. How it works

```text
Login page ──► "Continue with Google" ──► Google popup: user picks their Google account
       │
       ▼
Google gives the browser a signed ID token (proof of who the user is)
       │
       ▼
PawMart server verifies the token with Google's official library
       │
       ▼
Finds or creates the PawMart account ──► user is logged in
```

You only need a **Client ID**. There is **no client secret** for this kind of sign-in, and the Client ID is not secret (it's sent to every browser).

---

## 2. Create a Google Cloud project

1. Go to **[console.cloud.google.com](https://console.cloud.google.com)** and sign in with your Google account. Accept the terms if asked. (No billing or credit card is needed.)
2. At the top, click the **project selector** → **New project**.
3. Project name: `PawMart` → **Create**.
4. Make sure the new **PawMart** project is selected in the project selector.

---

## 3. Set up the consent screen (Google Auth Platform)

This is the screen users see ("Sign in to PawMart").

1. In the search bar at the top, type **Google Auth Platform** and open it (it may also appear as **APIs & Services → OAuth consent screen**).
2. Click **Get started** and fill in:
   - **App name:** `PawMart`
   - **User support email:** your email
   - **Audience:** **External**
   - **Contact information:** your email
3. Agree to the policy and click **Create**.

You don't need to add any extra scopes — PawMart only uses the basic ones (name, email, profile picture), which are included by default.

---

## 4. Choose who can sign in

A new app starts in **Testing** mode, where **only the Google accounts you list can sign in**. Pick one option:

**Option A — Test users (quickest for development)**

1. In Google Auth Platform, open **Audience**.
2. Under **Test users**, click **Add users** and add the Gmail addresses of everyone who will try it (you, your teammates, your examiner).

**Option B — Let anyone sign in**

1. In **Audience**, click **Publish app** → **Confirm**.
2. Because PawMart only asks for the basic name/email/profile information, this normally doesn't need Google's review.

---

## 5. Create the OAuth client ID

1. In Google Auth Platform, open **Clients** → **Create client**.
2. **Application type:** **Web application**.
3. **Name:** `PawMart web`.
4. Under **Authorized JavaScript origins**, click **Add URI** and add **both**:

   ```text
   http://localhost
   http://localhost:5173
   ```

   - Google requires both the plain `http://localhost` and the one **with the port** for local development.
   - If your frontend runs on a different port (for example Vite picked `5174`), add that one too.
   - No trailing slash and no path — exactly as shown.
5. Leave **Authorized redirect URIs** empty (PawMart doesn't use redirects).
6. Click **Create**.
7. Copy the **Client ID** — it looks like `1234567890-abc123….apps.googleusercontent.com`.
   (A client secret may also be shown — PawMart doesn't need it. Don't put it anywhere.)

> ⏱️ Google says changes to a client can take **5 minutes to a few hours** to apply. If the button gives an origin error right after creating it, wait a few minutes.

---

## 6. Add the Client ID to PawMart

1. Open `backend/.env` and add:

   ```env
   GOOGLE_CLIENT_ID=paste-your-client-id.apps.googleusercontent.com
   ```

2. Restart the backend (`Ctrl+C`, then `npm run dev` in `backend/`).
3. Nothing to change in the frontend — it asks the backend for the Client ID automatically.

---

## 7. Test it

1. Open `http://localhost:5173/login`.
2. Under **Or**, you should see **Continue with Google**. (In **Sign up** mode it says **Sign up with Google**.)
3. Click it, choose your Google account (it must be a **test user** if you chose Option A) and allow access.
4. You're logged in and sent to the home page. Your name appears in the navbar.

Try these too:

- **Sign out and use the button again** — you're logged in to the **same** account (no duplicate).
- **Admin → Manage Users** (as an admin) — the Google user appears like any other user. Admins can make them an admin or suspend them as usual.

---

## 8. How PawMart handles accounts

| Situation | What happens |
|---|---|
| First time with Google, email not used on PawMart | A new **customer** account is created with your Google name and profile picture. No password is set. |
| You've used Google before | You're logged in to the same account (matched by your Google account ID, not by email). |
| A PawMart account with the same **Gmail** address already exists (made with a password) | The Google login is **linked** to it. Both Google and your password work afterwards. |
| A PawMart account exists with the same **non-Gmail** address (e.g. `name@company.lk`) | Not linked automatically — you're asked to sign in with your password. (Google isn't the authority for that address, so this stops someone taking over the account.) Google Workspace (school/company Google) addresses are linked. |
| Google-only account tries the **password** form | Message: *"This account uses Google sign-in. Use "Continue with Google" instead."* |
| Someone tries to **sign up** with that email using a password | Message: *"This email is registered with Google…"* |
| Account was **suspended** by an admin | Google sign-in is refused, same as password login. |
| Google account email isn't verified | Refused. |

Security: the server checks the token's **signature**, **expiry**, **issuer** and that it was issued **for PawMart's Client ID**, using Google's official `google-auth-library`. A token made up by someone else, or issued for another website, is rejected.

---

## 9. Troubleshooting

| What you see | Cause | Fix |
|---|---|---|
| No Google button on the login page | `GOOGLE_CLIENT_ID` not set or backend not restarted | Add it to `backend/.env` and restart. Check `http://localhost:5000/api/auth/config` shows `"enabled": true` |
| Google popup: **"Error 400: origin_mismatch"**, or browser console: *"The given origin is not allowed for the given client ID"* | Your frontend address isn't in **Authorized JavaScript origins** | Add both `http://localhost` and `http://localhost:<your port>` (step 5), save, and wait a few minutes |
| Google popup: **"Access blocked: … has not completed the Google verification process"** / **"access_denied"** | App is in **Testing** and your account isn't a test user | Add your Gmail as a test user, or publish the app (step 4) |
| PawMart says *"Google sign-in could not be verified"* | The backend's `GOOGLE_CLIENT_ID` doesn't match the client the button used, or the token expired | Make sure `.env` has exactly the Client ID from step 5; restart; try again |
| PawMart says *"A PawMart account with this email already exists. Sign in with your password instead."* | That email has a password account and isn't a Gmail address | Sign in with the password |
| PawMart says *"Your Google account email is not verified"* | The Google account's email isn't verified | Verify it in your Google account, or use another account |
| Button text is in another language | Google picks the language from your location | PawMart forces English (`hl=en`); hard-refresh the page if you still see the old language |
| Button doesn't appear and the console shows a blocked request to `accounts.google.com` | Ad blocker or privacy extension | Allow `accounts.google.com` for localhost |
| Clicking does nothing in Chrome with third-party cookies blocked | Browser privacy settings | Allow third-party sign-in for localhost, or try another browser profile |

---

## 10. When you deploy

When PawMart is hosted (for example on Vercel), add the live address to the same client's **Authorized JavaScript origins**, e.g.:

```text
https://pawmart.vercel.app
```

Only HTTPS is allowed for non-localhost origins. Set `GOOGLE_CLIENT_ID` in the backend host's environment variables (e.g. Render) — the frontend needs no change.

### Useful links

- Google Cloud Console — [console.cloud.google.com](https://console.cloud.google.com)
- Google docs — [Get your Google API client ID](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid)
- Google docs — [Display the Sign in with Google button](https://developers.google.com/identity/gsi/web/guides/display-button)
- Google docs — [Verify the Google ID token on your server](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)
- Technical details — [`backend/README.md`](backend/README.md#sign-in-with-google)
