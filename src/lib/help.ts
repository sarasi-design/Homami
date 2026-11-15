/**
 * Find out more (#/help): how Homami works, in plain words, for members.
 * The member-facing side of docs/decisions.md: when a decision changes what people can do, pay or see,
 * update both in the same change.
 */
export interface HelpQuestion {
  q: string
  a: string[]
}

export interface HelpTopic {
  id: string
  title: string
  questions: HelpQuestion[]
  /** Show the 100% / 50% / 20% refund rules under the questions */
  refundRules?: boolean
}

export const HELP_TOPICS: HelpTopic[] = [
  {
    id: 'circle',
    title: 'Your circle and invites',
    questions: [
      {
        q: 'What is my circle?',
        a: [
          'The people you trust with your pets. Circles go both ways: if someone is in your circle, you’re in theirs.',
          'Only your circle sees your pets and your posts, photos included. Friends of friends (your extended circle) see your name, photo, city and bio.',
        ],
      },
      {
        q: 'Who sees my email?',
        a: [
          'Other members never see it. The small Homami team can, on a private page with everyone who signed up: name, email, city, when you joined and who invited you. We use it to look after Homami and to write to you if we need to, never to share it.',
        ],
      },
      {
        q: 'Do I need an invitation to join?',
        a: [
          'No, anyone can sign up. With a friend’s code or link you join their circle straight away.',
          'If a code doesn’t work (a typo, used or expired), clear the field to sign up without it.',
        ],
      },
      {
        q: 'How do I invite friends?',
        a: [
          'Share your personal link from Invite friends. Anyone who signs up with it joins your circle.',
          'On Your profile you can also create a code for one person. It works once, for 30 days. You can have up to 10 unused codes.',
        ],
      },
    ],
  },
  {
    id: 'sitters',
    title: 'Pet sitters',
    questions: [
      {
        q: 'Who can see pet sitters?',
        a: ['Every member. People in your circle come first, then friends of friends, then people in your city.'],
      },
      {
        q: 'How do I say when I’m available?',
        a: [
          'Your profile → Pet sitting → When you’re available. Pick the first day, and the last one if you like.',
          'People can only book you for those days.',
        ],
      },
      {
        q: 'What are exchanges?',
        a: [
          '“Stay in exchange for care” and “Pet sitting exchange” cost nothing: you help each other instead of paying. They don’t need a card.',
          '“Stay in exchange for care” is coming soon. When you pick it, Homami notes that you’d like it, so we know how many people are waiting for it. Only the Homami team sees that.',
        ],
      },
    ],
  },
  {
    id: 'booking',
    title: 'Booking a sitter',
    questions: [
      {
        q: 'How does booking work?',
        a: [
          'On a sitter’s profile, tap Book. Pick a service, the dates and your pets. You see the price before you send.',
          'Your request shows up in your chat with the sitter. They accept or decline from there, or from Your bookings.',
        ],
      },
      {
        q: 'How is the price worked out?',
        a: ['From the sitter’s own prices: per day, per night or per hour for walks. Homami works it out, so it’s always the same as what you saw.'],
      },
    ],
  },
  {
    id: 'paying',
    title: 'Paying and getting paid',
    questions: [
      {
        q: 'When am I charged?',
        a: ['Only when the sitter accepts. Nothing is charged while you wait for an answer, and accepting can never charge you twice.'],
      },
      {
        q: 'Where are my card and bank details kept?',
        a: [
          'With Stripe, our payment provider. Homami only keeps something like “Visa •••• 4242”.',
          'Pet sitters add their bank details on Stripe’s own page, from Payment details.',
        ],
      },
      {
        q: 'Is this real money?',
        a: ['Not yet. While we try Homami out with friends, payments are in test mode and no real money moves.'],
      },
    ],
  },
  {
    id: 'cancelling',
    title: 'Cancelling a booking',
    questions: [
      {
        q: 'Who can cancel, and until when?',
        a: [
          'The pet owner or the sitter, from Your bookings or your chat, up to and including the first day. After that, talk it over in the chat.',
          'A request that hasn’t been answered yet can be cancelled any time, with nothing to pay.',
        ],
      },
      {
        q: 'Do I have to say why?',
        a: ['Yes, pick a reason. You can add a message too. The other person gets both in your chat.'],
      },
      {
        q: 'How much do I get back?',
        a: [
          'It depends on how long before the first day you cancel. The sitter keeps the rest, because they kept those days free for you.',
          'If the sitter cancels, you always get everything back.',
        ],
      },
      {
        q: 'When does the money come back?',
        a: ['Straight away from Homami. Your bank can take 5–10 days to show it on your card.'],
      },
    ],
    refundRules: true,
  },
  {
    id: 'reviews',
    title: 'Reviews and recommendations',
    questions: [
      {
        q: 'Who can review a pet sitter?',
        a: [
          'Only people who booked them through Homami, once the booking has finished (its last day has come). Paid bookings and exchanges both count; cancelled ones don’t.',
          'Knowing someone isn’t enough to review them. That keeps reviews honest: no favours between friends, and no made-up profiles.',
        ],
      },
      {
        q: 'What does a review say?',
        a: [
          'How it went, from 1 to 5 hearts, and whether you’d recommend them. You can add a few words too.',
          'You write one review per sitter. After another booking with them, you update it. You can change or delete it whenever you like.',
        ],
      },
      {
        q: 'Who sees my review?',
        a: [
          'Everyone sees the hearts and how many people recommend a sitter.',
          'Your name and your words are only shown to your circle and to their friends (your extended circle). On a sitter’s card they might see “Recommended by Anna and 12 more”.',
        ],
      },
      {
        q: 'Where do I write one?',
        a: ['On Your bookings or in your chat with the sitter: a finished booking has a Review button. You can also find it on the sitter’s profile.'],
      },
      {
        q: 'How is a recommendation different from a review?',
        a: [
          'Anyone who has used a sitter can recommend them, through Homami or not: tap Recommend on their profile. Say which of your pets they looked after and add a short note if you like.',
          'Reviews, with hearts, are only for bookings made through Homami. A review saying you’d recommend them counts as a recommendation too: each person counts once.',
          'One recommendation per sitter. You can change it or take it back whenever you like. Nobody can recommend themselves, and recommendations can never be paid for.',
        ],
      },
      {
        q: 'Who sees my recommendation?',
        a: [
          'Anyone who opens the sitter’s page, even without an account: your first name, your photo and your note. Homami tells you before you send it.',
          'Which pets you mentioned is only shown to members. Members also see whether you’re in their circle.',
        ],
      },
      {
        q: 'Why are some sitters at the top of my wall?',
        a: ['Sitters recommended by you or by people in your circle come first, with “Recommended by Anna” on their card. Then come sitters in your circle, your extended circle and your city.'],
      },
    ],
  },
  {
    id: 'yourpage',
    title: 'Your page as a pet sitter',
    questions: [
      {
        q: 'What is my page’s link?',
        a: [
          'Every pet sitter has one link to their page. Find it on Your profile, under Recommended by, and send it on WhatsApp or anywhere you like.',
          'Send it to the people whose pets you’ve looked after, so they can recommend you, and to anyone looking for a sitter, so they can contact you. It’s the same link for both.',
        ],
      },
      {
        q: 'What do people see on it?',
        a: [
          'Your photo, first name, city and bio, what you offer and your prices, and your recommendations.',
          'Never your pets or your posts: those stay with your circle.',
        ],
      },
      {
        q: 'Do they need an invitation?',
        a: [
          'No. Your link works as an invitation: they sign up in a minute and land back on your page, ready to message or recommend you.',
          'Joining through your link doesn’t put anyone in your circle. Circles stay between friends.',
        ],
      },
    ],
  },
  {
    id: 'chat',
    title: 'Chat',
    questions: [
      {
        q: 'Who can I message?',
        a: ['People in your circle, anyone who offers pet sitting, and anyone who has messaged you. Only the two of you can read a chat.',
          'To keep Homami free of spam, you can send up to 20 messages a minute and 10 booking requests a day. Plenty for everyday use.'],
      },
    ],
  },
]
