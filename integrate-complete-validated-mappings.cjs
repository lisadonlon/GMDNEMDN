const fs = require('fs');
const path = require('path');

// Complete validated GMDN-EMDN mappings from CSV data
const completeValidatedMappings = [
  {
    "gmdnCode": "47247",
    "gmdnDescription": "Cardiac transseptal access set",
    "emdnMatches": [
      {
        "code": "C019015",
        "term": "CARDIAC TRANSSEPTAL PUNCTURE KITS",
        "similarity": 75.4,
        "category": "C"
      }
    ]
  },
  {
    "gmdnCode": "37705",
    "gmdnDescription": "Ventilator breathing circuit, reusable",
    "emdnMatches": [
      {
        "code": "R020101",
        "term": "STANDARD BREATHING CIRCUITS",
        "similarity": 72.0,
        "category": "R"
      }
    ]
  },
  {
    "gmdnCode": "58039",
    "gmdnDescription": "Endoscopic electrosurgical handpiece/electrode, monopolar, single-use",
    "emdnMatches": [
      {
        "code": "Z12010904",
        "term": "ENDOSCOPIC ELECTROSURGICAL UNITS (ESU)",
        "similarity": 77.3,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "47764",
    "gmdnDescription": "Wound hydrogel dressing, non-antimicrobial",
    "emdnMatches": [
      {
        "code": "M04040501",
        "term": "HYDROGEL DRESSINGS, NON-COMBINED",
        "similarity": 73.0,
        "category": "M"
      }
    ]
  },
  {
    "gmdnCode": "34873",
    "gmdnDescription": "Manual hospital bed",
    "emdnMatches": [
      {
        "code": "V080602",
        "term": "MANUAL MEDICAL BEDS",
        "similarity": 73.0,
        "category": "V"
      }
    ]
  },
  {
    "gmdnCode": "45607",
    "gmdnDescription": "Pulse oximeter",
    "emdnMatches": [
      {
        "code": "Z1203020408",
        "term": "PULSE OXIMETERS",
        "similarity": 97.6,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "55847",
    "gmdnDescription": "Dental implant system",
    "emdnMatches": [
      {
        "code": "P01020101",
        "term": "DENTAL IMPLANTS",
        "similarity": 97.6,
        "category": "P"
      }
    ]
  },
  {
    "gmdnCode": "33968",
    "gmdnDescription": "Surgical screwdriver, reusable",
    "emdnMatches": [
      {
        "code": "L26",
        "term": "SURGICAL SCREWDRIVERS, REUSABLE",
        "similarity": 98.4,
        "category": "L"
      }
    ]
  },
  {
    "gmdnCode": "58776",
    "gmdnDescription": "Surgical screwdriver, single-use",
    "emdnMatches": [
      {
        "code": "L26",
        "term": "SURGICAL SCREWDRIVERS, REUSABLE",
        "similarity": 98.4,
        "category": "L"
      }
    ]
  },
  {
    "gmdnCode": "56286",
    "gmdnDescription": "Nitrile examination/treatment glove, non-powdered, non-antimicrobial",
    "emdnMatches": [
      {
        "code": "T01020204",
        "term": "NITRILE EXAMINATION / TREATMENT GLOVES",
        "similarity": 83.6,
        "category": "T"
      }
    ]
  },
  {
    "gmdnCode": "12500",
    "gmdnDescription": "Medical bag",
    "emdnMatches": [
      {
        "code": "W02029010",
        "term": "BAG SEALERS",
        "similarity": 82.9,
        "category": "W"
      }
    ]
  },
  {
    "gmdnCode": "37468",
    "gmdnDescription": "Vaginal speculum, single-use",
    "emdnMatches": [
      {
        "code": "U089006",
        "term": "VAGINAL SPECULUM, SINGLE-USE",
        "similarity": 100.0,
        "category": "U"
      }
    ]
  },
  {
    "gmdnCode": "36079",
    "gmdnDescription": "Haemostasis valve",
    "emdnMatches": [
      {
        "code": "C900101",
        "term": "HAEMOSTASIS VALVES",
        "similarity": 97.6,
        "category": "C"
      }
    ]
  },
  {
    "gmdnCode": "38262",
    "gmdnDescription": "Total human chorionic gonadotropin IVD, control",
    "emdnMatches": [
      {
        "code": "W0102050205",
        "term": "TOTAL HUMAN CHORIONIC GONADOTROPIN",
        "similarity": 95.5,
        "category": "W"
      }
    ]
  },
  {
    "gmdnCode": "54413",
    "gmdnDescription": "Free thyroxine (FT4) IVD, kit, chemiluminescent immunoassay",
    "emdnMatches": [
      {
        "code": "W01020402",
        "term": "FREE THYROXINE",
        "similarity": 82.3,
        "category": "W"
      }
    ]
  },
  {
    "gmdnCode": "54386",
    "gmdnDescription": "Thyroid stimulating hormone (TSH) IVD, kit, chemiluminescent immunoassay",
    "emdnMatches": [
      {
        "code": "W01020410",
        "term": "THYROID STIMULATING HORMONE",
        "similarity": 87.1,
        "category": "W"
      }
    ]
  },
  {
    "gmdnCode": "37808",
    "gmdnDescription": "Pulse oximeter probe, reusable",
    "emdnMatches": [
      {
        "code": "Z1203020408",
        "term": "PULSE OXIMETERS",
        "similarity": 82.6,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "31658",
    "gmdnDescription": "Pulse oximeter probe, single-use",
    "emdnMatches": [
      {
        "code": "Z1203020408",
        "term": "PULSE OXIMETERS",
        "similarity": 82.6,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "46232",
    "gmdnDescription": "Anaesthesia face mask, single-use",
    "emdnMatches": [
      {
        "code": "R03010101",
        "term": "ANAESTHETIC FACE MASKS",
        "similarity": 88.4,
        "category": "R"
      }
    ]
  },
  {
    "gmdnCode": "60882",
    "gmdnDescription": "Anaesthesia mask strap, single-use",
    "emdnMatches": [
      {
        "code": "Z1203010101",
        "term": "ANAESTHESIA DEVICES",
        "similarity": 86.6,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "36086",
    "gmdnDescription": "Pulmonary resuscitator, manual, single-use",
    "emdnMatches": [
      {
        "code": "R03020201",
        "term": "MANUALLY OPERATED PULMONARY RESUSCITATORS",
        "similarity": 83.4,
        "category": "R"
      }
    ]
  },
  {
    "gmdnCode": "63256",
    "gmdnDescription": "Rigid video hysteroscope",
    "emdnMatches": [
      {
        "code": "Z12020712",
        "term": "VIDEO HYSTEROSCOPES",
        "similarity": 86.6,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "31253",
    "gmdnDescription": "Medical device air compressor",
    "emdnMatches": [
      {
        "code": "Z120304",
        "term": "CARDIAC COMPRESSORS",
        "similarity": 80.4,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "34672",
    "gmdnDescription": "Air-conduction hearing aid, in-the-ear",
    "emdnMatches": [
      {
        "code": "Y2145060201",
        "term": "HEARING AID IN THE-EAR (ITE)",
        "similarity": 83.8,
        "category": "Y"
      }
    ]
  },
  {
    "gmdnCode": "36117",
    "gmdnDescription": "Flexible video colonoscope, reusable",
    "emdnMatches": [
      {
        "code": "Z12020606",
        "term": "VIDEO COLONOSCOPES",
        "similarity": 81.0,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "17663",
    "gmdnDescription": "Flexible video gastroscope, reusable",
    "emdnMatches": [
      {
        "code": "Z12020511",
        "term": "VIDEO GASTROSCOPES",
        "similarity": 81.0,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "47259",
    "gmdnDescription": "Contrast medium injection system syringe",
    "emdnMatches": [
      {
        "code": "A02010401",
        "term": "SYRINGES FOR CONTRAST MEDIA INJECTOR, SINGLE-USE",
        "similarity": 83.0,
        "category": "A"
      }
    ]
  },
  {
    "gmdnCode": "16545",
    "gmdnDescription": "Angiography kit",
    "emdnMatches": [
      {
        "code": "Z11039020",
        "term": "ANGIOGRAPHY TABLES",
        "similarity": 83.6,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "46786",
    "gmdnDescription": "Direct ophthalmoscope",
    "emdnMatches": [
      {
        "code": "Z12120114",
        "term": "OPHTHALMOSCOPES",
        "similarity": 81.8,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "16345",
    "gmdnDescription": "Exophthalmometer",
    "emdnMatches": [
      {
        "code": "Z12120104",
        "term": "EXOPHTHALMOMETERS",
        "similarity": 97.6,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "58923",
    "gmdnDescription": "Wearable adult urine collection bag, open-ended",
    "emdnMatches": [
      {
        "code": "A06030301",
        "term": "URINE COLLECTION BAGS",
        "similarity": 80.0,
        "category": "A"
      }
    ]
  },
  {
    "gmdnCode": "34858",
    "gmdnDescription": "Surgical suction system collection container, single-use",
    "emdnMatches": [
      {
        "code": "W05010203",
        "term": "URINE COLLECTION, CONTAINERS",
        "similarity": 80.2,
        "category": "W"
      }
    ]
  },
  {
    "gmdnCode": "46569",
    "gmdnDescription": "Reinforced endotracheal tube, single-use",
    "emdnMatches": [
      {
        "code": "R01030202",
        "term": "ENDOTRACHEAL TUBES, CUFFED, REINFORCED",
        "similarity": 83.6,
        "category": "R"
      }
    ]
  },
  {
    "gmdnCode": "12875",
    "gmdnDescription": "Oxygen administration tubing",
    "emdnMatches": [
      {
        "code": "R03010204",
        "term": "OXYGEN ADMINISTRATION TUBINGS",
        "similarity": 98.4,
        "category": "R"
      }
    ]
  },
  {
    "gmdnCode": "64677",
    "gmdnDescription": "Urethral dilator, single-use",
    "emdnMatches": [
      {
        "code": "U03010201",
        "term": "URETHRAL DILATORS",
        "similarity": 97.6,
        "category": "U"
      }
    ]
  },
  {
    "gmdnCode": "31328",
    "gmdnDescription": "Endobronchial tube",
    "emdnMatches": [
      {
        "code": "R010499",
        "term": "ENDOBRONCHIAL TUBES - OTHER",
        "similarity": 87.2,
        "category": "R"
      }
    ]
  },
  {
    "gmdnCode": "44333",
    "gmdnDescription": "Urinary stone retrieval basket, single-use",
    "emdnMatches": [
      {
        "code": "U090101",
        "term": "URINARY STONE RETRIEVAL BASKETS",
        "similarity": 98.4,
        "category": "U"
      }
    ]
  },
  {
    "gmdnCode": "47769",
    "gmdnDescription": "Anaesthesia unit, mobile",
    "emdnMatches": [
      {
        "code": "Z1203010101",
        "term": "ANAESTHESIA DEVICES",
        "similarity": 84.5,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "35586",
    "gmdnDescription": "Hand rail",
    "emdnMatches": [
      {
        "code": "Y181803",
        "term": "HANDRAILS",
        "similarity": 89.0,
        "category": "Y"
      }
    ]
  },
  {
    "gmdnCode": "47770",
    "gmdnDescription": "Anaesthesia unit, wall-mounted",
    "emdnMatches": [
      {
        "code": "Z1203010101",
        "term": "ANAESTHESIA DEVICES",
        "similarity": 81.5,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "36890",
    "gmdnDescription": "Isoflurane anaesthesia vaporizer",
    "emdnMatches": [
      {
        "code": "Z1203010101",
        "term": "ANAESTHESIA DEVICES",
        "similarity": 81.8,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "36980",
    "gmdnDescription": "Sevoflurane anaesthesia vaporizer",
    "emdnMatches": [
      {
        "code": "Z1203010101",
        "term": "ANAESTHESIA DEVICES",
        "similarity": 81.5,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "61435",
    "gmdnDescription": "Intracranial/compartmental-pressure monitor calibrator/cable",
    "emdnMatches": [
      {
        "code": "Z12039002",
        "term": "INTRA COMPARTMENTAL PRESSURE MONITOR SYSTEMS",
        "similarity": 82.7,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "10960",
    "gmdnDescription": "Colposcope",
    "emdnMatches": [
      {
        "code": "Z12020703",
        "term": "COLPOSCOPES",
        "similarity": 96.0,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "10234",
    "gmdnDescription": "Rotating pneumatic tourniquet system",
    "emdnMatches": [
      {
        "code": "Z12139006",
        "term": "PNEUMATIC TOURNIQUETS",
        "similarity": 83.6,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "35375",
    "gmdnDescription": "Stopcock",
    "emdnMatches": [
      {
        "code": "A0703",
        "term": "STOPCOCKS",
        "similarity": 95.2,
        "category": "A"
      }
    ]
  },
  {
    "gmdnCode": "34175",
    "gmdnDescription": "Acupuncture needle, single-use",
    "emdnMatches": [
      {
        "code": "A019002",
        "term": "ACUPUNCTURE NEEDLES",
        "similarity": 97.6,
        "category": "A"
      }
    ]
  },
  {
    "gmdnCode": "33819",
    "gmdnDescription": "Total human chorionic gonadotropin IVD, kit, rapid ICT, clinical",
    "emdnMatches": [
      {
        "code": "W0102050205",
        "term": "TOTAL HUMAN CHORIONIC GONADOTROPIN",
        "similarity": 91.6,
        "category": "W"
      }
    ]
  },
  {
    "gmdnCode": "38152",
    "gmdnDescription": "Tibia intramedullary nail",
    "emdnMatches": [
      {
        "code": "P09120201",
        "term": "INTRAMEDULLARY NAILS",
        "similarity": 86.6,
        "category": "P"
      }
    ]
  },
  {
    "gmdnCode": "16204",
    "gmdnDescription": "Orthodontic wire",
    "emdnMatches": [
      {
        "code": "Q010405",
        "term": "ORTHODONTIC WIRES",
        "similarity": 97.6,
        "category": "Q"
      }
    ]
  },
  {
    "gmdnCode": "47176",
    "gmdnDescription": "Vinyl examination/treatment glove, non-powdered",
    "emdnMatches": [
      {
        "code": "T01020201",
        "term": "VINYL EXAMINATION / TREATMENT GLOVES",
        "similarity": 87.5,
        "category": "T"
      }
    ]
  },
  {
    "gmdnCode": "35091",
    "gmdnDescription": "Surgical gown, single-use",
    "emdnMatches": [
      {
        "code": "T020499",
        "term": "SURGICAL GOWNS - OTHER",
        "similarity": 83.2,
        "category": "T"
      }
    ]
  },
  {
    "gmdnCode": "60734",
    "gmdnDescription": "Needle guide, reusable",
    "emdnMatches": [
      {
        "code": "A018002",
        "term": "NEEDLE GUIDES",
        "similarity": 96.8,
        "category": "A"
      }
    ]
  },
  {
    "gmdnCode": "47179",
    "gmdnDescription": "Hevea-latex surgical glove, powdered",
    "emdnMatches": [
      {
        "code": "T01010101",
        "term": "POWDERED LATEX SURGICAL GLOVES",
        "similarity": 85.8,
        "category": "T"
      }
    ]
  },
  {
    "gmdnCode": "47172",
    "gmdnDescription": "Hevea-latex examination/treatment glove, non-powdered, non-antimicrobial",
    "emdnMatches": [
      {
        "code": "T010201",
        "term": "LATEX EXAMINATION / TREATMENT GLOVES",
        "similarity": 81.8,
        "category": "T"
      }
    ]
  },
  {
    "gmdnCode": "17942",
    "gmdnDescription": "Cerebral oximeter",
    "emdnMatches": [
      {
        "code": "Z1203020406",
        "term": "CEREBRAL OXIMETERS",
        "similarity": 97.6,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "17453",
    "gmdnDescription": "Cardiac valvuloplasty catheter",
    "emdnMatches": [
      {
        "code": "C019014",
        "term": "CARDIAC VALVULOPLASTY CATHETERS",
        "similarity": 98.4,
        "category": "C"
      }
    ]
  },
  {
    "gmdnCode": "64055",
    "gmdnDescription": "Flexible video choledochoscope, single-use",
    "emdnMatches": [
      {
        "code": "Z12020507",
        "term": "VIDEO CHOLEDOCOSCOPES",
        "similarity": 81.4,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "60963",
    "gmdnDescription": "Flexible video bronchoscope, single-use",
    "emdnMatches": [
      {
        "code": "Z12020802",
        "term": "VIDEO BRONCHOSCOPES",
        "similarity": 81.8,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "46878",
    "gmdnDescription": "Haemorrhoid ligation set",
    "emdnMatches": [
      {
        "code": "G020401",
        "term": "HAEMORRHOID LIGATURE SETS",
        "similarity": 86.4,
        "category": "G"
      }
    ]
  },
  {
    "gmdnCode": "35176",
    "gmdnDescription": "Anaesthesia face mask, reusable",
    "emdnMatches": [
      {
        "code": "R03010101",
        "term": "ANAESTHETIC FACE MASKS",
        "similarity": 88.4,
        "category": "R"
      }
    ]
  },
  {
    "gmdnCode": "35501",
    "gmdnDescription": "Anaesthesia screen",
    "emdnMatches": [
      {
        "code": "Z1203010101",
        "term": "ANAESTHESIA DEVICES",
        "similarity": 91.2,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "45716",
    "gmdnDescription": "Suture knot pusher, reusable",
    "emdnMatches": [
      {
        "code": "L0207",
        "term": "KNOT PUSHERS, REUSABLE",
        "similarity": 83.2,
        "category": "L"
      }
    ]
  },
  {
    "gmdnCode": "38530",
    "gmdnDescription": "Dental spatula, reusable",
    "emdnMatches": [
      {
        "code": "L159013",
        "term": "DENTAL SPATULAS, REUSABLE",
        "similarity": 97.6,
        "category": "L"
      }
    ]
  },
  {
    "gmdnCode": "35811",
    "gmdnDescription": "Dental excavator, reusable",
    "emdnMatches": [
      {
        "code": "L159002",
        "term": "DENTAL EXCAVATORS, REUSABLE",
        "similarity": 97.6,
        "category": "L"
      }
    ]
  },
  {
    "gmdnCode": "41660",
    "gmdnDescription": "Periodontal curette",
    "emdnMatches": [
      {
        "code": "L159001",
        "term": "DENTAL AND PERIODONTAL CURETTES, REUSABLE",
        "similarity": 80.8,
        "category": "L"
      }
    ]
  },
  {
    "gmdnCode": "35697",
    "gmdnDescription": "Dental material application tool, single-use",
    "emdnMatches": [
      {
        "code": "Q019006",
        "term": "DENTAL MATERIAL APPLICATION TIPS AND BRUSHES, SINGLE-USE",
        "similarity": 87.0,
        "category": "Q"
      }
    ]
  },
  {
    "gmdnCode": "57849",
    "gmdnDescription": "Mass spectrometry analyser IVD",
    "emdnMatches": [
      {
        "code": "W020303",
        "term": "MASS - SPECTROMETRY SYSTEM",
        "similarity": 89.4,
        "category": "W"
      }
    ]
  },
  {
    "gmdnCode": "59222",
    "gmdnDescription": "Neonatal thyroxine (neonatal T4) IVD, kit, fluorescent immunoassay",
    "emdnMatches": [
      {
        "code": "W01020411",
        "term": "NEONATAL THYROXINE",
        "similarity": 83.5,
        "category": "W"
      }
    ]
  },
  {
    "gmdnCode": "59221",
    "gmdnDescription": "Neonatal thyroid stimulating hormone (neonatal TSH) IVD, kit, fluorescent immunoassay",
    "emdnMatches": [
      {
        "code": "W01020403",
        "term": "NEONATAL THYROID STIMULATING HORMONE",
        "similarity": 88.6,
        "category": "W"
      }
    ]
  },
  {
    "gmdnCode": "65432",
    "gmdnDescription": "Laboratory shaker IVD",
    "emdnMatches": [
      {
        "code": "W02070401",
        "term": "LABORATORY SHAKERS",
        "similarity": 88.4,
        "category": "W"
      }
    ]
  },
  {
    "gmdnCode": "15178",
    "gmdnDescription": "Laboratory shaker",
    "emdnMatches": [
      {
        "code": "W02070401",
        "term": "LABORATORY SHAKERS",
        "similarity": 97.6,
        "category": "W"
      }
    ]
  },
  {
    "gmdnCode": "58787",
    "gmdnDescription": "Total human chorionic gonadotropin IVD, kit, fluorescent immunoassay",
    "emdnMatches": [
      {
        "code": "W0102050205",
        "term": "TOTAL HUMAN CHORIONIC GONADOTROPIN",
        "similarity": 90.4,
        "category": "W"
      }
    ]
  },
  {
    "gmdnCode": "54186",
    "gmdnDescription": "Follicle stimulating hormone (FSH) IVD, kit, enzyme immunoassay (EIA)",
    "emdnMatches": [
      {
        "code": "W0102050104",
        "term": "FOLLICLE STIMULATING HORMONE",
        "similarity": 88.6,
        "category": "W"
      }
    ]
  },
  {
    "gmdnCode": "41839",
    "gmdnDescription": "C-reactive protein (CRP) IVD, control",
    "emdnMatches": [
      {
        "code": "W01021109",
        "term": "C-REACTIVE PROTEIN",
        "similarity": 90.7,
        "category": "W"
      }
    ]
  },
  {
    "gmdnCode": "53705",
    "gmdnDescription": "C-reactive protein (CRP) IVD, kit, nephelometry/turbidimetry",
    "emdnMatches": [
      {
        "code": "W01021109",
        "term": "C-REACTIVE PROTEIN",
        "similarity": 84.7,
        "category": "W"
      }
    ]
  },
  {
    "gmdnCode": "61762",
    "gmdnDescription": "Procollagen type I N-terminal propeptide (PINP) IVD, kit, radioimmunoassay",
    "emdnMatches": [
      {
        "code": "W0102060317",
        "term": "PROCOLLAGEN TYPE I N TERMINAL PROPEPTIDE",
        "similarity": 91.5,
        "category": "W"
      }
    ]
  },
  {
    "gmdnCode": "11474",
    "gmdnDescription": "Electromyograph",
    "emdnMatches": [
      {
        "code": "Z12100401",
        "term": "ELECTROMYOGRAPHS",
        "similarity": 97.6,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "11467",
    "gmdnDescription": "Electroencephalograph",
    "emdnMatches": [
      {
        "code": "Z12100302",
        "term": "ELECTROENCEPHALOGRAPHS",
        "similarity": 98.4,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "46495",
    "gmdnDescription": "Magnetoencephalography system, superconducting",
    "emdnMatches": [
      {
        "code": "Z12101201",
        "term": "MAGNETOENCEPHALOGRAPHY SYSTEMS",
        "similarity": 91.1,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "64054",
    "gmdnDescription": "Insulin-like growth factor binding protein 1 (IGFBP-1) IVD, kit, rapid ICT, clinical",
    "emdnMatches": [
      {
        "code": "W0102060405",
        "term": "INSULIN-LIKE GROWTH FACTOR BINDING PROTEIN 1",
        "similarity": 91.6,
        "category": "W"
      }
    ]
  },
  {
    "gmdnCode": "42194",
    "gmdnDescription": "Insulin-like growth factor binding protein 1 (IGFBP-1) IVD, control",
    "emdnMatches": [
      {
        "code": "W0102060405",
        "term": "INSULIN-LIKE GROWTH FACTOR BINDING PROTEIN 1",
        "similarity": 94.3,
        "category": "W"
      }
    ]
  },
  {
    "gmdnCode": "37503",
    "gmdnDescription": "Tone audiometer",
    "emdnMatches": [
      {
        "code": "Z121401",
        "term": "AUDIOMETERS",
        "similarity": 80.6,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "36398",
    "gmdnDescription": "Hess-screen",
    "emdnMatches": [
      {
        "code": "Z1212012004",
        "term": "HESS SCREENS",
        "similarity": 95.0,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "41188",
    "gmdnDescription": "Speech audiometer",
    "emdnMatches": [
      {
        "code": "Z121401",
        "term": "AUDIOMETERS",
        "similarity": 82.2,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "34868",
    "gmdnDescription": "Bedrail",
    "emdnMatches": [
      {
        "code": "V08068001",
        "term": "BED RAILS",
        "similarity": 87.6,
        "category": "V"
      }
    ]
  },
  {
    "gmdnCode": "11479",
    "gmdnDescription": "Electronystagmograph",
    "emdnMatches": [
      {
        "code": "Z12120124",
        "term": "VIDEO/ELECTRONYSTAGMOGRAPHS",
        "similarity": 88.0,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "35747",
    "gmdnDescription": "Evoked-potential audiometer",
    "emdnMatches": [
      {
        "code": "Z12140302",
        "term": "EVOKED POTENTIAL AUDIOMETRY EQUIPMENTS",
        "similarity": 82.6,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "40641",
    "gmdnDescription": "Mobile gamma camera system",
    "emdnMatches": [
      {
        "code": "Z11020101",
        "term": "MOBILE GAMMA CAMERAS",
        "similarity": 97.6,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "35277",
    "gmdnDescription": "Testicle prosthesis",
    "emdnMatches": [
      {
        "code": "P080201",
        "term": "TESTICLE PROSTHESES",
        "similarity": 95.0,
        "category": "P"
      }
    ]
  },
  {
    "gmdnCode": "36251",
    "gmdnDescription": "Rigid penile prosthesis",
    "emdnMatches": [
      {
        "code": "P080202",
        "term": "PENILE PROSTHESES",
        "similarity": 82.8,
        "category": "P"
      }
    ]
  },
  {
    "gmdnCode": "37162",
    "gmdnDescription": "Patient transfer sliding board",
    "emdnMatches": [
      {
        "code": "Z12019010",
        "term": "PATIENT TRANSFER SYSTEMS",
        "similarity": 89.5,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "65299",
    "gmdnDescription": "Flexible video gastroscope, single-use",
    "emdnMatches": [
      {
        "code": "Z12020511",
        "term": "VIDEO GASTROSCOPES",
        "similarity": 81.0,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "46828",
    "gmdnDescription": "Laryngoscope blade, single-use",
    "emdnMatches": [
      {
        "code": "R9002",
        "term": "LARYNGOSCOPE BLADES, SINGLE-USE",
        "similarity": 97.6,
        "category": "R"
      }
    ]
  },
  {
    "gmdnCode": "17591",
    "gmdnDescription": "Pulmonary resuscitator, manual, reusable",
    "emdnMatches": [
      {
        "code": "R03020201",
        "term": "MANUALLY OPERATED PULMONARY RESUSCITATORS",
        "similarity": 83.4,
        "category": "R"
      }
    ]
  },
  {
    "gmdnCode": "64067",
    "gmdnDescription": "Flexible video duodenoscope, single-use",
    "emdnMatches": [
      {
        "code": "Z12020508",
        "term": "VIDEO DUODENOSCOPES",
        "similarity": 81.8,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "62159",
    "gmdnDescription": "Flexible video colonoscope, single-use",
    "emdnMatches": [
      {
        "code": "Z12020606",
        "term": "VIDEO COLONOSCOPES",
        "similarity": 81.0,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "33843",
    "gmdnDescription": "Polysomnograph",
    "emdnMatches": [
      {
        "code": "Z12100501",
        "term": "POLYSOMNOGRAPHS",
        "similarity": 97.6,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "35401",
    "gmdnDescription": "Endotracheal tube cuff inflator",
    "emdnMatches": [
      {
        "code": "R01038001",
        "term": "ENDOTRACHEAL TUBE CUFFS INFLATION SYSTEMS",
        "similarity": 91.6,
        "category": "R"
      }
    ]
  },
  {
    "gmdnCode": "11441",
    "gmdnDescription": "Electromyographic needle electrode, single-use",
    "emdnMatches": [
      {
        "code": "N010101",
        "term": "ELECTROMYOGRAPHIC ELECTRODES",
        "similarity": 85.4,
        "category": "N"
      }
    ]
  },
  {
    "gmdnCode": "45018",
    "gmdnDescription": "Needle guide, single-use",
    "emdnMatches": [
      {
        "code": "A018002",
        "term": "NEEDLE GUIDES",
        "similarity": 96.8,
        "category": "A"
      }
    ]
  },
  {
    "gmdnCode": "10735",
    "gmdnDescription": "Nephrostomy catheter",
    "emdnMatches": [
      {
        "code": "U040203",
        "term": "NEPHROSTOMY CATHETERS",
        "similarity": 98.4,
        "category": "U"
      }
    ]
  },
  {
    "gmdnCode": "30208",
    "gmdnDescription": "Lactate electrode IVD",
    "emdnMatches": [
      {
        "code": "W0101070204",
        "term": "LACTATE - ELECTRODES",
        "similarity": 86.6,
        "category": "W"
      }
    ]
  },
  {
    "gmdnCode": "57054",
    "gmdnDescription": "Coagulation factor VIII-associated antigen IVD, antibody",
    "emdnMatches": [
      {
        "code": "W0103020207",
        "term": "COAGULATION FACTOR VIII",
        "similarity": 87.7,
        "category": "W"
      }
    ]
  },
  {
    "gmdnCode": "62810",
    "gmdnDescription": "Retinol-binding protein IVD, antibody",
    "emdnMatches": [
      {
        "code": "W0102010306",
        "term": "RETINOL BINDING PROTEIN",
        "similarity": 92.6,
        "category": "W"
      }
    ]
  },
  {
    "gmdnCode": "57058",
    "gmdnDescription": "Complement component C1q IVD, antibody",
    "emdnMatches": [
      {
        "code": "W0102010201",
        "term": "COMPLEMENT COMPONENT C1Q",
        "similarity": 93.7,
        "category": "W"
      }
    ]
  },
  {
    "gmdnCode": "56891",
    "gmdnDescription": "Cancer antigen 125 (CA125) IVD, antibody",
    "emdnMatches": [
      {
        "code": "W0102030106",
        "term": "CANCER ANTIGEN 125",
        "similarity": 89.5,
        "category": "W"
      }
    ]
  },
  {
    "gmdnCode": "57299",
    "gmdnDescription": "Total human chorionic gonadotropin IVD, antibody",
    "emdnMatches": [
      {
        "code": "W0102050205",
        "term": "TOTAL HUMAN CHORIONIC GONADOTROPIN",
        "similarity": 95.2,
        "category": "W"
      }
    ]
  },
  {
    "gmdnCode": "57331",
    "gmdnDescription": "Insulin IVD, antibody",
    "emdnMatches": [
      {
        "code": "W0102060104",
        "term": "INSULIN ANTIBODY",
        "similarity": 91.7,
        "category": "W"
      }
    ]
  },
  {
    "gmdnCode": "40943",
    "gmdnDescription": "Radiology picture archiving and communication system workstation",
    "emdnMatches": [
      {
        "code": "Z110603",
        "term": "PICTURE ARCHIVING AND COMMUNICATION SYSTEMS",
        "similarity": 91.6,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "46265",
    "gmdnDescription": "Cardiac mapping system",
    "emdnMatches": [
      {
        "code": "Z12059002",
        "term": "CARDIAC MAPPING EQUIPMENT",
        "similarity": 92.5,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "58183",
    "gmdnDescription": "Electromagnetic surgical navigation device tracking system",
    "emdnMatches": [
      {
        "code": "Z12011401",
        "term": "SURGICAL NAVIGATION SYSTEM",
        "similarity": 88.0,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "35974",
    "gmdnDescription": "Cardiac electrophysiology stimulation system",
    "emdnMatches": [
      {
        "code": "Z1205078001",
        "term": "CARDIAC ELECTROPHYSIOLOGY STIMULATORS",
        "similarity": 95.0,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "37165",
    "gmdnDescription": "Patient transfer/turning sheet, single-use",
    "emdnMatches": [
      {
        "code": "Z12019010",
        "term": "PATIENT TRANSFER SYSTEMS",
        "similarity": 87.3,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "47069",
    "gmdnDescription": "Proton therapy system",
    "emdnMatches": [
      {
        "code": "Z11011001",
        "term": "PROTON THERAPY SYSTEMS",
        "similarity": 97.9,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "58403",
    "gmdnDescription": "Insulin-like growth factor I (IGF1) IVD, kit, radioimmunoassay",
    "emdnMatches": [
      {
        "code": "W0102060404",
        "term": "INSULIN-LIKE GROWTH FACTOR II",
        "similarity": 87.0,
        "category": "W"
      }
    ]
  },
  {
    "gmdnCode": "54185",
    "gmdnDescription": "Follicle stimulating hormone (FSH) IVD, kit, radioimmunoassay",
    "emdnMatches": [
      {
        "code": "W0102050104",
        "term": "FOLLICLE STIMULATING HORMONE",
        "similarity": 89.8,
        "category": "W"
      }
    ]
  },
  {
    "gmdnCode": "58409",
    "gmdnDescription": "Insulin-like growth factor binding protein 3 (IGFBP-3) IVD, kit, enzyme immunoassay (EIA)",
    "emdnMatches": [
      {
        "code": "W0102060406",
        "term": "INSULIN-LIKE GROWTH FACTOR BINDING PROTEIN 3",
        "similarity": 90.7,
        "category": "W"
      }
    ]
  },
  {
    "gmdnCode": "44776",
    "gmdnDescription": "Electrosurgical system",
    "emdnMatches": [
      {
        "code": "Z12010903",
        "term": "ARGON ELECTROSURGICAL UNITS (ESU)",
        "similarity": 89.5,
        "category": "Z"
      }
    ]
  },
  {
    "gmdnCode": "56021",
    "gmdnDescription": "Coagulation factor VIII IVD, kit, clotting",
    "emdnMatches": [
      {
        "code": "W0103020207",
        "term": "COAGULATION FACTOR VIII",
        "similarity": 91.9,
        "category": "W"
      }
    ]
  }
];

async function integrateCompleteValidatedMappings() {
  try {
    const mappingsFile = path.join(__dirname, 'public', 'gmdn-emdn-mappings', 'gmdn-emdn-mappings.json');
    
    // Create a backup first
    const backupFile = mappingsFile + '.backup-' + Date.now();
    if (fs.existsSync(mappingsFile)) {
      fs.copyFileSync(mappingsFile, backupFile);
      console.log(`💾 Created backup: ${path.basename(backupFile)}`);
    }
    
    // Read existing mappings
    let existingData = { metadata: {}, mappings: {} };
    if (fs.existsSync(mappingsFile)) {
      const content = fs.readFileSync(mappingsFile, 'utf8');
      existingData = JSON.parse(content);
    }
    
    console.log(`📋 Starting complete validated mappings integration...`);
    console.log(`📊 Found ${Object.keys(existingData.mappings).length} existing mappings`);
    console.log(`🎯 Processing ${completeValidatedMappings.length} validated mappings`);
    
    let addedCount = 0;
    let updatedCount = 0;
    let duplicatesSkipped = 0;
    
    // Track unique GMDN codes to handle duplicates
    const processedGmdnCodes = new Set();
    
    // Process each mapping from complete validated set
    for (const newMapping of completeValidatedMappings) {
      const gmdnCode = newMapping.gmdnCode;
      
      // Skip duplicates in the input data
      if (processedGmdnCodes.has(gmdnCode)) {
        duplicatesSkipped++;
        console.log(`⚠️  Skipped duplicate GMDN ${gmdnCode}`);
        continue;
      }
      processedGmdnCodes.add(gmdnCode);
      
      if (existingData.mappings[gmdnCode]) {
        // Update existing mapping
        existingData.mappings[gmdnCode] = {
          gmdnCode: newMapping.gmdnCode,
          gmdnDescription: newMapping.gmdnDescription,
          emdnMatches: newMapping.emdnMatches.map(match => ({
            emdnCode: match.code,
            emdnDescription: match.term,
            score: match.similarity,
            category: match.category
          }))
        };
        updatedCount++;
        console.log(`🔄 Updated GMDN ${newMapping.gmdnCode}: ${newMapping.gmdnDescription.substring(0, 50)}...`);
      } else {
        // Add new mapping
        existingData.mappings[gmdnCode] = {
          gmdnCode: newMapping.gmdnCode,
          gmdnDescription: newMapping.gmdnDescription,
          emdnMatches: newMapping.emdnMatches.map(match => ({
            emdnCode: match.code,
            emdnDescription: match.term,
            score: match.similarity,
            category: match.category
          }))
        };
        addedCount++;
        console.log(`✅ Added GMDN ${newMapping.gmdnCode}: ${newMapping.gmdnDescription.substring(0, 50)}...`);
      }
    }
    
    // Update metadata
    const totalMappings = Object.keys(existingData.mappings).length;
    existingData.metadata = {
      generated: new Date().toISOString(),
      version: "1.0.0",
      description: "GMDN to EMDN device code mappings - Complete validated dataset",
      stats: {
        totalGmdn: totalMappings,
        mappedGmdn: totalMappings,
        manualMappings: totalMappings,
        automaticMappings: 0
      }
    };
    
    // Write updated mappings
    fs.writeFileSync(mappingsFile, JSON.stringify(existingData, null, 2));
    
    console.log(`\n🎉 Complete Validated Mappings Integration Summary:`);
    console.log(`✅ Added: ${addedCount} new mappings`);
    console.log(`🔄 Updated: ${updatedCount} existing mappings`);
    console.log(`⚠️  Skipped duplicates: ${duplicatesSkipped} mappings`);
    console.log(`📊 Total mappings: ${totalMappings}`);
    
    // Analyze categories
    const categories = {};
    Object.values(existingData.mappings).forEach(mapping => {
      mapping.emdnMatches.forEach(match => {
        categories[match.category] = (categories[match.category] || 0) + 1;
      });
    });
    
    console.log(`\n📋 Category Distribution:`);
    Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`  ${category}: ${count} mappings`);
      });
    
    // Analyze confidence distribution
    const confidenceLevels = { very_high: 0, high: 0, medium: 0, low: 0 };
    Object.values(existingData.mappings).forEach(mapping => {
      mapping.emdnMatches.forEach(match => {
        const score = match.score;
        if (score >= 95) confidenceLevels.very_high++;
        else if (score >= 85) confidenceLevels.high++;
        else if (score >= 75) confidenceLevels.medium++;
        else confidenceLevels.low++;
      });
    });
    
    console.log(`\n🎯 Confidence Distribution:`);
    console.log(`  Very High (≥95%): ${confidenceLevels.very_high} mappings`);
    console.log(`  High (≥85%): ${confidenceLevels.high} mappings`);
    console.log(`  Medium (≥75%): ${confidenceLevels.medium} mappings`);
    console.log(`  Low (<75%): ${confidenceLevels.low} mappings`);
    
  } catch (error) {
    console.error('❌ Error integrating complete validated mappings:', error);
    process.exit(1);
  }
}

integrateCompleteValidatedMappings();