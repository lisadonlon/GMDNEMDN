const fs = require('fs');
const path = require('path');

const table = `| GMDN Code | GMDN Description | EMDN Code | EMDN Term |
| :--- | :--- | :--- | :--- |
| 16 | Tourniquet, non-pneumatic | R010101 | NON-PNEUMATIC TOURNIQUETS |
| 28 | Laryngeal mask airway, single-use | R020202 | LARYNGEAL MASKS, SINGLE-USE |
| 85 | Stethoscope | Z110301 | STETHOSCOPES |
| 149 | Suture needle | L040101 | SUTURE NEEDLES |
| 163 | Dental mouth prop | L030302 | DENTAL MOUTH PROPS |
| 205 | Hospital-bed mattress, static | Z010205 | MATTRESSES FOR HOSPITAL BEDS |
| 232 | Ostomy pouch | U020101 | COLOSTOMY BAGS/POUCHES |
| 234 | Tracheostomy tube | R020301 | TRACHEOSTOMY TUBES |
| 245 | Oropharyngeal airway | R020203 | OROPHARYNGEAL AIRWAYS |
| 246 | Nasopharyngeal airway | R020204 | NASOPHARYNGEAL AIRWAYS |
| 315 | Endoscope washer/disinfector | Z120101 | ENDOSCOPE WASHER-DISINFECTORS |
| 333 | Suction catheter kit | A080103 | SUCTION CATHETERS |
| 350 | Sterile-fluid-pathway closing cap | A010104 | LUER CAPS |
| 352 | Surgical instrument decontamination container | Z120201 | SURGICAL INSTRUMENT DECONTAMINATION CONTAINERS |
| 353 | Manual surgical instrument cleaning brush | Z120202 | MANUAL SURGICAL INSTRUMENT CLEANING BRUSHES |
| 360 | Surgical light | Z010101 | SURGICAL LIGHTS |
| 363 | Endoscope leak tester | Z120102 | ENDOSCOPE LEAK TESTERS |
| 382 | Medical gas pipeline system | Z010301 | MEDICAL GAS PIPELINE SYSTEMS |
| 402 | Walking stick | G020201 | WALKING STICKS |
| 403 | Crutch | G020202 | CRUTCHES |
| 404 | Walking frame | G020203 | WALKING FRAMES |
| 408 | Medical air compressor | Z010302 | MEDICAL AIR COMPRESSORS |
| 418 | Guedel-type oropharyngeal airway, single-use | R020203 | OROPHARYNGEAL AIRWAYS |
| 449 | Manual resuscitation bag | R020401 | MANUAL RESUSCITATION BAGS |
| 451 | Rebreathing bag | R020403 | BREATHING BAGS |
| 452 | Steam sterilizer | Z120301 | STEAM STERILIZERS |
| 475 | Patient bed | Z010201 | PATIENT BEDS |
| 476 | Operating table | Z010202 | OPERATING TABLES |
| 498 | Urethral catheter | U010101 | URETHRAL CATHETERS |
| 505 | Peritoneal dialysis catheter | D010101 | PERITONEAL DIALYSIS CATHETERS |
| 506 | Peritoneal dialysis solution | D010102 | PERITONEAL DIALYSIS SOLUTIONS |
| 508 | Oxygen mask | R020101 | OXYGEN MASKS |
| 509 | Oxygen cannula | R020102 | OXYGEN CANNULAS |
| 524 | Intravenous administration set | A010101 | INTRAVENOUS ADMINISTRATION SETS |
| 525 | Intravenous catheter | A010102 | INTRAVENOUS CATHETERS |
| 537 | Electrocardiograph electrode | Z110302 | ELECTROCARDIOGRAPH ELECTRODES |
| 542 | Electrosurgical electrode | L010101 | ELECTROSURGICAL ELECTRODES |
| 553 | Haemodialysis blood tubing set | D010201 | HAEMODIALYSIS BLOOD LINES |
| 554 | Dialyzer | D010202 | DIALYZERS |
| 555 | Haemodialysis machine | D010203 | HAEMODIALYSIS MACHINES |
| 568 | Humidifier | R020501 | HUMIDIFIERS |
| 573 | Nebulizer | R020502 | NEBULIZERS |
| 582 | Lung ventilator | R020601 | LUNG VENTILATORS |
| 583 | Ventilator breathing circuit | R020602 | VENTILATOR BREATHING CIRCUITS |
| 597 | Bone cement | P010101 | BONE CEMENTS |
| 623 | Scalpel, single-use | L020101 | SCALPELS, SINGLE-USE |
| 624 | Scalpel, reusable | L020102 | SCALPELS, REUSABLE |
| 628 | Surgical drape | L020201 | SURGICAL DRAPES |
| 629 | Surgical gown | L020202 | SURGICAL GOWNS |
| 631 | Surgical mask | L020203 | SURGICAL MASKS |
| 637 | Hypodermic needle | A020101 | HYPODERMIC NEEDLES |
| 638 | Hypodermic syringe | A020102 | HYPODERMIC SYRINGES |
| 641 | Blood specimen container | W010103 | BLOOD COLLECTION TUBES |
| 643 | Blood collection tube | W010101 | BLOOD COLLECTION TUBES |
| 644 | Blood collection needle | W010102 | BLOOD COLLECTION NEEDLES |
| 650 | Blood component separation set IVD | W010901 | BLOOD COMPONENT SEPARATORS |
| 662 | Vaginal speculum | K010101 | VAGINAL SPECULA |
| 670 | Surgical suction apparatus | L020301 | SURGICAL SUCTION APPARATUS |
| 671 | Suction tubing | L020302 | SUCTION TUBING |
| 681 | Surgical microscope | L020401 | SURGICAL MICROSCOPES |
| 686 | Fibreoptic light cable | L020508 | ENDOSCOPIC LIGHT SOURCES |
| 689 | Endoscopic light source | L020501 | ENDOSCOPIC LIGHT SOURCES |
| 690 | Endoscopic camera system | L020502 | ENDOSCOPIC CAMERA SYSTEMS |
| 692 | Defibrillator | C010201 | DEFIBRILLATORS |
| 693 | Defibrillator electrode | C010202 | DEFIBRILLATOR ELECTRODES |
| 710 | Blood warmer | A010201 | BLOOD WARMERS |
| 711 | Intravenous solution warmer | A010202 | INTRAVENOUS SOLUTION WARMERS |
| 713 | Patient warming/cooling system | Z010401 | WATER BLANKETS |
| 726 | Dental hand instrument, reusable | L030201 | DENTAL HAND INSTRUMENTS, REUSABLE |
| 729 | Anaesthesia face mask, single-use | R020701 | ANAESTHESIA FACE MASKS, SINGLE-USE |
| 735 | Anaesthesia screen | Z010204 | ANAESTHESIA SCREENS |
| 740 | Anaesthetic-gas-scavenging system | R020702 | ANAESTHETIC GAS SCAVENGING/DISPOSAL SYSTEMS |
| 754 | Dental instrument handpiece, air-powered | L030401 | DENTAL INSTRUMENT HANDPIECES, AIR-POWERED |
| 771 | Dental handpiece lubricant | L030402 | DENTAL HANDPIECE CLEANING/LUBRICATION SYSTEMS |
| 790 | Dental aspirator tip, single-use | L030501 | DENTAL ASPIRATOR TIPS, SINGLE-USE |
| 798 | Dental impression material | L030601 | DENTAL IMPRESSION MATERIALS |
| 818 | Dental amalgam | L030701 | DENTAL AMALGAMS |
| 832 | Dental cement | L030801 | DENTAL CEMENTS |
| 834 | Dental restorative material | L030901 | DENTAL RESTORATIVE MATERIALS |
| 851 | Dental chair | L030101 | DENTAL CHAIRS |
| 854 | Dental light | L030102 | DENTAL LIGHTS |
| 898 | Dental X-ray unit | L031001 | DENTAL X-RAY UNITS |
| 913 | Orthodontic bracket | L031101 | ORTHODONTIC BRACKETS |
| 940 | Tone audiometer | Z110501 | TONE AUDIOMETERS |
| 1003 | Hess-screen | Z110603 | HESS SCREENS |
| 1062 | Speech audiometer | Z110502 | SPEECH AUDIOMETERS |
| 1084 | Bedrail | Z010203 | BED RAILS |
| 1089 | Electronystagmograph | Z110604 | ELECTRONYSTAGMOGRAPHS |
| 1096 | Evoked-potential audiometer | Z110503 | EVOKED POTENTIAL AUDIOMETERS |
| 1126 | Mobile gamma camera system | Y020101 | MOBILE GAMMA CAMERAS |
| 1190 | Testicle prosthesis | P020101 | TESTICLE PROSTHESES |
| 1191 | Rigid penile prosthesis | P020102 | PENILE PROSTHESES |
| 1231 | Patient transfer sliding board | G020301 | PATIENT TRANSFER SLIDING BOARDS |
| 1244 | Flexible video gastroscope, single-use | L020503 | FLEXIBLE VIDEO GASTROSCOPES, SINGLE-USE |
| 1246 | Laryngoscope blade, single-use | R020205 | LARYNGOSCOPE BLADES, SINGLE-USE |
| 1247 | Pulmonary resuscitator, manual, reusable | R020402 | PULMONARY RESUSCITATORS, MANUAL, REUSABLE |
| 1249 | Flexible video duodenoscope, single-use | L020504 | FLEXIBLE VIDEO DUODENOSCOPES, SINGLE-USE |
| 1254 | Flexible video colonoscope, single-use | L020505 | FLEXIBLE VIDEO COLONOSCOPES, SINGLE-USE |
| 1258 | Polysomnograph | Z110401 | POLYSOMNOGRAPHS |
| 1259 | Endotracheal tube cuff inflator | R020303 | ENDOTRACHEAL TUBE CUFF INFLATORS |
| 1263 | Electromyographic needle electrode, single-use | Z110402 | ELECTROMYOGRAPHIC NEEDLE ELECTRODES, SINGLE-USE |
| 1280 | Needle guide, single-use | A020103 | NEEDLE GUIDES, SINGLE-USE |
| 1289 | Nephrostomy catheter | U010201 | NEPHROSTOMY CATHETERS |
| 1299 | Lactate electrode IVD | W010201 | LACTATE ELECTRODES |
| 1380 | Total hCG IVD, antibody | W010301 | TOTAL HCG ANTIBODY |
| 1467 | Insulin IVD, antibody | W010302 | INSULIN ANTIBODY |
| 1523 | Medical image management system software | Y030103 | PICTURE ARCHIVING AND COMMUNICATION SYSTEMS |
| 1539 | PACS workstation | Y030101 | PACS WORKSTATIONS |
| 1548 | Cardiac mapping system | C010302 | CARDIAC MAPPING SYSTEMS |
| 1606 | Surgical navigation device | L020601 | SURGICAL NAVIGATION DEVICES |
| 1669 | Cardiac electrophysiology stimulation system | C010303 | CARDIAC ELECTROPHYSIOLOGY STIMULATION SYSTEMS |
| 1736 | Patient transfer/turning sheet, single-use | G020302 | PATIENT TRANSFER/TURNING SHEETS, SINGLE-USE |
| 1741 | Proton therapy system | Y040101 | PROTON THERAPY SYSTEMS |
| 1752 | Insulin-like growth factor I (IGF-1) IVD, kit | W010401 | INSULIN-LIKE GROWTH FACTOR I (IGF-1) |
| 1759 | Follicle stimulating hormone (FSH) IVD, kit | W010402 | FOLLICLE STIMULATING HORMONE (FSH) |
| 1767 | Insulin-like growth factor binding protein 3 (IGFBP-3) IVD, kit | W010403 | INSULIN-LIKE GROWTH FACTOR BINDING PROTEIN 3 (IGFBP-3) |
| 1788 | Electrosurgical system | L010102 | ELECTROSURGICAL SYSTEMS |
| 1826 | Coagulation factor VIII IVD, kit | W010404 | COAGULATION FACTOR VIII |
| 1830 | Activated partial thromboplastin time (APTT) IVD, kit | W010411 | ACTIVATED PARTIAL THROMBOPLASTIN TIME |
| 1935 | Coronary atherectomy device | C010401 | CORONARY ATHERECTOMY DEVICES |
| 1987 | External pacemaker pulse generator | C010203 | EXTERNAL PACEMAKER PULSE GENERATORS |
| 2043 | Human immunodeficiency virus (HIV) drug resistance genotyping IVD, kit | W010801 | HUMAN IMMUNODEFICIENCY VIRUS (HIV) DRUG RESISTANCE GENOTYPING |
| 2049 | Blood glucose meter | W010501 | BLOOD GLUCOSE METERS |
| 2069 | Troponin I IVD, kit | W010405 | TROPONIN I |
| 2070 | Troponin T IVD, kit | W010406 | TROPONIN T |
| 2073 | Thyroid stimulating hormone (TSH) IVD, kit | W010407 | THYROID STIMULATING HORMONE (TSH) |
| 2159 | Luteinizing hormone (LH) IVD, kit | W010408 | LUTEINIZING HORMONE (LH) |
| 2160 | Progesterone IVD, kit | W010409 | PROGESTERONE |
| 2161 | Prolactin IVD, kit | W010410 | PROLACTIN |
| 2215 | Automated immunoassay system | W010601 | AUTOMATED IMMUNOASSAY SYSTEMS |
| 2223 | Blood gas/pH analyser | W010701 | BLOOD GAS/PH ANALYSERS |
| 2500 | Surgical smoke evacuator | L020701 | SURGICAL SMOKE EVACUATORS |
| 2502 | Surgical smoke evacuator tubing | L020702 | SURGICAL SMOKE EVACUATOR TUBING |
| 2503 | Surgical smoke evacuator filter | L020703 | SURGICAL SMOKE EVACUATOR FILTERS |
| 2623 | Radiographic Quality Assurance device | Y050101 | RADIOGRAPHIC QUALITY ASSURANCE DEVICES |
| 2749 | Intra-aortic balloon pump catheter | C010501 | INTRA-AORTIC BALLOON PUMP CATHETERS |
| 2811 | Cryosurgical unit | L010201 | CRYOSURGICAL UNITS |
| 2891 | External fixation system wrench | P010201 | EXTERNAL FIXATION SYSTEM WRENCHES |
| 2950 | Cardiopulmonary bypass arterial cannula | C010602 | CARDIOPULMONARY BYPASS CANNULAS |
| 2956 | Heart-lung bypass heat exchanger | C010601 | HEART-LUNG BYPASS HEAT EXCHANGERS |
| 3075 | Atherectomy device catheter | C010402 | ATHERECTOMY DEVICE CATHETERS |
| 3076 | Coronary angioplasty catheter guidewire | C020101 | PTCA GUIDEWIRES |
| 3077 | Percutaneous transluminal coronary angioplasty (PTCA) catheter | C020201 | PTCA CATHETERS |
| 3078 | Coronary artery stent | C030101 | CORONARY STENTS |
| 3079 | Drug-eluting coronary artery stent | C030102 | DRUG-ELUTING CORONARY STENTS |
| 3088 | Steerable catheter guidewire | C010305 | STEERABLE CATHETER GUIDEWIRES |
| 3089 | Angiographic catheter | C010306 | ANGIOGRAPHIC CATHETERS |
| 3170 | Ophthalmic tonometer | Z110601 | OPHTHALMIC TONOMETERS |
| 3184 | Bone-conduction hearing aid | Z110504 | BONE-CONDUCTION HEARING AIDS |
| 3261 | Endoscopic camera | L020506 | ENDOSCOPIC CAMERAS |
| 3379 | Dialysis catheter | D010102 | DIALYSIS CATHETERS |
| 3499 | Infusion pump | A010301 | INFUSION PUMPS |
| 3529 | Surgical drill | L020801 | SURGICAL DRILLS |
| 3530 | Surgical saw | L020802 | SURGICAL SAWS |
| 3548 | Ultrasound therapy system | Z110701 | ULTRASOUND THERAPY SYSTEMS |
| 3683 | Medical image digitizer | Y030102 | MEDICAL IMAGE DIGITIZERS |
| 3729 | Medical chart recorder | Z110801 | MEDICAL CHART RECORDERS |
| 3935 | Contact lens | Z110602 | CONTACT LENSES |
| 3952 | Ophthalmic perimeter | Z110605 | OPHTHALMIC PERIMETERS |
| 4001 | Hip prosthesis | P020201 | HIP PROSTHESES |
| 4002 | Knee prosthesis | P020202 | KNEE PROSTHESES |
| 4003 | Shoulder prosthesis | P020203 | SHOULDER PROSTHESES |
| 4004 | Elbow prosthesis | P020204 | ELBOW PROSTHESES |
| 4005 | Ankle prosthesis | P020205 | ANKLE PROSTHESES |
| 4006 | Wrist prosthesis | P020206 | WRIST PROSTHESES |
| 4007 | Toe prosthesis | P020207 | TOE PROSTHESES |
| 4008 | Finger prosthesis | P020208 | FINGER PROSTHESES |
| 4101 | Hearing aid | Z110505 | HEARING AIDS |
| 4211 | Bone screw | P010202 | BONE SCREWS |
| 4212 | Bone plate | P010203 | BONE PLATES |
| 4213 | Intramedullary nail | P010204 | INTRAMEDULLARY NAILS |
| 4214 | Bone wire | P010205 | BONE WIRES |
| 4215 | Vascular graft | C040101 | VASCULAR GRAFTS |
| 4216 | Arteriovenous (AV) fistula graft | D010301 | ARTERIOVENOUS FISTULA GRAFTS |
| 4217 | Prosthetic heart valve, mechanical | C050101 | MECHANICAL HEART VALVES |
| 4218 | Prosthetic heart valve, tissue | C050102 | TISSUE HEART VALVES |
| 4219 | Bone pin | P010206 | BONE PINS |
| 4220 | External fixation system | P010207 | EXTERNAL FIXATION SYSTEMS |
| 4300 | Spinal intervertebral body fusion cage | P030201 | SPINAL INTERVERTEBRAL BODY FUSION CAGES |
| 4300 | Urinary catheter | U010102 | URINARY CATHETERS |
| 4301 | Pedicle screw spinal system | P030202 | PEDICLE SCREW SPINAL SYSTEMS |
| 4302 | Spinal plate | P030203 | SPINAL PLATES |
| 4303 | Artificial spinal disc | P030204 | ARTIFICIAL SPINAL DISCS |
| 4326 | Doppler ultrasound system | Y010101 | DOPPLER ULTRASOUND SYSTEMS |
| 4448 | Surgical instrument tray | L020901 | SURGICAL INSTRUMENT TRAYS |
| 4450 | Surgical stapler | L021001 | SURGICAL STAPLERS |
| 4554 | Laparoscope | L020507 | LAPAROSCOPES |
| 4601 | Surgical laser | L010301 | SURGICAL LASERS |
| 4885 | Electrocardiograph | C010701 | ELECTROCARDIOGRAPHS |
| 5001 | Blood pressure cuff | C010801 | BLOOD PRESSURE CUFFS |
| 5200 | Cardiovascular diagnostic catheter | C010307 | CARDIOVASCULAR CATHETERS |
| 5201 | Intravascular ultrasound (IVUS) catheter | C010308 | INTRAVASCULAR ULTRASOUND CATHETERS |
| 5202 | Peripheral arterial catheter guidewire | C060101 | PERIPHERAL GUIDEWIRES |
| 5203 | Peripheral arterial catheter | C060201 | PERIPHERAL CATHETERS |
| 5204 | Peripheral venous catheter | C060202 | PERIPHERAL CATHETERS |
| 5231 | Diagnostic x-ray system | Y050201 | DIAGNOSTIC X-RAY SYSTEMS |
| 5300 | Carotid artery stent | C030201 | CAROTID STENTS |
| 5301 | Peripheral artery stent | C030301 | PERIPHERAL STENTS |
| 5302 | Biliary stent | J010101 | BILIARY STENTS |
| 5303 | Tracheal/bronchial stent | R030101 | TRACHEAL/BRONCHIAL STENTS |
| 5304 | Oesophageal stent | J010102 | OESOPHAGEAL STENTS |
| 5305 | Ureteral stent | U010301 | URETERAL STENTS |
| 5400 | Septal occluder | C070101 | SEPTAL OCCLUDERS |
| 5401 | Carotid shunt | C070201 | CAROTID SHUNTS |
| 5412 | Magnetic resonance imaging system | Y060101 | MAGNETIC RESONANCE IMAGING SYSTEMS |
| 5500 | Aortic stent graft | C040201 | AORTIC STENT GRAFTS |
| 5501 | Thoracic stent graft | C040202 | THORACIC STENT GRAFTS |
| 5502 | Fenestrated/Branched aortic stent graft | C040203 | FENESTrated/BRANCHED AORTIC STENT GRAFTS |
| 5600 | Transcatheter aortic valve | C050201 | TRANSCATHETER AORTIC VALVES |
| 5601 | Transcatheter pulmonary valve | C050202 | TRANSCATHETER PULMONARY VALVES |
| 5602 | Venous valve | C050301 | VENOUS VALVES |
| 5790 | Computed tomography x-ray system | Y050301 | COMPUTED TOMOGRAPHY X-RAY SYSTEMS |
| 6001 | Syringe | A020104 | SYRINGES |
| 6034 | Surgical gloves | L020204 | SURGICAL GOWNS |
| 6210 | Short-term peripheral venous catheter | A010103 | PERIPHERAL CATHETERS |
| 6333 | Endotracheal tube | R020304 | ENDOTRACHEAL TUBES |
| 6400 | Hydrocephalus shunt valve | N010201 | HYDROCEPHALUS VALVES |
| 6500 | Neurostimulator | N010301 | NEUROSTIMULATORS |
| 6501 | Aneurysm clip | N010401 | ANEURYSM CLIPS |
| 6543 | Medical-gas regulator | R020103 | MEDICAL GAS REGULATORS |
| 6800 | Electrophysiology diagnostic catheter | C010309 | ELECTROPHYSIOLOGY CATHETERS |
| 7021 | Oxygen analyser | R020104 | OXYGEN ANALYSERS |
| 7100 | Patient scale | Z110102 | PATIENT SCALES |
| 7200 | Wheelchair | G020102 | WHEELCHAIRS |
| 8108 | Catheter guide wire | C010301 | CATHETER GUIDEWIRES |
| 9001 | Bandage | M010102 | BANDAGES |
| 9123 | Suture | L040202 | SUTURES |`;

const DEFAULT_SCORE = 95;

function parseTable(markdown) {
  const lines = markdown
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line.startsWith('|'));

  // Drop header and alignment rows
  const dataLines = lines.slice(2);

  const records = [];
  for (const line of dataLines) {
    const parts = line.split('|').map((part) => part.trim());
    if (parts.length < 5) {
      continue;
    }

    const gmdnCode = parts[1];
    const gmdnDescription = parts[2];
    const emdnCode = parts[3];
    const emdnDescription = parts[4].replace(/\s+\|?$/g, '').trim();

    if (!gmdnCode || !emdnCode) {
      continue;
    }

    records.push({ gmdnCode, gmdnDescription, emdnCode, emdnDescription });
  }

  return records;
}

function syncValidatedMappings() {
  const mappingsPath = path.join(__dirname, 'public', 'gmdn-emdn-mappings', 'gmdn-emdn-mappings.json');
  if (!fs.existsSync(mappingsPath)) {
    console.error('❌ Mappings file not found:', mappingsPath);
    process.exit(1);
  }

  const records = parseTable(table);
  const mappingIndex = {};
  const duplicateCodes = new Map();
  const occurrenceCounts = new Map();

  for (const record of records) {
    const { gmdnCode, gmdnDescription, emdnCode, emdnDescription } = record;
    const category = emdnCode.charAt(0);

    const occurrences = (occurrenceCounts.get(gmdnCode) || 0) + 1;
    occurrenceCounts.set(gmdnCode, occurrences);

    if (!mappingIndex[gmdnCode]) {
      mappingIndex[gmdnCode] = {
        gmdnCode,
        gmdnDescription,
        emdnMatches: [
          {
            emdnCode,
            emdnDescription,
            score: DEFAULT_SCORE,
            category
          }
        ]
      };
    } else {
      const existing = mappingIndex[gmdnCode];
      if (existing.gmdnDescription !== gmdnDescription) {
        if (!duplicateCodes.has(gmdnCode)) {
          duplicateCodes.set(gmdnCode, new Set());
        }
        duplicateCodes.get(gmdnCode).add(existing.gmdnDescription);
        duplicateCodes.get(gmdnCode).add(gmdnDescription);
      }
      existing.emdnMatches.push({ emdnCode, emdnDescription, score: DEFAULT_SCORE, category });
    }
  }

  const sortedKeys = Object.keys(mappingIndex).sort((a, b) => Number(a) - Number(b));
  const mappings = {};
  for (const key of sortedKeys) {
    mappings[key] = mappingIndex[key];
  }

  const metadata = {
    generated: new Date().toISOString(),
    version: '3.1.0',
    description: `Complete validated GMDN to EMDN device code mappings - ${sortedKeys.length} mappings`,
    stats: {
      totalGmdn: sortedKeys.length,
      mappedGmdn: sortedKeys.length,
      manualMappings: sortedKeys.length,
      automaticMappings: 0
    }
  };

  const payload = {
    metadata,
    mappings
  };

  const backupPath = `${mappingsPath}.backup-${Date.now()}`;
  fs.copyFileSync(mappingsPath, backupPath);
  console.log(`💾 Backup created at ${path.basename(backupPath)}`);

  fs.writeFileSync(mappingsPath, JSON.stringify(payload, null, 2));

  console.log(`✅ Parsed ${records.length} rows from table.`);
  console.log(`✅ Synced ${sortedKeys.length} unique GMDN codes to validated dataset.`);

  if (duplicateCodes.size > 0) {
    console.warn('\n⚠️ Duplicate GMDN codes detected with differing descriptions:');
    for (const [code, descriptions] of duplicateCodes.entries()) {
      console.warn(` - ${code}: ${Array.from(descriptions).join(' | ')}`);
    }
  }

  const ambiguous = Array.from(occurrenceCounts.entries()).filter(([, count]) => count > 1);
  if (ambiguous.length > 0) {
    console.warn('\nℹ️ GMDN codes appearing multiple times in source table:');
    for (const [code, count] of ambiguous) {
      console.warn(` - ${code}: ${count} occurrences`);
    }
  }
}

syncValidatedMappings();
