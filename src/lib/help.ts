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
          'Only your circle sees your pets and your posts. Friends of friends (your extended circle) see your name, photo, city and bio.',
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
    id: 'chat',
    title: 'Chat',
    questions: [
      {
        q: 'Who can I message?',
        a: ['People in your circle, anyone who offers pet sitting, and anyone who has messaged you. Only the two of you can read a chat.'],
      },
    ],
  },
]
