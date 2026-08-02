// Annuaire statique TV/Radio — maintenu manuellement, pas de backend, pas de scraping.
// Liens sortants uniquement (jamais d'embed/iframe live) — décision prise pour
// raisons légales/fiabilité (cf. document de reprise, section 2).
//
// verified: 'confirmed' = URL fetchée directement et son contenu inspecté.
//           'consistent' = cohérent sur plusieurs sources (Wikipédia/agrégateurs),
//                           pas fetché individuellement.
// verifiedAt: date de la dernière vérification, pour repérer les entrées à
//             réaudit plus tard sans devoir tout revérifier en bloc.

export const tvChannels = [
  // ── Groupe SNRT (public) ──
  { id: 'al-aoula', name: 'Al Aoula', category: 'Généraliste', url: 'https://www.snrt.ma/fr/al-aoula', verified: 'confirmed', verifiedAt: '2026-07-30' },
  { id: 'arryadia', name: 'Arryadia', category: 'Sport', url: 'https://www.snrt.ma/fr/arryadia', verified: 'confirmed', verifiedAt: '2026-07-30' },
  { id: 'athaqafia', name: 'Athaqafia', category: 'Culture', url: 'https://www.snrt.ma/fr/athaqafia', verified: 'consistent', verifiedAt: '2026-07-30' },
  { id: 'al-maghribia', name: 'Al Maghribia', category: 'MRE / International', url: 'https://www.snrt.ma/fr/al-maghribia', verified: 'consistent', verifiedAt: '2026-07-30' },
  { id: 'assadissa', name: 'Assadissa', category: 'Religieux', url: 'https://www.snrt.ma/fr/assadissa', verified: 'consistent', verifiedAt: '2026-07-30' },
  { id: 'aflam-tv', name: 'Aflam TV', category: 'Cinéma', url: 'https://www.snrt.ma/fr/aflam-tv', verified: 'consistent', verifiedAt: '2026-07-30' },
  { id: 'tamazight-tv', name: 'Tamazight TV', category: 'Amazigh', url: 'https://www.snrt.ma/fr/tamazight-tv', verified: 'consistent', verifiedAt: '2026-07-30' },
  { id: 'laayoune-tv', name: 'Laâyoune TV', category: 'Régionale (Sud)', url: 'https://www.snrt.ma/fr/laayoune-tv', verified: 'consistent', verifiedAt: '2026-07-30' },
  // ── Holding publique élargie ──
  { id: '2m', name: '2M', category: 'Généraliste', url: 'https://2m.ma/fr/', verified: 'confirmed', verifiedAt: '2026-07-30' },
  { id: 'medi1tv', name: 'Medi1 TV', category: 'Généraliste', url: 'https://www.medi1tv.com/fr/tv', verified: 'confirmed', verifiedAt: '2026-07-30' },
  // ── Privée ──
  { id: 'chada-tv', name: 'Chada TV', category: 'Divertissement', url: 'https://chada.ma/fr/chada-tv/', verified: 'confirmed', verifiedAt: '2026-07-30' },
];

export const radioStations = {
  national: [
    { id: 'al-idaa-al-watania', name: 'Al Idaâ Al Watania', url: 'https://www.alidaa-alwatania.ma', verified: 'consistent', verifiedAt: '2026-07-30' },
    { id: 'chaine-inter', name: 'Chaîne Inter', url: 'https://snrtlive.ma/fr/chaine-inter', verified: 'confirmed', verifiedAt: '2026-07-30' },
    { id: 'medi1-radio', name: 'Medi1 Radio', url: 'https://www.medi1.com/fr', verified: 'confirmed', verifiedAt: '2026-07-30' },
  ],
  // Les 11 radios régionales SNRT sont regroupées sur une seule page annuaire
  // officielle plutôt que 11 liens individuels non vérifiés un par un.
  regional: {
    label: 'Radios régionales SNRT (Agadir, Al Hoceïma, Casablanca, Dakhla, Fès, Laâyoune, Marrakech, Meknès, Oujda, Tanger, Tétouan)',
    url: 'https://snrtlive.ma/fr/radio-regionale',
    verified: 'confirmed',
    verifiedAt: '2026-07-30',
  },
  private: [
    { id: 'hit-radio', name: 'Hit Radio', url: 'https://hitradio.ma', verified: 'confirmed', verifiedAt: '2026-07-30' },
    { id: 'chada-fm', name: 'Chada FM', url: 'https://chada.ma/fr/chada-fm/', verified: 'confirmed', verifiedAt: '2026-07-30' },
    { id: 'radio-mars', name: 'Radio Mars', url: 'https://radiomars.ma', verified: 'consistent', verifiedAt: '2026-07-30' },
    { id: 'cap-radio', name: 'Cap Radio', url: 'https://capradio.ma', verified: 'consistent', verifiedAt: '2026-07-30' },
    { id: 'atlantic-radio', name: 'Atlantic Radio', url: 'https://atlanticradio.ma', verified: 'confirmed', verifiedAt: '2026-07-30' },
    { id: 'aswat', name: 'Aswat', url: 'https://radioaswat.ma', verified: 'consistent', verifiedAt: '2026-07-30' },
    { id: 'mfm-radio', name: 'MFM Radio', url: 'https://www.mfmradio.ma', verified: 'consistent', verifiedAt: '2026-07-30' },
  ],
};