import { useState } from "react";
import {
  Footprints,
  Handshake,
  House,
  Moon,
  Sun,
  Trash2,
} from "lucide-react";
import { Button } from "../components/basics/Button";
import { Note } from "../components/basics/Note";
import { SelectableTag } from "../components/basics/SelectableTag";
import { TextInput } from "../components/basics/TextInput";
import { Toggle } from "../components/basics/Toggle";
import { Header } from "../components/blocks/Header";
import { MonthCalendar } from "../components/blocks/MonthCalendar";
import {
  PriceServiceCard,
  ToggleServiceCard,
} from "../components/blocks/ServiceCard";
import { ConfirmAction } from "../components/blocks/ConfirmAction";
import { ComingSoonSheet } from "../components/blocks/ComingSoonSheet";
import { LocationField } from "../components/blocks/LocationField";
import type { LocationFieldProps } from "../components/blocks/LocationField";
import { FormError } from "./WelcomeLayout";
import { OFFERS, formatDate } from "../lib/sitters";
import type { OfferId, SitterValues } from "../lib/sitters";
import { COMING_SOON_OFFERS, STAY_FOR_CARE_LABEL } from "../lib/comingSoon";

/**
 * Set up pet sitter profile — Figma ONBOARDING "USER OFFERS PET SITTING" (85:10659 → 91:10326),
 * on one scrolling page: What you offer · When you're available (from – to; Sara, Nov 11: the end date is
 * optional) · Where · Service & prices.
 *   setup mode (after "How will you use Homami?" or from Your profile): "Save" and "Not now"
 *   edit mode (from the Offers section on Your profile): "Save" and "Stop offering pet sitting"
 * Only "What you offer" is needed; everything else is optional.
 * The pin in Where finds you (Nov 15, 2026; script 21): owners nearby then see you on the map, at your rough area only.
 */
export interface SitterSetupProps {
  initial?: Partial<SitterValues>;
  mode?: "setup" | "edit";
  onSubmit?: (values: SitterValues) => Promise<void> | void;
  onBack?: () => void;
  /** setup mode: "Not now" */
  onSkip?: () => void;
  /** edit mode: "Stop offering pet sitting" */
  onRemove?: () => Promise<void> | void;
  /** Someone picked "Stay in exchange for care", which is coming soon: count it */
  onComingSoon?: () => void;
  /** The pin in Where: finds you (see LocationField) */
  onLocate?: LocationFieldProps["onLocate"];
  /** Already saved a rough location: what to say under Where, with Remove my location */
  located?: LocationFieldProps["located"];
  onForgetLocation?: LocationFieldProps["onForget"];
}

export function SitterSetup({
  initial,
  mode = "setup",
  onSubmit,
  onBack,
  onSkip,
  onRemove,
  onComingSoon,
  onLocate,
  located,
  onForgetLocation,
}: SitterSetupProps) {
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const showComingSoon = () => {
    setComingSoonOpen(true);
    onComingSoon?.();
  };
  const [offers, setOffers] = useState<OfferId[]>(initial?.offers ?? []);
  const [availableFrom, setAvailableFrom] = useState<string | null>(
    initial?.available_from ?? null,
  );
  const [availableUntil, setAvailableUntil] = useState<string | null>(
    initial?.available_until ?? null,
  );
  const [area, setArea] = useState(initial?.area ?? "");
  const [travels, setTravels] = useState(initial?.travels ?? true);
  const [radius, setRadius] = useState(
    initial?.radius_km ? String(initial.radius_km) : "",
  );
  const [dailyRate, setDailyRate] = useState<number | null>(
    initial?.daily_rate ?? null,
  );
  const [overnightRate, setOvernightRate] = useState<number | null>(
    initial?.overnight_rate ?? null,
  );
  const [walkRate, setWalkRate] = useState<number | null>(
    initial?.walk_rate ?? null,
  );
  const [stayForCare, setStayForCare] = useState(
    initial?.stay_for_care ?? false,
  );
  const [sittingExchange, setSittingExchange] = useState(
    initial?.sitting_exchange ?? false,
  );
  const [triedOnce, setTriedOnce] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const radiusNumber = !travels || radius.trim() === "" ? null : Number(radius);
  const radiusError =
    radiusNumber !== null &&
    (!Number.isInteger(radiusNumber) || radiusNumber < 1 || radiusNumber > 200)
      ? "Use a number from 1 to 200"
      : undefined;
  const offersError =
    triedOnce && offers.length === 0
      ? "Pick at least one thing you offer"
      : undefined;

  async function save() {
    setTriedOnce(true);
    if (offers.length === 0)
      return document
        .getElementById("sitter-offers")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (radiusError) return document.getElementById("sitter-radius")?.focus();
    setSubmitting(true);
    setFormError(null);
    try {
      await onSubmit?.({
        offers,
        available_from: availableFrom,
        available_until: availableUntil,
        area: area.trim() || null,
        travels,
        radius_km: radiusNumber,
        daily_rate: dailyRate,
        overnight_rate: overnightRate,
        walk_rate: walkRate,
        stay_for_care: stayForCare,
        sitting_exchange: sittingExchange,
      });
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const toggleOffer = (id: OfferId) => (on: boolean) => {
    if (on && COMING_SOON_OFFERS.includes(id)) return showComingSoon();
    setOffers((list) => (on ? [...list, id] : list.filter((o) => o !== id)));
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-surface">
      <Header
        title={
          mode === "edit"
            ? "Your pet sitter profile"
            : "Set up pet sitter profile"
        }
        onBack={onBack}
      />
      <div className="flex flex-1 flex-col gap-xl px-l pt-s pb-[40px]">
        <section
          id="sitter-offers"
          className="flex flex-col gap-m"
          aria-labelledby="sitter-offers-title"
        >
          <h2 id="sitter-offers-title" className="text-overline text-dark-grey">
            What you offer
          </h2>
          <div
            className="flex flex-wrap gap-s"
            role="group"
            aria-labelledby="sitter-offers-title"
          >
            {OFFERS.map((o) => (
              <SelectableTag
                key={o.id}
                label={o.label}
                color={o.color}
                selected={offers.includes(o.id)}
                onChange={toggleOffer(o.id)}
              />
            ))}
          </div>
          {offersError && (
            <p role="alert" className="text-label text-error">
              {offersError}
            </p>
          )}
        </section>

        <section className="flex flex-col gap-m">
          <h2 className="text-overline text-dark-grey">When you’re available</h2>
          <MonthCalendar
            mode="range"
            label="When you’re available"
            start={availableFrom}
            end={availableUntil}
            onRangeChange={(from, until) => {
              setAvailableFrom(from);
              setAvailableUntil(until);
            }}
          />
          <div className="flex flex-wrap items-center justify-between gap-s">
            <p className="text-caption text-medium-grey" aria-live="polite">
              {availableFrom
                ? availableUntil
                  ? `From ${formatDate(availableFrom)} to ${formatDate(availableUntil)}`
                  : `From ${formatDate(availableFrom)}, no end date. Tap a later day to add one.`
                : "No dates means you’re available now. Tap a first day, then a last one if you like."}
            </p>
            {availableFrom && (
              <Button
                variant="ghost"
                size="xsmall"
                onClick={() => {
                  setAvailableFrom(null);
                  setAvailableUntil(null);
                }}
              >
                Clear dates
              </Button>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-m">
          <h2 className="text-overline text-dark-grey">Where</h2>
          <LocationField
            id="sitter-area"
            label="Area"
            hideLabel
            placeholder="Your area, e.g. Málaga Centro"
            maxLength={60}
            autoCapitalize="words"
            value={area}
            onChange={setArea}
            onLocate={onLocate}
            located={located}
            onForget={onForgetLocation}
            hint={
              onLocate
                ? "Tap the pin so pet owners near you find you on the map. Only your rough area shows, never your address."
                : undefined
            }
          />
          <Toggle
            label="I travel to pet owners"
            description={
              travels
                ? "You go to their home."
                : "You don’t travel: pets come to you."
            }
            checked={travels}
            onChange={setTravels}
          />
          {travels && (
            <TextInput
              id="sitter-radius"
              label="How far you’ll travel, in km"
              hideLabel
              placeholder="How far you’ll travel"
              suffix="km"
              inputMode="numeric"
              helper="For example 30"
              value={radius}
              onChange={(e) => setRadius(e.target.value.replace(/[^\d]/g, ""))}
              error={radiusError}
            />
          )}
        </section>

        <section className="flex flex-col gap-m">
          <h2 className="text-overline text-dark-grey">Service &amp; prices</h2>
          <PriceServiceCard
            icon={Sun}
            title="Daily rate"
            description="Daytime care only, no overnight"
            unit="day"
            price={dailyRate}
            onChange={setDailyRate}
          />
          <PriceServiceCard
            icon={Moon}
            title="Overnight stay"
            description="Sleep there every night of the booking"
            unit="night"
            price={overnightRate}
            onChange={setOvernightRate}
          />
          <PriceServiceCard
            icon={Footprints}
            title="Dog walking"
            description="Walks or home visits, priced per hour"
            unit="hour"
            price={walkRate}
            onChange={setWalkRate}
          />
          <ToggleServiceCard
            id="stay-for-care"
            icon={House}
            title={STAY_FOR_CARE_LABEL}
            description="You care for the pets — the stay is your payment. No fees."
            checked={stayForCare}
            onChange={(on) => (on ? showComingSoon() : setStayForCare(false))}
          />
          <ToggleServiceCard
            id="sitting-exchange"
            icon={Handshake}
            title="Pet sitting exchange"
            description="You look after someone’s pet, they look after yours next time. No fees."
            checked={sittingExchange}
            onChange={setSittingExchange}
          />
          <Note>Only priced services will be displayed in your profile.</Note>
        </section>

        {formError && <FormError>{formError}</FormError>}

        <div className="mt-auto flex flex-col items-center gap-m pt-xl">
          <Button
            variant="neutral"
            onClick={save}
            disabled={submitting}
            aria-busy={submitting || undefined}
          >
            {submitting ? "Saving…" : "Save"}
          </Button>
          {mode === "setup" && onSkip && (
            <Button
              variant="ghost"
              size="small"
              onClick={onSkip}
              disabled={submitting}
            >
              Not now
            </Button>
          )}
          {mode === "edit" && onRemove && (
            <ConfirmAction
              size="small"
              icon={Trash2}
              label="Stop offering pet sitting"
              confirmLabel="Yes, stop"
              busyLabel="Removing…"
              onConfirm={async () => {
                setFormError(null);
                try {
                  await onRemove();
                } catch (err) {
                  setFormError(
                    err instanceof Error
                      ? err.message
                      : "Something went wrong. Please try again.",
                  );
                }
              }}
            />
          )}
        </div>
      </div>
      <ComingSoonSheet
        open={comingSoonOpen}
        onClose={() => setComingSoonOpen(false)}
        icon={House}
        feature={STAY_FOR_CARE_LABEL}
      />
    </main>
  );
}
