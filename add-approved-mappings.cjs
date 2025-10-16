#!/usr/bin/env node
const fs = require('fs');

const approvedMappings = [
  '42811|Compression/pressure sock/stocking, reusable|M030405|COMPRESSION STOCKINGS',
  '46207|Peristomal/periwound dressing|A108001|RINGS / BEZELS / PLATES FOR PERISTOMAL SKIN',
  '62525|Intestinal ostomy bag/support kit|A10020202|COLOSTOMY BAGS FOR TWO-PART SYSTEMS, WITH TISSUE COVER',
  '47247|Cardiac transseptal access set|C019015|CARDIAC TRANSSEPTAL PUNCTURE KITS',
  '58865|Vascular catheter introduction set, nonimplantable|C0504|ARTERIAL INTRODUCTION SETS',
  '47143|Electrical-only medical device connection cable, single-use|Z12030285|VITAL SIGNS MONITORING INSTRUMENTS - CONSUMABLES',
  '46355|Cardiac mapping catheter, percutaneous, single-use|C02010403|ARRHYTHMOLOGY MULTIPOLAR DIAGNOSTIC CATHETERS, ADJUSTABLE',
  '45603|Single-administration urethral drainage catheter|U01010502|NELATON CATHETERS, NON SELF-LUBRICATING',
  // REJECTED: '47732|Coronary angioplasty balloon catheter, basic|P070402010102|METALLIC NON-STAINLESS STEEL CORONARY STENTS',
  '44732|Orthodontic aligner auxiliary attachment kit|Q010499|ORTHODONTIC DEVICES - OTHER',
  '57815|CPAP/BPAP nasal mask, reusable|R0301010201|CPAP MASKS',
  '57814|CPAP/BPAP face mask, reusable|R0301010201|CPAP MASKS',
  '60712|Home BPAP unit|Z12030102|CONTINUOUS POSITIVE PRESSURE EQUIPMENT',
  '60711|Home CPAP unit|Z12030102|CONTINUOUS POSITIVE PRESSURE EQUIPMENT',
  '12050|Heated respiratory humidifier|R060201|ACTIVE VENTILATION HUMIDIFICATION SYSTEMS,',
  '35113|Non-heated respiratory humidifier|R060201|ACTIVE VENTILATION HUMIDIFICATION SYSTEMS,',
  '37705|Ventilator breathing circuit, reusable|R02010101|BREATHING CIRCUITS, W/O WATER TRAP',
  '35171|Rebreathing oxygen face mask|R03010206|MASKS WITH RESERVOIR',
  '40582|Ventilator application software|Z1203010592|PULMONARY VENTILATORS FOR HOSPITAL USE - MEDICAL DEVICE SOFTWARE',
  '63711|Infrared patient thermometer, ear/skin|V0301010202|NON-CONTACT DIGITAL THERMOMETERS',
  '45617|Automatic-inflation electronic sphygmomanometer, portable, arm/wrist|Z1203020501|NON–INVASIVE OSCILLOMETRIC BLOOD PRESSURE GAUGES',
  '35379|Universal operating table, electrohydraulic|Z12011202|OPERATING TABLES',
  '47764|Wound hydrogel dressing, non-antimicrobial|M04040501|HYDROGEL DRESSINGS, NON-COMBINED',
  '33199|Flexible endoscopic tissue manipulation forceps, single-use|G0308010101|GASTROINTESTINAL ENDOSCOPY, COLD BIOPSY FORCEPS, SINGLE-USE',
  '46454|Gastrointestinal/airway foreign body retrieval basket, single-use|G0305010202|DIGESTIVE ENDOSCOPY, RETRIEVAL BASKET DEVICES, NON-REVOLVING',
  '46715|ERCP catheter, balloon, non-electrical, stone-retrieval|G0301010402|BILIARY BALLOON CATHETERS, HIGH PRESSURE',
  '61208|Gastrointestinal endoscopic clip, long-term, non-bioabsorbable|G030202|DIGESTIVE ENDOSCOPY, HAEMOSTASIS CLIPS',
  '58039|Endoscopic electrosurgical handpiece/electrode, monopolar, single-use|K0201010502|LAPAROSCOPIC AND THORACOSCOPIC ELECTROSURGERY HANDPIECES, SINGLE-USE',
  '62615|Mechanical-cutting endoscopic polypectomy snare|G03030102|POLYPECTOMY SNARES, NON-REVOLVING',
  '34873|Manual hospital bed|V080602|MANUAL MEDICAL BEDS',
  '34870|Basic electric hospital bed|V08060101|HOSPITAL/HOME CARE ELECTRIC MEDICAL BEDS',
  '16173|Automatic-inflation electronic sphygmomanometer, non-portable|Z1203020501|NON–INVASIVE OSCILLOMETRIC BLOOD PRESSURE GAUGES',
  '32109|Haemodialysis system transducer protector|F9080|DIALYSIS DEVICES - OTHER ACCESSORIES',
  // REJECTED: '12741|Haemodialysis needle|F900201|TEMPORARY HEMODIALYSIS CATHETERS AND KITS',
  '34999|Haemodialysis blood tubing set, single-use|F020102|ARTERIOVENOUS DIALYSIS LINES, TWO NEEDLES',
  '45607|Pulse oximeter|Z1203020408|PULSE OXIMETERS',
  '17887|Infrared patient thermometer, ear|V0301010202|NON-CONTACT DIGITAL THERMOMETERS',
  '17888|Infrared patient thermometer, skin|V0301010202|NON-CONTACT DIGITAL THERMOMETERS',
  '56286|Nitrile examination/treatment glove, non-powdered, non-antimicrobial|T01020204|NITRILE EXAMINATION / TREATMENT GLOVES',
  '36551|Patient monitoring system module, blood pressure, noninvasive|Z1203020302|NON–INVASIVE BLOOD PRESSURE MONITORING INSTRUMENTS',
  '36022|Bioelectrical body composition analyser|Z12099001|BODY IMPEDANCE ANALYSERS',
  '14035|Intermittent electronic patient thermometer|V0301010201|CONTACT DIGITAL THERMOMETERS',
  '56647|Nasal aspirator, electric|R05010301|SINGLE-CHAMBER MUCOUS MEMBRANE ASPIRATORS',
  '56552|HLA class II antibody identification panel IVD, kit, enzyme immunoassay (EIA)|W01030403|HLA ANTIGEN TYPING',
  '55847|Dental implant system|P01020101|DENTAL IMPLANTS',
  '61641|Dental implant abutment analog, intraoral-scanning, single-use|P01020180|DENTAL IMPLANTS - ACCESSORIES',
  '45147|Dental/maxillofacial surgical procedure kit, non-medicated, reusable|L159016|DENTAL SURGERY INSTRUMENT KITS, REUSABLE',
  '45714|Fixture/appliance dental drill bit, reusable|L159007|ODONTOSTOMATOLOGY BURS, REUSABLE',
  '14147|Bone trephine, reusable|L090902|ORTHOPAEDIC SURGERY TREPHINES, REUSABLE',
  '64371|Dental implantation drilling template guide-sleeve|P01020180|DENTAL IMPLANTS - ACCESSORIES',
  '46552|Dental implantation drilling template retention pin|P01020180|DENTAL IMPLANTS - ACCESSORIES',
  '33968|Surgical screwdriver, reusable|L26|SURGICAL SCREWDRIVERS, REUSABLE',
  '45320|Dental drill bit extension|L159007|ODONTOSTOMATOLOGY BURS, REUSABLE',
  '64304|Manual non-rotary dental instrument handle|L159016|DENTAL SURGERY INSTRUMENT KITS, REUSABLE',
  '44880|Dental implant suprastructure, temporary, preformed, single-use|P01020180|DENTAL IMPLANTS - ACCESSORIES',
  '61642|Dental implant analog|P01020180|DENTAL IMPLANTS - ACCESSORIES',
  '57789|Surgical drill guide, single-use|P091399|ORTHOPAEDIC IMPLANT INSTRUMENTS, SINGLE-USE - OTHER',
  '58776|Surgical screwdriver, single-use|P091399|ORTHOPAEDIC IMPLANT INSTRUMENTS, SINGLE-USE - OTHER',
  '35095|Surgical drill guide, reusable|L0922|ORTHOPAEDIC SURGERY GUIDES, REUSABLE'
];

// Read current file
const currentFile = fs.readFileSync('data/corrected-gmdn-emdn-mappings.psv', 'utf-8');
const lines = currentFile.split('\n');

// Add new mappings before the last line
const header = lines[0];
const existingMappings = lines.slice(1).filter(l => l.trim());
const allMappings = [...existingMappings, ...approvedMappings];

// Sort by GMDN code
allMappings.sort((a, b) => {
  const codeA = parseInt(a.split('|')[0]);
  const codeB = parseInt(b.split('|')[0]);
  return codeA - codeB;
});

// Write back
const newContent = [header, ...allMappings].join('\n') + '\n';
fs.writeFileSync('data/corrected-gmdn-emdn-mappings.psv', newContent);

console.log(`✅ Added ${approvedMappings.length} approved mappings`);
console.log(`❌ Rejected 2 mappings:`);
console.log(`   - GMDN 47732: Coronary angioplasty balloon catheter (wrong EMDN - stents)`);
console.log(`   - GMDN 12741: Haemodialysis needle (mapped to catheters)`);
console.log(`\n📊 Total mappings in file: ${allMappings.length + 1} (including header)`);
