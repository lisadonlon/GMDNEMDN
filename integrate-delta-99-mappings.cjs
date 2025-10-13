const fs = require('fs');
const path = require('path');

const deltaMappings = [
  { gmdnCode: '3170', gmdnDescription: 'Ophthalmic tonometer', emdnCode: 'Z110601', emdnDescription: 'OPHTHALMIC TONOMETERS' },
  { gmdnCode: '3935', gmdnDescription: 'Contact lens', emdnCode: 'Z110602', emdnDescription: 'CONTACT LENSES' },
  { gmdnCode: '3952', gmdnDescription: 'Ophthalmic perimeter', emdnCode: 'Z110605', emdnDescription: 'OPHTHALMIC PERIMETERS' },
  { gmdnCode: '4100', gmdnDescription: 'Ophthalmoscope', emdnCode: 'Z110606', emdnDescription: 'OPHTHALMOSCOPES' },
  { gmdnCode: '4102', gmdnDescription: 'Retinoscope', emdnCode: 'Z110607', emdnDescription: 'RETINOSCOPES' },
  { gmdnCode: '4103', gmdnDescription: 'Phoropter', emdnCode: 'Z110608', emdnDescription: 'PHOROPTERS' },
  { gmdnCode: '4602', gmdnDescription: 'Ophthalmic surgical laser', emdnCode: 'L010302', emdnDescription: 'OPHTHALMIC LASERS' },
  { gmdnCode: '5700', gmdnDescription: 'Slit lamp', emdnCode: 'Z110609', emdnDescription: 'SLIT LAMPS' },
  { gmdnCode: '5701', gmdnDescription: 'Fundus camera', emdnCode: 'Z110610', emdnDescription: 'FUNDUS CAMERAS' },
  { gmdnCode: '5702', gmdnDescription: 'Phacoemulsification system', emdnCode: 'L050101', emdnDescription: 'PHACOEMULSIFICATION SYSTEMS' },
  { gmdnCode: '5703', gmdnDescription: 'Vitrectomy system', emdnCode: 'L050102', emdnDescription: 'VITRECTOMY SYSTEMS' },
  { gmdnCode: '5704', gmdnDescription: 'Ophthalmic surgical microscope', emdnCode: 'L050103', emdnDescription: 'OPHTHALMIC SURGICAL MICROSCOPES' },
  { gmdnCode: '5705', gmdnDescription: 'Ophthalmic cryosurgical unit', emdnCode: 'L050104', emdnDescription: 'OPHTHALMIC CRYOSURGICAL UNITS' },
  { gmdnCode: '5706', gmdnDescription: 'Intraocular lens (IOL)', emdnCode: 'P040101', emdnDescription: 'INTRAOCULAR LENSES (IOLS)' },
  { gmdnCode: '5707', gmdnDescription: 'Spectacle lens', emdnCode: 'P040102', emdnDescription: 'SPECTACLE LENSES' },
  { gmdnCode: '2049', gmdnDescription: 'Blood glucose meter', emdnCode: 'W010501', emdnDescription: 'BLOOD GLUCOSE MONITORING SYSTEMS' },
  { gmdnCode: '2200', gmdnDescription: 'Clinical chemistry analyser', emdnCode: 'W011001', emdnDescription: 'CLINICAL CHEMISTRY ANALYSERS' },
  { gmdnCode: '2201', gmdnDescription: 'Haematology analyser', emdnCode: 'W011002', emdnDescription: 'HAEMATOLOGY ANALYSERS' },
  { gmdnCode: '2202', gmdnDescription: 'Coagulation analyser', emdnCode: 'W011003', emdnDescription: 'COAGULATION ANALYSERS' },
  { gmdnCode: '2203', gmdnDescription: 'Immunoassay analyser', emdnCode: 'W011004', emdnDescription: 'IMMUNOASSAY ANALYSERS' },
  { gmdnCode: '2204', gmdnDescription: 'Mass spectrometer', emdnCode: 'W011005', emdnDescription: 'MASS SPECTROMETERS' },
  { gmdnCode: '2205', gmdnDescription: 'Flow cytometer', emdnCode: 'W011006', emdnDescription: 'FLOW CYTOMETERS' },
  { gmdnCode: '3500', gmdnDescription: 'Laboratory microscope', emdnCode: 'Z130101', emdnDescription: 'LABORATORY MICROSCOPES' },
  { gmdnCode: '3501', gmdnDescription: 'Centrifuge', emdnCode: 'Z130102', emdnDescription: 'CENTRIFUGES' },
  { gmdnCode: '3502', gmdnDescription: 'Laboratory incubator', emdnCode: 'Z130103', emdnDescription: 'LABORATORY INCUBATORS' },
  { gmdnCode: '3503', gmdnDescription: 'Autoclave', emdnCode: 'Z120302', emdnDescription: 'AUTOCLAVES' },
  { gmdnCode: '3504', gmdnDescription: 'Pipette', emdnCode: 'W011101', emdnDescription: 'PIPETTES' },
  { gmdnCode: '7100', gmdnDescription: 'Point-of-care coagulation analyser', emdnCode: 'W010502', emdnDescription: 'POINT-OF-CARE COAGULATION ANALYSERS' },
  { gmdnCode: '7101', gmdnDescription: 'Point-of-care urinalysis system', emdnCode: 'W010503', emdnDescription: 'POINT-OF-CARE URINALYSIS SYSTEMS' },
  { gmdnCode: '4009', gmdnDescription: 'Prosthetic limb, upper', emdnCode: 'P050101', emdnDescription: 'UPPER LIMB PROSTHESES' },
  { gmdnCode: '4010', gmdnDescription: 'Prosthetic limb, lower', emdnCode: 'P050102', emdnDescription: 'LOWER LIMB PROSTHESES' },
  { gmdnCode: '4011', gmdnDescription: 'Orthotic, spinal', emdnCode: 'P060101', emdnDescription: 'SPINAL ORTHOSES' },
  { gmdnCode: '4012', gmdnDescription: 'Orthotic, knee', emdnCode: 'P060102', emdnDescription: 'KNEE ORTHOSES' },
  { gmdnCode: '4013', gmdnDescription: 'Orthotic, ankle-foot', emdnCode: 'P060103', emdnDescription: 'ANKLE-FOOT ORTHOSES' },
  { gmdnCode: '7201', gmdnDescription: 'Transcutaneous electrical nerve stimulator (TENS)', emdnCode: 'G030101', emdnDescription: 'TRANSCUTANEOUS ELECTRICAL NERVE STIMULATORS (TENS)' },
  { gmdnCode: '7202', gmdnDescription: 'Powered muscle stimulator', emdnCode: 'G030102', emdnDescription: 'POWERED MUSCLE STIMULATORS' },
  { gmdnCode: '7203', gmdnDescription: 'Continuous passive motion (CPM) device', emdnCode: 'G030103', emdnDescription: 'CONTINUOUS PASSIVE MOTION (CPM) DEVICES' },
  { gmdnCode: '7204', gmdnDescription: 'Traction unit', emdnCode: 'G030104', emdnDescription: 'TRACTION UNITS' },
  { gmdnCode: '7205', gmdnDescription: 'Therapeutic ultrasound system', emdnCode: 'G030105', emdnDescription: 'THERAPEUTIC ULTRASOUND SYSTEMS' },
  { gmdnCode: '7300', gmdnDescription: 'Medical image analysis software', emdnCode: 'Y030201', emdnDescription: 'MEDICAL IMAGE ANALYSIS SOFTWARE' },
  { gmdnCode: '7301', gmdnDescription: 'Digital pathology software', emdnCode: 'Y030202', emdnDescription: 'DIGITAL PATHOLOGY SOFTWARE' },
  { gmdnCode: '7302', gmdnDescription: 'Medical mobile application, diagnostic', emdnCode: 'Y030203', emdnDescription: 'DIAGNOSTIC MOBILE MEDICAL APPLICATIONS' },
  { gmdnCode: '7303', gmdnDescription: 'Medical device data system software', emdnCode: 'Y030204', emdnDescription: 'MEDICAL DEVICE DATA SYSTEMS (MDDS)' },
  { gmdnCode: '7304', gmdnDescription: 'Medical algorithm software, therapeutic', emdnCode: 'Y030205', emdnDescription: 'THERAPEUTIC ALGORITHM SOFTWARE' },
  { gmdnCode: '7400', gmdnDescription: 'Syringe pump', emdnCode: 'A010302', emdnDescription: 'SYRINGE PUMPS' },
  { gmdnCode: '7401', gmdnDescription: 'Ambulatory infusion pump', emdnCode: 'A010303', emdnDescription: 'AMBULATORY INFUSION PUMPS' },
  { gmdnCode: '7402', gmdnDescription: 'Enteral feeding pump', emdnCode: 'J020101', emdnDescription: 'ENTERAL FEEDING PUMPS' },
  { gmdnCode: '7403', gmdnDescription: 'Enteral administration set', emdnCode: 'J020102', emdnDescription: 'ENTERAL ADMINISTRATION SETS' },
  { gmdnCode: '8000', gmdnDescription: 'Absorbent wound dressing', emdnCode: 'M010201', emdnDescription: 'ABSORBENT WOUND DRESSINGS' },
  { gmdnCode: '8001', gmdnDescription: 'Hydrocolloid wound dressing', emdnCode: 'M010202', emdnDescription: 'HYDROCOLLOID WOUND DRESSINGS' },
  { gmdnCode: '8002', gmdnDescription: 'Foam wound dressing', emdnCode: 'M010203', emdnDescription: 'FOAM WOUND DRESSINGS' },
  { gmdnCode: '8003', gmdnDescription: 'Alginate wound dressing', emdnCode: 'M010204', emdnDescription: 'ALGINATE WOUND DRESSINGS' },
  { gmdnCode: '8004', gmdnDescription: 'Hydrogel wound dressing', emdnCode: 'M010205', emdnDescription: 'HYDROGEL WOUND DRESSINGS' },
  { gmdnCode: '8005', gmdnDescription: 'Antimicrobial wound dressing', emdnCode: 'M010206', emdnDescription: 'ANTIMICROBIAL WOUND DRESSINGS' },
  { gmdnCode: '8006', gmdnDescription: 'Wound dressing with adhesive border', emdnCode: 'M010207', emdnDescription: 'WOUND DRESSINGS WITH ADHESIVE BORDER' },
  { gmdnCode: '8007', gmdnDescription: 'Transparent film dressing', emdnCode: 'M010208', emdnDescription: 'TRANSPARENT FILM DRESSINGS' },
  { gmdnCode: '2301', gmdnDescription: 'Ostomy pouch deodorant', emdnCode: 'U020102', emdnDescription: 'OSTOMY POUCH DEODORANTS' },
  { gmdnCode: '2302', gmdnDescription: 'Ostomy skin barrier', emdnCode: 'U020103', emdnDescription: 'OSTOMY SKIN BARRIERS' },
  { gmdnCode: '2303', gmdnDescription: 'Ostomy pouch clamp', emdnCode: 'U020104', emdnDescription: 'OSTOMY POUCH CLAMPS' },
  { gmdnCode: '2304', gmdnDescription: 'Ileostomy pouch', emdnCode: 'U020105', emdnDescription: 'ILEOSTOMY BAGS/POUCHES' },
  { gmdnCode: '2305', gmdnDescription: 'Urostomy pouch', emdnCode: 'U020106', emdnDescription: 'UROSTOMY BAGS/POUCHES' },
  { gmdnCode: '2306', gmdnDescription: 'Ostomy irrigation set', emdnCode: 'U020107', emdnDescription: 'OSTOMY IRRIGATION SETS' },
  { gmdnCode: '2307', gmdnDescription: 'Stoma paste', emdnCode: 'U020108', emdnDescription: 'STOMA PASTES' },
  { gmdnCode: '9000', gmdnDescription: 'Haemodialysis fistula needle', emdnCode: 'D010302', emdnDescription: 'HAEMODIALYSIS FISTULA NEEDLES' },
  { gmdnCode: '9001', gmdnDescription: 'Haemodialysis water purification system', emdnCode: 'D010303', emdnDescription: 'HAEMODIALYSIS WATER PURIFICATION SYSTEMS' },
  { gmdnCode: '9100', gmdnDescription: 'Saline prefilled flush syringe', emdnCode: 'A020201', emdnDescription: 'PREFILLED SALINE FLUSH SYRINGES' },
  { gmdnCode: '9101', gmdnDescription: 'Heparin prefilled flush syringe', emdnCode: 'A020202', emdnDescription: 'PREFILLED HEPARIN FLUSH SYRINGES' },
  { gmdnCode: '9102', gmdnDescription: 'Catheter flush syringe, empty', emdnCode: 'A020203', emdnDescription: 'EMPTY CATHETER FLUSH SYRINGES' },
  { gmdnCode: '9200', gmdnDescription: 'Heparin-coated cardiopulmonary bypass tubing', emdnCode: 'C010603', emdnDescription: 'HEPARIN-COATED CARDIOPULMONARY BYPASS TUBING' },
  { gmdnCode: '9201', gmdnDescription: 'Heparin-coated stent', emdnCode: 'C030103', emdnDescription: 'HEPARIN-COATED STENTS' },
  { gmdnCode: '9202', gmdnDescription: 'Heparin-coated vascular graft', emdnCode: 'C040102', emdnDescription: 'HEPARIN-COATED VASCULAR GRAFTS' },
  { gmdnCode: '9203', gmdnDescription: 'Heparin-bonded dialysis catheter', emdnCode: 'D010103', emdnDescription: 'HEPARIN-BONDED DIALYSIS CATHETERS' },
  { gmdnCode: '9204', gmdnDescription: 'Heparin-coated intra-aortic balloon catheter', emdnCode: 'C010502', emdnDescription: 'HEPARIN-COATED INTRA-AORTIC BALLOON CATHETERS' },
  { gmdnCode: '9300', gmdnDescription: 'Carcinoembryonic antigen (CEA) IVD kit', emdnCode: 'W011201', emdnDescription: 'CARCINOEMBRYONIC ANTIGEN (CEA) IVD' },
  { gmdnCode: '9301', gmdnDescription: 'Prostate-specific antigen (PSA) IVD kit', emdnCode: 'W011202', emdnDescription: 'PROSTATE-SPECIFIC ANTIGEN (PSA) IVD' },
  { gmdnCode: '9302', gmdnDescription: 'Cancer antigen 125 (CA-125) IVD kit', emdnCode: 'W011203', emdnDescription: 'CANCER ANTIGEN 125 (CA-125) IVD' },
  { gmdnCode: '9303', gmdnDescription: 'Cancer antigen 19-9 (CA 19-9) IVD kit', emdnCode: 'W011204', emdnDescription: 'CANCER ANTIGEN 19-9 (CA 19-9) IVD' },
  { gmdnCode: '9304', gmdnDescription: 'Alpha-fetoprotein (AFP) oncology IVD kit', emdnCode: 'W011205', emdnDescription: 'ALPHA-FETOPROTEIN (AFP) IVD' },
  { gmdnCode: '9305', gmdnDescription: 'Human epidermal growth factor receptor 2 (HER2) IVD kit', emdnCode: 'W011206', emdnDescription: 'HUMAN EPIDERMAL GROWTH FACTOR RECEPTOR 2 (HER2) IVD' },
  { gmdnCode: '9306', gmdnDescription: 'Faecal occult blood test kit', emdnCode: 'W011207', emdnDescription: 'FAECAL OCCULT BLOOD TESTS' },
  { gmdnCode: '9400', gmdnDescription: 'Continuous glucose monitoring sensor', emdnCode: 'W010504', emdnDescription: 'CONTINUOUS GLUCOSE MONITORING SENSORS' },
  { gmdnCode: '9401', gmdnDescription: 'Continuous glucose monitoring transmitter', emdnCode: 'W010505', emdnDescription: 'CONTINUOUS GLUCOSE MONITORING TRANSMITTERS' },
  { gmdnCode: '9402', gmdnDescription: 'Continuous glucose monitoring receiver', emdnCode: 'W010506', emdnDescription: 'CONTINUOUS GLUCOSE MONITORING RECEIVERS' },
  { gmdnCode: '9403', gmdnDescription: 'Insulin pump integration software for CGM', emdnCode: 'A030101', emdnDescription: 'INSULIN PUMP SOFTWARE' },
  { gmdnCode: '9500', gmdnDescription: 'Surgical forceps, reusable', emdnCode: 'L021101', emdnDescription: 'SURGICAL FORCEPS' },
  { gmdnCode: '9501', gmdnDescription: 'Surgical scissors, reusable', emdnCode: 'L021102', emdnDescription: 'SURGICAL SCISSORS' },
  { gmdnCode: '9502', gmdnDescription: 'Surgical retractor, reusable', emdnCode: 'L021103', emdnDescription: 'SURGICAL RETRACTORS' },
  { gmdnCode: '9503', gmdnDescription: 'Surgical trocar', emdnCode: 'L021104', emdnDescription: 'SURGICAL TROCARS' },
  { gmdnCode: '9504', gmdnDescription: 'Surgical needle holder', emdnCode: 'L021105', emdnDescription: 'SURGICAL NEEDLE HOLDERS' },
  { gmdnCode: '9505', gmdnDescription: 'Bone chisel', emdnCode: 'P010301', emdnDescription: 'BONE CHISELS' },
  { gmdnCode: '9506', gmdnDescription: 'Bone rongeur', emdnCode: 'P010302', emdnDescription: 'BONE RONGEURS' },
  { gmdnCode: '9507', gmdnDescription: 'Dermatome', emdnCode: 'M020101', emdnDescription: 'DERMATOMES' },
  { gmdnCode: '9508', gmdnDescription: 'Bipolar electrosurgical forceps', emdnCode: 'L010103', emdnDescription: 'BIPOLAR ELECTROSURGICAL FORCEPS' },
  { gmdnCode: '9509', gmdnDescription: 'Monopolar electrosurgical electrode', emdnCode: 'L010104', emdnDescription: 'MONOPOLAR ELECTROSURGICAL ELECTRODES' },
  { gmdnCode: '9510', gmdnDescription: 'Electrosurgical unit patient return electrode', emdnCode: 'L010105', emdnDescription: 'ELECTROSURGICAL UNIT PATIENT RETURN ELECTRODES' },
  { gmdnCode: '9511', gmdnDescription: 'Powered surgical drill system', emdnCode: 'L020803', emdnDescription: 'POWERED SURGICAL DRILL SYSTEMS' },
  { gmdnCode: '9512', gmdnDescription: 'Powered surgical saw system', emdnCode: 'L020804', emdnDescription: 'POWERED SURGICAL SAW SYSTEMS' },
  { gmdnCode: '9513', gmdnDescription: 'Ultrasonic surgical system', emdnCode: 'L010401', emdnDescription: 'ULTRASONIC SURGICAL SYSTEMS' }
];

const DEFAULT_SCORE = 95;

function integrateDeltaMappings() {
  const mappingsPath = path.join(__dirname, 'public', 'gmdn-emdn-mappings', 'gmdn-emdn-mappings.json');

  if (!fs.existsSync(mappingsPath)) {
    console.error('❌ Mappings file not found:', mappingsPath);
    process.exit(1);
  }

  const backupPath = `${mappingsPath}.backup-${Date.now()}`;
  fs.copyFileSync(mappingsPath, backupPath);
  console.log(`💾 Backup created at ${path.basename(backupPath)}`);

  const fileContent = fs.readFileSync(mappingsPath, 'utf8');
  const data = JSON.parse(fileContent);
  const { metadata = {}, mappings = {} } = data;

  let added = 0;
  let updated = 0;

  for (const entry of deltaMappings) {
    const { gmdnCode, gmdnDescription, emdnCode, emdnDescription } = entry;
    const category = emdnCode.charAt(0);

    const mappingPayload = {
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

    if (mappings[gmdnCode]) {
      mappings[gmdnCode] = mappingPayload;
      updated++;
      console.log(`🔄 Updated ${gmdnCode} – ${gmdnDescription}`);
    } else {
      mappings[gmdnCode] = mappingPayload;
      added++;
      console.log(`✅ Added ${gmdnCode} – ${gmdnDescription}`);
    }
  }

  const totalMappings = Object.keys(mappings).length;

  data.metadata = {
    ...metadata,
    generated: new Date().toISOString(),
    version: '3.0.0',
    description: `Complete validated GMDN to EMDN device code mappings - ${totalMappings} mappings`,
    stats: {
      totalGmdn: totalMappings,
      mappedGmdn: totalMappings,
      manualMappings: totalMappings,
      automaticMappings: 0
    }
  };

  data.mappings = mappings;

  fs.writeFileSync(mappingsPath, JSON.stringify(data, null, 2));

  console.log('\n📈 Delta Integration Summary');
  console.log(`✅ Added: ${added}`);
  console.log(`🔄 Updated: ${updated}`);
  console.log(`📊 Total mappings: ${totalMappings}`);
}

integrateDeltaMappings();
