'use strict';
/**
 * seed-reviews.js
 *
 * Seeds realistic completed bookings + reviews for all existing providers,
 * then verifies that services and locations are present.
 *
 * Run: node server/seed-reviews.js
 *
 * Safe to run multiple times — uses upsert / existence checks throughout.
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');

const User                 = require('./models/User');
const Provider             = require('./models/Provider');
const Service              = require('./models/Service');
const Booking              = require('./models/Booking');
const Payment              = require('./models/Payment');
const Review               = require('./models/Review');
const GeoCity              = require('./models/GeoCity');
const GeoArea              = require('./models/GeoArea');
const Category             = require('./models/Category');

/* ════════════════════════════════════════
   REVIEW CONTENT POOL
   Varied, realistic Marathi/Hindi context
════════════════════════════════════════ */
const REVIEW_POOL = [
  {
    comment: 'Excellent service! Pandit ji arrived exactly on time and explained every step of the puja in simple Marathi. The entire family felt very connected to the ceremony. Will definitely call again.',
    ratings: { punctuality: 5, communication: 5, serviceQuality: 5, professionalism: 5 },
  },
  {
    comment: 'Very satisfied with the Griha Pravesh puja. Pandit ji brought all the samagri and the entire ceremony was performed in about 2.5 hours. Kids also enjoyed listening to the shlokas.',
    ratings: { punctuality: 5, communication: 4, serviceQuality: 5, professionalism: 5 },
  },
  {
    comment: 'Good experience overall. The Satyanarayan katha was done beautifully. Only minor issue was he was 15 minutes late, but informed us in advance. Ritual quality was top-notch.',
    ratings: { punctuality: 4, communication: 5, serviceQuality: 5, professionalism: 4 },
  },
  {
    comment: 'Pandit ji performed our son\'s Naamkaran ceremony with full devotion. He explained the meaning of each step and the name selection process. Very knowledgeable and patient.',
    ratings: { punctuality: 5, communication: 5, serviceQuality: 5, professionalism: 5 },
  },
  {
    comment: 'The havan was conducted perfectly. Pandit ji coordinated well with our family members and guided everyone on how to participate. The whole atmosphere was very spiritual.',
    ratings: { punctuality: 4, communication: 4, serviceQuality: 5, professionalism: 5 },
  },
  {
    comment: 'We booked for Ganesh Chaturthi puja. Very authentic and traditional style. Pandit ji recited all the vedic mantras correctly. Our guests were very impressed.',
    ratings: { punctuality: 5, communication: 4, serviceQuality: 5, professionalism: 5 },
  },
  {
    comment: 'Amazing experience for our daughter\'s Mundan ceremony. Pandit ji made the whole process very smooth and comfortable for the baby. Highly recommended for family ceremonies.',
    ratings: { punctuality: 5, communication: 5, serviceQuality: 5, professionalism: 4 },
  },
  {
    comment: 'Second time booking through this platform. Same Pandit ji, same quality. Very professional and thorough. He remembers our preferences from last time which is really nice.',
    ratings: { punctuality: 5, communication: 5, serviceQuality: 5, professionalism: 5 },
  },
  {
    comment: 'Wedding ceremony was handled brilliantly. The Saptapadi explanation in both Sanskrit and Marathi was very touching. Our guests from outside Maharashtra could also follow along.',
    ratings: { punctuality: 4, communication: 5, serviceQuality: 5, professionalism: 5 },
  },
  {
    comment: 'Good pandit. Performed the Vastu puja before we moved into our new home. Gave us practical Vastu tips as well. Finished in the time promised. Would hire again.',
    ratings: { punctuality: 4, communication: 4, serviceQuality: 4, professionalism: 4 },
  },
  {
    comment: 'Pandit ji performed the Rudrabhishek with full concentration. The 2-hour ceremony felt timeless. He also explained the significance of each abhishek item which we deeply appreciated.',
    ratings: { punctuality: 5, communication: 5, serviceQuality: 5, professionalism: 5 },
  },
  {
    comment: 'Decent experience. The puja was done correctly but pandit ji seemed a bit rushed. Maybe he had another booking. The ceremony itself was good but we wished it had more time.',
    ratings: { punctuality: 3, communication: 3, serviceQuality: 4, professionalism: 4 },
  },
  {
    comment: 'Very happy with the Diwali puja. Pandit ji came prepared with a printed schedule for the family. Everything ran smoothly in about 90 minutes. Great for working families.',
    ratings: { punctuality: 5, communication: 5, serviceQuality: 4, professionalism: 5 },
  },
  {
    comment: 'Booked for office inauguration. Pandit ji was very professional in a corporate setting — managed time well, no unnecessary delays. All our employees and clients were impressed.',
    ratings: { punctuality: 5, communication: 5, serviceQuality: 5, professionalism: 5 },
  },
  {
    comment: 'The Bhoomi Pujan for our new house construction was performed with great care. Pandit ji also guided us on muhurta selection. Very helpful throughout the entire process.',
    ratings: { punctuality: 4, communication: 5, serviceQuality: 5, professionalism: 5 },
  },
  {
    comment: 'Navgraha puja was very well conducted. Pandit ji explained which graha is affecting what and what the puja addresses. Very informative and spiritually uplifting.',
    ratings: { punctuality: 4, communication: 5, serviceQuality: 5, professionalism: 4 },
  },
  {
    comment: 'Booked for Lakshmi puja before Diwali. Short notice booking handled smoothly. Pandit ji brought all the necessary items. The puja was done in proper traditional style.',
    ratings: { punctuality: 4, communication: 4, serviceQuality: 5, professionalism: 4 },
  },
  {
    comment: 'The Upanayan ceremony for my son was performed beautifully. Pandit ji guided us through each step patiently. The ceremony lasted 3.5 hours as expected. Very satisfied.',
    ratings: { punctuality: 5, communication: 5, serviceQuality: 5, professionalism: 5 },
  },
  {
    comment: 'Very knowledgeable pandit. He arrived early to survey the space before the puja. The Satyanarayan puja was followed by a complete katha recitation. Guests were very pleased.',
    ratings: { punctuality: 5, communication: 4, serviceQuality: 5, professionalism: 5 },
  },
  {
    comment: 'Good experience for the Annaprashan ceremony. Very gentle and patient with the baby. Explained the significance to all attending family members. Highly recommend for baby ceremonies.',
    ratings: { punctuality: 4, communication: 5, serviceQuality: 4, professionalism: 5 },
  },
];

/* Customer names for realistic data */
const CUSTOMER_NAMES = [
  { firstName: 'Rajesh',    lastName: 'Mehta',      phone: '9823001111' },
  { firstName: 'Priya',     lastName: 'Kulkarni',   phone: '9765002222' },
  { firstName: 'Amit',      lastName: 'Sharma',     phone: '9890003333' },
  { firstName: 'Sunita',    lastName: 'Deshmukh',   phone: '9823004444' },
  { firstName: 'Vikram',    lastName: 'Patil',      phone: '9765005555' },
  { firstName: 'Neha',      lastName: 'Joshi',      phone: '9890006666' },
  { firstName: 'Suresh',    lastName: 'Naik',       phone: '9823007777' },
  { firstName: 'Anita',     lastName: 'Bhosale',    phone: '9765008888' },
  { firstName: 'Manoj',     lastName: 'Wagh',       phone: '9890009999' },
  { firstName: 'Kavita',    lastName: 'Shinde',     phone: '9823010101' },
  { firstName: 'Deepak',    lastName: 'Gaikwad',    phone: '9765011111' },
  { firstName: 'Smita',     lastName: 'Pawar',      phone: '9890012222' },
  { firstName: 'Nitin',     lastName: 'More',       phone: '9823013333' },
  { firstName: 'Madhuri',   lastName: 'Kadam',      phone: '9765014444' },
  { firstName: 'Sanjay',    lastName: 'Thakur',     phone: '9890015555' },
  { firstName: 'Pooja',     lastName: 'Deshpande',  phone: '9823016666' },
  { firstName: 'Rahul',     lastName: 'Jadhav',     phone: '9765017777' },
  { firstName: 'Archana',   lastName: 'Chavan',     phone: '9890018888' },
  { firstName: 'Tushar',    lastName: 'Sawant',     phone: '9823019999' },
  { firstName: 'Varsha',    lastName: 'Mane',       phone: '9765020000' },
];

/* Past dates for bookings (spread over last 18 months) */
function pastDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d;
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function run() {
  console.log('🌱 Connecting to MongoDB…');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log('✅ Connected\n');

  /* ══════════════════════════════════════
     STEP 1 — VERIFY / REPORT: Services & Locations
  ══════════════════════════════════════ */
  console.log('📋 Checking services & locations…');
  const [catCount, svcCount, cityCount, areaCount] = await Promise.all([
    Category.countDocuments(),
    Service.countDocuments({ isActive: true }),
    GeoCity.countDocuments({ isActive: true }),
    GeoArea.countDocuments({ isActive: true }),
  ]);

  console.log(`   Categories:  ${catCount}`);
  console.log(`   Services:    ${svcCount}`);
  console.log(`   Cities:      ${cityCount}`);
  console.log(`   Areas:       ${areaCount}`);

  if (catCount === 0 || svcCount === 0) {
    console.log('\n⚠️  No services found! Run the base seed first:');
    console.log('   node server/seed.js');
    await mongoose.disconnect();
    process.exit(1);
  }
  if (cityCount === 0) {
    console.log('\n⚠️  No geo cities found! Run the base seed first:');
    console.log('   node server/seed.js');
    await mongoose.disconnect();
    process.exit(1);
  }
  console.log('   ✅ Services and locations look good\n');

  /* ══════════════════════════════════════
     STEP 2 — Load providers & services
  ══════════════════════════════════════ */
  console.log('👤 Loading providers…');
  const providers = await Provider.find({ isDeleted: false, status: 'ACTIVE' })
    .populate('serviceIds', 'name slug')
    .populate('userId', 'profile contact');

  if (providers.length === 0) {
    console.log('⚠️  No providers found. Run seed.js and seed-maharashtra.js first.');
    await mongoose.disconnect();
    process.exit(1);
  }
  console.log(`   Found ${providers.length} providers\n`);

  const allServices = await Service.find({ isActive: true });
  const svcBySlug   = Object.fromEntries(allServices.map(s => [s.slug, s]));

  /* ══════════════════════════════════════
     STEP 3 — Create customer users
  ══════════════════════════════════════ */
  console.log('👥 Creating customer accounts…');
  const customerUsers = [];
  for (const c of CUSTOMER_NAMES) {
    const email = `${c.firstName.toLowerCase()}.${c.lastName.toLowerCase()}@customer.dev`;
    let user = await User.findOne({ 'contact.email': email });
    if (!user) {
      user = new User({
        userType: 'CUSTOMER',
        profile: { firstName: c.firstName, lastName: c.lastName, displayName: `${c.firstName} ${c.lastName}` },
        contact: { email, phone: c.phone },
        status:  'ACTIVE',
      });
      await user.setPassword('Customer@123');
      await user.save();
    }
    customerUsers.push(user);
  }
  console.log(`   ✓ ${customerUsers.length} customer accounts ready\n`);

  /* ══════════════════════════════════════
     STEP 4 — Create completed bookings + reviews
  ══════════════════════════════════════ */
  console.log('📅 Creating bookings and reviews…');
  let bookingsCreated = 0;
  let reviewsCreated  = 0;
  let skipped         = 0;

  /* How many reviews per provider — spread load */
  const REVIEWS_PER_PROVIDER = 6;

  for (const provider of providers) {
    const providerServices = provider.serviceIds || [];
    if (providerServices.length === 0) {
      console.log(`   ⚠  ${provider.displayName} has no services, skipping`);
      continue;
    }

    const city    = provider.location?.city    || 'Indore';
    const state   = provider.location?.state   || 'Maharashtra';
    const country = provider.location?.country || 'IN';

    let reviewsForThisProvider = 0;
    let customerIdx = Math.floor(Math.random() * customerUsers.length);

    for (let i = 0; i < REVIEWS_PER_PROVIDER; i++) {
      const customer = customerUsers[customerIdx % customerUsers.length];
      customerIdx++;

      const svc      = providerServices[i % providerServices.length];
      const review   = REVIEW_POOL[i % REVIEW_POOL.length];
      const daysAgo  = randomBetween(10, 540); // spread over last 18 months
      const bookDate = pastDate(daysAgo);

      /* Check if this customer already has a completed booking with this provider for this service */
      const existingBooking = await Booking.findOne({
        customerId:        customer._id,
        primaryProviderId: provider._id,
        serviceId:         svc._id,
        status:            'COMPLETED',
      });

      let booking;
      if (existingBooking) {
        booking = existingBooking;
      } else {
        const priceBreakdown = provider.pricing?.breakdown || { pandit: 1500, samagri: 0, travel: 100, platform: 100 };
        const total = (priceBreakdown.pandit || 0) + (priceBreakdown.samagri || 0) +
                      (priceBreakdown.travel || 0) + (priceBreakdown.platform || 100);

        try {
          booking = await Booking.create({
            customerId:        customer._id,
            serviceId:         svc._id,
            primaryProviderId: provider._id,
            providers: [{ providerId: provider._id, role: 'PRIMARY', status: 'COMPLETED' }],
            event: {
              date: bookDate,
              startTime: '10:00',
              location: { city, state, country },
            },
            customerDetails: {
              name:    `${customer.profile.firstName} ${customer.profile.lastName}`,
              phone:   customer.contact?.phone || '',
              address: `${randomBetween(1, 99)}, ${city} - ${randomBetween(400001, 416500)}`,
            },
            pricingSnapshot: {
              items: [
                { itemType: 'PANDIT_FEE',   label: 'Pandit service fee', quantity: 1, unitPrice: priceBreakdown.pandit   || 1500, totalPrice: priceBreakdown.pandit   || 1500 },
                { itemType: 'PLATFORM_FEE', label: 'Platform fee',       quantity: 1, unitPrice: priceBreakdown.platform || 100,  totalPrice: priceBreakdown.platform || 100  },
              ].filter(x => x.totalPrice > 0),
              subtotal: total,
              discount: 0,
              total,
              currency: 'INR',
              panditCount: 1,
            },
            requirementsSnapshot: { service: svc.name },
            status:    'COMPLETED',
            createdBy: customer._id,
            modifiedBy: customer._id,
          });

          /* Backdate createdTime to match the ceremony date */
          await Booking.findByIdAndUpdate(booking._id, {
            $set: { createdTime: bookDate, modifiedTime: bookDate },
          });

          bookingsCreated++;

          /* Create payment for the booking */
          const existingPayment = await Payment.findOne({ bookingId: booking._id });
          if (!existingPayment) {
            await Payment.create({
              bookingId:  booking._id,
              customerId: customer._id,
              providerId: provider._id,
              amount:     total,
              currency:   'INR',
              method:     'CASH',
              status:     'PAID',
              paidAt:     bookDate,
              createdBy:  customer._id,
              modifiedBy: customer._id,
            });
          }
        } catch (err) {
          /* Skip duplicates or validation errors */
          skipped++;
          continue;
        }
      }

      /* Create review if it doesn't exist */
      const existingReview = await Review.findOne({ bookingId: booking._id });
      if (existingReview) {
        skipped++;
        continue;
      }

      try {
        await Review.create({
          bookingId:  booking._id,
          customerId: customer._id,
          providerId: provider._id,
          ratings:    review.ratings,
          comment:    review.comment,
          status:     'PUBLISHED',
          createdBy:  customer._id,
          modifiedBy: customer._id,
        });
        /* Backdate review too */
        await Review.findOneAndUpdate(
          { bookingId: booking._id },
          { $set: { createdTime: new Date(bookDate.getTime() + 86400000) } } // review next day
        );
        reviewsCreated++;
        reviewsForThisProvider++;
      } catch (err) {
        skipped++;
      }
    }

    /* Update provider bookingSummary.completed to reflect real data */
    const completedCount = await Booking.countDocuments({
      primaryProviderId: provider._id,
      status: 'COMPLETED',
      isDeleted: false,
    });
    await Provider.findByIdAndUpdate(provider._id, {
      $set: {
        'bookingSummary.completed': completedCount,
        'bookingSummary.total':     completedCount,
      },
    });

    console.log(`   ✓ ${provider.displayName.padEnd(35)} — ${reviewsForThisProvider} reviews`);
  }

  /* ══════════════════════════════════════
     STEP 5 — Final summary
  ══════════════════════════════════════ */
  const [totalBookings, totalReviews, totalPayments] = await Promise.all([
    Booking.countDocuments({ status: 'COMPLETED' }),
    Review.countDocuments({ status: 'PUBLISHED' }),
    Payment.countDocuments({ status: 'PAID' }),
  ]);

  console.log('\n══════════════════════════════════════');
  console.log('✅ Seed complete!');
  console.log(`   Bookings created:  ${bookingsCreated}`);
  console.log(`   Reviews created:   ${reviewsCreated}`);
  console.log(`   Skipped (exist):   ${skipped}`);
  console.log('──────────────────────────────────────');
  console.log(`   Total completed bookings in DB:  ${totalBookings}`);
  console.log(`   Total published reviews in DB:   ${totalReviews}`);
  console.log(`   Total paid payments in DB:       ${totalPayments}`);
  console.log('══════════════════════════════════════');
  console.log('\n📋 Services & Locations status:');
  console.log(`   Categories: ${catCount}  |  Services: ${svcCount}`);
  console.log(`   Cities:     ${cityCount}  |  Areas:    ${areaCount}`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
