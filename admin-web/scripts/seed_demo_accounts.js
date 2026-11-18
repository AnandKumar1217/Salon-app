const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://tammisettyanandkumar1_db_user:gJdkTgCS7NmZmnE2@cluster0.lvrwitr.mongodb.net';
const DB_NAME = 'Glamora';

async function seedDemo() {
  console.log('Connecting to MongoDB Atlas at', DB_NAME, '...');
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DB_NAME);

  const saltRounds = 10;
  const adminHash = await bcrypt.hash('admin123', saltRounds);
  const ownerHash = await bcrypt.hash('OwnerPassword123!', saltRounds);
  const customerHash = await bcrypt.hash('CustomerPassword123!', saltRounds);

  // 1. Ensure Super Admin in admin_users
  await db.collection('admin_users').updateOne(
    { email: 'admin@glamora.com' },
    {
      $set: {
        id: 'adm_super_001',
        email: 'admin@glamora.com',
        name: 'Super Administrator',
        role: 'SUPER_ADMIN',
        passwordHash: adminHash,
        isActive: true,
        updatedAt: new Date().toISOString(),
      },
      $setOnInsert: {
        createdAt: new Date().toISOString(),
      },
    },
    { upsert: true }
  );
  console.log('✓ Super Admin ensured: admin@glamora.com (pass: admin123)');

  // 2. Ensure Demo Salon in salons collection
  const fullWorkingHours = {
    monday: { isWorking: true, start: '09:00', end: '20:00', breaks: [{ start: '13:00', end: '14:00' }] },
    tuesday: { isWorking: true, start: '09:00', end: '20:00', breaks: [{ start: '13:00', end: '14:00' }] },
    wednesday: { isWorking: true, start: '09:00', end: '20:00', breaks: [{ start: '13:00', end: '14:00' }] },
    thursday: { isWorking: true, start: '09:00', end: '20:00', breaks: [{ start: '13:00', end: '14:00' }] },
    friday: { isWorking: true, start: '09:00', end: '20:00', breaks: [{ start: '13:00', end: '14:00' }] },
    saturday: { isWorking: true, start: '09:00', end: '21:00', breaks: [{ start: '13:00', end: '14:00' }] },
    sunday: { isWorking: true, start: '10:00', end: '19:00', breaks: [{ start: '13:00', end: '14:00' }] },
  };

  const demoSalon = {
    id: 'salon_luxe_glow',
    name: 'Luxe Glow Salon & Spa',
    slug: 'luxe-glow-salon-spa',
    tagline: 'Premium Hair Styling, Organic Spa & Skin Rejuvenation',
    about: 'Luxe Glow is an upscale salon offering bespoke hair transformations, luxury Balinese spa therapies, and advanced aesthetic facial treatments.',
    ownerId: 'usr_demo_owner_001',
    ownerName: 'Priya Sharma',
    ownerEmail: 'owner@glamora.com',
    ownerPhone: '+91 98450 12345',
    phone: '+91 98450 12345',
    whatsappNumber: '+91 98450 12345',
    address: 'Plot 42, 100 Feet Road, Indiranagar',
    city: 'Bengaluru',
    postalCode: '560038',
    latitude: 12.9716,
    longitude: 77.5946,
    status: 'APPROVED',
    isOnlineBookingPaused: false,
    rating: 4.9,
    reviewCount: 128,
    bufferMinutes: 10,
    coverImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80',
    ],
    openingHours: {
      monday: { isOpen: true, open: '09:00', close: '20:00' },
      tuesday: { isOpen: true, open: '09:00', close: '20:00' },
      wednesday: { isOpen: true, open: '09:00', close: '20:00' },
      thursday: { isOpen: true, open: '09:00', close: '20:00' },
      friday: { isOpen: true, open: '09:00', close: '20:00' },
      saturday: { isOpen: true, open: '09:00', close: '21:00' },
      sunday: { isOpen: true, open: '10:00', close: '19:00' },
    },
    services: [
      {
        id: 'srv_cut_01',
        name: 'Precision Haircut & Style',
        category: 'Hair',
        price: 1200,
        durationMinutes: 45,
        description: 'Includes consultation, hair wash, precision cut, and blow-dry style.',
        isAvailableOnline: true,
      },
      {
        id: 'srv_spa_01',
        name: 'Balinese Aromatherapy Spa',
        category: 'Spa',
        price: 2500,
        durationMinutes: 60,
        description: 'Traditional deep tissue relaxation with authentic herbal oils.',
        isAvailableOnline: true,
      },
      {
        id: 'srv_fac_01',
        name: 'Hydra-Glow Facial Treatment',
        category: 'Facial',
        price: 1800,
        durationMinutes: 45,
        description: 'Deep hydration pore cleansing and glow serum infusion.',
        isAvailableOnline: true,
      },
      {
        id: 'srv_col_01',
        name: 'Global Organic Hair Colour',
        category: 'Hair',
        price: 3500,
        durationMinutes: 90,
        description: 'Ammonia-free high-shine radiant colour treatment.',
        isAvailableOnline: true,
      },
    ],
    staff: [
      {
        id: 'st_aarav_01',
        name: 'Aarav Sharma',
        role: 'Master Stylist',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        specialties: ['Hair', 'Spa'],
        rating: 4.9,
        reviewCount: 84,
        isActive: true,
        workingHours: fullWorkingHours,
      },
      {
        id: 'st_priya_01',
        name: 'Priya Patel',
        role: 'Senior Aesthetician',
        avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
        specialties: ['Spa', 'Facial'],
        rating: 5.0,
        reviewCount: 62,
        isActive: true,
        workingHours: fullWorkingHours,
      },
    ],
    updatedAt: new Date().toISOString(),
  };

  await db.collection('salons').updateOne(
    { id: 'salon_luxe_glow' },
    { $set: demoSalon, $setOnInsert: { createdAt: new Date().toISOString() } },
    { upsert: true }
  );
  console.log('✓ Demo Salon ensured: Luxe Glow Salon & Spa (id: salon_luxe_glow)');

  // 3. Ensure Demo Salon Owner in users
  await db.collection('users').updateOne(
    { email: 'owner@glamora.com' },
    {
      $set: {
        id: 'usr_demo_owner_001',
        email: 'owner@glamora.com',
        name: 'Priya Sharma',
        phone: '+91 98450 12345',
        roles: ['customer', 'salon_owner'],
        salonId: 'salon_luxe_glow',
        applicationStatus: 'APPROVED',
        passwordHash: ownerHash,
        updatedAt: new Date().toISOString(),
      },
      $setOnInsert: {
        createdAt: new Date().toISOString(),
      },
    },
    { upsert: true }
  );
  console.log('✓ Demo Salon Owner ensured: owner@glamora.com (pass: OwnerPassword123!)');

  // 4. Ensure Demo Customer in users
  await db.collection('users').updateOne(
    { email: 'customer@glamora.com' },
    {
      $set: {
        id: 'usr_demo_customer_001',
        email: 'customer@glamora.com',
        name: 'Ananya Roy',
        phone: '+91 98765 43210',
        roles: ['customer'],
        passwordHash: customerHash,
        updatedAt: new Date().toISOString(),
      },
      $setOnInsert: {
        createdAt: new Date().toISOString(),
      },
    },
    { upsert: true }
  );
  console.log('✓ Demo Customer ensured: customer@glamora.com (pass: CustomerPassword123!)');

  // 5. Seed a sample booking so that owner and admin immediately see live activity
  const sampleBooking = {
    id: 'bkg_demo_init_001',
    bookingCode: 'GLM-78241',
    salonId: 'salon_luxe_glow',
    salonName: 'Luxe Glow Salon & Spa',
    salonAddress: 'Plot 42, 100 Feet Road, Indiranagar',
    salonPhone: '+91 98450 12345',
    salonWhatsapp: '+91 98450 12345',
    salonImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
    customerId: 'usr_demo_customer_001',
    customerName: 'Ananya Roy',
    customerPhone: '+91 98765 43210',
    customerEmail: 'customer@glamora.com',
    staffId: 'st_aarav_01',
    staffName: 'Aarav Sharma',
    services: [
      {
        id: 'srv_cut_01',
        name: 'Precision Haircut & Style',
        category: 'Hair',
        price: 1200,
        durationMinutes: 45,
      },
    ],
    totalDurationMinutes: 45,
    bufferMinutes: 10,
    date: '2026-11-20',
    startTime: '11:00',
    endTime: '11:45',
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    paymentMethod: 'ONLINE',
    subtotal: 1200,
    tax: 60,
    totalAmount: 1260,
    source: 'PUBLIC_WEB',
    notes: 'Customer requested styling consultation for upcoming event',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.collection('bookings').updateOne(
    { id: 'bkg_demo_init_001' },
    { $set: sampleBooking },
    { upsert: true }
  );
  console.log('✓ Demo Booking ensured: GLM-78241 for Ananya Roy at Luxe Glow Salon & Spa');

  await client.close();
  console.log('\n--- MongoDB Atlas Seeding Successfully Completed ---');
}

seedDemo().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
