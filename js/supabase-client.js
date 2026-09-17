/**
 * NaqeeB Motors - Supabase Client, API Helper & Local Sync Engine
 * Project URL: https://pvkysazaazmguczsqebs.supabase.co
 */

const SUPABASE_CONFIG = {
  url: 'https://pvkysazaazmguczsqebs.supabase.co',
  anonKey: 'sb_publishable_8Om3cKUhWKkTSeVBscIhrQ_svVpWSeL'
};

// Global formatPKR currency formatter
function formatPKR(amount) {
  if (!amount || isNaN(amount)) return 'Price on Call';
  const num = Number(amount);
  if (num >= 10000000) {
    const crore = (num / 10000000).toFixed(2);
    return `PKR ${crore} Crore`;
  } else if (num >= 100000) {
    const lacs = (num / 100000).toFixed(2);
    return `PKR ${lacs} Lacs`;
  } else {
    return `PKR ${num.toLocaleString()}`;
  }
}
window.formatPKR = formatPKR;

// Seed data used as reliable showroom fallback and initial offline storage
const SEED_VEHICLES = [
  {
    id: '0e4b5434-2c07-4543-87c1-455f7b2526af',
    brand: 'Jaecoo',
    model: 'J7',
    variant: 'AWD Premium Luxury',
    model_year: 2024,
    price: 10500000,
    mileage: 1200,
    fuel_type: 'Petrol',
    transmission: 'Automatic',
    engine_capacity: '1600cc Turbo',
    exterior_colour: 'Emerald Green',
    registration_city: 'Unregistered',
    vehicle_origin: 'Japanese / Imported',
    condition_notes: 'Brand new showroom condition, zero scratches, panoramic sunroof, intelligent AWD drive modes.',
    description: 'The flagship Jaecoo J7 combines rugged capability with executive comfort. Features 360-degree cameras, HUD, ADAS Level 2 safety suite, and premium ventilated seats.',
    status: 'Available',
    is_featured: true,
    vehicle_images: [{ id: 'img-1', image_url: '/assets/images/showroom.jpg', is_primary: true, display_order: 0 }]
  },
  {
    id: '85f452a8-939b-4414-8a8d-0d8c0406a30d',
    brand: 'Toyota',
    model: 'Corolla Altis Grande',
    variant: '1.8 CVT-i Special Edition',
    model_year: 2023,
    price: 7650000,
    mileage: 14200,
    fuel_type: 'Petrol',
    transmission: 'Automatic',
    engine_capacity: '1800cc Dual VVT-i',
    exterior_colour: 'Super White',
    registration_city: 'Islamabad',
    vehicle_origin: 'Pakistani / Local',
    condition_notes: '100% bumper to bumper genuine paint. Single owner maintained with complete authorized dealership history.',
    description: 'Pakistan’s favorite executive sedan. Equipped with sunroof, beige leather interior, cruise control, paddle shifters, and push-start engine.',
    status: 'Available',
    is_featured: true,
    vehicle_images: [{ id: 'img-2', image_url: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=1200&auto=format&fit=crop&q=80', is_primary: true, display_order: 0 }]
  },
  {
    id: '2e8cc61e-22e1-40c5-a9ad-111dc77b9aa0',
    brand: 'Honda',
    model: 'Civic RS',
    variant: '1.5 VTEC Turbo',
    model_year: 2023,
    price: 9200000,
    mileage: 19500,
    fuel_type: 'Petrol',
    transmission: 'Automatic',
    engine_capacity: '1500cc VTEC Turbo',
    exterior_colour: 'Crystal Black Pearl',
    registration_city: 'Islamabad',
    vehicle_origin: 'Pakistani / Local',
    condition_notes: 'Immaculate condition. Factory warranty active, ceramic coated, genuine 19k mileage.',
    description: 'High performance sports sedan featuring Honda SENSING suite, dual exhaust, black sporty alloy rims, ambient lighting, and electronic parking brake.',
    status: 'Available',
    is_featured: true,
    vehicle_images: [{ id: 'img-3', image_url: 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=1200&auto=format&fit=crop&q=80', is_primary: true, display_order: 0 }]
  },
  {
    id: 'f62955b0-6909-44b7-8992-6803f2ed5728',
    brand: 'Toyota',
    model: 'Land Cruiser Prado',
    variant: 'TX-L 7-Seater',
    model_year: 2022,
    price: 34500000,
    mileage: 28000,
    fuel_type: 'Diesel',
    transmission: 'Automatic',
    engine_capacity: '2800cc D-4D Turbo',
    exterior_colour: 'Pearl White',
    registration_city: 'Islamabad',
    vehicle_origin: 'Japanese / Imported',
    condition_notes: 'Grade 4.5 Japanese Auction Sheet verified. Dual AC, Modellista body styling kit, sunroof.',
    description: 'Iconic luxury 4x4 SUV. Features full 7-seater leather interior, crawl control, KDSS suspension, heated/cooled seats, and premium surround sound system.',
    status: 'Available',
    is_featured: true,
    vehicle_images: [{ id: 'img-4', image_url: 'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=1200&auto=format&fit=crop&q=80', is_primary: true, display_order: 0 }]
  },
  {
    id: '384508ed-29c7-4cfa-a76f-ee01760645bd',
    brand: 'Suzuki',
    model: 'Swift',
    variant: 'GLX CVT',
    model_year: 2024,
    price: 4850000,
    mileage: 6500,
    fuel_type: 'Petrol',
    transmission: 'Automatic',
    engine_capacity: '1200cc DOHC',
    exterior_colour: 'Phoenix Red',
    registration_city: 'Islamabad',
    vehicle_origin: 'Pakistani / Local',
    condition_notes: 'Practically brand new, zero touch-ups, smart entry with push start.',
    description: 'Modern, fuel-efficient hatchback with 6 airbags, LED projector headlights, cruise control, 9-inch infotainment screen, and reverse camera.',
    status: 'Available',
    is_featured: false,
    vehicle_images: [{ id: 'img-5', image_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200&auto=format&fit=crop&q=80', is_primary: true, display_order: 0 }]
  },
  {
    id: '0d8c2c6b-a0db-4c8d-b319-aaafd4035407',
    brand: 'Daihatsu',
    model: 'Tanto Custom',
    variant: 'RS Turbo Top Edition',
    model_year: 2022,
    price: 3950000,
    mileage: 22000,
    fuel_type: 'Petrol',
    transmission: 'Automatic',
    engine_capacity: '660cc Turbo',
    exterior_colour: 'Two-Tone Black/Blue',
    registration_city: 'Unregistered',
    vehicle_origin: 'Japanese / Imported',
    condition_notes: 'Japanese import, Grade 4.5, dual electric power sliding doors, radar braking system.',
    description: 'Spacious Japanese kei car with outstanding fuel economy (22+ km/L), pillarless sliding doors, auto-folding mirrors, and multi-angle parking assist.',
    status: 'Available',
    is_featured: false,
    vehicle_images: [{ id: 'img-6', image_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&auto=format&fit=crop&q=80', is_primary: true, display_order: 0 }]
  }
];

const SEED_CUSTOMERS = [
  { id: 'c-1', name: 'Malik Zeeshan Tariq', phone: '+92 300 5551234', cnic: '37405-1234567-1', email: 'malik.zeeshan@gmail.com', address: 'Sector F-7/2, Islamabad', notes: 'VIP client, interested in SUVs' },
  { id: 'c-2', name: 'Raja Daniyal Ahmed', phone: '+92 333 9876543', cnic: '61101-9876543-3', email: 'daniyal.raja@outlook.com', address: 'Soan Gardens, Block B, Islamabad', notes: 'Purchased Grande 2023' },
  { id: 'c-3', name: 'Dr. Shahzad Qureshi', phone: '+92 345 4443322', cnic: '37405-5556667-5', email: 'dr.shahzad@yahoo.com', address: 'PWD Housing Scheme, Islamabad', notes: 'Inquired for Honda Civic RS' }
];

const SEED_SALES = [
  {
    id: 's-1',
    receipt_number: 'NM-RCP-000001',
    vehicle_id: '85f452a8-939b-4414-8a8d-0d8c0406a30d',
    customer_id: 'c-2',
    sale_date: '2026-09-10',
    sale_price: 7650000,
    amount_received: 7650000,
    remaining_amount: 0,
    payment_method: 'Bank Transfer',
    notes: 'Full payment received, original documents delivered with biometric verification transfer.',
    vehicles: {
      id: '85f452a8-939b-4414-8a8d-0d8c0406a30d',
      brand: 'Toyota',
      model: 'Corolla Altis Grande',
      variant: '1.8 CVT-i Special Edition',
      model_year: 2023,
      exterior_colour: 'Super White',
      engine_capacity: '1800cc Dual VVT-i',
      transmission: 'Automatic',
      fuel_type: 'Petrol',
      registration_city: 'Islamabad',
      mileage: 14200,
      vehicle_origin: 'Pakistani / Local'
    },
    customers: {
      id: 'c-2',
      name: 'Raja Daniyal Ahmed',
      phone: '+92 333 9876543',
      cnic: '61101-9876543-3',
      email: 'daniyal.raja@outlook.com',
      address: 'Soan Gardens, Block B, Islamabad'
    }
  }
];

// Local Storage Helper
function getLocalStore(key, defaultVal) {
  try {
    const raw = localStorage.getItem(`naqeeb_${key}`);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

function setLocalStore(key, val) {
  try {
    localStorage.setItem(`naqeeb_${key}`, JSON.stringify(val));
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
}

// Initialize local cache if not set
if (!localStorage.getItem('naqeeb_vehicles')) {
  setLocalStore('vehicles', SEED_VEHICLES);
}
if (!localStorage.getItem('naqeeb_customers')) {
  setLocalStore('customers', SEED_CUSTOMERS);
}
if (!localStorage.getItem('naqeeb_sales')) {
  setLocalStore('sales', SEED_SALES);
}

// Initialize Supabase Client
let _supabaseInstance = null;

function getSupabase() {
  if (!_supabaseInstance) {
    if (typeof supabase !== 'undefined' && supabase.createClient) {
      _supabaseInstance = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    } else if (window.supabase && window.supabase.createClient) {
      _supabaseInstance = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    } else {
      console.warn('Supabase SDK not loaded in window. Using local fallback mode.');
    }
  }
  return _supabaseInstance;
}

// ------------------------------------------------------------------------------
// PUBLIC API HELPERS
// ------------------------------------------------------------------------------

/**
 * Fetch available vehicles for the public showroom
 */
async function fetchAvailableVehicles(filters = {}) {
  const sb = getSupabase();
  let vehicles = [];

  if (sb) {
    try {
      let query = sb
        .from('vehicles')
        .select(`
          *,
          vehicle_images (
            id,
            image_url,
            is_primary,
            display_order
          )
        `)
        .eq('status', 'Available')
        .order('created_at', { ascending: false });

      if (filters.origin && filters.origin !== 'All') {
        query = query.eq('vehicle_origin', filters.origin);
      }
      if (filters.brand && filters.brand !== 'All') {
        query = query.ilike('brand', `%${filters.brand}%`);
      }
      if (filters.maxPrice) {
        query = query.lte('price', filters.maxPrice);
      }
      if (filters.transmission && filters.transmission !== 'All') {
        query = query.eq('transmission', filters.transmission);
      }
      if (filters.fuelType && filters.fuelType !== 'All') {
        query = query.eq('fuel_type', filters.fuelType);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        vehicles = data;
      }
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to local database:', err);
    }
  }

  // Merge with local storage
  const localVehicles = getLocalStore('vehicles', SEED_VEHICLES);
  if (vehicles.length === 0) {
    vehicles = localVehicles.filter(v => v.status === 'Available');
  } else {
    const remoteIds = new Set(vehicles.map(v => v.id));
    const localOnly = localVehicles.filter(v => v.status === 'Available' && !remoteIds.has(v.id));
    vehicles = [...localOnly, ...vehicles];
  }

  return vehicles;
}

/**
 * Fetch single vehicle by ID with all images
 */
async function fetchVehicleById(vehicleId) {
  if (!vehicleId) return null;
  const sb = getSupabase();

  if (sb) {
    try {
      const { data, error } = await sb
        .from('vehicles')
        .select(`
          *,
          vehicle_images (
            id,
            image_url,
            is_primary,
            display_order
          )
        `)
        .eq('id', vehicleId)
        .single();

      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn('Supabase fetch vehicle by id error:', err);
    }
  }

  const localVehicles = getLocalStore('vehicles', SEED_VEHICLES);
  return localVehicles.find(v => String(v.id) === String(vehicleId)) || null;
}

// ------------------------------------------------------------------------------
// STAFF & MANAGEMENT API HELPERS
// ------------------------------------------------------------------------------

/**
 * Get Staff Dashboard Metrics
 */
async function fetchDashboardStats() {
  const [vehicles, customers, sales] = await Promise.all([
    fetchAllVehiclesStaff(),
    fetchCustomersStaff(),
    fetchSalesStaff()
  ]);

  const totalVehicles = vehicles.length;
  const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
  const soldVehicles = vehicles.filter(v => v.status === 'Sold').length;
  const totalCustomers = customers.length;

  return {
    totalVehicles,
    availableVehicles,
    soldVehicles,
    totalCustomers,
    recentSales: sales
  };
}

/**
 * Fetch all vehicles for staff management
 */
async function fetchAllVehiclesStaff() {
  const sb = getSupabase();
  let vehicles = [];

  if (sb) {
    try {
      const { data, error } = await sb
        .from('vehicles')
        .select(`
          *,
          vehicle_images (
            id,
            image_url,
            is_primary,
            display_order
          )
        `)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        vehicles = data;
      }
    } catch (err) {
      console.warn('Supabase staff vehicles fetch error:', err);
    }
  }

  const localVehicles = getLocalStore('vehicles', SEED_VEHICLES);
  if (vehicles.length === 0) {
    return localVehicles;
  } else {
    const remoteIds = new Set(vehicles.map(v => v.id));
    const localOnly = localVehicles.filter(v => !remoteIds.has(v.id));
    return [...localOnly, ...vehicles];
  }
}

/**
 * Save (Insert or Update) Vehicle Record
 */
async function saveVehicleRecord(vehicleData, imageUrls = []) {
  const sb = getSupabase();
  const id = vehicleData.id || `veh_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  const formattedImages = (imageUrls && imageUrls.length > 0)
    ? imageUrls.map((url, idx) => ({ id: `img_${Date.now()}_${idx}`, image_url: url, is_primary: idx === 0, display_order: idx }))
    : [{ id: `img_${Date.now()}_0`, image_url: '/assets/images/showroom.jpg', is_primary: true, display_order: 0 }];

  const record = {
    ...vehicleData,
    id: id,
    vehicle_origin: vehicleData.vehicle_origin || 'Pakistani / Local',
    status: vehicleData.status || 'Available',
    vehicle_images: formattedImages,
    created_at: vehicleData.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // 1. Update local storage
  const localVehicles = getLocalStore('vehicles', SEED_VEHICLES);
  const existingIndex = localVehicles.findIndex(v => String(v.id) === String(id));
  if (existingIndex >= 0) {
    localVehicles[existingIndex] = { ...localVehicles[existingIndex], ...record };
  } else {
    localVehicles.unshift(record);
  }
  setLocalStore('vehicles', localVehicles);

  // 2. Sync to Supabase
  if (sb) {
    try {
      const { id: vid, vehicle_images, ...payload } = record;
      if (vehicleData.id) {
        await sb.from('vehicles').update(payload).eq('id', vid);
      } else {
        await sb.from('vehicles').insert([{ id: vid, ...payload }]);
      }
      if (imageUrls && imageUrls.length > 0) {
        const imageRecords = imageUrls.map((url, index) => ({
          vehicle_id: vid,
          image_url: url,
          is_primary: index === 0,
          display_order: index
        }));
        await sb.from('vehicle_images').insert(imageRecords);
      }
    } catch (err) {
      console.warn('Supabase remote sync failed (stored locally):', err);
    }
  }

  return id;
}

/**
 * Update Vehicle Status
 */
async function updateVehicleStatus(vehicleId, status) {
  const localVehicles = getLocalStore('vehicles', SEED_VEHICLES);
  const v = localVehicles.find(item => String(item.id) === String(vehicleId));
  if (v) {
    v.status = status;
    v.updated_at = new Date().toISOString();
    setLocalStore('vehicles', localVehicles);
  }

  const sb = getSupabase();
  if (sb) {
    try {
      await sb.from('vehicles').update({ status, updated_at: new Date().toISOString() }).eq('id', vehicleId);
    } catch (err) {
      console.warn('Supabase status update error:', err);
    }
  }

  return v;
}

/**
 * Upload Image to Supabase Storage Bucket ('vehicle-images') with local Base64 fallback
 */
async function uploadVehicleImage(file) {
  const sb = getSupabase();
  if (sb && sb.storage) {
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
      const filePath = `cars/${fileName}`;

      const { error: uploadError } = await sb.storage
        .from('vehicle-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (!uploadError) {
        const { data: publicUrlData } = sb.storage.from('vehicle-images').getPublicUrl(filePath);
        if (publicUrlData && publicUrlData.publicUrl) {
          return publicUrlData.publicUrl;
        }
      }
    } catch (err) {
      console.warn('Supabase storage upload error, using local data URL:', err);
    }
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => resolve('/assets/images/showroom.jpg');
    reader.readAsDataURL(file);
  });
}

/**
 * Customers CRUD
 */
async function fetchCustomersStaff() {
  const sb = getSupabase();
  let customers = [];

  if (sb) {
    try {
      const { data, error } = await sb.from('customers').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        customers = data;
      }
    } catch (err) {
      console.warn('Supabase customer fetch error:', err);
    }
  }

  const localCustomers = getLocalStore('customers', SEED_CUSTOMERS);
  if (customers.length === 0) return localCustomers;

  const remoteIds = new Set(customers.map(c => c.id));
  const localOnly = localCustomers.filter(c => !remoteIds.has(c.id));
  return [...localOnly, ...customers];
}

async function saveCustomerRecord(customerData) {
  const id = customerData.id || `cust_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const record = { ...customerData, id, created_at: customerData.created_at || new Date().toISOString() };

  const localCustomers = getLocalStore('customers', SEED_CUSTOMERS);
  const existingIdx = localCustomers.findIndex(c => String(c.id) === String(id));
  if (existingIdx >= 0) {
    localCustomers[existingIdx] = { ...localCustomers[existingIdx], ...record };
  } else {
    localCustomers.unshift(record);
  }
  setLocalStore('customers', localCustomers);

  const sb = getSupabase();
  if (sb) {
    try {
      if (customerData.id) {
        await sb.from('customers').update(record).eq('id', id);
      } else {
        await sb.from('customers').insert([record]);
      }
    } catch (err) {
      console.warn('Supabase save customer error (saved locally):', err);
    }
  }

  return record;
}

/**
 * Sales CRUD with Permanent Unique Receipt Number Support
 */
async function fetchSalesStaff() {
  const sb = getSupabase();
  let sales = [];

  if (sb) {
    try {
      const { data, error } = await sb
        .from('sales')
        .select(`
          *,
          vehicles (*),
          customers (*)
        `)
        .order('sale_date', { ascending: false });

      if (!error && data && data.length > 0) {
        sales = data;
      }
    } catch (err) {
      console.warn('Supabase sales fetch error:', err);
    }
  }

  const localSales = getLocalStore('sales', SEED_SALES);
  if (sales.length === 0) return localSales;

  const remoteIds = new Set(sales.map(s => s.id));
  const localOnly = localSales.filter(s => !remoteIds.has(s.id));
  return [...localOnly, ...sales];
}

/**
 * Fetch a single sale record by ID
 */
async function fetchSaleById(saleId) {
  if (!saleId) return null;
  const sales = await fetchSalesStaff();
  return sales.find(s => String(s.id) === String(saleId)) || null;
}

/**
 * Generate Next Sequential Permanent Receipt Number (e.g. NM-RCP-000002)
 */
function generateNextReceiptNumber(existingSales = []) {
  let highestNum = 0;
  existingSales.forEach(s => {
    if (s.receipt_number && s.receipt_number.startsWith('NM-RCP-')) {
      const numPart = parseInt(s.receipt_number.replace('NM-RCP-', ''), 10);
      if (!isNaN(numPart) && numPart > highestNum) {
        highestNum = numPart;
      }
    }
  });
  const nextNum = Math.max(highestNum + 1, existingSales.length + 1);
  return `NM-RCP-${String(nextNum).padStart(6, '0')}`;
}

/**
 * Record a sale, generate receipt, update vehicle status, and persist
 */
async function recordSaleRecord(saleData) {
  const id = saleData.id || `sale_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  // Find linked vehicle and customer
  const [vehicles, customers, existingSales] = await Promise.all([
    fetchAllVehiclesStaff(),
    fetchCustomersStaff(),
    fetchSalesStaff()
  ]);

  const matchedVehicle = vehicles.find(v => String(v.id) === String(saleData.vehicle_id));
  let matchedCustomer = customers.find(c => String(c.id) === String(saleData.customer_id));

  // If customer details were entered as custom/walk-in in saleData
  if (!matchedCustomer && saleData.customer_name) {
    matchedCustomer = {
      name: saleData.customer_name,
      phone: saleData.customer_phone || '-',
      cnic: saleData.customer_cnic || '-',
      address: saleData.customer_address || '-'
    };
  }

  // Determine permanent receipt number (preserved if already set)
  const receiptNumber = saleData.receipt_number || generateNextReceiptNumber(existingSales);

  const record = {
    ...saleData,
    id,
    receipt_number: receiptNumber,
    created_at: saleData.created_at || new Date().toISOString(),
    sale_date: saleData.sale_date || new Date().toISOString().split('T')[0],
    vehicles: matchedVehicle ? {
      id: matchedVehicle.id,
      brand: matchedVehicle.brand || '',
      model: matchedVehicle.model || '',
      variant: matchedVehicle.variant || '',
      model_year: matchedVehicle.model_year || '',
      exterior_colour: matchedVehicle.exterior_colour || '',
      engine_capacity: matchedVehicle.engine_capacity || '',
      transmission: matchedVehicle.transmission || '',
      fuel_type: matchedVehicle.fuel_type || '',
      registration_city: matchedVehicle.registration_city || '',
      mileage: matchedVehicle.mileage || '',
      vehicle_origin: matchedVehicle.vehicle_origin || ''
    } : { brand: 'Showroom Vehicle', model: '' },
    customers: matchedCustomer ? {
      id: matchedCustomer.id || 'walkin',
      name: matchedCustomer.name || 'Valued Client',
      phone: matchedCustomer.phone || '-',
      cnic: matchedCustomer.cnic || '-',
      email: matchedCustomer.email || '-',
      address: matchedCustomer.address || '-'
    } : { name: 'Valued Client', phone: '-' }
  };

  // 1. Save sale locally
  const localSales = getLocalStore('sales', SEED_SALES);
  localSales.unshift(record);
  setLocalStore('sales', localSales);

  // 2. Mark vehicle as Sold
  if (saleData.vehicle_id) {
    await updateVehicleStatus(saleData.vehicle_id, 'Sold');
  }

  // 3. Sync to Supabase
  const sb = getSupabase();
  if (sb) {
    try {
      const { vehicles: _, customers: __, customer_name, customer_phone, customer_cnic, customer_address, ...payload } = record;
      await sb.from('sales').insert([payload]);
      await sb.from('vehicles').update({ status: 'Sold' }).eq('id', saleData.vehicle_id);
    } catch (err) {
      console.warn('Supabase sale record error (saved locally):', err);
    }
  }

  return record;
}

// Global exposure
window.NaqeebDB = {
  getSupabase,
  formatPKR,
  fetchAvailableVehicles,
  fetchVehicleById,
  fetchDashboardStats,
  fetchAllVehiclesStaff,
  saveVehicleRecord,
  updateVehicleStatus,
  uploadVehicleImage,
  fetchCustomersStaff,
  saveCustomerRecord,
  fetchSalesStaff,
  fetchSaleById,
  recordSaleRecord,
  SEED_VEHICLES,
  SEED_CUSTOMERS,
  SEED_SALES
};
