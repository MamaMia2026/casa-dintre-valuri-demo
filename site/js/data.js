/* ============================================================================
   DATE DE EXEMPLU – Casa dintre Valuri (machetă demo)
   Toate prețurile, sezoanele, regulile, opțiunile extra și zilele ocupate de mai
   jos sunt EXEMPLE. Pe site-ul real se înlocuiesc cu datele pensiunii.
   ============================================================================ */
window.CDV_DATA = {
  moneda: 'lei',
  avans: 0.30, // avans 30% (exemplu) – fără plată online, doar informativ

  // Cât de departe în viitor se pot face cereri (lună inclusă)
  rezervariPanaLa: '2027-12',

  // Prețul de bază = prețul afișat pe cardul camerei (sezon: mai, iunie, septembrie)
  camere: [
    { id: 'scoica', nume: 'Camera Scoică', descriere: '2 persoane · balcon spre mare', pret: 340, capacitate: 2, patSuplimentar: true, micDejunInclus: false },
    { id: 'far', nume: 'Camera Far', descriere: '2 persoane · stil marin', pret: 300, capacitate: 2, patSuplimentar: false, micDejunInclus: false },
    { id: 'faleza', nume: 'Apartament Faleză', descriere: '4 persoane · terasă privată', pret: 560, capacitate: 4, patSuplimentar: true, micDejunInclus: true }
  ],

  // luni: 1 = ianuarie … 12 = decembrie. factor se aplică prețului de bază.
  // minNopti = minim pentru orice sejur; minNoptiWeekend = minim dacă sejurul include
  // o noapte de vineri sau sâmbătă.
  sezoane: [
    { id: 'extra', nume: 'Extrasezon', perioada: 'oct–apr', luni: [10, 11, 12, 1, 2, 3, 4], factor: 0.7, minNopti: 1, minNoptiWeekend: 2 },
    { id: 'sezon', nume: 'Sezon', perioada: 'mai, iun, sep', luni: [5, 6, 9], factor: 1, minNopti: 1, minNoptiWeekend: 2 },
    { id: 'varf', nume: 'Vârf de sezon', perioada: 'iul–aug', luni: [7, 8], factor: 1.4, minNopti: 3, minNoptiWeekend: 3 }
  ],

  // Opțiuni extra (prețuri exemplu)
  extra: {
    micDejun: { nume: 'Mic dejun pe terasă', adult: 45, copil: 25 },  // / persoană / noapte
    patSuplimentar: { nume: 'Pat suplimentar', pret: 80 },             // / noapte, +1 loc în cameră
    parcare: { nume: 'Parcare', pret: 30 },                            // / noapte
    animal: { nume: 'Animal de companie', pret: 50 }                   // / sejur
  },

  // Nopți ocupate (exemplu), pe cameră: [sosire, plecare) – ziua de plecare rămâne liberă
  // pentru o nouă sosire.
  ocupat: {
    scoica: [
      ['2026-11-13', '2026-11-16'], ['2026-11-27', '2026-11-30'], ['2026-12-24', '2026-12-28'],
      ['2026-12-30', '2027-01-03'], ['2027-02-13', '2027-02-15'], ['2027-05-01', '2027-05-04'],
      ['2027-06-12', '2027-06-16'], ['2027-07-03', '2027-07-10'], ['2027-07-17', '2027-07-24'],
      ['2027-08-01', '2027-08-08'], ['2027-08-21', '2027-08-28'], ['2027-09-10', '2027-09-13'],
      ['2027-10-08', '2027-10-11']
    ],
    far: [
      ['2026-11-20', '2026-11-23'], ['2026-12-05', '2026-12-08'], ['2026-12-29', '2027-01-02'],
      ['2027-03-06', '2027-03-08'], ['2027-04-30', '2027-05-03'], ['2027-06-05', '2027-06-08'],
      ['2027-07-01', '2027-07-06'], ['2027-07-12', '2027-07-19'], ['2027-08-07', '2027-08-15'],
      ['2027-08-24', '2027-08-29'], ['2027-09-17', '2027-09-20'], ['2027-10-15', '2027-10-18']
    ],
    faleza: [
      ['2026-11-06', '2026-11-09'], ['2026-11-26', '2026-11-29'], ['2026-12-18', '2026-12-21'],
      ['2026-12-31', '2027-01-03'], ['2027-04-30', '2027-05-04'], ['2027-06-19', '2027-06-22'],
      ['2027-07-08', '2027-07-15'], ['2027-07-24', '2027-07-31'], ['2027-08-05', '2027-08-12'],
      ['2027-08-19', '2027-08-26'], ['2027-09-03', '2027-09-06'], ['2027-10-22', '2027-10-25']
    ]
  }
};
