import { supabase } from './supabase'
import { isMissingInDatabase } from './errors'

/**
 * Interest in things that aren't built yet (database script 18; Sara, Nov 14, 2026).
 * When someone picks "Stay in exchange for care", Homami says it's coming soon and notes who, where and when,
 * so Sara can see how many people want it. Only she reads these, in Supabase.
 * Noting never gets in the way: if it fails (offline, script 18 not run yet) the person still just sees "coming soon".
 */
export type ComingSoonFeature = 'stay_for_care'
export type InterestPlace = 'sitter_setup' | 'book' | 'care_request'

export async function noteInterest(feature: ComingSoonFeature, place: InterestPlace): Promise<void> {
  const { error } = await supabase.from('feature_interest').insert({ feature, place })
  if (!error) return
  if (isMissingInDatabase(error)) console.warn('Homami: run database script 18 to count interest in coming-soon features')
  else console.warn('Homami: couldn’t note interest', error)
}
