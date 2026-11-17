# Homami: product decisions

What we decided, when, and why. Newest first. Each entry names where it lives in the code or the database.

**People read these in the app too.** Anything that changes what members can do, pay or see also goes on **Find out more**: `src/lib/help.ts`, shown at `#/help` from the ≡ menu. Update both in the same change.

---

## 2026-11-15 · Your location, and pet sitters near you on a map
Sara: the pin in the city field should find you, and you should see how many pet sitters are near you, and the sitters on a map.
- **Tapping the pin finds you** (Set up your profile, Edit profile, Pet sitter profile → Where, Ask for pet care → Where, and "Use my location" on Home → Sitters and on the map). The phone asks permission first; you can always type instead.
- **Only a rough location is kept: about 1 km** (two decimal places), never the exact position or an address. The app rounds it before sending; the database rounds it again.
  - *Why:* enough to say "3 km away" and draw a map, without ever pointing at someone's home.
- **Your location is private.** Nobody can read it but you. It's only used to work out distances.
- **Pet sitters who add their area show on the members' map** at that rough spot, with their photo. Tapping a pin shows their card, which opens their profile. Owners never show on the map. Visitors without an account never see the map or anyone's location.
  - *Why:* sitters want to be found; owners don't need to be.
- **"Near you"** means within 10 km, or further if the sitter travels further than that (their "How far you'll travel").
- **On the wall**, sitters recommended by your circle still come first; then the nearest; each card says "3 km away". Home → Sitters says "4 pet sitters near you", with Map.
- **The town's name comes from OpenStreetMap** (Nominatim), sent only the rough location. The map pictures also come from OpenStreetMap. Both are free for light use; if Homami grows, we'll move to a paid map service.
- The site's security settings now allow location (for Homami only) and OpenStreetMap's map pictures and town names (`vercel.json`).
- **Where it lives:**
  - database script 21 (`member_locations`, `set_my_location()`, `sitters_near_me()`);
  - `src/lib/location.ts`, `src/hooks/useNearby.ts`;
  - blocks `LocationField`, `SitterMap` (Leaflet); screen `SittersMap` (#/sitters/map);
  - Find out more → Pet sitters.
- **A sitter's pin follows the area they save** (Sara, Nov 15, 2026, after her husband set up as a sitter): saving a typed area in the pet sitter profile looks it up on OpenStreetMap and moves the pin there (rough, ~1 km), so the map matches the profile without tapping the pin. If the pin just filled in the area, its spot is kept. If the area can't be found, the pin stays where it was.
  - *Why:* sitters often work where they live and just keep the city we fill in; they shouldn't need to find the pin to show on the map.
- **You can remove your location** whenever you like: Remove my location on the map, on Edit profile and on the pet sitter profile. It's deleted, and distances and the map pin go with it.
- *Open questions:* whether owners' care requests should show on a map for sitters. The map has no Figma frame: Sara said the built screen (Storybook, Screens/Sitters near you) is enough.

## 2026-11-15 · Recommending pet sitters, and each sitter's own link
New direction: **sitters bring people to Homami.** Their happy clients recommend them, and those clients' friends find them through "Recommended by…". Positioning: **Find a pet sitter your friends already trust.**
- **Anyone who has used a sitter can recommend them**, through Homami or not: which of their pets (optional) and a short note up to 300 characters (optional). One per person per sitter; you can change it or take it back. Nobody can recommend themselves, and recommendations are never paid for.
  - *Why:* sitters' existing clients are the first people who can vouch for them. Reviews with hearts still need a finished Homami booking (Nov 13), so they stay about care booked here.
  - A review saying "Yes, I'd recommend" counts as a recommendation too. Each person counts once.
- **Recommendations are public**, with the first name, photo and note of the person who wrote them. The form says so before sending ("Your name and photo will be shown on Daniel's page").
  - Which pets they mentioned, and how you know them ("In your circle"), only show to members.
  - Hearts and review texts stay members-only, as before.
- **Every pet sitter has one link** (…/?sitter=CODE), on Your profile and right after setting up as a sitter ("Get your first recommendations"). Anyone can open it, even without an account, and sees only: photo, first name, city, bio, offers and prices, and recommendations. **Never pets or posts.**
  - The page has Contact Daniel and I've used Daniel, recommend. Both lead to sign-up with no code (sign-up is open since Nov 11), then back to Daniel's profile.
  - Joining through a sitter's link **doesn't put anyone in a circle**. Circles stay between friends.
- **On the wall, sitters recommended by you or your circle come first**, with "Recommended by Anna" on top of their card. Then the usual order: circle, extended circle, near you, everyone else.
- **Owners can bring their own sitter** (Your profile, and the Sitters filter): "Already have a sitter you love?" sends their own invite link with a message for the sitter. The sitter joins the owner's circle (they know each other). Once the sitter has set up their profile, the owner sees "Dani is on Homami now. Would you recommend them?" on Home.
  - With **Not now** next to it (Sara, Nov 15, 2026): the box goes and doesn't come back on that phone; you can still recommend Dani from his profile. A notifications list (a bell) may replace these boxes later.
- **A sitter sees who recommended them** on Your profile, with a badge on their photo and a note for new ones. New ones are remembered per phone, for now. Email can come later.
- Sign-up and Log in lead with "Find a pet sitter your friends already trust"; invite messages and banners lead with finding and recommending sitters.
- **Where it lives:**
  - database script 20 (`sitter_recommendations`, `recommend_sitter()`, `public_sitter_page()`, `sitters_to_recommend()`, an updated `sitter_review_summaries()`);
  - `src/lib/recommendations.ts`, `src/hooks/useRecommendations.ts`;
  - screens `RecommendSitter`, `SitterPublicPage`, `FirstRecommendations`; block `RecommendationCard`;
  - Find out more → Reviews and recommendations, and Your page as a pet sitter.
- *Open questions:* email when someone recommends you; whether a sitter can hide a recommendation; a nicer address than ?sitter=CODE (e.g. a name).

## 2026-11-14 · The Homami team page
- **A private page for the team at #/admin** (≡ → Homami team), with the numbers (members, sitters, pets, posts, requests, bookings, reviews), the interest in "Stay in exchange for care", and everyone who signed up.
- **It shows emails**, so we can write to people (for example those who wanted Stay in exchange for care). Members are told on Find out more → Who sees my email?
- **Read only for now.** No blocking people or removing posts from the page; that comes later, with its own rules.
- **Who's on the team is decided only in Supabase** (table `admins`, script 19). Nobody can add themselves from the app, and every team function checks it in the database, not just the page.
- **Why:** Sara needs to see how Homami is growing and how the coming-soon test is going, without opening Supabase each time.

## 2026-11-14 · "Stay in exchange for care" is coming soon, and we count who wants it
- **Picking it shows "Coming soon" instead.** In Set up pet sitter profile (the switch and the "Accommodation exchange" tag), in Book (the service) and in Create a request (the "Accommodation exchange" tag). Nothing gets picked. Turning it off still works, for anything saved before.
- **Why:** it's a test. Before building stays in exchange for care (who hosts whom, house rules, trust), we want to know how many people actually reach for it.
- **We note who, where and when** (database script 18, table `feature_interest`), so we can tell many people from one person tapping often, and later tell the people who wanted it when it's ready. Only Sara reads it, in Supabase; members can add their own clicks and can't read anyone's. At most 50 a day per person.
- **Members are told** in the sheet itself ("We've noted that you'd like it") and on Find out more → What are exchanges?

## 2026-11-13 · Reviewing and recommending pet sitters
- **Only people who booked a sitter through Homami can review them**, once the booking has finished: accepted, not cancelled, and its last day has come. Paid bookings and exchanges both count.
  - *Why:* reviews should be about real care. Knowing someone isn't enough, which keeps out favours between friends and made-up profiles.
- **A review is 1 to 5 hearts, "Would you recommend them?" (yes or no) and an optional few words.** The hearts follow Figma's review design.
- **One review per person per sitter.** A later booking updates it, so the numbers count people, not bookings. You can edit or delete yours any time.
- **Who sees what:**
  - every member sees the number of reviews, the average hearts and how many people recommend a sitter;
  - the writer's name and words are only shown to the writer's circle and extended circle.
- **On sitter cards and profiles:** "Recommended by Anna and 12 more", naming the people you know first (you, then your circle, then friends of friends), with their faces.
- **Where it lives:**
  - database script 16;
  - `src/lib/reviews.ts`;
  - `src/screens/ReviewSitter.tsx`;
  - the Reviews section on a sitter's profile;
  - the badge on wall cards.
- *Open questions:*
  - whether sitters should be able to reply;
  - whether recommendations should push sitters up the wall;
  - Figma's idea of badges, like "Local celeb" after a number of sits.
- **Reviews are for members only**: a visitor who isn't logged in sees no hearts, numbers or reviews, like every other members-only part of Homami (script 17).

## 2026-11-13 · Posting and deleting straight away
- **A new post shows on the wall straight away**, faded with "Posting…", while it's saved in the background, like a chat message. If it doesn't post, it says so under the post, with Try again and Remove. Why: no more waiting on the New post sheet while a photo uploads on mobile data.
- **Deleting a post takes it off the wall straight away.** If deleting doesn't work, the post comes back with a short note and Try again. (Before, a delete that didn't work showed nothing.)
- Payments are never shown before they're done: "paid" only shows once Stripe has really charged the card.

## 2026-11-13 · Pet photos private, and limits against spam
- **Pet photos are private**, like post photos: only the owner and their circle can open them, through links that stop working after an hour. Pets were already circle-only; now their photos are too. A replaced or removed photo is deleted. Photos added before this stay where they were until replaced (script 17, `src/lib/photos.ts`).
- **A pet's photo has to be your own** (script 17).
- **Profile photos stay public**: many people may see your profile (your circle, pet sitters, people you chat with). They now get random names, and a replaced photo is deleted.
- **Limits against spam**: 20 messages a minute and 500 a day; 10 booking requests a day. High enough that nobody using Homami normally meets them; the person sees a short message asking them to wait. Why: anyone can message a pet sitter, so one person could otherwise flood sitters (script 17).
- **Automatic checks** run on GitHub for every change: unit tests (money, dates, messages), the database rules tried as pretend people, and browser tests at phone width (`npm test`, `npm run test:db`, `npm run test:e2e`).

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
- 2026-11-17: the sitter page now says the last day is optional before you pick, and “No end date” removes it without clearing the first day. Many sitters have no end, and the old page made it look required. Pet parents’ requests keep their end: with only a first day, a request is for one day.

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
