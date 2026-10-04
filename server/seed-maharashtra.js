'use strict';
/**
 * Maharashtra seed — adds ~20 realistic Pandit profiles for
 * Pune, Kolhapur, Sangli, Nashik, Aurangabad and nearby areas.
 *
 * Run: node server/seed-maharashtra.js
 *
 * Password for every pandit: Pandit@123
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
const GeoState             = require('./models/GeoState');
const GeoCity              = require('./models/GeoCity');
const GeoArea              = require('./models/GeoArea');
const GeoCountry           = require('./models/GeoCountry');

/* ══════════════════════════════════════════
   NEW GEO DATA — Maharashtra cities & areas
   (Kolhapur, Sangli, Aurangabad + more Pune
    and Nashik areas not in original seed)
══════════════════════════════════════════ */

const NEW_CITIES = [
  {
    _id: 'IN_MH_KOLHAPUR',
    stateId: 'IN_MH', countryId: 'IN',
    name: 'Kolhapur', aliases: ['Kolhapoor', 'Karveer'],
    coordinates: { latitude: 16.7050, longitude: 74.2433 },
    timezone: 'Asia/Kolkata', isActive: true,
  },
  {
    _id: 'IN_MH_SANGLI',
    stateId: 'IN_MH', countryId: 'IN',
    name: 'Sangli', aliases: ['Sangali'],
    coordinates: { latitude: 16.8524, longitude: 74.5815 },
    timezone: 'Asia/Kolkata', isActive: true,
  },
  {
    _id: 'IN_MH_AURANGABAD',
    stateId: 'IN_MH', countryId: 'IN',
    name: 'Aurangabad', aliases: ['Chhatrapati Sambhajinagar'],
    coordinates: { latitude: 19.8762, longitude: 75.3433 },
    timezone: 'Asia/Kolkata', isActive: true,
  },
  {
    _id: 'IN_MH_SOLAPUR',
    stateId: 'IN_MH', countryId: 'IN',
    name: 'Solapur', aliases: ['Sholapur'],
    coordinates: { latitude: 17.6805, longitude: 75.9064 },
    timezone: 'Asia/Kolkata', isActive: true,
  },
];

const NEW_AREAS = [
  /* ── Pune ── */
  {
    _id: 'IN_MH_PUNE_SHIVAJINAGAR',
    cityId: 'IN_MH_PUNE', stateId: 'IN_MH', countryId: 'IN',
    name: 'Shivajinagar', aliases: ['Shivaji Nagar'],
    postalCode: '411005',
    coordinates: { latitude: 18.5308, longitude: 73.8475 },
    geoPoint: { type: 'Point', coordinates: [73.8475, 18.5308] },
    isActive: true,
  },
  {
    _id: 'IN_MH_PUNE_DECCAN',
    cityId: 'IN_MH_PUNE', stateId: 'IN_MH', countryId: 'IN',
    name: 'Deccan Gymkhana', aliases: ['Deccan'],
    postalCode: '411004',
    coordinates: { latitude: 18.5167, longitude: 73.8408 },
    geoPoint: { type: 'Point', coordinates: [73.8408, 18.5167] },
    isActive: true,
  },
  {
    _id: 'IN_MH_PUNE_HADAPSAR',
    cityId: 'IN_MH_PUNE', stateId: 'IN_MH', countryId: 'IN',
    name: 'Hadapsar', aliases: ['Hadapsar Gaon'],
    postalCode: '411028',
    coordinates: { latitude: 18.4997, longitude: 73.9254 },
    geoPoint: { type: 'Point', coordinates: [73.9254, 18.4997] },
    isActive: true,
  },
  {
    _id: 'IN_MH_PUNE_WAKAD',
    cityId: 'IN_MH_PUNE', stateId: 'IN_MH', countryId: 'IN',
    name: 'Wakad', aliases: ['Wakad Phata'],
    postalCode: '411057',
    coordinates: { latitude: 18.5975, longitude: 73.7618 },
    geoPoint: { type: 'Point', coordinates: [73.7618, 18.5975] },
    isActive: true,
  },
  {
    _id: 'IN_MH_PUNE_PIMPRI',
    cityId: 'IN_MH_PUNE', stateId: 'IN_MH', countryId: 'IN',
    name: 'Pimpri-Chinchwad', aliases: ['Pimpri', 'PCMC'],
    postalCode: '411017',
    coordinates: { latitude: 18.6279, longitude: 73.8009 },
    geoPoint: { type: 'Point', coordinates: [73.8009, 18.6279] },
    isActive: true,
  },
  {
    _id: 'IN_MH_PUNE_BANER',
    cityId: 'IN_MH_PUNE', stateId: 'IN_MH', countryId: 'IN',
    name: 'Baner', aliases: ['Baner Road'],
    postalCode: '411045',
    coordinates: { latitude: 18.5590, longitude: 73.7868 },
    geoPoint: { type: 'Point', coordinates: [73.7868, 18.5590] },
    isActive: true,
  },
  {
    _id: 'IN_MH_PUNE_AUNDH',
    cityId: 'IN_MH_PUNE', stateId: 'IN_MH', countryId: 'IN',
    name: 'Aundh', aliases: ['Aundh Road'],
    postalCode: '411007',
    coordinates: { latitude: 18.5648, longitude: 73.8075 },
    geoPoint: { type: 'Point', coordinates: [73.8075, 18.5648] },
    isActive: true,
  },
  /* ── Kolhapur ── */
  {
    _id: 'IN_MH_KOLHAPUR_MAHADWAR',
    cityId: 'IN_MH_KOLHAPUR', stateId: 'IN_MH', countryId: 'IN',
    name: 'Mahadwar Road', aliases: ['Mahadwar'],
    postalCode: '416001',
    coordinates: { latitude: 16.7081, longitude: 74.2350 },
    geoPoint: { type: 'Point', coordinates: [74.2350, 16.7081] },
    isActive: true,
  },
  {
    _id: 'IN_MH_KOLHAPUR_TARABAI',
    cityId: 'IN_MH_KOLHAPUR', stateId: 'IN_MH', countryId: 'IN',
    name: 'Tarabai Park', aliases: ['Tarabai'],
    postalCode: '416003',
    coordinates: { latitude: 16.7076, longitude: 74.2636 },
    geoPoint: { type: 'Point', coordinates: [74.2636, 16.7076] },
    isActive: true,
  },
  {
    _id: 'IN_MH_KOLHAPUR_SHAHUPURI',
    cityId: 'IN_MH_KOLHAPUR', stateId: 'IN_MH', countryId: 'IN',
    name: 'Shahupuri', aliases: ['Shahu Puri'],
    postalCode: '416001',
    coordinates: { latitude: 16.7007, longitude: 74.2334 },
    geoPoint: { type: 'Point', coordinates: [74.2334, 16.7007] },
    isActive: true,
  },
  /* ── Sangli ── */
  {
    _id: 'IN_MH_SANGLI_VISHRAMBAG',
    cityId: 'IN_MH_SANGLI', stateId: 'IN_MH', countryId: 'IN',
    name: 'Vishrambag', aliases: ['Vishram Bag'],
    postalCode: '416415',
    coordinates: { latitude: 16.8566, longitude: 74.5839 },
    geoPoint: { type: 'Point', coordinates: [74.5839, 16.8566] },
    isActive: true,
  },
  {
    _id: 'IN_MH_SANGLI_MIRAJ',
    cityId: 'IN_MH_SANGLI', stateId: 'IN_MH', countryId: 'IN',
    name: 'Miraj', aliases: ['Miraj City'],
    postalCode: '416410',
    coordinates: { latitude: 16.8234, longitude: 74.6444 },
    geoPoint: { type: 'Point', coordinates: [74.6444, 16.8234] },
    isActive: true,
  },
  /* ── Aurangabad ── */
  {
    _id: 'IN_MH_AURANGABAD_CIDCO',
    cityId: 'IN_MH_AURANGABAD', stateId: 'IN_MH', countryId: 'IN',
    name: 'CIDCO', aliases: ['CIDCO Colony'],
    postalCode: '431003',
    coordinates: { latitude: 19.8887, longitude: 75.3547 },
    geoPoint: { type: 'Point', coordinates: [75.3547, 19.8887] },
    isActive: true,
  },
  /* ── Nashik (extra areas for existing city) ── */
  {
    _id: 'IN_MH_NASHIK_PANCHAVATI',
    cityId: 'IN_MH_NASHIK', stateId: 'IN_MH', countryId: 'IN',
    name: 'Panchavati', aliases: ['Panchwati'],
    postalCode: '422003',
    coordinates: { latitude: 20.0050, longitude: 73.7814 },
    geoPoint: { type: 'Point', coordinates: [73.7814, 20.0050] },
    isActive: true,
  },
  {
    _id: 'IN_MH_NASHIK_GANGAPUR',
    cityId: 'IN_MH_NASHIK', stateId: 'IN_MH', countryId: 'IN',
    name: 'Gangapur Road', aliases: ['Gangapur'],
    postalCode: '422013',
    coordinates: { latitude: 20.0386, longitude: 73.7906 },
    geoPoint: { type: 'Point', coordinates: [73.7906, 20.0386] },
    isActive: true,
  },
];

/* ══════════════════════════════════════════
   PANDIT PROFILES — 20 realistic entries
   Password: Pandit@123  (same for all)
══════════════════════════════════════════ */

const PANDIT_PASSWORD = 'Pandit@123';

const PROVIDERS_DATA = [
  /* ───── PUNE — 8 Pandits ───── */
  {
    name: 'Pandit Sudhir Kulkarni',
    email: 'sudhir.kulkarni@panditji.dev',
    phone: '9823041567',
    provider: {
      displayName: 'Pandit Sudhir Kulkarni',
      profile: {
        about: 'Third-generation Rigvedi Brahmin from Pune with 18 years of experience. Specialises in Griha Pravesh, Satyanarayan, and Ganesh Puja. Meticulous with muhurta selection and full bilingual explanation in Marathi and Hindi.',
        experienceYears: 18,
        languages: ['Marathi', 'Hindi', 'Sanskrit'],
        traditions: ['Rigvedic (Maharashtra)'],
      },
      serviceAreas: ['Pune', 'Shivajinagar', 'Deccan', 'Kothrud', 'Aundh'],
      location: { type: 'Point', coordinates: [73.8475, 18.5308], city: 'Pune', state: 'Maharashtra', country: 'IN', cityId: 'IN_MH_PUNE', stateId: 'IN_MH', countryId: 'IN' },
      pricing: { startingFrom: 1600, currency: 'INR', breakdown: { pandit: 1600, samagri: 450, travel: 120, platform: 100 } },
      capabilities: { samagriAvailable: true, supportsMultiplePandits: false, acceptsCorporateBookings: false, acceptsNriBookings: true },
      ratingSummary: { overall: 4.9, punctuality: 4.9, communication: 4.8, serviceQuality: 4.9, professionalism: 4.9, count: 153 },
      bookingSummary: { total: 171, completed: 168, cancelled: 1, repeatCustomers: 38 },
      badges: ['100+ Bookings', 'Samagri Available', 'Marathi Speaking'],
      verificationStatus: 'VERIFIED', status: 'ACTIVE',
      serviceSlugs: ['griha-pravesh', 'satyanarayan', 'ganesh-chaturthi', 'lakshmi-puja', 'diwali-puja', 'vastu-puja', 'naamkaran'],
    },
  },
  {
    name: 'Pandit Avinash Deshpande',
    email: 'avinash.deshpande@panditji.dev',
    phone: '9765320481',
    provider: {
      displayName: 'Pandit Avinash Deshpande',
      profile: {
        about: 'Trained at Shri Ram Shastra Pathashal, Pune. 12 years of experience in wedding ceremonies, Naamkaran, and Satyanarayan. Known for on-time arrivals and clear ritual explanations even for younger generations.',
        experienceYears: 12,
        languages: ['Marathi', 'Hindi', 'English'],
        traditions: ['Vedic (Deccan)'],
      },
      serviceAreas: ['Pune', 'Koregaon Park', 'Hadapsar', 'Wakad', 'Pimpri-Chinchwad'],
      location: { type: 'Point', coordinates: [73.8926, 18.5362], city: 'Pune', state: 'Maharashtra', country: 'IN', cityId: 'IN_MH_PUNE', stateId: 'IN_MH', countryId: 'IN' },
      pricing: { startingFrom: 1400, currency: 'INR', breakdown: { pandit: 1400, samagri: 0, travel: 100, platform: 100 } },
      capabilities: { samagriAvailable: false, supportsMultiplePandits: true, acceptsCorporateBookings: true, acceptsNriBookings: true },
      ratingSummary: { overall: 4.8, punctuality: 4.9, communication: 4.7, serviceQuality: 4.8, professionalism: 4.8, count: 98 },
      bookingSummary: { total: 112, completed: 110, cancelled: 2, repeatCustomers: 19 },
      badges: ['English Speaking', 'Wedding Specialist', 'Verified'],
      verificationStatus: 'VERIFIED', status: 'ACTIVE',
      serviceSlugs: ['wedding-ceremony', 'engagement', 'naamkaran', 'satyanarayan', 'ganesh-chaturthi', 'upanayan'],
    },
  },
  {
    name: 'Pandit Ramesh Bhave',
    email: 'ramesh.bhave@panditji.dev',
    phone: '9890134752',
    provider: {
      displayName: 'Pandit Ramesh Bhave',
      profile: {
        about: '25 years experience in havan, yagna, and Rudrabhishek. Trained in Varanasi, now based in Pune. Performs in pure Sanskrit with step-by-step Marathi commentary. Accepts corporate and NRI bookings.',
        experienceYears: 25,
        languages: ['Marathi', 'Hindi', 'Sanskrit'],
        traditions: ['Kashi Tradition'],
      },
      serviceAreas: ['Pune', 'Baner', 'Aundh', 'Kothrud'],
      location: { type: 'Point', coordinates: [73.7868, 18.5590], city: 'Pune', state: 'Maharashtra', country: 'IN', cityId: 'IN_MH_PUNE', stateId: 'IN_MH', countryId: 'IN' },
      pricing: { startingFrom: 2200, currency: 'INR', breakdown: { pandit: 2200, samagri: 0, travel: 150, platform: 100 } },
      capabilities: { samagriAvailable: false, supportsMultiplePandits: true, acceptsCorporateBookings: true, acceptsNriBookings: true },
      ratingSummary: { overall: 4.9, punctuality: 4.8, communication: 4.9, serviceQuality: 4.9, professionalism: 5.0, count: 221 },
      bookingSummary: { total: 258, completed: 255, cancelled: 2, repeatCustomers: 61 },
      badges: ['200+ Bookings', 'Senior Pandit', 'Havan Specialist', 'Corporate Bookings'],
      verificationStatus: 'VERIFIED', status: 'ACTIVE',
      serviceSlugs: ['havan', 'yagna', 'rudrabhishek', 'navgraha', 'office-inaug', 'factory-inaug', 'corp-diwali'],
    },
  },
  {
    name: 'Pandit Nilesh Joshi',
    email: 'nilesh.joshi@panditji.dev',
    phone: '9822567890',
    provider: {
      displayName: 'Pandit Nilesh Joshi',
      profile: {
        about: 'Young and energetic Pandit, 7 years of experience. Specialises in home pujas and baby ceremonies. Trained under Pandit Bhave (senior). Comfortable performing for working families on short notice.',
        experienceYears: 7,
        languages: ['Marathi', 'Hindi'],
        traditions: ['Vedic'],
      },
      serviceAreas: ['Pune', 'Pimpri-Chinchwad', 'Wakad', 'Baner'],
      location: { type: 'Point', coordinates: [73.8009, 18.6279], city: 'Pune', state: 'Maharashtra', country: 'IN', cityId: 'IN_MH_PUNE', stateId: 'IN_MH', countryId: 'IN' },
      pricing: { startingFrom: 1100, currency: 'INR', breakdown: { pandit: 1100, samagri: 300, travel: 80, platform: 100 } },
      capabilities: { samagriAvailable: true, supportsMultiplePandits: false, acceptsCorporateBookings: false, acceptsNriBookings: false },
      ratingSummary: { overall: 4.6, punctuality: 4.7, communication: 4.6, serviceQuality: 4.5, professionalism: 4.6, count: 47 },
      bookingSummary: { total: 53, completed: 52, cancelled: 1, repeatCustomers: 8 },
      badges: ['Samagri Available', 'Short Notice OK'],
      verificationStatus: 'VERIFIED', status: 'ACTIVE',
      serviceSlugs: ['griha-pravesh', 'ganesh-chaturthi', 'naamkaran', 'mundan', 'satyanarayan', 'lakshmi-puja'],
    },
  },
  {
    name: 'Pandit Vitthal Gokhale',
    email: 'vitthal.gokhale@panditji.dev',
    phone: '9881234560',
    provider: {
      displayName: 'Pandit Vitthal Gokhale',
      profile: {
        about: 'Renowned for authentic Ganesh and Navratri celebrations in Pune. Over 20 years performing festival pujas for housing societies, clubs, and corporate offices. Comes with his own team of two assistants for large events.',
        experienceYears: 20,
        languages: ['Marathi', 'Hindi', 'Sanskrit'],
        traditions: ['Maharashtra Shaiva'],
      },
      serviceAreas: ['Pune', 'Deccan', 'Shivajinagar', 'Koregaon Park', 'Hadapsar'],
      location: { type: 'Point', coordinates: [73.8408, 18.5167], city: 'Pune', state: 'Maharashtra', country: 'IN', cityId: 'IN_MH_PUNE', stateId: 'IN_MH', countryId: 'IN' },
      pricing: { startingFrom: 1800, currency: 'INR', breakdown: { pandit: 1800, samagri: 500, travel: 100, platform: 100 } },
      capabilities: { samagriAvailable: true, supportsMultiplePandits: true, acceptsCorporateBookings: true, acceptsNriBookings: false },
      ratingSummary: { overall: 4.8, punctuality: 4.8, communication: 4.7, serviceQuality: 4.9, professionalism: 4.8, count: 176 },
      bookingSummary: { total: 194, completed: 191, cancelled: 2, repeatCustomers: 44 },
      badges: ['100+ Bookings', 'Festival Expert', 'Samagri Available'],
      verificationStatus: 'VERIFIED', status: 'ACTIVE',
      serviceSlugs: ['ganesh-chaturthi', 'navratri', 'lakshmi-puja', 'diwali-puja', 'havan', 'corp-ganesh', 'corp-diwali'],
    },
  },
  {
    name: 'Pandit Shashikant Phadke',
    email: 'shashikant.phadke@panditji.dev',
    phone: '9765001234',
    provider: {
      displayName: 'Pandit Shashikant Phadke',
      profile: {
        about: 'Expert in Vedic wedding ceremonies and post-wedding rituals. 16 years experience. Covered 400+ weddings across Pune, Nasik, and Satara. Provides printed ritual guide booklet for the family to follow along.',
        experienceYears: 16,
        languages: ['Marathi', 'Hindi', 'Sanskrit'],
        traditions: ['Vedic (Maharashtra)'],
      },
      serviceAreas: ['Pune', 'Kothrud', 'Deccan', 'Shivajinagar'],
      location: { type: 'Point', coordinates: [73.8077, 18.5074], city: 'Pune', state: 'Maharashtra', country: 'IN', cityId: 'IN_MH_PUNE', stateId: 'IN_MH', countryId: 'IN' },
      pricing: { startingFrom: 4800, currency: 'INR', breakdown: { pandit: 4800, samagri: 0, travel: 200, platform: 100 } },
      capabilities: { samagriAvailable: false, supportsMultiplePandits: true, acceptsCorporateBookings: false, acceptsNriBookings: true },
      ratingSummary: { overall: 4.9, punctuality: 4.9, communication: 4.9, serviceQuality: 4.9, professionalism: 4.9, count: 312 },
      bookingSummary: { total: 348, completed: 344, cancelled: 3, repeatCustomers: 71 },
      badges: ['300+ Bookings', 'Wedding Specialist', 'Senior Pandit'],
      verificationStatus: 'VERIFIED', status: 'ACTIVE',
      serviceSlugs: ['wedding-ceremony', 'engagement', 'upanayan', 'satyanarayan', 'bhoomi-pujan'],
    },
  },
  {
    name: 'Pandit Hemant Sahasrabuddhe',
    email: 'hemant.sahasrabuddhe@panditji.dev',
    phone: '9890567891',
    provider: {
      displayName: 'Pandit Hemant Sahasrabuddhe',
      profile: {
        about: 'Specialises in Vastu consultation and Vastu Shanti puja. 14 years experience. Has assisted over 200 families moving into new homes in Pune and PCMC. Provides a full Vastu report with remedies after the puja.',
        experienceYears: 14,
        languages: ['Marathi', 'Hindi', 'English'],
        traditions: ['Vedic (Vastu lineage)'],
      },
      serviceAreas: ['Pune', 'Pimpri-Chinchwad', 'Aundh', 'Baner', 'Wakad'],
      location: { type: 'Point', coordinates: [73.7618, 18.5975], city: 'Pune', state: 'Maharashtra', country: 'IN', cityId: 'IN_MH_PUNE', stateId: 'IN_MH', countryId: 'IN' },
      pricing: { startingFrom: 1500, currency: 'INR', breakdown: { pandit: 1500, samagri: 400, travel: 100, platform: 100 } },
      capabilities: { samagriAvailable: true, supportsMultiplePandits: false, acceptsCorporateBookings: true, acceptsNriBookings: true },
      ratingSummary: { overall: 4.7, punctuality: 4.8, communication: 4.8, serviceQuality: 4.7, professionalism: 4.7, count: 89 },
      bookingSummary: { total: 101, completed: 99, cancelled: 1, repeatCustomers: 21 },
      badges: ['Samagri Available', 'Vastu Expert', 'English Speaking'],
      verificationStatus: 'VERIFIED', status: 'ACTIVE',
      serviceSlugs: ['vastu-puja', 'griha-pravesh', 'bhoomi-pujan', 'office-inaug', 'satyanarayan'],
    },
  },
  {
    name: 'Pandit Dattatray Barve',
    email: 'dattatray.barve@panditji.dev',
    phone: '9823456781',
    provider: {
      displayName: 'Pandit Dattatray Barve',
      profile: {
        about: 'Performs Shri Satyanarayan Puja and Ganesh Puja with traditional Marathi mantras. 9 years of experience serving Pune and Hadapsar. Affordable, reliable, and always on time. First-time ceremony? He explains every step patiently.',
        experienceYears: 9,
        languages: ['Marathi', 'Hindi'],
        traditions: ['Vedic'],
      },
      serviceAreas: ['Pune', 'Hadapsar', 'Koregaon Park'],
      location: { type: 'Point', coordinates: [73.9254, 18.4997], city: 'Pune', state: 'Maharashtra', country: 'IN', cityId: 'IN_MH_PUNE', stateId: 'IN_MH', countryId: 'IN' },
      pricing: { startingFrom: 1000, currency: 'INR', breakdown: { pandit: 1000, samagri: 250, travel: 80, platform: 100 } },
      capabilities: { samagriAvailable: true, supportsMultiplePandits: false, acceptsCorporateBookings: false, acceptsNriBookings: false },
      ratingSummary: { overall: 4.6, punctuality: 4.6, communication: 4.7, serviceQuality: 4.6, professionalism: 4.5, count: 62 },
      bookingSummary: { total: 70, completed: 69, cancelled: 1, repeatCustomers: 12 },
      badges: ['Samagri Available', 'Affordable'],
      verificationStatus: 'VERIFIED', status: 'ACTIVE',
      serviceSlugs: ['satyanarayan', 'ganesh-chaturthi', 'naamkaran', 'lakshmi-puja', 'diwali-puja'],
    },
  },

  /* ───── KOLHAPUR — 6 Pandits ───── */
  {
    name: 'Pandit Vasant Patil',
    email: 'vasant.patil@panditji.dev',
    phone: '9860234501',
    provider: {
      displayName: 'Pandit Vasant Patil',
      profile: {
        about: '20 years of performing traditional Mahalaxmi and Ambabai deity pujas in Kolhapur. Deeply rooted in local traditions of the Deccan. Also serves Sangli, Ichalkaranji, and Hatkanangale on request.',
        experienceYears: 20,
        languages: ['Marathi', 'Hindi', 'Sanskrit', 'Kannada'],
        traditions: ['Maharashtra Shaiva', 'Devi Upasana'],
      },
      serviceAreas: ['Kolhapur', 'Tarabai Park', 'Shahupuri', 'Sangli'],
      location: { type: 'Point', coordinates: [74.2350, 16.7081], city: 'Kolhapur', state: 'Maharashtra', country: 'IN', cityId: 'IN_MH_KOLHAPUR', stateId: 'IN_MH', countryId: 'IN' },
      pricing: { startingFrom: 1400, currency: 'INR', breakdown: { pandit: 1400, samagri: 400, travel: 100, platform: 100 } },
      capabilities: { samagriAvailable: true, supportsMultiplePandits: false, acceptsCorporateBookings: false, acceptsNriBookings: false },
      ratingSummary: { overall: 4.9, punctuality: 4.9, communication: 4.8, serviceQuality: 4.9, professionalism: 4.9, count: 187 },
      bookingSummary: { total: 209, completed: 207, cancelled: 1, repeatCustomers: 48 },
      badges: ['100+ Bookings', 'Samagri Available', 'Kolhapur Specialist'],
      verificationStatus: 'VERIFIED', status: 'ACTIVE',
      serviceSlugs: ['griha-pravesh', 'satyanarayan', 'ganesh-chaturthi', 'navratri', 'lakshmi-puja', 'havan'],
    },
  },
  {
    name: 'Pandit Santosh Desai',
    email: 'santosh.desai@panditji.dev',
    phone: '9765432109',
    provider: {
      displayName: 'Pandit Santosh Desai',
      profile: {
        about: 'Wedding specialist with 15 years experience in Kolhapur, Belgaum, and surrounding districts. Expert in Vedic Vivah Vidhi as per Maharashtrian customs. Performs the full ceremony in approximately 4 hours without shortcuts.',
        experienceYears: 15,
        languages: ['Marathi', 'Hindi', 'Sanskrit', 'Kannada'],
        traditions: ['Vedic (Kolhapur-Belgaum lineage)'],
      },
      serviceAreas: ['Kolhapur', 'Mahadwar Road', 'Tarabai Park', 'Shahupuri'],
      location: { type: 'Point', coordinates: [74.2636, 16.7076], city: 'Kolhapur', state: 'Maharashtra', country: 'IN', cityId: 'IN_MH_KOLHAPUR', stateId: 'IN_MH', countryId: 'IN' },
      pricing: { startingFrom: 4500, currency: 'INR', breakdown: { pandit: 4500, samagri: 0, travel: 200, platform: 100 } },
      capabilities: { samagriAvailable: false, supportsMultiplePandits: true, acceptsCorporateBookings: false, acceptsNriBookings: true },
      ratingSummary: { overall: 4.8, punctuality: 4.8, communication: 4.8, serviceQuality: 4.9, professionalism: 4.8, count: 134 },
      bookingSummary: { total: 149, completed: 147, cancelled: 1, repeatCustomers: 32 },
      badges: ['Wedding Specialist', '100+ Bookings', 'Bi-lingual Ceremony'],
      verificationStatus: 'VERIFIED', status: 'ACTIVE',
      serviceSlugs: ['wedding-ceremony', 'engagement', 'upanayan', 'satyanarayan', 'griha-pravesh'],
    },
  },
  {
    name: 'Pandit Ganesh Kulkarni',
    email: 'ganesh.kulkarni.klp@panditji.dev',
    phone: '9823012345',
    provider: {
      displayName: 'Pandit Ganesh Kulkarni',
      profile: {
        about: 'Performs Griha Pravesh, Bhoomi Pujan, and office inaugurations for Kolhapur, Sangli, and Satara districts. 11 years experience. Available on weekdays with 24-hour advance notice.',
        experienceYears: 11,
        languages: ['Marathi', 'Hindi'],
        traditions: ['Vedic'],
      },
      serviceAreas: ['Kolhapur', 'Shahupuri', 'Mahadwar Road'],
      location: { type: 'Point', coordinates: [74.2334, 16.7007], city: 'Kolhapur', state: 'Maharashtra', country: 'IN', cityId: 'IN_MH_KOLHAPUR', stateId: 'IN_MH', countryId: 'IN' },
      pricing: { startingFrom: 1300, currency: 'INR', breakdown: { pandit: 1300, samagri: 350, travel: 120, platform: 100 } },
      capabilities: { samagriAvailable: true, supportsMultiplePandits: false, acceptsCorporateBookings: true, acceptsNriBookings: false },
      ratingSummary: { overall: 4.7, punctuality: 4.8, communication: 4.6, serviceQuality: 4.7, professionalism: 4.7, count: 76 },
      bookingSummary: { total: 84, completed: 82, cancelled: 2, repeatCustomers: 16 },
      badges: ['Samagri Available', 'Corporate Bookings'],
      verificationStatus: 'VERIFIED', status: 'ACTIVE',
      serviceSlugs: ['griha-pravesh', 'bhoomi-pujan', 'vastu-puja', 'office-inaug', 'ganesh-chaturthi', 'satyanarayan'],
    },
  },
  {
    name: 'Pandit Prashant Gaikwad',
    email: 'prashant.gaikwad@panditji.dev',
    phone: '9860789012',
    provider: {
      displayName: 'Pandit Prashant Gaikwad',
      profile: {
        about: 'Havan and yagna specialist with 17 years of experience. Trained in Shri Kshetra Narsobawadi. Performs Navchandi, Sapta Shrungi, and Rudrabhishek for devotees in Kolhapur and nearby pilgrimage areas.',
        experienceYears: 17,
        languages: ['Marathi', 'Sanskrit'],
        traditions: ['Shakta (Kolhapur lineage)'],
      },
      serviceAreas: ['Kolhapur', 'Tarabai Park', 'Mahadwar Road'],
      location: { type: 'Point', coordinates: [74.2433, 16.7050], city: 'Kolhapur', state: 'Maharashtra', country: 'IN', cityId: 'IN_MH_KOLHAPUR', stateId: 'IN_MH', countryId: 'IN' },
      pricing: { startingFrom: 2000, currency: 'INR', breakdown: { pandit: 2000, samagri: 0, travel: 150, platform: 100 } },
      capabilities: { samagriAvailable: false, supportsMultiplePandits: true, acceptsCorporateBookings: false, acceptsNriBookings: false },
      ratingSummary: { overall: 4.8, punctuality: 4.7, communication: 4.8, serviceQuality: 4.9, professionalism: 4.8, count: 115 },
      bookingSummary: { total: 128, completed: 126, cancelled: 1, repeatCustomers: 29 },
      badges: ['Havan Specialist', '100+ Bookings'],
      verificationStatus: 'VERIFIED', status: 'ACTIVE',
      serviceSlugs: ['havan', 'yagna', 'rudrabhishek', 'navgraha', 'navratri'],
    },
  },
  {
    name: 'Pandit Mahesh Chavan',
    email: 'mahesh.chavan@panditji.dev',
    phone: '9765890123',
    provider: {
      displayName: 'Pandit Mahesh Chavan',
      profile: {
        about: 'Known for Naamkaran, Mundan, and Annaprashan ceremonies. 8 years of experience with young families in Kolhapur. Punctual, cheerful, and great with children. Includes a small printed blessing card for the baby.',
        experienceYears: 8,
        languages: ['Marathi', 'Hindi'],
        traditions: ['Vedic'],
      },
      serviceAreas: ['Kolhapur', 'Shahupuri', 'Tarabai Park'],
      location: { type: 'Point', coordinates: [74.2400, 16.7000], city: 'Kolhapur', state: 'Maharashtra', country: 'IN', cityId: 'IN_MH_KOLHAPUR', stateId: 'IN_MH', countryId: 'IN' },
      pricing: { startingFrom: 900, currency: 'INR', breakdown: { pandit: 900, samagri: 200, travel: 70, platform: 100 } },
      capabilities: { samagriAvailable: true, supportsMultiplePandits: false, acceptsCorporateBookings: false, acceptsNriBookings: false },
      ratingSummary: { overall: 4.7, punctuality: 4.8, communication: 4.7, serviceQuality: 4.7, professionalism: 4.6, count: 58 },
      bookingSummary: { total: 65, completed: 64, cancelled: 1, repeatCustomers: 14 },
      badges: ['Samagri Available', 'Baby Ceremony Specialist'],
      verificationStatus: 'VERIFIED', status: 'ACTIVE',
      serviceSlugs: ['naamkaran', 'mundan', 'ganesh-chaturthi', 'satyanarayan', 'lakshmi-puja'],
    },
  },
  {
    name: 'Pandit Deepak Kadam',
    email: 'deepak.kadam@panditji.dev',
    phone: '9890234501',
    provider: {
      displayName: 'Pandit Deepak Kadam',
      profile: {
        about: 'Corporate and real-estate puja specialist. 13 years experience covering Kolhapur, Ichalkaranji, and Miraj industrial belts. Performs Bhoomi Pujan, office inaugurations, and vehicle puja. On-time guarantee.',
        experienceYears: 13,
        languages: ['Marathi', 'Hindi', 'English'],
        traditions: ['Vedic'],
      },
      serviceAreas: ['Kolhapur', 'Mahadwar Road', 'Shahupuri'],
      location: { type: 'Point', coordinates: [74.2350, 16.7100], city: 'Kolhapur', state: 'Maharashtra', country: 'IN', cityId: 'IN_MH_KOLHAPUR', stateId: 'IN_MH', countryId: 'IN' },
      pricing: { startingFrom: 2500, currency: 'INR', breakdown: { pandit: 2500, samagri: 0, travel: 200, platform: 100 } },
      capabilities: { samagriAvailable: false, supportsMultiplePandits: false, acceptsCorporateBookings: true, acceptsNriBookings: true },
      ratingSummary: { overall: 4.8, punctuality: 5.0, communication: 4.8, serviceQuality: 4.7, professionalism: 4.9, count: 93 },
      bookingSummary: { total: 105, completed: 104, cancelled: 1, repeatCustomers: 22 },
      badges: ['Corporate Expert', 'English Speaking', 'Punctuality Award'],
      verificationStatus: 'VERIFIED', status: 'ACTIVE',
      serviceSlugs: ['bhoomi-pujan', 'office-inaug', 'factory-inaug', 'corp-diwali', 'corp-ganesh', 'vastu-puja'],
    },
  },

  /* ───── SANGLI — 2 Pandits ───── */
  {
    name: 'Pandit Chandrakant Shinde',
    email: 'chandrakant.shinde@panditji.dev',
    phone: '9822765432',
    provider: {
      displayName: 'Pandit Chandrakant Shinde',
      profile: {
        about: '19 years of performing home and wedding ceremonies in Sangli-Miraj-Kupwad Municipal Corporation area. Expert in both North-Indian and Deccan styles. Well-known in Vishrambag and Miraj localities.',
        experienceYears: 19,
        languages: ['Marathi', 'Hindi', 'Sanskrit'],
        traditions: ['Vedic (Deccan)'],
      },
      serviceAreas: ['Sangli', 'Vishrambag', 'Miraj'],
      location: { type: 'Point', coordinates: [74.5839, 16.8566], city: 'Sangli', state: 'Maharashtra', country: 'IN', cityId: 'IN_MH_SANGLI', stateId: 'IN_MH', countryId: 'IN' },
      pricing: { startingFrom: 1400, currency: 'INR', breakdown: { pandit: 1400, samagri: 400, travel: 100, platform: 100 } },
      capabilities: { samagriAvailable: true, supportsMultiplePandits: true, acceptsCorporateBookings: false, acceptsNriBookings: false },
      ratingSummary: { overall: 4.7, punctuality: 4.7, communication: 4.7, serviceQuality: 4.8, professionalism: 4.7, count: 104 },
      bookingSummary: { total: 117, completed: 115, cancelled: 2, repeatCustomers: 24 },
      badges: ['100+ Bookings', 'Samagri Available'],
      verificationStatus: 'VERIFIED', status: 'ACTIVE',
      serviceSlugs: ['wedding-ceremony', 'griha-pravesh', 'satyanarayan', 'havan', 'naamkaran', 'ganesh-chaturthi'],
    },
  },
  {
    name: 'Pandit Sunil Pawar',
    email: 'sunil.pawar@panditji.dev',
    phone: '9765678901',
    provider: {
      displayName: 'Pandit Sunil Pawar',
      profile: {
        about: 'Havan and Navgraha specialist for Sangli district. 11 years experience. Fluent in Sanskrit with plain Marathi explanations. Available 7 days a week. Covers Sangli, Tasgaon, and Palus areas.',
        experienceYears: 11,
        languages: ['Marathi', 'Sanskrit'],
        traditions: ['Vedic'],
      },
      serviceAreas: ['Sangli', 'Vishrambag', 'Miraj'],
      location: { type: 'Point', coordinates: [74.6444, 16.8234], city: 'Sangli', state: 'Maharashtra', country: 'IN', cityId: 'IN_MH_SANGLI', stateId: 'IN_MH', countryId: 'IN' },
      pricing: { startingFrom: 1600, currency: 'INR', breakdown: { pandit: 1600, samagri: 0, travel: 100, platform: 100 } },
      capabilities: { samagriAvailable: false, supportsMultiplePandits: true, acceptsCorporateBookings: false, acceptsNriBookings: false },
      ratingSummary: { overall: 4.6, punctuality: 4.6, communication: 4.5, serviceQuality: 4.7, professionalism: 4.6, count: 67 },
      bookingSummary: { total: 75, completed: 73, cancelled: 2, repeatCustomers: 14 },
      badges: ['Havan Specialist'],
      verificationStatus: 'VERIFIED', status: 'ACTIVE',
      serviceSlugs: ['havan', 'navgraha', 'rudrabhishek', 'satyanarayan', 'griha-pravesh'],
    },
  },

  /* ───── NASHIK — 2 Pandits ───── */
  {
    name: 'Pandit Abhijit Dande',
    email: 'abhijit.dande@panditji.dev',
    phone: '9823901234',
    provider: {
      displayName: 'Pandit Abhijit Dande',
      profile: {
        about: 'Based in Panchavati, Nashik — the holy city of sadhana. 16 years experience in Ramkund puja, Godavari Snan Vidhi, and all Vedic home ceremonies. Preferred Pandit for families during Kumbh Mela visits.',
        experienceYears: 16,
        languages: ['Marathi', 'Hindi', 'Sanskrit'],
        traditions: ['Vaishnava (Nashik lineage)'],
      },
      serviceAreas: ['Nashik', 'Panchavati', 'Gangapur Road'],
      location: { type: 'Point', coordinates: [73.7814, 20.0050], city: 'Nashik', state: 'Maharashtra', country: 'IN', cityId: 'IN_MH_NASHIK', stateId: 'IN_MH', countryId: 'IN' },
      pricing: { startingFrom: 1500, currency: 'INR', breakdown: { pandit: 1500, samagri: 400, travel: 100, platform: 100 } },
      capabilities: { samagriAvailable: true, supportsMultiplePandits: false, acceptsCorporateBookings: false, acceptsNriBookings: true },
      ratingSummary: { overall: 4.8, punctuality: 4.7, communication: 4.8, serviceQuality: 4.9, professionalism: 4.8, count: 129 },
      bookingSummary: { total: 143, completed: 141, cancelled: 2, repeatCustomers: 31 },
      badges: ['100+ Bookings', 'Samagri Available', 'Nashik Specialist'],
      verificationStatus: 'VERIFIED', status: 'ACTIVE',
      serviceSlugs: ['griha-pravesh', 'satyanarayan', 'havan', 'naamkaran', 'ganesh-chaturthi', 'navratri'],
    },
  },
  {
    name: 'Pandit Kedar Wagh',
    email: 'kedar.wagh@panditji.dev',
    phone: '9890123456',
    provider: {
      displayName: 'Pandit Kedar Wagh',
      profile: {
        about: 'Wedding and Upanayan specialist based in Gangapur Road, Nashik. 10 years of experience. Known for his detailed Saptapadi explanations and keeping the wedding running smoothly on schedule. Available across Nashik district.',
        experienceYears: 10,
        languages: ['Marathi', 'Hindi', 'Sanskrit'],
        traditions: ['Vedic'],
      },
      serviceAreas: ['Nashik', 'Gangapur Road', 'Panchavati'],
      location: { type: 'Point', coordinates: [73.7906, 20.0386], city: 'Nashik', state: 'Maharashtra', country: 'IN', cityId: 'IN_MH_NASHIK', stateId: 'IN_MH', countryId: 'IN' },
      pricing: { startingFrom: 4200, currency: 'INR', breakdown: { pandit: 4200, samagri: 0, travel: 150, platform: 100 } },
      capabilities: { samagriAvailable: false, supportsMultiplePandits: true, acceptsCorporateBookings: false, acceptsNriBookings: true },
      ratingSummary: { overall: 4.7, punctuality: 4.8, communication: 4.7, serviceQuality: 4.7, professionalism: 4.7, count: 72 },
      bookingSummary: { total: 81, completed: 79, cancelled: 2, repeatCustomers: 17 },
      badges: ['Wedding Specialist'],
      verificationStatus: 'VERIFIED', status: 'ACTIVE',
      serviceSlugs: ['wedding-ceremony', 'upanayan', 'satyanarayan', 'bhoomi-pujan', 'griha-pravesh'],
    },
  },

  /* ───── AURANGABAD — 2 Pandits ───── */
  {
    name: 'Pandit Rajendra Vaidya',
    email: 'rajendra.vaidya@panditji.dev',
    phone: '9765543210',
    provider: {
      displayName: 'Pandit Rajendra Vaidya',
      profile: {
        about: 'Senior Pandit from CIDCO, Aurangabad with 22 years of experience. Specialises in Graha Shanti, Navgraha Puja, and major Vedic yagnas. Has performed yagnas for government inaugurations and prominent hospitals.',
        experienceYears: 22,
        languages: ['Marathi', 'Hindi', 'Sanskrit'],
        traditions: ['Vedic (Marathwada)'],
      },
      serviceAreas: ['Aurangabad', 'CIDCO'],
      location: { type: 'Point', coordinates: [75.3547, 19.8887], city: 'Aurangabad', state: 'Maharashtra', country: 'IN', cityId: 'IN_MH_AURANGABAD', stateId: 'IN_MH', countryId: 'IN' },
      pricing: { startingFrom: 2000, currency: 'INR', breakdown: { pandit: 2000, samagri: 0, travel: 150, platform: 100 } },
      capabilities: { samagriAvailable: false, supportsMultiplePandits: true, acceptsCorporateBookings: true, acceptsNriBookings: true },
      ratingSummary: { overall: 4.8, punctuality: 4.8, communication: 4.8, serviceQuality: 4.9, professionalism: 4.9, count: 148 },
      bookingSummary: { total: 163, completed: 161, cancelled: 1, repeatCustomers: 36 },
      badges: ['Senior Pandit', 'Corporate Bookings', '100+ Bookings'],
      verificationStatus: 'VERIFIED', status: 'ACTIVE',
      serviceSlugs: ['havan', 'yagna', 'navgraha', 'rudrabhishek', 'office-inaug', 'factory-inaug'],
    },
  },
  {
    name: 'Pandit Nandkishor Lele',
    email: 'nandkishor.lele@panditji.dev',
    phone: '9823678901',
    provider: {
      displayName: 'Pandit Nandkishor Lele',
      profile: {
        about: '13 years experience in Aurangabad, specialising in home pujas and baby ceremonies. Very patient with families, explains rituals in simple Marathi. Also covers Jalna, Beed on prior arrangement.',
        experienceYears: 13,
        languages: ['Marathi', 'Hindi'],
        traditions: ['Vedic'],
      },
      serviceAreas: ['Aurangabad', 'CIDCO'],
      location: { type: 'Point', coordinates: [75.3433, 19.8762], city: 'Aurangabad', state: 'Maharashtra', country: 'IN', cityId: 'IN_MH_AURANGABAD', stateId: 'IN_MH', countryId: 'IN' },
      pricing: { startingFrom: 1200, currency: 'INR', breakdown: { pandit: 1200, samagri: 300, travel: 100, platform: 100 } },
      capabilities: { samagriAvailable: true, supportsMultiplePandits: false, acceptsCorporateBookings: false, acceptsNriBookings: false },
      ratingSummary: { overall: 4.7, punctuality: 4.7, communication: 4.8, serviceQuality: 4.7, professionalism: 4.6, count: 81 },
      bookingSummary: { total: 91, completed: 90, cancelled: 1, repeatCustomers: 19 },
      badges: ['Samagri Available', 'Baby Ceremony Specialist'],
      verificationStatus: 'VERIFIED', status: 'ACTIVE',
      serviceSlugs: ['naamkaran', 'mundan', 'griha-pravesh', 'satyanarayan', 'ganesh-chaturthi', 'lakshmi-puja'],
    },
  },
];

/* ══════════════════════════════════════════
   SEED FUNCTION
══════════════════════════════════════════ */
async function seedMaharashtra() {
  console.log('🌱 Connecting to MongoDB…');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  console.log('✅ Connected\n');

  /* ── Geo: new cities ── */
  console.log('🌏 Seeding new Maharashtra cities…');
  for (const c of NEW_CITIES) {
    const res = await GeoCity.findOneAndUpdate(
      { _id: c._id },
      { $setOnInsert: c },
      { upsert: true, new: true }
    );
    console.log(`   ✓ ${c.name} ${res ? '(upserted)' : '(existing)'}`);
  }

  /* ── Geo: new areas ── */
  console.log('\n📍 Seeding new Maharashtra areas…');
  for (const a of NEW_AREAS) {
    await GeoArea.findOneAndUpdate(
      { _id: a._id },
      { $setOnInsert: a },
      { upsert: true, new: true }
    );
    console.log(`   ✓ ${a.name}, ${a.cityId.split('_').pop()}`);
  }

  /* Ensure 2dsphere index */
  await GeoArea.ensureIndexes();

  /* ── Resolve service slug → ObjectId map ── */
  console.log('\n📋 Loading service map…');
  const services = await Service.find({});
  const svcMap   = Object.fromEntries(services.map(s => [s.slug, s._id]));
  console.log(`   ✓ ${Object.keys(svcMap).length} services loaded`);

  /* ── Seed providers ── */
  console.log('\n👤 Seeding Maharashtra providers…');
  let created = 0;
  let skipped = 0;

  for (const pd of PROVIDERS_DATA) {
    /* Check if user already exists */
    let user = await User.findOne({ 'contact.email': pd.email }).select('+passwordHash');
    if (!user) {
      user = new User({
        userType: 'PROVIDER',
        profile: {
          displayName: pd.name,
          firstName:   pd.name.split(' ').slice(1, 2).join(''),
          lastName:    pd.name.split(' ').slice(2).join(' '),
        },
        contact: {
          email: pd.email,
          phone: pd.phone,
        },
        status: 'ACTIVE',
      });
      await user.setPassword(PANDIT_PASSWORD);
      await user.save();
    }

    /* Skip if provider already exists */
    const existing = await Provider.findOne({ userId: user._id });
    if (existing) {
      console.log(`   ⚠  ${pd.name} already exists — skipping`);
      skipped++;
      continue;
    }

    /* Resolve service IDs */
    const { serviceSlugs, ...provData } = pd.provider;
    const serviceIds = serviceSlugs.map(s => svcMap[s]).filter(Boolean);

    const provider = await Provider.create({
      ...provData,
      userId:     user._id,
      serviceIds,
      createdBy:  user._id,
      modifiedBy: user._id,
    });

    /* ProviderService records */
    for (const slug of serviceSlugs) {
      const svcId = svcMap[slug];
      if (!svcId) continue;
      await ProviderService.findOneAndUpdate(
        { providerId: provider._id, serviceId: svcId },
        {
          $setOnInsert: {
            providerId: provider._id,
            serviceId:  svcId,
            pricing: {
              model:          'STARTING_FROM',
              startingPrice:  provData.pricing.startingFrom,
              currency:       'INR',
            },
            capabilities: { providesSamagri: provData.capabilities.samagriAvailable },
            status: 'ACTIVE',
          },
        },
        { upsert: true, new: true }
      );
    }

    /* Availability — Mon-Sat 8am-8pm */
    await ProviderAvailability.create({
      providerId:          provider._id,
      workingHours: [1,2,3,4,5,6].map(d => ({
        dayOfWeek: d, startTime: '08:00', endTime: '20:00', isActive: true,
      })),
      blockedRanges:         [],
      bookedSlots:           [],
      maxDailyConcurrent:    2,
      bookingWindowDays:     60,
      minimumNoticeHours:    24,
    });

    /* ProviderServiceArea — city-wide */
    const cityId = provData.location.cityId;
    const cityDoc = NEW_CITIES.find(c => c._id === cityId) ||
      { name: provData.location.city, coordinates: { latitude: provData.location.coordinates[1], longitude: provData.location.coordinates[0] } };

    await ProviderServiceArea.create({
      providerId:   provider._id,
      locationType: 'CITY',
      locationId:   cityId,
      label:        `${provData.location.city} City`,
      travelCharge: { model: 'FREE' },
      isActive:     true,
    });

    console.log(`   ✓ ${pd.name} — ${provData.location.city} (${serviceIds.length} services)`);
    created++;
  }

  /* ── Summary ── */
  const total = await Provider.countDocuments();
  console.log(`\n✅ Maharashtra seed complete!`);
  console.log(`   Created: ${created} new providers`);
  console.log(`   Skipped: ${skipped} existing`);
  console.log(`   Total providers in DB: ${total}`);
  console.log(`\n   Password for all new pandits: ${PANDIT_PASSWORD}`);
  console.log('\n   Sample logins:');
  console.log('   sudhir.kulkarni@panditji.dev  / Pandit@123  (Pune)');
  console.log('   vasant.patil@panditji.dev      / Pandit@123  (Kolhapur)');
  console.log('   santosh.desai@panditji.dev     / Pandit@123  (Kolhapur - wedding)');
  console.log('   abhijit.dande@panditji.dev     / Pandit@123  (Nashik)');

  await mongoose.disconnect();
  process.exit(0);
}

seedMaharashtra().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
