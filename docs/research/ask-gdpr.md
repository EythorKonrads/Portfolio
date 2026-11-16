# Ask: GDPR for IP hashes and Unanswered questions

Research for issue #144 (map #136). Question: Ask would store (1) a salted
SHA-256 hash of each visitor's IP, kept for at most an hour, for rate
limiting, and (2) Unanswered question text with its date, kept for 90 days.
The site is run by a private individual in Denmark and has no privacy notice
today. Is each of these personal data, what lawful basis fits, and what must
the site do: notice, retention, rights, Cloudflare and Anthropic as
processors, and whether localStorage history or Turnstile needs a consent
banner?

Checked 2026-11-16 against the GDPR text, CJEU judgments, EDPB and WP29
guidance, the Danish cookie order and Datatilsynet guidance, and Cloudflare's
and Anthropic's own terms and docs.

**This is not legal advice.** It is a reading of primary sources by a
non-lawyer, written to make spec decisions. Where the sources leave room, it
says so. If Ask's risk ever looks higher than "small personal site", ask a
lawyer or Datatilsynet.

## Answer

- **GDPR applies.** A public portfolio that presents its owner for work is
  not "purely personal or household" activity.
- **Both stores hold personal data.** The salted IP hash is pseudonymised
  personal data for Eythor, who holds the salt. Unanswered question text is
  personal data whenever a visitor types something that identifies someone,
  which Ask can't prevent, so treat the whole table as personal data.
- **Lawful basis: legitimate interests (Art. 6(1)(f))** for all three
  purposes: rate limiting (abuse and cost protection), answering the question
  (sending it to Claude), and keeping Unanswered questions to improve the About
  file. No consent is needed for any of them.
- **A privacy notice is required** (Art. 13). Use two layers: a short note
  under the Ask box, shown before the visitor submits, linking to a full
  privacy section or page.
- **Retention is fine as planned** (1 hour, 90 days), but D1 Time Travel
  keeps deleted rows restorable for 7 days (Free) or 30 days (Paid), and
  Anthropic keeps API inputs and outputs for up to 30 days. Say so in the
  notice.
- **Processors:** Cloudflare's and Anthropic's DPAs are already part of
  their standard terms, with EU Standard Contractual Clauses for data going to
  the US. Nothing to sign, but name both in the notice.
- **No consent banner is needed for Turnstile** on the reading below, and
  probably not for the localStorage history, but the history is the least
  certain point here: 12 hours is longer than the "few hours" the old WP29
  opinion mentions. Options are below.

## Does GDPR apply at all?

- GDPR does not apply to processing "by a natural person in the course of a
  purely personal or household activity" (Art. 2(2)(c)). Recital 18 limits
  this to activity "with no connection to a professional or commercial
  activity". [gdpr]
- The CJEU held in *Lindqvist* that publishing on the internet, where data is
  "made accessible to an indefinite number of people", is not covered by the
  exemption (C-101/01, para. 47). [lindqvist]
- Datatilsynet has in a few 2020 decisions found a private person's website
  publication to be purely personal, but on "a concrete overall assessment",
  and stresses the exemption needs no connection to commercial or
  professional activity. [dt-private]
- A portfolio whose purpose is presenting Eythor's work and experience to
  people who might hire him is connected to professional activity. Treat
  GDPR as applying. Eythor is the **controller**.

Not needed for a site this size: a data protection officer (Art. 37 applies
to public bodies and large-scale monitoring or special-category processing)
[gdpr-b]. Records of processing (Art. 30): the under-250-employees exemption
in Art. 30(5) doesn't apply when processing "is not occasional" [gdpr-a],
and Ask runs on every question, so a record is arguably required. It is a
short table; the spec can include it as a doc in the repo (see the list at
the end).

## (1) Salted IP hash: personal data?

Yes, for Eythor.

- Personal data is "any information relating to an identified or
  identifiable natural person" (Art. 4(1)). Recital 26 judges
  identifiability by "all the means reasonably likely to be used". Recital 30
  names IP addresses as online identifiers. [gdpr] [gdpr-a]
- *Breyer* (C-582/14): a dynamic IP address is personal data for a website
  operator that has "the means which may likely reasonably be used" to
  identify the person, here the legal route via the authorities to the ISP
  (paras. 47-49, ruling point 1). [breyer]
- Hashing with a secret salt is **pseudonymisation** (Art. 4(5)): the data
  can't be attributed "without the use of additional information" kept
  separately. Pseudonymised data stays personal data (Recital 26). [gdpr-a]
- EDPB Guidelines 01/2025 on pseudonymisation (consultation version) agree:
  pseudonymised data that can be attributed using additional information "is
  therefore personal", even if the two are held by different people (para.
  22). They warn that a plain hash is reversible by brute force (footnote 23)
  and recommend a keyed one-way function such as a MAC, with a secret of
  "sufficient entropy" (paras. 88-89). [edpb-pseudo]
- The IPv4 space has about 4.3 billion addresses. Anyone with the salt can
  hash all of them in minutes, so the hash protects against outsiders who
  read the D1 table, not against the salt holder.

**Where sources differ:** in *EDPS v SRB* (C-413/23 P, 4 September 2025) the
CJEU rejected the EDPS/EDPB view that pseudonymised data is personal "in all
cases and for every person" (para. 86): for a recipient who cannot
re-identify, it may not be (para. 77). But for the controller who holds the
key it stays personal data (para. 76), and identifiability is judged at
collection from the controller's side (para. 111). [srb] So SRB changes
nothing for Eythor; it would only matter for someone who sees the table
without the salt.

**Design notes that follow:**

- Use HMAC-SHA-256 with a random secret key (a Worker secret), not
  `sha256(salt + ip)`. Same cost, and it is what the EDPB describes.
- Never store or log the raw IP. Check that Workers Logs / observability, if
  turned on, doesn't record client IPs or `CF-Connecting-IP` (not checked
  here).
- Rotating the key often (for example daily) and destroying old keys makes old
  hashes much harder to tie to anyone. The EDPB says erasing the additional
  information makes data anonymous "only if the conditions for anonymity are
  met" (para. 22), so don't claim the hashes are anonymous.

## (2) Unanswered question text: personal data?

Sometimes, and Ask can't tell which rows. Treat the table as personal data.

- No IP is stored, so the row is not tied to the visitor by Ask. But free
  text can identify its author ("I'm Anna from Acme, can Eythor…") or other
  people. *SRB* also held that personal opinions can be personal data
  (from commentary on the judgment; paragraph not checked). [srb]
- The visitor may type special-category data (health, beliefs). Ask doesn't
  ask for it; the notice should say not to type personal details.
- Data about third parties named in a question is collected from the
  visitor, not the third party. Art. 14(5)(b) excuses informing them where
  that "proves impossible or would involve a disproportionate effort". With no
  contact details, that applies. [gdpr-a]
- Every question, answered or not, is personal data in transit: it goes to
  Anthropic to be answered. The notice must cover that, not only the stored
  Unanswered questions.

## Lawful basis

Legitimate interests, Art. 6(1)(f): processing "necessary for the purposes of
the legitimate interests pursued by the controller", unless "overridden by
the interests or fundamental rights" of the person. Three cumulative
conditions: a legitimate interest, necessity, and a balancing test. [gdpr-a]
[edpb-li]

- **Rate limiting (IP hash).** Recital 49 names network and information
  security, including stopping "denial of service" attacks, as a legitimate
  interest. *Breyer* accepted an operator's interest in "ensuring the general
  operability" of its site as able to justify storing IP addresses (paras.
  60-64). EDPB Guidelines 1/2024 (version 2.0, adopted 10 November 2026)
  confirm security processing can rest on 6(1)(f), but "the objective of
  security cannot justify an excessive processing" (section 4.6, paras.
  125-126). [gdpr] [breyer] [edpb-li] A keyed hash, kept an hour, with no
  other data, is about as small as a per-visitor limit can get; the balancing
  should come out in favour. Protecting Eythor's API bill from runaway cost is
  a further, ordinary economic interest.
- **Answering the question (sending it to Claude).** The visitor asks for an
  answer; sending the text to the model is the only way to give one. 6(1)(f)
  fits. Art. 6(1)(b) (contract) is a stretch for a free, anonymous Q&A box;
  don't rely on it.
- **Keeping Unanswered questions.** Interest: learning what visitors want to
  know so the About file can be improved. Necessity: question text and date
  only, no IP. Balancing: visitors are told before submitting, it's kept 90
  days, and it's never published. Reasonable on these facts.
- **Consent** (Art. 6(1)(a)) is not needed for any of these, and would be
  worse: it must be withdrawable, and Ask can't find a visitor's row to
  delete it.

Visitors have a right to object to 6(1)(f) processing (Art. 21(1)) [gdpr-a];
see Rights below.

Datatilsynet's guidance on website visitors walks through the same
three-step legitimate-interest test, with worked examples from WP29 Opinion
6/2014. [dt-visitors]

## Notice: what, where, when

Art. 13 applies because the data is collected from the visitor. It requires,
at the time of collection: [gdpr-a]

- (1)(a) controller identity and contact details
- (1)(c) purposes and legal basis; (1)(d) the legitimate interests
- (1)(e) recipients (Cloudflare, Anthropic)
- (1)(f) transfers outside the EU and the safeguard used
- (2)(a) retention periods
- (2)(b) rights of access, rectification, erasure, restriction, objection
- (2)(d) right to complain to a supervisory authority (Datatilsynet)
- (2)(e) whether giving the data is required (it isn't, Ask is optional)
- (2)(f) automated decision-making: none in the Art. 22 sense

Art. 12(1): "concise, transparent, intelligible and easily accessible form,
using clear and plain language". [gdpr-a]

**Where:** WP29 transparency guidelines (WP260 rev.01, endorsed by the EDPB)
recommend layered notices online. The first layer should give the purposes,
the controller's identity and the rights, and "should be directly brought to
the attention of a data subject at the time of collection ... e.g. displayed
as a data subject fills in an online form" (paras. 35-36). A link must not be
hidden by "positioning or colour schemes" (section on "easily
accessible"). [wp260]

So:

1. **First layer:** a short note directly under the Ask box, visible before
   submitting (the map already plans one). It must link to the second layer.
2. **Second layer:** a full privacy section, reachable from the note and
   from the site footer. A new route or a section on the page; the spec
   decides.

The map currently says the note reads "unanswered questions may be saved".
That is not enough on its own: it doesn't say questions go to Anthropic, or
link to the rest.

## Retention

Storage limitation: kept "no longer than is necessary" (Art. 5(1)(e)).
[gdpr-a]

- **IP hash: 1 hour** matches the hourly limit. Delete on write, as planned.
- **Unanswered questions: 90 days** is a reasonable, stated period. Nothing
  in the sources fixes a number; what matters is that it is stated and kept.
- **D1 Time Travel.** D1 keeps point-in-time restore history for 7 days on
  Workers Free and 30 days on Workers Paid, and the docs describe no way to
  turn it off. [d1-tt] Deleted rows stay restorable for that long. The notice
  should say so rather than claim "deleted after an hour".
- **Anthropic.** Standard API retention: inputs and outputs are deleted
  "within 30 days of receipt or generation", longer if flagged under the
  Usage Policy (up to 2 years) or required by law. [anth-retention] Claude
  Haiku 5.5 is not one of the "Covered Models" with a separate 30-day
  requirement, so zero data retention is possible in principle, but it needs
  an agreement with Anthropic. [anth-api-retention] Structured outputs cache
  only the JSON schema, not prompts. [anth-api-retention]

## Rights

- **Art. 11.** If the purposes don't need Ask to identify anyone, Ask needn't
  collect more data just to answer rights requests. Arts. 15-20 then don't
  apply unless the person gives information that lets Eythor find their data.
  [gdpr-a]
- **IP hash:** gone within an hour (plus Time Travel). A person who sends
  their IP could in principle be matched while the row exists, but in
  practice the row is gone before a request is read.
- **Unanswered questions:** a person who quotes their question and roughly
  when they asked can have it found and deleted with a `wrangler d1 execute`
  query. The spec should document that query next to the read query.
- **Objection (Art. 21):** the simple honest answer is "don't use Ask"; it is
  optional and the rest of the site works without it.
- Requests go to Eythor's contact address. Respond within one month (Art.
  12(3)). [gdpr-a]

## Processors and transfers

Art. 28(1): use only processors "providing sufficient guarantees", and
28(3): processing must be governed by "a contract or other legal act".
[gdpr-a]

**Cloudflare** (Workers, D1, Turnstile)

- The Self-Serve Subscription Agreement says the DPA "is hereby incorporated
  by reference" (section 6.1); it has no exception for free services. [cf-terms]
- DPA: Cloudflare is processor, customer is controller; no use of personal
  data for marketing; EU SCCs (Module 2 or 3) for restricted transfers;
  transfers under the EU-US Data Privacy Framework are not restricted
  transfers, and SCCs kick in if certification lapses. [cf-dpa]
- **Turnstile** has its own privacy addendum: Cloudflare is processor for
  the signals used to protect the site, but **controller** for signals used
  "to improve Turnstile's bot detection capabilities". Signals include IP,
  TLS fingerprint and User-Agent. [cf-turnstile] The notice should say
  Cloudflare also uses Turnstile data for its own bot-detection purposes and
  link to the addendum. Turnstile "does not access, store, or transmit user
  communications, form entries, or other page inputs". [cf-turnstile-docs]
- D1 can be pinned to the EU with `--jurisdiction=eu`, but only when the
  database is created. [d1-loc] Ask's database doesn't exist yet, so create
  it with that flag. It doesn't stop the Worker itself running elsewhere.

**Anthropic** (Claude API)

- The Commercial Terms incorporate the DPA "by reference"; the contracting
  party for an EEA customer is "Anthropic Ireland, Limited"; Anthropic "may
  not train models on Customer Content". [anth-terms]
- DPA: Anthropic is processor; EU SCCs Modules 2 and 3 incorporated; Irish
  law. The DPA doesn't mention the Data Privacy Framework. Anthropic may keep
  data after termination to combat "harmful use". [anth-dpa]
- Data residency: `inference_geo` accepts only `"global"` (default) and
  `"us"`; workspace geo (storage at rest) is only `"us"`. There is no EU
  option. [anth-residency] Question text therefore leaves the EU.

**Transfers to the US (Chapter V).** Art. 45 adequacy decisions need no
further authorisation; SCCs are an Art. 46(2)(c) safeguard. [gdpr-b] The
EU-US Data Privacy Framework adequacy decision was upheld by the General
Court in *Latombe* (T-553/23, 3 September 2025), but an appeal (C-703/25 P)
is pending at the Court of Justice. [latombe] Both providers also have SCCs
in their DPAs, so a DPF ruling would not leave Ask without a transfer
mechanism, though SCCs formally need a transfer impact assessment (from
*Schrems II*, not researched in depth here). **Uncertain:** whether a small
controller using SCCs with these providers must write its own transfer
assessment; in practice regulators have not targeted this, but the sources
don't excuse it.

## Cookies and storage on the device

The Danish cookie order (BEK 1148/2011, implementing ePrivacy Art. 5(3))
bans storing or reading information on a user's device without informed
consent (§ 3), unless (§ 4(1)(2)) it "is required to enable the provider of
an information society service, which the end user has expressly requested,
to deliver that service". § 4(2): required means "a technical prerequisite
for delivering a service that works in accordance with the service's
purpose". [cookie-order] (Own translation.)

- **It covers localStorage, not only cookies.** EDPB Guidelines 2/2023
  (v2.0, 7 October 2024): Art. 5(3) applies to "information", whether or not
  personal data (para. 12), stored through "browser cookie storage as well as
  customized software" (para. 36), with no minimum duration (para. 37), and
  names "local storage" (para. 44). [edpb-53]
- **Supervision** is by Digitaliseringsstyrelsen (moved from Erhvervsstyrelsen
  on 15 December 2022, according to Digitaliseringsstyrelsen's 2022 annual
  report; not re-fetched), not Datatilsynet. Datatilsynet's 2020 visitor
  guidance still names Erhvervsstyrelsen. [dt-visitors]

**localStorage question history (12 hours)**

- WP29 Opinion 04/2012 reads the exemption per functionality: storage is
  exempt if it is needed for a functionality "explicitly requested by the
  user" (section 2.2). "User input" storage (form state, shopping carts) is
  exempt "for the duration of a session or persistent cookies limited to a few
  hours in some cases", and UI customisation "for the duration of a session
  (or slightly more)" (section 5). Necessity is judged "from the point of view
  of the user, not the service provider". [wp194]
- For: the history is first-party, holds only what the visitor typed and got
  back, never leaves the device (EDPB 2/2023 para. 44: browser use of local
  storage that stays inside the device is not "gaining access"), and showing
  your own questions is part of the service you asked for.
- Against: 12 hours is longer than "a few hours", and a visitor could get an
  answer without any history. A strict reader could call the history a
  convenience, not a technical prerequisite.
- **Unclear point in Danish law:** the order defines an information society
  service as one with "a commercial purpose" (§ 2(4)). A non-commercial
  personal site arguably isn't one, which would make the § 4 exemption, read
  literally, unavailable, while § 3 still binds "natural or legal persons". No
  source found resolves this; the ePrivacy Directive itself has the same
  wording problem. Most likely a regulator would apply the exemption by its
  purpose, but this is a guess.
- **Options for the spec**, safest first:
  1. `sessionStorage` (cleared when the tab closes): the clearest fit with WP29's
     "session" examples. Changes the map's 12-hour decision.
  2. Keep localStorage but shorten the window to a few hours.
  3. Keep 12h localStorage as decided and rely on the user-input reading;
     disclose it in the privacy section either way, with a "clear history"
     button.

  Whichever is picked, list it in the privacy section: purpose, what's
  stored, how long, how to clear it. § 3(2)'s information list is strictly
  for storage that needs consent, but giving it anyway costs nothing.

**Turnstile**

- Turnstile probes the browser ("probing web APIs and detecting browser
  quirks") [cf-turnstile-docs], which is "gaining access" under Art. 5(3).
  Cloudflare calls the signals "strictly necessary" for bot detection.
  [cf-turnstile] It sets a `cf_clearance` cookie only with pre-clearance,
  which Ask doesn't need. [cf-turnstile-docs] [cf-cookies]
- Running it only when the visitor submits a question (as the map decides)
  ties it to an explicit request and to protecting the service, which is the
  strongest position for the § 4 exemption.
- **Not covered by the exemption:** Cloudflare's own controller use of
  signals to improve bot detection. Neither the order nor the EDPB has
  ruled on this split for captcha-style checks; no source found. It is the
  same for every site using Turnstile or similar; disclose it and move on.
- No consent banner, on this reading.

## AI disclosure (outside GDPR, flagged only)

The EU AI Act's Art. 50(1) requires that people be told they are interacting
with an AI system unless that is obvious. Not researched here; an "Ask" box
that says it is answered by an AI covers it either way.

## What the spec must include

1. **Privacy section or page** (second layer), linked from the Ask note and
   the footer, with:
   - who runs the site: Eythor Konradsson, contact email (needed; Eythor to
     choose the address);
   - what Ask processes and why: question text sent to Anthropic to answer
     it; a keyed hash of the IP for rate limiting; Unanswered questions kept
     to improve the About file; Turnstile bot check;
   - legal basis: legitimate interests (abuse and cost protection; answering
     questions; improving the site's answers);
   - recipients: Cloudflare (hosting, database, Turnstile; also a controller
     for Turnstile's bot-detection improvement, link its addendum) and
     Anthropic (answers; link its privacy policy);
   - transfers: Anthropic processes in the US, under EU Standard Contractual
     Clauses; Cloudflare under the EU-US Data Privacy Framework and SCCs;
   - retention: IP hash 1 hour; Unanswered questions 90 days; Cloudflare
     database backups up to 7/30 days (match the actual plan); Anthropic up
     to 30 days, longer if flagged for misuse;
   - browser storage: question history in local/session storage, what, how
     long, how to clear it;
   - rights: access, erasure, objection etc., by emailing Eythor and quoting
     the question; complaints to Datatilsynet (datatilsynet.dk);
   - Ask is optional; no automated decisions about visitors.
2. **First-layer note under the Ask box**, visible before submitting. Draft:

   > Questions are answered by Claude, an AI from Anthropic, and are sent to
   > Anthropic in the US. Questions it can't answer are saved for 90 days so I
   > can improve this page. Please don't include personal details.
   > [Privacy](#privacy)

   (Rate limiting and Turnstile can live in the second layer: the first
   layer needs purposes, identity and rights, and the link carries the
   rest.)
3. **IP hashing:** HMAC-SHA-256 with a Worker secret key, never the raw IP in
   D1 or logs; delete rows older than 1 hour on write. Optional: rotate the
   key daily.
4. **Ask's D1 database created with `--jurisdiction=eu`** (one-time account
   step for Eythor; can't be added later).
5. **Unanswered questions:** text and date only, deleted after 90 days; a
   documented `wrangler d1 execute` query to find and delete one question on
   request, next to the read query.
6. **History storage decision:** pick one of the three options above
   (sessionStorage / a few hours / 12h as decided) and a way to clear it.
7. **Turnstile:** invisible or managed mode, run on submit only, no
   pre-clearance. No consent banner.
8. **Record of processing:** a short doc (e.g. in `docs/`) listing the three
   purposes, data, recipients, retention and safeguards, per Art. 30.
9. **Optional:** ask Anthropic about zero data retention for the API key
   (removes the 30-day copy); not required.

No consent banner is required on this reading. The only point that might
change that is the localStorage history, and option 1 or 2 removes the
doubt.

## Sources

- [gdpr]: Regulation (EU) 2016/679, recitals 18, 26, 30, 49 and Art. 2,
  EUR-Lex, https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32016R0679
- [gdpr-a]: same, Arts. 4(1), 4(5), 5(1), 6(1)(f), 11, 12, 13, 14(5), 17,
  21, 28, 30(5)
- [gdpr-b]: same, Arts. 37, 44, 45(1), 46(2)(c)
- [lindqvist]: CJEU C-101/01 *Lindqvist*, 6 November 2003, para. 47,
  https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:62001CJ0101
- [breyer]: CJEU C-582/14 *Breyer*, 19 October 2016, paras. 42-49, 60-64,
  https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:62014CJ0582
- [srb]: CJEU C-413/23 P *EDPS v SRB*, 4 September 2025, paras. 76-86,
  110-120,
  https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:62023CJ0413
- [edpb-pseudo]: EDPB Guidelines 01/2025 on Pseudonymisation, adopted 16
  January 2025 for public consultation, paras. 22, 88-91,
  https://www.edpb.europa.eu/system/files/2025-01/edpb_guidelines_202501_pseudonymisation_en.pdf
- [edpb-li]: EDPB Guidelines 1/2024 on Art. 6(1)(f), version 2.0, adopted 10
  November 2026, section 4.6,
  https://www.edpb.europa.eu/system/files/2026-11/edpb_guidelines_202401_legitimateinterest_v2_en.pdf
- [edpb-53]: EDPB Guidelines 2/2023 on the technical scope of Art. 5(3)
  ePrivacy, version 2.0, 7 October 2024, paras. 12, 36-37, 44,
  https://www.edpb.europa.eu/system/files/2024-10/edpb_guidelines_202302_technical_scope_art_53_eprivacydirective_v2_en_0.pdf
- [wp194]: WP29 Opinion 04/2012 on Cookie Consent Exemption (WP194),
  sections 2.2, 3.1, 5,
  https://ec.europa.eu/justice/article-29/documentation/opinion-recommendation/files/2012/wp194_en.pdf
- [wp260]: WP29 Guidelines on transparency (WP260 rev.01), paras. 35-36 and the
  "easily accessible" section,
  https://ec.europa.eu/newsroom/article29/items/622227
- [cookie-order]: Bekendtgørelse nr. 1148 af 9. december 2011
  (cookiebekendtgørelsen), §§ 2-4, https://www.retsinformation.dk/eli/lta/2011/1148
- [dt-visitors]: Datatilsynet, *Behandling af personoplysninger om
  hjemmesidebesøgende*, February 2020,
  https://www.datatilsynet.dk/Media/F/8/Behandling%20af%20personoplysninger%20om%20hjemmesidebes%C3%B8gende.pdf
- [dt-private]: Datatilsynet, *Nye afgørelser: Behandling af
  personoplysninger i rent private sammenhænge*, December 2020,
  https://www.datatilsynet.dk/presse-og-nyheder/nyhedsarkiv/2020/dec/nye-afgoerelser-behandling-af-personoplysninger-i-rent-private-sammenhaenge
  (read via search summary, not fetched in full)
- [cf-terms]: Cloudflare Self-Serve Subscription Agreement, section 6.1,
  https://www.cloudflare.com/terms/
- [cf-dpa]: Cloudflare Customer DPA v6.4, clauses 2.3, 3.1, 4, 6,
  https://www.cloudflare.com/cloudflare-customer-dpa/
- [cf-turnstile]: Cloudflare Turnstile Privacy Addendum,
  https://www.cloudflare.com/turnstile-privacy-policy/
- [cf-turnstile-docs]: Cloudflare Turnstile docs,
  https://developers.cloudflare.com/turnstile/
- [cf-cookies]: Cloudflare cookies reference,
  https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/
- [d1-loc]: D1 data location (jurisdictions),
  https://developers.cloudflare.com/d1/configuration/data-location/
- [d1-tt]: D1 Time Travel, https://developers.cloudflare.com/d1/reference/time-travel/
- [anth-terms]: Anthropic Commercial Terms of Service,
  https://www.anthropic.com/legal/commercial-terms
- [anth-dpa]: Anthropic Data Processing Addendum,
  https://www.anthropic.com/legal/data-processing-addendum
- [anth-retention]: Anthropic, *How long do you store my organization's
  data?*, dated 1 July 2026,
  https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data
- [anth-api-retention]: Claude docs, *API and data retention*,
  https://platform.claude.com/docs/en/manage-claude/api-and-data-retention
- [anth-residency]: Claude docs, *Data residency*,
  https://platform.claude.com/docs/en/manage-claude/data-residency
- [latombe]: General Court T-553/23 *Latombe v Commission*, 3 September 2025;
  appeal C-703/25 P pending. Status from search results (law-firm and press
  summaries), not from the Curia docket, which couldn't be fetched.
