#!/usr/bin/env node
const fs = require('fs');

// Load all EMDN category files
const categories = ['A', 'C', 'D', 'E', 'F', 'G', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'Y', 'Z'];
const emdnLookup = {};

categories.forEach(cat => {
  try {
    const data = JSON.parse(fs.readFileSync(`emdn-chunks/emdn-${cat}.json`, 'utf-8'));
    data.entries.forEach(code => {
      emdnLookup[code.code] = code;
    });
  } catch (e) {
    // Skip if file doesn't exist
  }
});

const proposedMappings = [
  { gmdn: '42811', gmdnDesc: 'Compression/pressure sock/stocking, reusable', emdn: 'M030405', emdnDesc: 'COMPRESSION STOCKINGS' },
  { gmdn: '46207', gmdnDesc: 'Peristomal/periwound dressing', emdn: 'A108001', emdnDesc: 'RINGS / BEZELS / PLATES FOR PERISTOMAL SKIN' },
  { gmdn: '62525', gmdnDesc: 'Intestinal ostomy bag/support kit', emdn: 'A10020202', emdnDesc: 'COLOSTOMY BAGS FOR TWO-PART SYSTEMS, WITH TISSUE COVER' },
  { gmdn: '47247', gmdnDesc: 'Cardiac transseptal access set', emdn: 'C019015', emdnDesc: 'CARDIAC TRANSSEPTAL PUNCTURE KITS' },
  { gmdn: '58865', gmdnDesc: 'Vascular catheter introduction set, nonimplantable', emdn: 'C0504', emdnDesc: 'ARTERIAL INTRODUCTION SETS' },
  { gmdn: '47143', gmdnDesc: 'Electrical-only medical device connection cable, single-use', emdn: 'Z12030285', emdnDesc: 'VITAL SIGNS MONITORING INSTRUMENTS - CONSUMABLES' },
  { gmdn: '46355', gmdnDesc: 'Cardiac mapping catheter, percutaneous, single-use', emdn: 'C02010403', emdnDesc: 'ARRHYTHMOLOGY MULTIPOLAR DIAGNOSTIC CATHETERS, ADJUSTABLE' },
  { gmdn: '45603', gmdnDesc: 'Single-administration urethral drainage catheter', emdn: 'U01010502', emdnDesc: 'NELATON CATHETERS, NON SELF-LUBRICATING' },
  { gmdn: '47732', gmdnDesc: 'Coronary angioplasty balloon catheter, basic', emdn: 'P070402010102', emdnDesc: 'METALLIC NON-STAINLESS STEEL CORONARY STENTS' },
  { gmdn: '44732', gmdnDesc: 'Orthodontic aligner auxiliary attachment kit', emdn: 'Q010499', emdnDesc: 'ORTHODONTIC DEVICES - OTHER' },
  { gmdn: '57815', gmdnDesc: 'CPAP/BPAP nasal mask, reusable', emdn: 'R0301010201', emdnDesc: 'CPAP MASKS' },
  { gmdn: '57814', gmdnDesc: 'CPAP/BPAP face mask, reusable', emdn: 'R0301010201', emdnDesc: 'CPAP MASKS' },
  { gmdn: '60712', gmdnDesc: 'Home BPAP unit', emdn: 'Z12030102', emdnDesc: 'CONTINUOUS POSITIVE PRESSURE EQUIPMENT' },
  { gmdn: '60711', gmdnDesc: 'Home CPAP unit', emdn: 'Z12030102', emdnDesc: 'CONTINUOUS POSITIVE PRESSURE EQUIPMENT' },
  { gmdn: '12050', gmdnDesc: 'Heated respiratory humidifier', emdn: 'R060201', emdnDesc: 'ACTIVE VENTILATION HUMIDIFICATION SYSTEMS' },
  { gmdn: '35113', gmdnDesc: 'Non-heated respiratory humidifier', emdn: 'R060201', emdnDesc: 'ACTIVE VENTILATION HUMIDIFICATION SYSTEMS' },
  { gmdn: '37705', gmdnDesc: 'Ventilator breathing circuit, reusable', emdn: 'R02010101', emdnDesc: 'BREATHING CIRCUITS, W/O WATER TRAP' },
  { gmdn: '35171', gmdnDesc: 'Rebreathing oxygen face mask', emdn: 'R03010206', emdnDesc: 'MASKS WITH RESERVOIR' },
  { gmdn: '40582', gmdnDesc: 'Ventilator application software', emdn: 'Z1203010592', emdnDesc: 'PULMONARY VENTILATORS FOR HOSPITAL USE - MEDICAL DEVICE SOFTWARE' },
  { gmdn: '63711', gmdnDesc: 'Infrared patient thermometer, ear/skin', emdn: 'V0301010202', emdnDesc: 'NON-CONTACT DIGITAL THERMOMETERS' },
  { gmdn: '45617', gmdnDesc: 'Automatic-inflation electronic sphygmomanometer, portable, arm/wrist', emdn: 'Z1203020501', emdnDesc: 'NON–INVASIVE OSCILLOMETRIC BLOOD PRESSURE GAUGES' },
  { gmdn: '35379', gmdnDesc: 'Universal operating table, electrohydraulic', emdn: 'Z12011202', emdnDesc: 'OPERATING TABLES' },
  { gmdn: '47764', gmdnDesc: 'Wound hydrogel dressing, non-antimicrobial', emdn: 'M04040501', emdnDesc: 'HYDROGEL DRESSINGS, NON-COMBINED' },
  { gmdn: '33199', gmdnDesc: 'Flexible endoscopic tissue manipulation forceps, single-use', emdn: 'G0308010101', emdnDesc: 'GASTROINTESTINAL ENDOSCOPY, COLD BIOPSY FORCEPS, SINGLE-USE' },
  { gmdn: '46454', gmdnDesc: 'Gastrointestinal/airway foreign body retrieval basket, single-use', emdn: 'G0305010202', emdnDesc: 'DIGESTIVE ENDOSCOPY, RETRIEVAL BASKET DEVICES, NON-REVOLVING' },
  { gmdn: '46715', gmdnDesc: 'ERCP catheter, balloon, non-electrical, stone-retrieval', emdn: 'G0301010402', emdnDesc: 'BILIARY BALLOON CATHETERS, HIGH PRESSURE' },
  { gmdn: '61208', gmdnDesc: 'Gastrointestinal endoscopic clip, long-term, non-bioabsorbable', emdn: 'G030202', emdnDesc: 'DIGESTIVE ENDOSCOPY, HAEMOSTASIS CLIPS' },
  { gmdn: '58039', gmdnDesc: 'Endoscopic electrosurgical handpiece/electrode, monopolar, single-use', emdn: 'K0201010502', emdnDesc: 'LAPAROSCOPIC AND THORACOSCOPIC ELECTROSURGERY HANDPIECES, SINGLE-USE' },
  { gmdn: '62615', gmdnDesc: 'Mechanical-cutting endoscopic polypectomy snare', emdn: 'G03030102', emdnDesc: 'POLYPECTOMY SNARES, NON-REVOLVING' },
  { gmdn: '34873', gmdnDesc: 'Manual hospital bed', emdn: 'V080602', emdnDesc: 'MANUAL MEDICAL BEDS' },
  { gmdn: '34870', gmdnDesc: 'Basic electric hospital bed', emdn: 'V08060101', emdnDesc: 'HOSPITAL/HOME CARE ELECTRIC MEDICAL BEDS' },
  { gmdn: '16173', gmdnDesc: 'Automatic-inflation electronic sphygmomanometer, non-portable', emdn: 'Z1203020501', emdnDesc: 'NON–INVASIVE OSCILLOMETRIC BLOOD PRESSURE GAUGES' },
  { gmdn: '32109', gmdnDesc: 'Haemodialysis system transducer protector', emdn: 'F9080', emdnDesc: 'DIALYSIS DEVICES - OTHER ACCESSORIES' },
  { gmdn: '12741', gmdnDesc: 'Haemodialysis needle', emdn: 'F900201', emdnDesc: 'TEMPORARY HEMODIALYSIS CATHETERS AND KITS' },
  { gmdn: '34999', gmdnDesc: 'Haemodialysis blood tubing set, single-use', emdn: 'F020102', emdnDesc: 'ARTERIOVENOUS DIALYSIS LINES, TWO NEEDLES' },
  { gmdn: '45607', gmdnDesc: 'Pulse oximeter', emdn: 'Z1203020408', emdnDesc: 'PULSE OXIMETERS' },
  { gmdn: '17887', gmdnDesc: 'Infrared patient thermometer, ear', emdn: 'V0301010202', emdnDesc: 'NON-CONTACT DIGITAL THERMOMETERS' },
  { gmdn: '17888', gmdnDesc: 'Infrared patient thermometer, skin', emdn: 'V0301010202', emdnDesc: 'NON-CONTACT DIGITAL THERMOMETERS' },
  { gmdn: '56286', gmdnDesc: 'Nitrile examination/treatment glove, non-powdered, non-antimicrobial', emdn: 'T01020204', emdnDesc: 'NITRILE EXAMINATION / TREATMENT GLOVES' },
  { gmdn: '36551', gmdnDesc: 'Patient monitoring system module, blood pressure, noninvasive', emdn: 'Z1203020302', emdnDesc: 'NON–INVASIVE BLOOD PRESSURE MONITORING INSTRUMENTS' },
  { gmdn: '36022', gmdnDesc: 'Bioelectrical body composition analyser', emdn: 'Z12099001', emdnDesc: 'BODY IMPEDANCE ANALYSERS' },
  { gmdn: '14035', gmdnDesc: 'Intermittent electronic patient thermometer', emdn: 'V0301010201', emdnDesc: 'CONTACT DIGITAL THERMOMETERS' },
  { gmdn: '56647', gmdnDesc: 'Nasal aspirator, electric', emdn: 'R05010301', emdnDesc: 'SINGLE-CHAMBER MUCOUS MEMBRANE ASPIRATORS' },
  { gmdn: '56552', gmdnDesc: 'HLA class II antibody identification panel IVD, kit, enzyme immunoassay (EIA)', emdn: 'W01030403', emdnDesc: 'HLA ANTIGEN TYPING' },
  { gmdn: '55847', gmdnDesc: 'Dental implant system', emdn: 'P01020101', emdnDesc: 'DENTAL IMPLANTS' },
  { gmdn: '61641', gmdnDesc: 'Dental implant abutment analog, intraoral-scanning, single-use', emdn: 'P01020180', emdnDesc: 'DENTAL IMPLANTS - ACCESSORIES' },
  { gmdn: '45147', gmdnDesc: 'Dental/maxillofacial surgical procedure kit, non-medicated, reusable', emdn: 'L159016', emdnDesc: 'DENTAL SURGERY INSTRUMENT KITS, REUSABLE' },
  { gmdn: '45714', gmdnDesc: 'Fixture/appliance dental drill bit, reusable', emdn: 'L159007', emdnDesc: 'ODONTOSTOMATOLOGY BURS, REUSABLE' },
  { gmdn: '14147', gmdnDesc: 'Bone trephine, reusable', emdn: 'L090902', emdnDesc: 'ORTHOPAEDIC SURGERY TREPHINES, REUSABLE' },
  { gmdn: '64371', gmdnDesc: 'Dental implantation drilling template guide-sleeve', emdn: 'P01020180', emdnDesc: 'DENTAL IMPLANTS - ACCESSORIES' },
  { gmdn: '46552', gmdnDesc: 'Dental implantation drilling template retention pin', emdn: 'P01020180', emdnDesc: 'DENTAL IMPLANTS - ACCESSORIES' },
  { gmdn: '33968', gmdnDesc: 'Surgical screwdriver, reusable', emdn: 'L26', emdnDesc: 'SURGICAL SCREWDRIVERS, REUSABLE' },
  { gmdn: '45320', gmdnDesc: 'Dental drill bit extension', emdn: 'L159007', emdnDesc: 'ODONTOSTOMATOLOGY BURS, REUSABLE' },
  { gmdn: '64304', gmdnDesc: 'Manual non-rotary dental instrument handle', emdn: 'L159016', emdnDesc: 'DENTAL SURGERY INSTRUMENT KITS, REUSABLE' },
  { gmdn: '44880', gmdnDesc: 'Dental implant suprastructure, temporary, preformed, single-use', emdn: 'P01020180', emdnDesc: 'DENTAL IMPLANTS - ACCESSORIES' },
  { gmdn: '61642', gmdnDesc: 'Dental implant analog', emdn: 'P01020180', emdnDesc: 'DENTAL IMPLANTS - ACCESSORIES' },
  { gmdn: '57789', gmdnDesc: 'Surgical drill guide, single-use', emdn: 'P091399', emdnDesc: 'ORTHOPAEDIC IMPLANT INSTRUMENTS, SINGLE-USE - OTHER' },
  { gmdn: '58776', gmdnDesc: 'Surgical screwdriver, single-use', emdn: 'P091399', emdnDesc: 'ORTHOPAEDIC IMPLANT INSTRUMENTS, SINGLE-USE - OTHER' },
  { gmdn: '35095', gmdnDesc: 'Surgical drill guide, reusable', emdn: 'L0922', emdnDesc: 'ORTHOPAEDIC SURGERY GUIDES, REUSABLE' }
];

console.log('VERIFYING PROPOSED MAPPINGS');
console.log('═'.repeat(120));
console.log('');

let valid = 0;
let invalid = 0;
let warnings = 0;

const issues = [];

proposedMappings.forEach((mapping, i) => {
  const actualEmdn = emdnLookup[mapping.emdn];
  
  if (!actualEmdn) {
    console.log(`❌ INVALID #${i + 1}: GMDN ${mapping.gmdn} → EMDN ${mapping.emdn}`);
    console.log(`   GMDN: ${mapping.gmdnDesc}`);
    console.log(`   ERROR: EMDN code ${mapping.emdn} does not exist in database!`);
    console.log('');
    invalid++;
    issues.push({ ...mapping, issue: 'EMDN_CODE_NOT_FOUND' });
    return;
  }
  
  if (actualEmdn.term !== mapping.emdnDesc) {
    console.log(`⚠️  WARNING #${i + 1}: GMDN ${mapping.gmdn} → EMDN ${mapping.emdn}`);
    console.log(`   GMDN: ${mapping.gmdnDesc}`);
    console.log(`   Expected EMDN: ${mapping.emdnDesc}`);
    console.log(`   Actual EMDN: ${actualEmdn.term}`);
    console.log('');
    warnings++;
    issues.push({ ...mapping, issue: 'DESCRIPTION_MISMATCH', actualDesc: actualEmdn.term });
  }
  
  // Check for obviously wrong mappings
  const gmdnLower = mapping.gmdnDesc.toLowerCase();
  const emdnLower = actualEmdn.term.toLowerCase();
  
  // Specific validation checks
  if (gmdnLower.includes('balloon catheter') && emdnLower.includes('stent')) {
    console.log(`❌ SEMANTIC ERROR #${i + 1}: GMDN ${mapping.gmdn} → EMDN ${mapping.emdn}`);
    console.log(`   GMDN: ${mapping.gmdnDesc}`);
    console.log(`   EMDN: ${actualEmdn.term}`);
    console.log(`   ISSUE: Balloon catheter mapped to STENTS - completely wrong device type!`);
    console.log('');
    invalid++;
    issues.push({ ...mapping, issue: 'SEMANTIC_MISMATCH', actualDesc: actualEmdn.term });
    return;
  }
  
  if (gmdnLower.includes('dressing') && !emdnLower.includes('dressing') && !emdnLower.includes('ring') && !emdnLower.includes('bezel')) {
    console.log(`⚠️  SEMANTIC WARNING #${i + 1}: GMDN ${mapping.gmdn} → EMDN ${mapping.emdn}`);
    console.log(`   GMDN: ${mapping.gmdnDesc}`);
    console.log(`   EMDN: ${actualEmdn.term}`);
    console.log(`   ISSUE: Dressing mapped to non-dressing category - verify this is intentional`);
    console.log('');
    warnings++;
    issues.push({ ...mapping, issue: 'SEMANTIC_WARNING', actualDesc: actualEmdn.term });
    return;
  }
  
  if (gmdnLower.includes('needle') && emdnLower.includes('catheter')) {
    console.log(`⚠️  SEMANTIC WARNING #${i + 1}: GMDN ${mapping.gmdn} → EMDN ${mapping.emdn}`);
    console.log(`   GMDN: ${mapping.gmdnDesc}`);
    console.log(`   EMDN: ${actualEmdn.term}`);
    console.log(`   ISSUE: Needle mapped to CATHETERS - verify this is correct`);
    console.log('');
    warnings++;
    issues.push({ ...mapping, issue: 'SEMANTIC_WARNING', actualDesc: actualEmdn.term });
    return;
  }
  
  valid++;
});

console.log('═'.repeat(120));
console.log(`SUMMARY: ${valid} valid, ${warnings} warnings, ${invalid} invalid`);
console.log('═'.repeat(120));

if (issues.length > 0) {
  console.log('\n\nISSUES REQUIRING REVIEW:\n');
  issues.forEach(issue => {
    console.log(`GMDN ${issue.gmdn}: ${issue.gmdnDesc}`);
    console.log(`→ EMDN ${issue.emdn}: ${issue.actualDesc || issue.emdnDesc}`);
    console.log(`Issue: ${issue.issue}\n`);
  });
}
