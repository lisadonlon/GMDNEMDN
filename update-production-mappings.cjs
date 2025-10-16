#!/usr/bin/env node
const fs = require('fs');

// Load EMDN lookup
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

const newMappings = {
  '42811': { desc: 'Compression/pressure sock/stocking, reusable', emdn: 'M030405' },
  '46207': { desc: 'Peristomal/periwound dressing', emdn: 'A108001' },
  '62525': { desc: 'Intestinal ostomy bag/support kit', emdn: 'A10020202' },
  '47247': { desc: 'Cardiac transseptal access set', emdn: 'C019015' },
  '58865': { desc: 'Vascular catheter introduction set, nonimplantable', emdn: 'C0504' },
  '47143': { desc: 'Electrical-only medical device connection cable, single-use', emdn: 'Z12030285' },
  '46355': { desc: 'Cardiac mapping catheter, percutaneous, single-use', emdn: 'C02010403' },
  '45603': { desc: 'Single-administration urethral drainage catheter', emdn: 'U01010502' },
  '44732': { desc: 'Orthodontic aligner auxiliary attachment kit', emdn: 'Q010499' },
  '57815': { desc: 'CPAP/BPAP nasal mask, reusable', emdn: 'R0301010201' },
  '57814': { desc: 'CPAP/BPAP face mask, reusable', emdn: 'R0301010201' },
  '60712': { desc: 'Home BPAP unit', emdn: 'Z12030102' },
  '60711': { desc: 'Home CPAP unit', emdn: 'Z12030102' },
  '12050': { desc: 'Heated respiratory humidifier', emdn: 'R060201' },
  '35113': { desc: 'Non-heated respiratory humidifier', emdn: 'R060201' },
  '37705': { desc: 'Ventilator breathing circuit, reusable', emdn: 'R02010101' },
  '35171': { desc: 'Rebreathing oxygen face mask', emdn: 'R03010206' },
  '40582': { desc: 'Ventilator application software', emdn: 'Z1203010592' },
  '63711': { desc: 'Infrared patient thermometer, ear/skin', emdn: 'V0301010202' },
  '45617': { desc: 'Automatic-inflation electronic sphygmomanometer, portable, arm/wrist', emdn: 'Z1203020501' },
  '35379': { desc: 'Universal operating table, electrohydraulic', emdn: 'Z12011202' },
  '47764': { desc: 'Wound hydrogel dressing, non-antimicrobial', emdn: 'M04040501' },
  '33199': { desc: 'Flexible endoscopic tissue manipulation forceps, single-use', emdn: 'G0308010101' },
  '46454': { desc: 'Gastrointestinal/airway foreign body retrieval basket, single-use', emdn: 'G0305010202' },
  '46715': { desc: 'ERCP catheter, balloon, non-electrical, stone-retrieval', emdn: 'G0301010402' },
  '61208': { desc: 'Gastrointestinal endoscopic clip, long-term, non-bioabsorbable', emdn: 'G030202' },
  '58039': { desc: 'Endoscopic electrosurgical handpiece/electrode, monopolar, single-use', emdn: 'K0201010502' },
  '62615': { desc: 'Mechanical-cutting endoscopic polypectomy snare', emdn: 'G03030102' },
  '34873': { desc: 'Manual hospital bed', emdn: 'V080602' },
  '34870': { desc: 'Basic electric hospital bed', emdn: 'V08060101' },
  '16173': { desc: 'Automatic-inflation electronic sphygmomanometer, non-portable', emdn: 'Z1203020501' },
  '32109': { desc: 'Haemodialysis system transducer protector', emdn: 'F9080' },
  '34999': { desc: 'Haemodialysis blood tubing set, single-use', emdn: 'F020102' },
  '45607': { desc: 'Pulse oximeter', emdn: 'Z1203020408' },
  '17887': { desc: 'Infrared patient thermometer, ear', emdn: 'V0301010202' },
  '17888': { desc: 'Infrared patient thermometer, skin', emdn: 'V0301010202' },
  '56286': { desc: 'Nitrile examination/treatment glove, non-powdered, non-antimicrobial', emdn: 'T01020204' },
  '36551': { desc: 'Patient monitoring system module, blood pressure, noninvasive', emdn: 'Z1203020302' },
  '36022': { desc: 'Bioelectrical body composition analyser', emdn: 'Z12099001' },
  '14035': { desc: 'Intermittent electronic patient thermometer', emdn: 'V0301010201' },
  '56647': { desc: 'Nasal aspirator, electric', emdn: 'R05010301' },
  '56552': { desc: 'HLA class II antibody identification panel IVD, kit, enzyme immunoassay (EIA)', emdn: 'W01030403' },
  '55847': { desc: 'Dental implant system', emdn: 'P01020101' },
  '61641': { desc: 'Dental implant abutment analog, intraoral-scanning, single-use', emdn: 'P01020180' },
  '45147': { desc: 'Dental/maxillofacial surgical procedure kit, non-medicated, reusable', emdn: 'L159016' },
  '45714': { desc: 'Fixture/appliance dental drill bit, reusable', emdn: 'L159007' },
  '14147': { desc: 'Bone trephine, reusable', emdn: 'L090902' },
  '64371': { desc: 'Dental implantation drilling template guide-sleeve', emdn: 'P01020180' },
  '46552': { desc: 'Dental implantation drilling template retention pin', emdn: 'P01020180' },
  '33968': { desc: 'Surgical screwdriver, reusable', emdn: 'L26' },
  '45320': { desc: 'Dental drill bit extension', emdn: 'L159007' },
  '64304': { desc: 'Manual non-rotary dental instrument handle', emdn: 'L159016' },
  '44880': { desc: 'Dental implant suprastructure, temporary, preformed, single-use', emdn: 'P01020180' },
  '61642': { desc: 'Dental implant analog', emdn: 'P01020180' },
  '57789': { desc: 'Surgical drill guide, single-use', emdn: 'P091399' },
  '58776': { desc: 'Surgical screwdriver, single-use', emdn: 'P091399' },
  '35095': { desc: 'Surgical drill guide, reusable', emdn: 'L0922' }
};

// Load current mappings
const currentMappings = JSON.parse(fs.readFileSync('public/gmdn-emdn-mappings/gmdn-emdn-mappings.json', 'utf-8'));

// Add new mappings
let added = 0;
Object.keys(newMappings).forEach(gmdnCode => {
  const mapping = newMappings[gmdnCode];
  const emdnCode = emdnLookup[mapping.emdn];
  
  if (!emdnCode) {
    console.log(`⚠️  Warning: EMDN ${mapping.emdn} not found for GMDN ${gmdnCode}`);
    return;
  }
  
  currentMappings.mappings[gmdnCode] = {
    gmdnCode: gmdnCode,
    gmdnDescription: mapping.desc,
    emdnMatches: [{
      emdnCode: mapping.emdn,
      emdnDescription: emdnCode.term,
      score: 100,
      category: emdnCode.category
    }],
    matchCount: 1,
    timestamp: new Date().toISOString(),
    source: 'manual-batch-verification'
  };
  added++;
});

// Save updated mappings
fs.writeFileSync('public/gmdn-emdn-mappings/gmdn-emdn-mappings.json', JSON.stringify(currentMappings, null, 2));

console.log(`✅ Added ${added} new mappings to production file`);
console.log(`📊 Total GMDN codes mapped: ${Object.keys(currentMappings.mappings).length}`);
