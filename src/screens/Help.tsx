import { useEffect } from 'react'
import { Header } from '../components/blocks/Header'
import { Disclosure } from '../components/blocks/Disclosure'
import { RefundTiers } from '../components/blocks/RefundSummary'
import { HELP_TOPICS } from '../lib/help'

/**
 * Find out more — #/help, from the ≡ menu (Sara, Nov 12; not in Figma yet). How Homami works, in
 * plain words: one section per topic (Your circle, Pet sitters, Booking, Paying, Cancelling, Chat),
 * each a list of questions that open (Disclosure). The words live in src/lib/help.ts.
 * #/help/cancelling opens on that topic with its questions open (e.g. from Cancel booking).
 */
export interface HelpProps {
  /** A topic id to open on, e.g. "cancelling" */
  topic?: string
  onBack: () => void
}

export function Help({ topic, onBack }: HelpProps) {
  useEffect(() => {
    if (topic) document.getElementById(`help-${topic}`)?.scrollIntoView({ block: 'start' })
  }, [topic])

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-surface">
      <Header title="Find out more" onBack={onBack} />
      <div className="flex flex-1 flex-col gap-xl px-l pt-s pb-[40px]">
        <p className="text-label-light text-dark-grey">How Homami works: circles, sitters, booking, paying, cancelling and reviews.</p>
        <nav aria-label="Topics" className="flex flex-wrap gap-s">
          {HELP_TOPICS.map((t) => (
            <a
              key={t.id}
              href={`#/help/${t.id}`}
              className="inline-flex h-[32px] items-center rounded-pill border border-soft-grey px-m text-label text-dark-grey hover:bg-light-grey outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-primary-sage"
            >
              {t.title}
            </a>
          ))}
        </nav>
        {HELP_TOPICS.map((t) => (
          <section key={t.id} id={`help-${t.id}`} aria-labelledby={`help-${t.id}-title`} className="flex scroll-mt-[72px] flex-col gap-s">
            <h2 id={`help-${t.id}-title`} className="text-title text-dark-grey">
              {t.title}
            </h2>
            <div className="flex flex-col">
              {t.questions.map((q) => (
                <Disclosure key={q.q} question={q.q} defaultOpen={t.id === topic}>
                  {q.a.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </Disclosure>
              ))}
            </div>
            {t.refundRules && (
              <div className="flex flex-col gap-s rounded-card border border-soft-grey p-l">
                <p className="text-label-bold text-dark-grey">When the pet owner cancels, they get back</p>
                <RefundTiers />
                <p className="text-caption text-medium-grey">Counted from the first day of the booking. If the sitter cancels, the owner gets 100% back.</p>
              </div>
            )}
          </section>
        ))}
      </div>
    </main>
  )
}
