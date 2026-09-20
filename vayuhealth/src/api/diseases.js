import client from './client';

// 4. Disease Controller — /api/diseases with high-fidelity fallback dataset

export const FALLBACK_DISEASES = [
  {
    id: 'd-1',
    name: 'Acute Respiratory Infection',
    category: 'Airborne',
    type: 'Airborne',
    description: 'Acute inflammation of the upper and lower respiratory tract caused by airborne particulate matter (PM2.5/PM10), viruses, or bacteria.',
    transmission: 'Inhalation of infected particulate droplets and aerosol pollutants',
    symptoms: ['Cough', 'Sore throat', 'Runny nose', 'Mild fever', 'Chest congestion'],
    precautions: ['Wear N95/N99 mask when AQI > 150', 'Avoid high-traffic corridors during peak hours', 'Keep indoor air purifiers active'],
    ayurvedicRemedies: [
      {
        title: 'Eucalyptus Steam Inhalation',
        description: 'Add 3-4 drops of eucalyptus or camphor oil to steaming water and inhale for 8-10 minutes twice daily.',
        ingredients: ['Eucalyptus essential oil', 'Boiling water'],
      },
      {
        title: 'Tulsi-Ginger Kadha',
        description: 'Boil fresh Tulsi leaves, crushed ginger, cloves, and black pepper. Drink warm with raw honey.',
        ingredients: ['Tulsi leaves', 'Fresh ginger', 'Black pepper', 'Clove', 'Raw honey'],
      },
    ],
    remedies: ['Eucalyptus Steam Inhalation', 'Tulsi-Ginger Kadha', 'Warm Saline Gargle'],
    firstAid: ['Sit in an upright position', 'Use a warm mist humidifier', 'Hydrate with warm fluids'],
    whenToSeeDoctor: 'If respiratory distress worsens, oxygen saturation drops below 94%, or high fever persists beyond 3 days.',
    severity: 'High',
  },
  {
    id: 'd-2',
    name: 'Asthma & Bronchospasm',
    category: 'Airborne',
    type: 'Airborne',
    description: 'Chronic inflammatory airway disease where bronchioles narrow, swell, and produce extra mucus, triggered by smog, dust, and cold dry air.',
    transmission: 'Non-contagious; environmental triggers (PM2.5, ground-level Ozone, pollen)',
    symptoms: ['Wheezing breath sounds', 'Shortness of breath (Dyspnea)', 'Chest tightness', 'Nocturnal cough'],
    precautions: ['Keep prescribed SOS reliever inhaler (Salbutamol) at hand', 'Avoid early morning jogs during thermal inversion', 'Check daily AQI before stepping outdoors'],
    ayurvedicRemedies: [
      {
        title: 'Golden Turmeric Milk (Haridra Dugdha)',
        description: 'Boil 1 tsp pure organic turmeric and a pinch of black pepper in cows milk. Consume before sleep to reduce bronchial inflammation.',
        ingredients: ['Organic turmeric powder', 'Milk', 'Black pepper'],
      },
      {
        title: 'Adhatoda Vasica (Vasa) Decoction',
        description: 'Boil Vasa leaves in water to prepare a potent bronchodilator decoction.',
        ingredients: ['Vasa leaves', 'Water', 'Jaggery'],
      },
    ],
    remedies: ['Golden Turmeric Milk', 'Vasa Decoction', 'Warm Honey & Ginger Syrup'],
    firstAid: ['Sit upright, do not lie flat', 'Take 2-4 puffs of reliever inhaler via spacer', 'Stay calm and practice pursed-lip breathing'],
    whenToSeeDoctor: 'If peak flow drops below 50%, cyanosis (blue lips/fingers) occurs, or inhaler relief fails after 15 minutes.',
    severity: 'Critical',
  },
  {
    id: 'd-3',
    name: 'Chronic Obstructive Pulmonary Disease (COPD)',
    category: 'Airborne',
    type: 'Airborne',
    description: 'Progressive lung condition causing obstructed airflow from the lungs, heavily exacerbated by winter smog and stubble burning smoke in Delhi-NCR.',
    transmission: 'Non-contagious; long-term exposure to particulate pollutants, biomass smoke, and tobacco',
    symptoms: ['Chronic productive cough', 'Progressive breathlessness', 'Fatigue', 'Frequent chest infections'],
    precautions: ['Strict indoor confinement during GRAP Stage III/IV smog emergencies', 'Use HEPA air filtration at home', 'Annual influenza & pneumococcal vaccination'],
    ayurvedicRemedies: [
      {
        title: 'Pippali Rasayana',
        description: 'Long pepper powder taken with honey helps clear deep lung congestion and enhances alveolar elasticity.',
        ingredients: ['Pippali (Long pepper) powder', 'Raw honey'],
      },
    ],
    remedies: ['Pippali Rasayana', 'Sitopaladi Churna with Honey', 'Steam with Ajwain'],
    firstAid: ['Administer prescribed bronchodilator nebulization', 'Position patient sitting upright with forearms supported', 'Provide supplemental oxygen if SpO2 < 88%'],
    whenToSeeDoctor: 'If acute breathlessness prevents speaking full sentences or swelling appears in ankles/feet.',
    severity: 'Critical',
  },
  {
    id: 'd-4',
    name: 'Allergic Rhinitis & Sinusitis',
    category: 'Airborne',
    type: 'Airborne',
    description: 'Hypersensitivity reaction of the nasal mucosal lining caused by airborne allergens, urban dust, nitrogen dioxide, and chemical smog.',
    transmission: 'Non-contagious; airborne pollen, dust mites, particulate matter',
    symptoms: ['Paroxysmal sneezing', 'Clear rhinorrhea (runny nose)', 'Itchy watery eyes', 'Nasal congestion', 'Frontal headache'],
    precautions: ['Perform saline nasal rinses after outdoor commutes', 'Wear protective wraparound sunglasses', 'Keep vehicle windows rolled up'],
    ayurvedicRemedies: [
      {
        title: 'Anu Taila Nasya',
        description: 'Instill 2 drops of medicated Anu oil in each nostril every morning to form a protective lipid barrier against fine dust.',
        ingredients: ['Anu Taila (Medicated sesame oil)'],
      },
      {
        title: 'Jala Neti (Nasal Saline Irrigation)',
        description: 'Rinse nasal passages using lukewarm saline water in a Neti pot to flush out accumulated particulate matter.',
        ingredients: ['Sterile water', 'Rock salt'],
      },
    ],
    remedies: ['Anu Taila Nasya', 'Jala Neti Saline Rinse', 'Ginger-Basil Infusion'],
    firstAid: ['Warm facial compress over sinuses', 'Steam inhalation with mint crystals'],
    whenToSeeDoctor: 'If facial pain becomes severe, thick green nasal discharge develops, or high fever occurs.',
    severity: 'Moderate',
  },
  {
    id: 'd-5',
    name: 'Chronic Bronchitis',
    category: 'Airborne',
    type: 'Airborne',
    description: 'Persistent irritation and inflammation of the bronchial tubes with excess mucus production lasting several months, highly prevalent during peak north-Indian winter inversions.',
    transmission: 'Non-contagious; aggravated by industrial SO2, NO2, and toxic winter inversion layers',
    symptoms: ['Heavy morning phlegm cough', 'Low-pitched wheezing', 'Throat irritation', 'Chest discomfort'],
    precautions: ['Avoid exposure to early morning cold mist and heavy haze', 'Maintain adequate room ventilation with HEPA filters'],
    ayurvedicRemedies: [
      {
        title: 'Sitopaladi & Honey Paste',
        description: 'Traditional Ayurvedic formulation to soothe throat irritation, liquefy mucus, and ease coughing.',
        ingredients: ['Sitopaladi churna', 'Organic raw honey'],
      },
    ],
    remedies: ['Sitopaladi & Honey Paste', 'Licorice (Mulethi) Root Tea', 'Clove & Cardamom Decoction'],
    firstAid: ['Keep patient comfortably warm', 'Encourage deep diaphragmatic breathing and warm fluid intake'],
    whenToSeeDoctor: 'If coughing up blood (hemoptysis) or high spiking fever occurs.',
    severity: 'High',
  },
  {
    id: 'd-6',
    name: 'Typhoid & Enteric Fever',
    category: 'Waterborne',
    type: 'Waterborne',
    description: 'Bacterial infection caused by Salmonella typhi spread through contaminated drinking water and unhygienic food handling.',
    transmission: 'Ingestion of fecally contaminated water and unwashed raw foods',
    symptoms: ['Step-ladder high fever', 'Severe headache', 'Abdominal pain', 'Loss of appetite', 'Rose spots on trunk'],
    precautions: ['Drink only boiled or RO-purified water', 'Avoid street food and raw unpeeled vegetables during monsoon/floods'],
    ayurvedicRemedies: [
      {
        title: 'Giloy (Guduchi) Kwath',
        description: 'Boil Giloy stems in water until reduced to 1/4th. Consume to modulate immunity and manage intermittent fever.',
        ingredients: ['Giloy stem', 'Water'],
      },
    ],
    remedies: ['Giloy Kwath', 'Pomegranate Juice for Vitality', 'Electrolyte Rehydration'],
    firstAid: ['Oral Rehydration Salts (ORS) solution', 'Complete bed rest and soft digestible khichdi diet'],
    whenToSeeDoctor: 'Immediate medical consult required for antibiotic prescription and blood culture.',
    severity: 'Moderate',
  },
];

/** GET /api/diseases — Retrieve all diseases */
export const getAllDiseases = async () => {
  try {
    const res = await client.get('/api/diseases');
    if (Array.isArray(res.data) && res.data.length > 0) return res.data;
    return FALLBACK_DISEASES;
  } catch (err) {
    console.warn('Backend /api/diseases unreachable, returning clinical disease encyclopedia:', err.message);
    return FALLBACK_DISEASES;
  }
};

/** GET /api/diseases/category/{category} — Filter diseases by category */
export const getDiseasesByCategory = async (category) => {
  try {
    const res = await client.get(`/api/diseases/category/${encodeURIComponent(category)}`);
    if (Array.isArray(res.data) && res.data.length > 0) return res.data;
    return FALLBACK_DISEASES.filter(d => (d.category || d.type || '').toLowerCase() === category.toLowerCase());
  } catch (err) {
    console.warn(`Backend diseases by category "${category}" fallback:`, err.message);
    return FALLBACK_DISEASES.filter(d => (d.category || d.type || '').toLowerCase() === category.toLowerCase());
  }
};

/** GET /api/diseases/transmission/{transmission} — Filter diseases by transmission type */
export const getDiseasesByTransmission = async (transmission) => {
  try {
    const res = await client.get(`/api/diseases/transmission/${encodeURIComponent(transmission)}`);
    if (Array.isArray(res.data) && res.data.length > 0) return res.data;
    return FALLBACK_DISEASES.filter(d => (d.transmission || '').toLowerCase().includes(transmission.toLowerCase()));
  } catch (err) {
    console.warn(`Backend diseases by transmission "${transmission}" fallback:`, err.message);
    return FALLBACK_DISEASES.filter(d => (d.transmission || '').toLowerCase().includes(transmission.toLowerCase()));
  }
};

/** GET /api/diseases/remedies/{diseaseName} — Retrieve remedies for a specific disease */
export const getDiseaseRemedies = async (diseaseName) => {
  try {
    const res = await client.get(`/api/diseases/remedies/${encodeURIComponent(diseaseName)}`);
    return res.data;
  } catch (err) {
    console.warn(`Backend remedies for "${diseaseName}" fallback:`, err.message);
    const d = FALLBACK_DISEASES.find(x => x.name.toLowerCase().includes(diseaseName.toLowerCase()));
    return d?.ayurvedicRemedies || d?.remedies || [];
  }
};

/** GET /api/diseases/{idOrName} — Retrieve a disease using its ID or name */
export const getDiseaseByIdOrName = async (idOrName) => {
  try {
    const res = await client.get(`/api/diseases/${encodeURIComponent(idOrName)}`);
    return res.data;
  } catch (err) {
    console.warn(`Backend disease "${idOrName}" fallback:`, err.message);
    const clean = idOrName.toLowerCase();
    const match = FALLBACK_DISEASES.find(d => d.id === idOrName || d.name.toLowerCase().includes(clean) || clean.includes(d.name.toLowerCase()));
    return match || FALLBACK_DISEASES[0];
  }
};
