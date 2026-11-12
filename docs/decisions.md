# Homami: product decisions

What we decided, when, and why. Newest first. Each entry names where it lives in the code or the database.

**People read these in the app too.** Anything that changes what members can do, pay or see also goes on **Find out more**: `src/lib/help.ts`, shown at `#/help` from the ≡ menu. Update both in the same change.

---

## 2026-11-12 · Security check-up
- **Post photos are private.** They live in their own private folder: only the person who posted and their circle can open them, through links that stop working after an hour. Deleting a post deletes its photo too. Why: before, a post photo could be opened by anyone who had its link, even though posts are circle-only. Photos from posts made before this change stay where they were until the post is deleted (script 16, `src/lib/posts.ts`).
- **A post's photo has to be your own.** Nobody can show someone else's photo, or a picture from another website, in a post (script 16).
- **Accepting and cancelling at the same moment.** If the owner cancels a request while the sitter is accepting it, the request stays cancelled and the owner gets all the money back straight away (payments function).
- **Bookings can't be accepted once their first day has passed**, paid or free (payments function, script 16).
- **Database actions that need a login can't be used without one.** Only "is this invitation code valid?" stays open, for sign-up (script 16).
- **Browser safety settings** on the live app: Homami can't be shown inside another website, and the app only talks to Homami, Supabase and Stripe (`vercel.json`). Storybook is left out of these.

## 2026-11-12 · Cancelling a booking
- Once a booking has been accepted, **the pet owner or the sitter** can cancel it, up to and including its first day. After that they sort it out in the chat.
- **Whoever cancels says why.** They pick a reason from a short list, which is different for owners and sitters. They can also add a message, which is required if they pick "Something else". The other person gets the reason and the message in their chat.
- **Money back for paid bookings**, counted from the first day of the booking. "Today" means today in Spain.

  | Who cancels | When | Owner gets back |
  |---|---|---|
  | Pet owner | 14 days or more before | 100% |
  | Pet owner | 7 to 13 days before | 50% |
  | Pet owner | less than 7 days before | 20% |
  | Sitter | any time | 100% |

  The sitter keeps the rest. Homami's fee is refunded in the same share.
  - *Why:* the sitter has kept those days free and loses more the later a booking is cancelled. Owners still always get something back.
  - *Why the sitter rule:* the owner shouldn't pay for care that isn't happening. *Open question:* what a sitter who cancels often should face.
- Free bookings (exchanges) are cancelled the same way, with nothing to refund.
- Cancelling a request that hasn't been answered yet stays one tap ("Cancel request"), with no reason asked: nothing has been agreed or paid.
- **Where it lives:**
  - database script 15;
  - `cancel-booking` in the payments function, which does the Stripe refund and is the rule that counts;
  - `src/lib/cancellation.ts`, the same rules shown beforehand;
  - `src/screens/CancelBooking.tsx`.

## 2026-11-12 · A decisions log and a Find out more page
- Decisions are logged here, and members can read the rules in the app under ≡ → Find out more.

## 2026-11-11 · Pet sitters are available from – to
- Sitters can give an end date as well as a start date. The end date is optional.
- Bookings must fit inside those dates. The calendar only offers those days, and the database checks them too (script 14).

## 2026-11-11 · Booking requests show up in chat
- Asking for a booking also sends the sitter a chat message.
- The sitter can accept or decline right in the chat.
- A badge shows on your photo and on Your bookings while a request waits for your answer.

## 2026-11-11 · Anyone can sign up
- The invitation code is optional, because asking for one was too much friction.
- Signing up with a friend's code or link still puts you straight into their circle.
- A code that's filled in but doesn't work stops the sign-up, so nobody misses their friend's circle by accident (script 13).

## 2026-11-11 · Invite codes from your profile
- "Create an invite code" makes a code for one person. It works once, for 30 days.
- You can have up to 10 unused codes at a time, and delete ones you no longer need.
- You can copy just the code, without the whole link (script 12).
- Invite links always point at the live site.

## 2026-11-11 · Sitters get paid through Stripe
- Sitters get paid through Stripe Connect (Accounts v2), set up as individuals, not companies.
- Homami collects the fees and covers any losses; this needs revisiting before real money is involved.
- Everything runs in test mode for now.

## 2026-11-10 · Booking and paying
- The price is worked out by the database from the sitter's own prices. It's never sent by the app.
- Nothing is charged until the sitter accepts. Accepting charges the owner's saved card once; accepting twice can never charge twice.
- Paid services need the owner's card on file and the sitter set up for payouts. Exchanges are free and need neither.
- Cards and bank details stay with Stripe. Homami only keeps "Visa •••• 4242" (script 11, payments function).

## 2026-11-10 · Pet care requests
- Every member can see requests, so sitters outside your circle can find them.
- Other people see how many pets you have, not who they are (script 10).

## 2026-10-28 · Chat
- You can message people in your circle and anyone who offers pet sitting.
- You can reply to anyone who messaged you.
- Only the two people in a chat can read it (script 09).

## 2026-10-18 · The trusted circle
- Circles go both ways: if you're in my circle, I'm in yours.
- Everyone gets a personal invite link.
- Only your circle sees your pets and posts.
- Your extended circle (friends of friends) sees your basic profile only (scripts 04, 05, 08).

## 2026-10-18 · Pet sitters
- Every member can see pet sitters and their basic profile.
- The wall ranks sitters in this order: your circle, your extended circle, your city, then everyone (scripts 06, 07).
