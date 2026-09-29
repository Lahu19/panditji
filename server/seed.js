'use strict';
/**
 * Seed script — populates MongoDB with realistic categories, services,
 * service requirements, provider profiles, and geo hierarchy data.
 *
 * Run: node server/seed.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');

const Category             = require('./models/Category');
const Service              = require('./models/Service');
const User                 = require('./models/User');
const Provider             = require('./models/Provider');
const ProviderService      = require('./models/ProviderService');
const ProviderAvailability = require('./models/ProviderAvailability');
const ProviderServiceArea  = require('./models/ProviderServiceArea');
const GeoCountry           = require('./models/GeoCountry');
const GeoState             = require('./models/GeoState');
const GeoCity              = require('./models/GeoCity');
const GeoArea              = require('./models/GeoArea');

/* ════════════════════════════════════════════════════
   GEO HIERARCHY SEED DATA
   Structure: India → key states → key cities → areas
   Every _id follows the pattern:
     Country  : ISO 3166-1 alpha-2        "IN"
     State    : "<countryId>_<stateCode>" "IN_MP"
     City     : "<stateId>_<CITY>"        "IN_MP_INDORE"
     Area     : "<cityId>_<AREA>"         "IN_MP_INDORE_VIJAY_NAGAR"
════════════════════════════════════════════════════ */

const GEO_COUNTRIES = [
  {
    _id: 'IN', name: 'India', officialName: 'Republic of India',
    dialCode: '+91', currencyCode: 'INR', currencySymbol: '₹',
    languages: ['hi', 'en'], timezone: 'Asia/Kolkata', flagEmoji: '🇮🇳',
    isActive: true,
  },
];

const GEO_STATES = [
  { _id: 'IN_MP',  countryId: 'IN', name: 'Madhya Pradesh',  code: 'MP',  timezone: 'Asia/Kolkata', isActive: true },
  { _id: 'IN_MH',  countryId: 'IN', name: 'Maharashtra',      code: 'MH',  timezone: 'Asia/Kolkata', isActive: true },
  { _id: 'IN_RJ',  countryId: 'IN', name: 'Rajasthan',        code: 'RJ',  timezone: 'Asia/Kolkata', isActive: true },
  { _id: 'IN_GJ',  countryId: 'IN', name: 'Gujarat',          code: 'GJ',  timezone: 'Asia/Kolkata', isActive: true },
  { _id: 'IN_DL',  countryId: 'IN', name: 'Delhi',            code: 'DL',  timezone: 'Asia/Kolkata', isActive: true },
  { _id: 'IN_UP',  countryId: 'IN', name: 'Uttar Pradesh',    code: 'UP',  timezone: 'Asia/Kolkata', isActive: true },
  { _id: 'IN_KA',  countryId: 'IN', name: 'Karnataka',        code: 'KA',  timezone: 'Asia/Kolkata', isActive: true },
  { _id: 'IN_TN',  countryId: 'IN', name: 'Tamil Nadu',       code: 'TN',  timezone: 'Asia/Kolkata', isActive: true },
  { _id: 'IN_WB',  countryId: 'IN', name: 'West Bengal',      code: 'WB',  timezone: 'Asia/Kolkata', isActive: true },
  { _id: 'IN_PB',  countryId: 'IN', name: 'Punjab',           code: 'PB',  timezone: 'Asia/Kolkata', isActive: true },
];

const GEO_CITIES = [
  /* MP */
  { _id: 'IN_MP_INDORE',  stateId: 'IN_MP', countryId: 'IN', name: 'Indore',  aliases: ['Indaur'],           coordinates: { latitude: 22.7196, longitude: 75.8577 }, timezone: 'Asia/Kolkata', isActive: true },
  { _id: 'IN_MP_BHOPAL',  stateId: 'IN_MP', countryId: 'IN', name: 'Bhopal',  aliases: ['Bhopal City'],      coordinates: { latitude: 23.2599, longitude: 77.4126 }, timezone: 'Asia/Kolkata', isActive: true },
  { _id: 'IN_MP_UJJAIN',  stateId: 'IN_MP', countryId: 'IN', name: 'Ujjain',  aliases: ['Ujjain City'],      coordinates: { latitude: 23.1765, longitude: 75.7885 }, timezone: 'Asia/Kolkata', isActive: true },
  { _id: 'IN_MP_GWALIOR', stateId: 'IN_MP', countryId: 'IN', name: 'Gwalior', aliases: [],                   coordinates: { latitude: 26.2183, longitude: 78.1828 }, timezone: 'Asia/Kolkata', isActive: true },
  { _id: 'IN_MP_DEWAS',   stateId: 'IN_MP', countryId: 'IN', name: 'Dewas',   aliases: [],                   coordinates: { latitude: 22.9676, longitude: 76.0534 }, timezone: 'Asia/Kolkata', isActive: true },
  /* MH */
  { _id: 'IN_MH_PUNE',    stateId: 'IN_MH', countryId: 'IN', name: 'Pune',    aliases: ['Poona'],            coordinates: { latitude: 18.5204, longitude: 73.8567 }, timezone: 'Asia/Kolkata', isActive: true },
  { _id: 'IN_MH_MUMBAI',  stateId: 'IN_MH', countryId: 'IN', name: 'Mumbai',  aliases: ['Bombay'],           coordinates: { latitude: 19.0760, longitude: 72.8777 }, timezone: 'Asia/Kolkata', isActive: true },
  { _id: 'IN_MH_NASHIK',  stateId: 'IN_MH', countryId: 'IN', name: 'Nashik',  aliases: ['Nasik'],            coordinates: { latitude: 19.9975, longitude: 73.7898 }, timezone: 'Asia/Kolkata', isActive: true },
  { _id: 'IN_MH_NAGPUR',  stateId: 'IN_MH', countryId: 'IN', name: 'Nagpur',  aliases: [],                   coordinates: { latitude: 21.1458, longitude: 79.0882 }, timezone: 'Asia/Kolkata', isActive: true },
  /* DL */
  { _id: 'IN_DL_DELHI',   stateId: 'IN_DL', countryId: 'IN', name: 'New Delhi', aliases: ['Delhi'],          coordinates: { latitude: 28.6139, longitude: 77.2090 }, timezone: 'Asia/Kolkata', isActive: true },
  /* UP */
  { _id: 'IN_UP_VARANASI',stateId: 'IN_UP', countryId: 'IN', name: 'Varanasi', aliases: ['Kashi','Banaras'], coordinates: { latitude: 25.3176, longitude: 82.9739 }, timezone: 'Asia/Kolkata', isActive: true },
  { _id: 'IN_UP_LUCKNOW', stateId: 'IN_UP', countryId: 'IN', name: 'Lucknow',  aliases: [],                  coordinates: { latitude: 26.8467, longitude: 80.9462 }, timezone: 'Asia/Kolkata', isActive: true },
  /* GJ */
  { _id: 'IN_GJ_AHMEDABAD',stateId:'IN_GJ', countryId: 'IN', name: 'Ahmedabad',aliases: ['Amdavad'],         coordinates: { latitude: 23.0225, longitude: 72.5714 }, timezone: 'Asia/Kolkata', isActive: true },
  { _id: 'IN_GJ_SURAT',   stateId: 'IN_GJ', countryId: 'IN', name: 'Surat',   aliases: [],                   coordinates: { latitude: 21.1702, longitude: 72.8311 }, timezone: 'Asia/Kolkata', isActive: true },
  /* KA */
  { _id: 'IN_KA_BANGALORE',stateId:'IN_KA', countryId: 'IN', name: 'Bangalore',aliases: ['Bengaluru'],       coordinates: { latitude: 12.9716, longitude: 77.5946 }, timezone: 'Asia/Kolkata', isActive: true },
  /* TN */
  { _id: 'IN_TN_CHENNAI', stateId: 'IN_TN', countryId: 'IN', name: 'Chennai', aliases: ['Madras'],           coordinates: { latitude: 13.0827, longitude: 80.2707 }, timezone: 'Asia/Kolkata', isActive: true },
];

/* ── Areas — detailed coverage for Indore (primary city in seed data) ── */
const GEO_AREAS = [
  /* Indore areas — matches existing provider serviceAreas strings */
  { _id: 'IN_MP_INDORE_VIJAY_NAGAR',    cityId: 'IN_MP_INDORE', stateId: 'IN_MP', countryId: 'IN', name: 'Vijay Nagar',    aliases: ['Vijaynagar','VN'],           postalCode: '452010', coordinates: { latitude: 22.7533, longitude: 75.8937 }, geoPoint: { type: 'Point', coordinates: [75.8937, 22.7533] }, isActive: true },
  { _id: 'IN_MP_INDORE_PALASIA',        cityId: 'IN_MP_INDORE', stateId: 'IN_MP', countryId: 'IN', name: 'Palasia',        aliases: ['Palasiya'],                  postalCode: '452001', coordinates: { latitude: 22.7177, longitude: 75.8659 }, geoPoint: { type: 'Point', coordinates: [75.8659, 22.7177] }, isActive: true },
  { _id: 'IN_MP_INDORE_RAU',            cityId: 'IN_MP_INDORE', stateId: 'IN_MP', countryId: 'IN', name: 'Rau',            aliases: ['Raau'],                      postalCode: '453331', coordinates: { latitude: 22.6333, longitude: 75.8303 }, geoPoint: { type: 'Point', coordinates: [75.8303, 22.6333] }, isActive: true },
  { _id: 'IN_MP_INDORE_BHANWARKUAN',    cityId: 'IN_MP_INDORE', stateId: 'IN_MP', countryId: 'IN', name: 'Bhanwarkuan',    aliases: ['Bhanwar Kuan'],              postalCode: '452001', coordinates: { latitude: 22.6987, longitude: 75.8341 }, geoPoint: { type: 'Point', coordinates: [75.8341, 22.6987] }, isActive: true },
  { _id: 'IN_MP_INDORE_RAJENDRA_NAGAR', cityId: 'IN_MP_INDORE', stateId: 'IN_MP', countryId: 'IN', name: 'Rajendra Nagar', aliases: ['Rajendranagar','Raj Nagar'], postalCode: '452012', coordinates: { latitude: 22.6868, longitude: 75.8561 }, geoPoint: { type: 'Point', coordinates: [75.8561, 22.6868] }, isActive: true },
  { _id: 'IN_MP_INDORE_SCHEME_78',      cityId: 'IN_MP_INDORE', stateId: 'IN_MP', countryId: 'IN', name: 'Scheme 78',      aliases: ['Scheme No 78','LIG Colony'],  postalCode: '452010', coordinates: { latitude: 22.7381, longitude: 75.9082 }, geoPoint: { type: 'Point', coordinates: [75.9082, 22.7381] }, isActive: true },
  { _id: 'IN_MP_INDORE_MG_ROAD',        cityId: 'IN_MP_INDORE', stateId: 'IN_MP', countryId: 'IN', name: 'MG Road',        aliases: ['Mahatma Gandhi Road'],       postalCode: '452001', coordinates: { latitude: 22.7181, longitude: 75.8539 }, geoPoint: { type: 'Point', coordinates: [75.8539, 22.7181] }, isActive: true },
  { _id: 'IN_MP_INDORE_DEWAS_ROAD',     cityId: 'IN_MP_INDORE', stateId: 'IN_MP', countryId: 'IN', name: 'Dewas Road',     aliases: ['AB Road','Dewas Naka'],      postalCode: '452001', coordinates: { latitude: 22.7452, longitude: 75.8786 }, geoPoint: { type: 'Point', coordinates: [75.8786, 22.7452] }, isActive: true },
  { _id: 'IN_MP_INDORE_SUPER_CORRIDOR', cityId: 'IN_MP_INDORE', stateId: 'IN_MP', countryId: 'IN', name: 'Super Corridor', aliases: ['IT Park','Bypass Road'],     postalCode: '453771', coordinates: { latitude: 22.7578, longitude: 75.9285 }, geoPoint: { type: 'Point', coordinates: [75.9285, 22.7578] }, isActive: true },
  { _id: 'IN_MP_INDORE_SOUTH_TUKOGANJ', cityId: 'IN_MP_INDORE', stateId: 'IN_MP', countryId: 'IN', name: 'South Tukoganj', aliases: ['Tukoganj'],                  postalCode: '452001', coordinates: { latitude: 22.7182, longitude: 75.8617 }, geoPoint: { type: 'Point', coordinates: [75.8617, 22.7182] }, isActive: true },
  /* Bhopal areas */
  { _id: 'IN_MP_BHOPAL_NEW_MARKET',     cityId: 'IN_MP_BHOPAL', stateId: 'IN_MP', countryId: 'IN', name: 'New Market',     aliases: ['Newmarket'],                 postalCode: '462003', coordinates: { latitude: 23.2378, longitude: 77.4040 }, geoPoint: { type: 'Point', coordinates: [77.4040, 23.2378] }, isActive: true },
  { _id: 'IN_MP_BHOPAL_ARERA_COLONY',   cityId: 'IN_MP_BHOPAL', stateId: 'IN_MP', countryId: 'IN', name: 'Arera Colony',   aliases: ['Arera Hills'],               postalCode: '462016', coordinates: { latitude: 23.2185, longitude: 77.4512 }, geoPoint: { type: 'Point', coordinates: [77.4512, 23.2185] }, isActive: true },
  /* Pune areas */
  { _id: 'IN_MH_PUNE_KOREGAON_PARK',    cityId: 'IN_MH_PUNE',   stateId: 'IN_MH', countryId: 'IN', name: 'Koregaon Park',  aliases: ['KP'],                        postalCode: '411001', coordinates: { latitude: 18.5362, longitude: 73.8926 }, geoPoint: { type: 'Point', coordinates: [73.8926, 18.5362] }, isActive: true },
  { _id: 'IN_MH_PUNE_KOTHRUD',          cityId: 'IN_MH_PUNE',   stateId: 'IN_MH', countryId: 'IN', name: 'Kothrud',        aliases: [],                            postalCode: '411038', coordinates: { latitude: 18.5074, longitude: 73.8077 }, geoPoint: { type: 'Point', coordinates: [73.8077, 18.5074] }, isActive: true },
  /* Mumbai areas */
  { _id: 'IN_MH_MUMBAI_ANDHERI',        cityId: 'IN_MH_MUMBAI', stateId: 'IN_MH', countryId: 'IN', name: 'Andheri',        aliases: ['Andheri West','Andheri East'],postalCode: '400053', coordinates: { latitude: 19.1136, longitude: 72.8697 }, geoPoint: { type: 'Point', coordinates: [72.8697, 19.1136] }, isActive: true },
  { _id: 'IN_MH_MUMBAI_THANE',          cityId: 'IN_MH_MUMBAI', stateId: 'IN_MH', countryId: 'IN', name: 'Thane',          aliases: ['Thane City'],                postalCode: '400601', coordinates: { latitude: 19.2183, longitude: 72.9781 }, geoPoint: { type: 'Point', coordinates: [72.9781, 19.2183] }, isActive: true },
];

/* ── Seed data ── */
const CATEGORIES_DATA = [
  { name: 'Home & Property', slug: 'home',      icon: '🏠', color: '#FF6B00', description: 'Griha Pravesh · Vastu · Bhoomi Pujan', displayOrder: 1 },
  { name: 'Wedding',          slug: 'wedding',   icon: '💍', color: '#E91E8C', description: 'Wedding · Engagement · Rituals',         displayOrder: 2 },
  { name: 'Family & Life',    slug: 'family',    icon: '👶', color: '#9C27B0', description: 'Naamkaran · Mundan · Upanayan',           displayOrder: 3 },
  { name: 'Puja & Festivals', slug: 'festival',  icon: '🪔', color: '#D4AF37', description: 'Ganesh · Lakshmi · Satyanarayan',        displayOrder: 4 },
  { name: 'Havan & Yagna',    slug: 'havan',     icon: '🔥', color: '#CC231E', description: 'Havan · Yagna · Anushthan',              displayOrder: 5 },
  { name: 'Corporate',        slug: 'corporate', icon: '🏢', color: '#1565C0', description: 'Office · Bhoomi Pujan · Events',         displayOrder: 6 },
];

const SERVICES_DATA = [
  /* Home */
  { catSlug: 'home',      name: 'Griha Pravesh',         slug: 'griha-pravesh',    serviceType: 'HOME_PUJA',  duration: { min: 120, max: 180, label: '2–3 hrs' }, pricing: { model: 'STARTING_FROM', startingFrom: 1800 }, isBookable: true,
    requirementFields: [
      { key: 'eventDate',  label: 'When is the ceremony?',    type: 'DATE',   required: true },
      { key: 'eventTime',  label: 'Preferred time?',          type: 'TIME',   required: true },
      { key: 'language',   label: 'Language preference?',     type: 'SELECT', options: ['Hindi','Marathi','Sanskrit','English','No preference'] },
      { key: 'samagri',    label: 'Should Pandit arrange Samagri?', type: 'BOOLEAN' },
      { key: 'budget',     label: 'Approximate budget?',      type: 'SELECT', options: ['Under ₹1,500','₹1,500–₹3,000','₹3,000+','No preference'] },
    ]},
  { catSlug: 'home',      name: 'Vastu Puja',            slug: 'vastu-puja',       serviceType: 'HOME_PUJA',  duration: { min: 60,  max: 120, label: '1–2 hrs' }, pricing: { model: 'STARTING_FROM', startingFrom: 1200 }, isBookable: true, requirementFields: [{ key: 'eventDate', label: 'When?', type: 'DATE', required: true }, { key: 'language', label: 'Language?', type: 'SELECT', options: ['Hindi','Marathi','Sanskrit','English'] }] },
  { catSlug: 'home',      name: 'Bhoomi Pujan',          slug: 'bhoomi-pujan',     serviceType: 'HOME_PUJA',  duration: { min: 120, max: 180, label: '2–3 hrs' }, pricing: { model: 'STARTING_FROM', startingFrom: 2000 }, isBookable: true, requirementFields: [] },
  { catSlug: 'home',      name: 'Satyanarayan Puja',     slug: 'satyanarayan',     serviceType: 'HOME_PUJA',  duration: { min: 120, max: 120, label: '2 hrs'   }, pricing: { model: 'STARTING_FROM', startingFrom: 1500 }, isBookable: true, requirementFields: [] },
  { catSlug: 'home',      name: 'Ganesh Puja',           slug: 'ganesh-home',      serviceType: 'HOME_PUJA',  duration: { min: 60,  max: 60,  label: '1 hr'    }, pricing: { model: 'STARTING_FROM', startingFrom: 800  }, isBookable: true, requirementFields: [] },
  { catSlug: 'home',      name: 'Lakshmi Puja',          slug: 'lakshmi-home',     serviceType: 'HOME_PUJA',  duration: { min: 60,  max: 60,  label: '1 hr'    }, pricing: { model: 'STARTING_FROM', startingFrom: 900  }, isBookable: true, requirementFields: [] },
  /* Wedding */
  { catSlug: 'wedding',   name: 'Wedding Ceremony',      slug: 'wedding-ceremony', serviceType: 'WEDDING',    duration: { min: 240, max: 360, label: '4–6 hrs' }, pricing: { model: 'STARTING_FROM', startingFrom: 5000 }, isBookable: false, isRequestBased: true, requirementFields: [{ key: 'eventDate', label: 'Wedding date?', type: 'DATE', required: true }, { key: 'language', label: 'Language?', type: 'SELECT', options: ['Hindi','Marathi','Sanskrit','English'] }, { key: 'panditCount', label: 'Number of Pandits?', type: 'NUMBER' }] },
  { catSlug: 'wedding',   name: 'Engagement Ceremony',   slug: 'engagement',       serviceType: 'WEDDING',    duration: { min: 120, max: 180, label: '2–3 hrs' }, pricing: { model: 'STARTING_FROM', startingFrom: 2500 }, isBookable: true, requirementFields: [] },
  /* Family */
  { catSlug: 'family',    name: 'Naamkaran',             slug: 'naamkaran',        serviceType: 'FAMILY',     duration: { min: 60,  max: 120, label: '1–2 hrs' }, pricing: { model: 'STARTING_FROM', startingFrom: 1000 }, isBookable: true, requirementFields: [] },
  { catSlug: 'family',    name: 'Mundan Ceremony',       slug: 'mundan',           serviceType: 'FAMILY',     duration: { min: 60,  max: 60,  label: '1 hr'    }, pricing: { model: 'STARTING_FROM', startingFrom: 1200 }, isBookable: true, requirementFields: [] },
  { catSlug: 'family',    name: 'Upanayan (Janeu)',       slug: 'upanayan',         serviceType: 'FAMILY',     duration: { min: 180, max: 240, label: '3–4 hrs' }, pricing: { model: 'STARTING_FROM', startingFrom: 3000 }, isBookable: true, requirementFields: [] },
  /* Festival */
  { catSlug: 'festival',  name: 'Ganesh Chaturthi Puja', slug: 'ganesh-chaturthi', serviceType: 'FESTIVAL',   duration: { min: 120, max: 120, label: '2 hrs'   }, pricing: { model: 'STARTING_FROM', startingFrom: 1200 }, isBookable: true, requirementFields: [] },
  { catSlug: 'festival',  name: 'Lakshmi Puja',          slug: 'lakshmi-puja',     serviceType: 'FESTIVAL',   duration: { min: 60,  max: 60,  label: '1 hr'    }, pricing: { model: 'STARTING_FROM', startingFrom: 900  }, isBookable: true, requirementFields: [] },
  { catSlug: 'festival',  name: 'Diwali Puja',           slug: 'diwali-puja',      serviceType: 'FESTIVAL',   duration: { min: 60,  max: 60,  label: '1 hr'    }, pricing: { model: 'STARTING_FROM', startingFrom: 800  }, isBookable: true, requirementFields: [] },
  { catSlug: 'festival',  name: 'Navratri Puja',         slug: 'navratri',         serviceType: 'FESTIVAL',   duration: { min: 60,  max: 60,  label: '1 hr'    }, pricing: { model: 'STARTING_FROM', startingFrom: 1000 }, isBookable: true, requirementFields: [] },
  /* Havan */
  { catSlug: 'havan',     name: 'Havan',                 slug: 'havan',            serviceType: 'HAVAN_YAGNA', duration: { min: 120, max: 180, label: '2–3 hrs' }, pricing: { model: 'STARTING_FROM', startingFrom: 2500 }, isBookable: true, requirementFields: [{ key: 'eventDate', label: 'When?', type: 'DATE', required: true }, { key: 'language', label: 'Language?', type: 'SELECT', options: ['Hindi','Marathi','Sanskrit','English'] }, { key: 'samagri', label: 'Pandit arranges Samagri?', type: 'BOOLEAN' }] },
  { catSlug: 'havan',     name: 'Yagna',                 slug: 'yagna',            serviceType: 'HAVAN_YAGNA', duration: { min: 240, max: 360, label: '4–6 hrs' }, pricing: { model: 'STARTING_FROM', startingFrom: 5000 }, isBookable: false, isRequestBased: true, requirementFields: [] },
  { catSlug: 'havan',     name: 'Navgraha Puja',         slug: 'navgraha',         serviceType: 'HAVAN_YAGNA', duration: { min: 120, max: 180, label: '2–3 hrs' }, pricing: { model: 'STARTING_FROM', startingFrom: 2000 }, isBookable: true, requirementFields: [] },
  { catSlug: 'havan',     name: 'Rudrabhishek',          slug: 'rudrabhishek',     serviceType: 'HAVAN_YAGNA', duration: { min: 120, max: 120, label: '2 hrs'   }, pricing: { model: 'STARTING_FROM', startingFrom: 2200 }, isBookable: true, requirementFields: [] },
  /* Corporate */
  { catSlug: 'corporate', name: 'Office Inauguration',   slug: 'office-inaug',     serviceType: 'CORPORATE',  duration: { min: 120, max: 180, label: '2–3 hrs' }, pricing: { model: 'STARTING_FROM', startingFrom: 3000 }, isBookable: true, requirementFields: [] },
  { catSlug: 'corporate', name: 'Factory Inauguration',  slug: 'factory-inaug',    serviceType: 'CORPORATE',  duration: { min: 180, max: 240, label: '3–4 hrs' }, pricing: { model: 'STARTING_FROM', startingFrom: 4500 }, isBookable: true, requirementFields: [] },
  { catSlug: 'corporate', name: 'Corporate Diwali Puja', slug: 'corp-diwali',      serviceType: 'CORPORATE',  duration: { min: 60,  max: 120, label: '1–2 hrs' }, pricing: { model: 'STARTING_FROM', startingFrom: 2500 }, isBookable: true, requirementFields: [] },
  { catSlug: 'corporate', name: 'Corporate Ganesh Puja', slug: 'corp-ganesh',      serviceType: 'CORPORATE',  duration: { min: 60,  max: 60,  label: '1 hr'    }, pricing: { model: 'STARTING_FROM', startingFrom: 1800 }, isBookable: true, requirementFields: [] },
];

const PROVIDERS_DATA = [
  {
    name:     'Pandit Rajesh Sharma',
    email:    'rajesh.sharma@panditji.dev',
    password: 'Password123!',
    provider: {
      providerType: 'INDIVIDUAL',
      displayName: 'Pandit Rajesh Sharma',
      profile: { about: 'Trained in traditional Vedic rituals with 14 years of experience across home, wedding, and corporate ceremonies.', experienceYears: 14, languages: ['Hindi','Marathi','Sanskrit'], traditions: ['Vedic (Madhya Pradesh)'] },
      serviceAreas: ['Indore','Rau','Vijay Nagar','Dewas Road'],
      location: { type: 'Point', coordinates: [75.8577, 22.7196], city: 'Indore', state: 'Madhya Pradesh', country: 'IN' },
      pricing: { startingFrom: 1500, currency: 'INR', breakdown: { pandit: 1500, samagri: 400, travel: 100, platform: 100 } },
      capabilities: { samagriAvailable: true, supportsMultiplePandits: true, acceptsCorporateBookings: true, acceptsNriBookings: true },
      ratingSummary: { overall: 4.9, punctuality: 4.8, communication: 4.9, serviceQuality: 4.9, professionalism: 4.8, count: 127 },
      bookingSummary: { total: 143, completed: 139, cancelled: 2, repeatCustomers: 27 },
      badges: ['100+ Bookings','Video Portfolio','Samagri Available'],
      verificationStatus: 'VERIFIED',
      status: 'ACTIVE',
      serviceSlugs: ['griha-pravesh','satyanarayan','havan','wedding-ceremony','ganesh-chaturthi','navgraha','vastu-puja','bhoomi-pujan'],
    },
  },
  {
    name:     'Pandit Mahesh Joshi',
    email:    'mahesh.joshi@panditji.dev',
    password: 'Password123!',
    provider: {
      providerType: 'INDIVIDUAL',
      displayName: 'Pandit Mahesh Joshi',
      profile: { about: 'Specialises in home ceremonies and family events. Fluent in English, making rituals accessible to all generations.', experienceYears: 8, languages: ['Hindi','Sanskrit','English'], traditions: ['Vedic'] },
      serviceAreas: ['Indore','Palasia','Scheme 78'],
      location: { type: 'Point', coordinates: [75.8654, 22.7231], city: 'Indore', state: 'Madhya Pradesh', country: 'IN' },
      pricing: { startingFrom: 1200, currency: 'INR', breakdown: { pandit: 1200, samagri: 350, travel: 80, platform: 100 } },
      capabilities: { samagriAvailable: true, supportsMultiplePandits: false, acceptsCorporateBookings: false, acceptsNriBookings: true },
      ratingSummary: { overall: 4.7, punctuality: 4.7, communication: 4.8, serviceQuality: 4.7, professionalism: 4.6, count: 84 },
      bookingSummary: { total: 96, completed: 94, cancelled: 2, repeatCustomers: 14 },
      badges: ['English Speaking','Samagri Available'],
      verificationStatus: 'VERIFIED',
      status: 'ACTIVE',
      serviceSlugs: ['griha-pravesh','ganesh-chaturthi','lakshmi-puja','naamkaran','havan','diwali-puja','lakshmi-home'],
    },
  },
  {
    name:     'Pandit Suresh Dwivedi',
    email:    'suresh.dwivedi@panditji.dev',
    password: 'Password123!',
    provider: {
      providerType: 'INDIVIDUAL',
      displayName: 'Pandit Suresh Dwivedi',
      profile: { about: '22 years experience with specialisation in weddings, yagnas, and complex Vedic ceremonies. Trained in Kashi tradition.', experienceYears: 22, languages: ['Hindi','Sanskrit','Marathi'], traditions: ['Vedic (Kashi tradition)'] },
      serviceAreas: ['Indore','Ujjain','Dewas','Dhar'],
      location: { type: 'Point', coordinates: [75.7849, 22.6873], city: 'Indore', state: 'Madhya Pradesh', country: 'IN' },
      pricing: { startingFrom: 2000, currency: 'INR', breakdown: { pandit: 2500, samagri: 0, travel: 150, platform: 100 } },
      capabilities: { samagriAvailable: false, supportsMultiplePandits: true, acceptsCorporateBookings: true, acceptsNriBookings: true },
      ratingSummary: { overall: 4.8, punctuality: 4.9, communication: 4.7, serviceQuality: 4.9, professionalism: 4.9, count: 210 },
      bookingSummary: { total: 248, completed: 246, cancelled: 2, repeatCustomers: 52 },
      badges: ['200+ Bookings','Wedding Specialist','Senior Pandit'],
      verificationStatus: 'VERIFIED',
      status: 'ACTIVE',
      serviceSlugs: ['wedding-ceremony','havan','yagna','navgraha','rudrabhishek','upanayan','office-inaug','corp-diwali','corp-ganesh'],
    },
  },
];

async function seed() {
  console.log('🌱 Connecting to MongoDB…');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  console.log('✅ Connected');

  /* ══════════════════════════════════════════
     GEO HIERARCHY
  ══════════════════════════════════════════ */
  console.log('\n🌏 Seeding geo hierarchy…');

  for (const c of GEO_COUNTRIES) {
    await GeoCountry.findOneAndUpdate(
      { _id: c._id },
      { $setOnInsert: c },
      { upsert: true, new: true }
    );
  }
  console.log(`   ✓ ${GEO_COUNTRIES.length} countries`);

  for (const s of GEO_STATES) {
    await GeoState.findOneAndUpdate(
      { _id: s._id },
      { $setOnInsert: s },
      { upsert: true, new: true }
    );
  }
  console.log(`   ✓ ${GEO_STATES.length} states`);

  for (const c of GEO_CITIES) {
    await GeoCity.findOneAndUpdate(
      { _id: c._id },
      { $setOnInsert: c },
      { upsert: true, new: true }
    );
  }
  console.log(`   ✓ ${GEO_CITIES.length} cities`);

  for (const a of GEO_AREAS) {
    await GeoArea.findOneAndUpdate(
      { _id: a._id },
      { $setOnInsert: a },
      { upsert: true, new: true }
    );
  }
  console.log(`   ✓ ${GEO_AREAS.length} areas`);

  /* ── Ensure 2dsphere index is created before $near queries ── */
  await GeoArea.ensureIndexes();

  /* ── Categories ── */
  console.log('\n📂 Seeding categories…');
  const catMap = {};
  for (const c of CATEGORIES_DATA) {
    const cat = await Category.findOneAndUpdate(
      { slug: c.slug },
      { $setOnInsert: { ...c, isActive: true } },
      { upsert: true, new: true }
    );
    catMap[c.slug] = cat._id;
    console.log(`   ✓ ${c.name}`);
  }

  /* ── Services ── */
  console.log('\n📋 Seeding services…');
  const svcMap = {};
  for (const s of SERVICES_DATA) {
    const { catSlug, ...svcData } = s;
    const svc = await Service.findOneAndUpdate(
      { slug: svcData.slug },
      { $setOnInsert: { ...svcData, categoryId: catMap[catSlug], isActive: true } },
      { upsert: true, new: true }
    );
    svcMap[svcData.slug] = svc._id;
    console.log(`   ✓ ${svcData.name}`);
  }

  /* ── Providers ── */
  console.log('\n👤 Seeding providers…');
  for (const pd of PROVIDERS_DATA) {
    /* Create or find user */
    let user = await User.findOne({ 'contact.email': pd.email }).select('+passwordHash');
    if (!user) {
      user = new User({
        userType: 'PROVIDER',
        profile: { displayName: pd.name, firstName: pd.name.split(' ')[1] || pd.name, lastName: pd.name.split(' ').slice(2).join(' ') },
        contact: { email: pd.email },
        status: 'ACTIVE',
      });
      await user.setPassword(pd.password);
      await user.save();
    }

    /* Resolve service IDs from slugs */
    const { serviceSlugs, ...provData } = pd.provider;
    const serviceIds = serviceSlugs.map(s => svcMap[s]).filter(Boolean);

    /* Create or update provider */
    const provider = await Provider.findOneAndUpdate(
      { userId: user._id },
      {
        $setOnInsert: {
          ...provData,
          userId: user._id,
          serviceIds,
        },
      },
      { upsert: true, new: true }
    );

    /* Create ProviderService records */
    for (const slug of serviceSlugs) {
      const svcId = svcMap[slug];
      if (!svcId) continue;
      await ProviderService.findOneAndUpdate(
        { providerId: provider._id, serviceId: svcId },
        {
          $setOnInsert: {
            providerId: provider._id,
            serviceId:  svcId,
            pricing: { model: 'STARTING_FROM', startingPrice: provData.pricing.startingFrom, currency: 'INR' },
            capabilities: { providesSamagri: provData.capabilities.samagriAvailable },
            status: 'ACTIVE',
          },
        },
        { upsert: true, new: true }
      );
    }

    /* Create availability record — Mon-Sat 8am-7pm */
    await ProviderAvailability.findOneAndUpdate(
      { providerId: provider._id },
      {
        $setOnInsert: {
          providerId: provider._id,
          workingHours: [1,2,3,4,5,6].map(d => ({ dayOfWeek: d, startTime: '08:00', endTime: '19:00', isActive: true })),
          blockedRanges: [],
          bookedSlots: [],
          maxDailyConcurrent: 2,
          bookingWindowDays: 60,
          minimumNoticeHours: 24,
        },
      },
      { upsert: true, new: true }
    );

    console.log(`   ✓ ${pd.name} (${serviceIds.length} services)`);
  }

  /* ── Backfill Provider geo IDs for the seeded providers ── */
  console.log('\n📍 Backfilling provider geo IDs and service areas…');
  const indoreProvider = await Provider.findOne({ 'location.city': 'Indore' }).limit(1);
  if (indoreProvider) {
    /* Update all Indore-based providers with normalized geo IDs */
    await Provider.updateMany(
      { 'location.city': 'Indore' },
      {
        $set: {
          'location.cityId':    'IN_MP_INDORE',
          'location.stateId':   'IN_MP',
          'location.countryId': 'IN',
        },
      }
    );

    /* Seed ProviderServiceArea records for each seeded provider */
    const providers = await Provider.find({ 'location.city': 'Indore' });
    for (const prov of providers) {
      /* City-wide coverage for Indore */
      await ProviderServiceArea.findOneAndUpdate(
        { providerId: prov._id, locationId: 'IN_MP_INDORE', locationType: 'CITY' },
        {
          $setOnInsert: {
            providerId:  prov._id,
            locationType:'CITY',
            locationId:  'IN_MP_INDORE',
            label:       'Indore City',
            travelCharge:{ model: 'FREE' },
            isActive:    true,
          },
        },
        { upsert: true, new: true }
      );

      /* 30 km radius from city centre */
      await ProviderServiceArea.findOneAndUpdate(
        { providerId: prov._id, locationType: 'RADIUS' },
        {
          $setOnInsert: {
            providerId:   prov._id,
            locationType: 'RADIUS',
            radiusKm:     30,
            centerPoint:  { type: 'Point', coordinates: [75.8577, 22.7196] },
            label:        '30 km radius from Indore',
            travelCharge: { model: 'PER_KM', perKmAmount: 10, freeUpToKm: 10 },
            isActive:     true,
          },
        },
        { upsert: true, new: true }
      );
    }
    console.log(`   ✓ ${providers.length} providers updated with geo IDs and service areas`);
  }

  /* ── Admin user ── */
  console.log('\n🔑 Creating admin user…');
  let admin = await User.findOne({ 'contact.email': 'admin@panditji.dev' }).select('+passwordHash');
  if (!admin) {
    admin = new User({
      userType: 'ADMIN',
      profile: { displayName: 'Admin', firstName: 'Admin' },
      contact: { email: 'admin@panditji.dev' },
      status: 'ACTIVE',
    });
    await admin.setPassword('Admin@123!');
    await admin.save();
    console.log('   ✓ admin@panditji.dev / Admin@123!');
  } else {
    console.log('   ✓ Admin already exists');
  }

  /* ── Summary ── */
  const [cats, svcs, provs, users, areas, gCities] = await Promise.all([
    Category.countDocuments(),
    Service.countDocuments(),
    Provider.countDocuments(),
    User.countDocuments(),
    GeoArea.countDocuments(),
    GeoCity.countDocuments(),
  ]);
  console.log(`\n✅ Seed complete!`);
  console.log(`   Categories: ${cats}`);
  console.log(`   Services:   ${svcs}`);
  console.log(`   Providers:  ${provs}`);
  console.log(`   Users:      ${users}`);
  console.log(`   Geo Cities: ${gCities}`);
  console.log(`   Geo Areas:  ${areas}`);
  console.log('\n   Admin login:    admin@panditji.dev  / Admin@123!');
  console.log('   Provider login: rajesh.sharma@panditji.dev / Password123!');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
