# PayPal Setup Guide (Sandbox)

This guide walks you through connecting PawMart to **PayPal's sandbox** — PayPal's free test environment. You get the real PayPal checkout (real PayPal pages and popup), but **no real money moves**. It takes about 15 minutes.

> **You don't need PayPal to run PawMart.** Without it, checkout still works with the simulated card and cash on delivery — the PayPal option just doesn't appear. Follow this guide only if you want to demonstrate PayPal.

---

## Contents

1. [How it works (1-minute overview)](#1-how-it-works-1-minute-overview)
2. [Before you start](#2-before-you-start)
3. [Create a PayPal developer account](#3-create-a-paypal-developer-account)
4. [Create the sandbox test accounts](#4-create-the-sandbox-test-accounts)
5. [Create the PayPal app and copy its keys](#5-create-the-paypal-app-and-copy-its-keys)
6. [Add the keys to PawMart](#6-add-the-keys-to-pawmart)
7. [Make a test payment](#7-make-a-test-payment)
8. [Test a refund](#8-test-a-refund)
9. [Troubleshooting](#9-troubleshooting)
10. [Good to know](#10-good-to-know)

---

## 1. How it works (1-minute overview)

There are **three sandbox accounts** involved, and mixing them up is the most common mistake:

| Account | What it is | Where you use it |
|---|---|---|
| **Your developer login** | Your normal PayPal account, used to sign in to developer.paypal.com | Only on the developer website |
| **Sandbox Business account** (`…@business.example.com`) | The fake **shop** that receives the money | Linked to your app — **never log in to checkout with it** |
| **Sandbox Personal account** (`…@personal.example.com`) | The fake **customer** with test money | Log in with it in the PayPal popup when you pay |

What happens when a customer pays:

```text
PawMart checkout ──► PawMart server asks PayPal to create an order for the total
       │
       ▼
PayPal popup ──► customer logs in with the sandbox Personal account and clicks "Complete the purchase"
       │
       ▼
PawMart server captures the payment ──► order confirmed, cart cleared, "Order Placed!"
```

---

## 2. Before you start

You need:

- [ ] PawMart running locally (backend and frontend — see the main [README](README.md#quick-start))
- [ ] Any PayPal account to sign in to the developer website. A normal Sri Lankan PayPal account is fine for this — it's only used to log in to developer.paypal.com.
- [ ] Access to the `backend/.env` file on your computer

---

## 3. Create a PayPal developer account

1. Go to **[developer.paypal.com](https://developer.paypal.com)**.
2. Click **Log in to Dashboard** and sign in with your PayPal account (or create one).
3. At the top of the dashboard there's a **Sandbox / Live** switch. Make sure **Sandbox** is selected. Everything in this guide happens in **Sandbox**.

---

## 4. Create the sandbox test accounts

PayPal usually creates two sandbox accounts for you automatically. **They are often registered in your own country (Sri Lanka), and that won't work** — PayPal accounts in Sri Lanka can send money but **can't receive** it, so the fake shop could never be paid. Create new ones in the **United States**.

1. In the dashboard go to **Testing Tools → Sandbox Accounts**.
2. Click **Create account** and create the **shop**:
   - Account type: **Business (Merchant Account)**
   - Country/Region: **United States**
   - Click **Create**.
3. Click **Create account** again and create the **customer**:
   - Account type: **Personal (Buyer Account)**
   - Country/Region: **United States**
   - Click **Create**.

To see an account's login details: click the **⋮** (three dots) next to it → **View/Edit account** → **Profile** tab. You'll see the **Email ID** and the **System Generated Password** (you can change the password there).

✅ Write down the **Personal** account's email and password — you'll log in with them when paying.

> These are fake test accounts with test money. They aren't real PayPal accounts and can't be used outside the sandbox.

---

## 5. Create the PayPal app and copy its keys

The "app" gives PawMart its keys and decides **which business account receives the money**.

1. Go to **Apps & Credentials** (make sure **Sandbox** is still selected).
2. Click **Create App**.
   - **App Name:** `PawMart`
   - **Type:** Merchant
   - **Sandbox Account:** choose the **United States Business** account you created in step 4.
     ⚠️ This is the most important choice in the whole guide. If the app is linked to a Sri Lankan business account, payments will fail.
3. Click **Create App**.
4. On the app's page you'll see two keys:
   - **Client ID** — a long code starting with `A…`
   - **Secret** — click **Show** to reveal it

> If you already had an app linked to a Sri Lankan account, don't try to fix that app — create a **new** app linked to the US business account and use the new keys.

---

## 6. Add the keys to PawMart

1. Open `backend/.env` in your editor. (If it doesn't exist yet, copy `backend/.env.example` to `backend/.env` first.)
2. Add or update these lines, pasting your own values:

   ```env
   PAYPAL_ENV=sandbox
   PAYPAL_CLIENT_ID=paste-the-client-id-here
   PAYPAL_CLIENT_SECRET=paste-the-secret-here
   PAYPAL_SHIPPING_COUNTRY=LK
   ```

   - No spaces around `=` and no quotes needed.
   - `PAYPAL_SHIPPING_COUNTRY=LK` means checkout addresses are sent to PayPal as Sri Lankan addresses. Leave it as `LK`.

3. **Restart the backend** (stop it with `Ctrl+C`, then run `npm run dev` again in `backend/`).
4. Check the backend terminal. You should see:

   ```text
   [paypal] enabled (sandbox)
   ```

   If it says `[paypal] not configured — PayPal checkout hidden`, the keys weren't picked up — check the variable names and that you saved the file.

> 🔒 **Never commit `backend/.env` or share the Secret** (it's already in `.gitignore`). The Client ID is shown to browsers by design; the Secret must stay on the server.

---

## 7. Make a test payment

1. Open PawMart in your browser (normally `http://localhost:5173`) and log in with a **PawMart** account (any customer account — this is your PawMart login, not PayPal).
2. Add a product to the cart and open the **Cart**.
3. Fill in **Shipping Information** (all five fields are required).
4. Under **Payment Method**, select **PayPal**.
5. In the **Order Total** box on the right, click the yellow **PayPal** button. A PayPal popup opens.
6. In the popup:
   - If it already shows an email, check it ends in **`@personal.example.com`**. If it shows a `@business.example.com` email, click **Change**.
   - Log in with the **Personal** account's email and password from step 4.
   - Choose **PayPal balance** and click **Complete the purchase**. (The store name shows as **PawMart** and the shipping address is the one you typed at checkout.)
7. The popup closes and PawMart shows **Order Placed!** with:
   - `PayPal (sb-…@personal.example.com) • Paid`
   - `PayPal transaction XXXXXXXX (sandbox)`

🎉 That's a complete PayPal payment. You can see it in **Profile → Order History**, and as the customer you can also see it by logging in to **[sandbox.paypal.com](https://www.sandbox.paypal.com)** with the Personal account.

---

## 8. Test a refund

1. Go to **Profile → Order History**.
2. On the PayPal order, click **Cancel Order** and confirm.
3. PawMart asks PayPal to refund the payment. The order changes to **Cancelled** and the payment line to **PayPal • Refunded**. Stock goes back to the shop.

You can only cancel before an order has shipped. Admins can also cancel and refund from **Admin → Orders**.

---

## 9. Troubleshooting

| What you see | Cause | Fix |
|---|---|---|
| No **PayPal** option at checkout | Keys not loaded | Check `backend/.env`, restart the backend, and look for `[paypal] enabled (sandbox)` in the terminal |
| Backend log says `[paypal] not configured` | Variable names wrong or file not saved | Names must be exactly `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` |
| PawMart error *"Could not connect to PayPal. Check the PayPal credentials."* | Wrong Client ID/Secret, or keys from the **Live** tab | Copy both keys again from **Sandbox → Apps & Credentials**; keep `PAYPAL_ENV=sandbox` |
| PayPal popup: **"Things don't seem to be going well at the moment"** | The app's business account can't receive money (registered in **Sri Lanka**), or you logged in with the **business** account | Create a **US** business account and a **new app** linked to it (steps 4–5); log in to the popup with the **Personal** account |
| **Debit or Credit Card** button: *"We weren't able to add this card"* | Card payments aren't enabled for that sandbox business account (PayPal error `PAYEE_NOT_ENABLED_FOR_CARD_PROCESSING`) | Use the yellow **PayPal** button with the Personal account instead — it's the reliable path for demos |
| Popup opens and closes immediately / nothing happens | Browser blocked the popup | Allow popups for `localhost` and try again |
| PawMart says *"Fill in your shipping information before paying with PayPal"* | Shipping fields empty | Fill in all five shipping fields first |
| PawMart says *"PayPal declined that payment method"* | The test funding source was declined | PayPal lets you pick another method in the popup — choose **PayPal balance** |
| PayPal buttons don't load | No internet, or an ad blocker blocks `paypal.com` | Check your connection; disable the blocker for localhost |
| An order stays **Awaiting payment** | The popup was closed without paying | It's released automatically after 30 minutes (stock returns), or cancel it from Order History |
| Backend can't reach MongoDB (`querySrv ENOTFOUND`) | Temporary DNS problem, unrelated to PayPal | Wait a moment and restart; it usually reconnects on retry |

---

## 10. Good to know

- **Currency:** payments are in **USD** (PawMart's prices are in dollars). The sandbox handles conversion; no real money moves.
- **Fees:** in the sandbox, PayPal deducts a pretend fee from the shop's balance — you'll see it in the business account's activity. It isn't real.
- **Safety built into PawMart:**
  - The amount is always calculated on the PawMart server, never taken from the browser.
  - PawMart checks that the amount PayPal captured matches the order before confirming it.
  - Stock is reserved while the customer is in the popup and released if they cancel or abandon the payment.
- **For your teammates:** each person can use their own sandbox keys in their own `backend/.env`, or the team can share one set of **sandbox** keys privately (never in Git).
- **Going live (not needed for this project):** you would need a real PayPal **Business** account in a country that can receive payments, the **Live** keys from the dashboard, and `PAYPAL_ENV=live`. Don't do this for a demo.

### Useful links

- PayPal Developer Dashboard — [developer.paypal.com](https://developer.paypal.com)
- Sandbox PayPal site (log in as the test customer/shop) — [sandbox.paypal.com](https://www.sandbox.paypal.com)
- PayPal docs — [Standard Checkout integration](https://developer.paypal.com/studio/checkout/standard/integrate)
- Technical details of PawMart's PayPal integration — [`backend/README.md`](backend/README.md#paypal-checkout-sandbox)
