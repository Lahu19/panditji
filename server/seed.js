'use strict';
/**
 * Seed script — populates MongoDB with realistic categories, services,
 * service requirements, and provider profiles matching the static frontend data.
 *
 * Run: node server/seed.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');

const Category            = require('./models/Category');
const Service             = require('./models/Service');
const User                = require('./models/User');
const Provider            = require('./models/Provider');
const ProviderService     = require('./models/ProviderService');
const ProviderAvailability = require('./models/ProviderAvailability');

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
  const [cats, svcs, provs, users] = await Promise.all([
    Category.countDocuments(),
    Service.countDocuments(),
    Provider.countDocuments(),
    User.countDocuments(),
  ]);
  console.log(`\n✅ Seed complete!`);
  console.log(`   Categories: ${cats}`);
  console.log(`   Services:   ${svcs}`);
  console.log(`   Providers:  ${provs}`);
  console.log(`   Users:      ${users}`);
  console.log('\n   Admin login: admin@panditji.dev / Admin@123!');
  console.log('   Test login:  rajesh.sharma@panditji.dev / Password123!');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
