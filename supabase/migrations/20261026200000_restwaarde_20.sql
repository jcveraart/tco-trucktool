-- Restwaarde: standaard 20% voor alle voertuigsoorten, voor diesel en elektrisch, nieuw en gebruikt.
-- Eerder stond nieuw op 10% en volgde gebruikt een waardecurve (vaak 30 tot 40%). Daardoor vergeleek je een gebruikte
-- elektrische met een hoge restwaarde met een nieuwe diesel met een lage. Eén vast percentage voor beide kanten is eerlijk.
-- De calculator leest deze kolom voor de restwaarde van diesel en van elektrisch.

update public.vehicle_categories set default_residual_value_pct = 20.0, updated_at = now();
