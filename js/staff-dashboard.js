/**
 * NaqeeB Motors - Staff Dashboard & Management Controller
 * Includes Official Dealership Receipt Generation, PDF Export & Print Engine
 */

let currentStaffUser = null;
let currentVehiclesList = [];
let currentCustomersList = [];
let currentActiveReceiptSale = null;

document.addEventListener('DOMContentLoaded', async () => {
  await initStaffApp();
});

async function initStaffApp() {
  const session = await window.NaqeebAuth.getSession();
  const pageType = document.body.getAttribute('data-staff-page') || 'dashboard';
  const loginSection = document.getElementById('staff-login-section');
  const appSection = document.getElementById('staff-app-section');

  // If on subpages without a session, automatically authenticate as authorized staff
  if (!session) {
    if (pageType === 'dashboard') {
      if (loginSection) loginSection.style.display = 'flex';
      if (appSection) appSection.style.display = 'none';
      initLoginForm();
      return;
    } else {
      window.NaqeebAuth.quickStaffLogin();
      currentStaffUser = { email: 'staff@naqeebmotors.com', role: 'staff' };
    }
  } else {
    currentStaffUser = session.user || { email: 'staff@naqeebmotors.com' };
  }

  // Show App Section
  if (loginSection) loginSection.style.display = 'none';
  if (appSection) appSection.style.display = 'block';

  const emailDisplays = document.querySelectorAll('#staff-user-email');
  emailDisplays.forEach(el => {
    el.textContent = currentStaffUser.email || 'staff@naqeebmotors.com';
  });

  // Load page-specific data & modals
  if (pageType === 'dashboard') {
    loadDashboardData();
  } else if (pageType === 'vehicles') {
    loadVehiclesManagement();
  } else if (pageType === 'customers') {
    loadCustomersManagement();
  } else if (pageType === 'sales') {
    loadSalesManagement();
  }

  initGlobalStaffActions();
  initReceiptModalListeners();
}

// ------------------------------------------------------------------------------
// LOGIN & AUTH
// ------------------------------------------------------------------------------
function initLoginForm() {
  const form = document.getElementById('staff-login-form');
  const errorMsg = document.getElementById('login-error-msg');
  const quickLoginBtn = document.getElementById('quick-demo-login-btn');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const submitBtn = form.querySelector('button[type="submit"]');

    if (errorMsg) errorMsg.style.display = 'none';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Verifying Credentials...';
    }

    try {
      await window.NaqeebAuth.signIn(email, password);
      window.location.reload();
    } catch (err) {
      if (errorMsg) {
        errorMsg.textContent = err.message || 'Invalid email or password.';
        errorMsg.style.display = 'block';
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In to Portal';
      }
    }
  });

  if (quickLoginBtn) {
    quickLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.NaqeebAuth.quickStaffLogin();
      window.location.reload();
    });
  }
}

function initGlobalStaffActions() {
  const logoutBtns = document.querySelectorAll('#staff-logout-btn');
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', () => window.NaqeebAuth.signOut());
  });
}

// ------------------------------------------------------------------------------
// 1. STAFF DASHBOARD
// ------------------------------------------------------------------------------
async function loadDashboardData() {
  const stats = await window.NaqeebDB.fetchDashboardStats();

  const totalEl = document.getElementById('stat-total-vehicles');
  const availEl = document.getElementById('stat-avail-vehicles');
  const soldEl = document.getElementById('stat-sold-vehicles');
  const custEl = document.getElementById('stat-total-customers');

  if (totalEl) totalEl.textContent = stats.totalVehicles;
  if (availEl) availEl.textContent = stats.availableVehicles;
  if (soldEl) soldEl.textContent = stats.soldVehicles;
  if (custEl) custEl.textContent = stats.totalCustomers;

  // Load Recent Vehicles table
  const vehicles = await window.NaqeebDB.fetchAllVehiclesStaff();
  const recentVehicles = vehicles.slice(0, 6);
  const vTableBody = document.getElementById('dashboard-recent-vehicles-tbody');

  if (vTableBody) {
    if (recentVehicles.length === 0) {
      vTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">No vehicles in inventory yet. Click "Add Vehicle" to create your first listing.</td></tr>';
    } else {
      vTableBody.innerHTML = recentVehicles.map(car => `
        <tr>
          <td><strong>${car.model_year || ''} ${car.brand || ''} ${car.model || ''}</strong></td>
          <td>${car.vehicle_origin || 'Pakistani / Local'}</td>
          <td>${window.formatPKR(car.price)}</td>
          <td>${car.mileage ? Number(car.mileage).toLocaleString() + ' km' : '-'}</td>
          <td><span class="badge-status ${(car.status || 'available').toLowerCase()}">${car.status || 'Available'}</span></td>
          <td>
            <a href="/staff/vehicles.html" class="btn btn-secondary btn-sm" style="padding: 4px 10px; font-size: 0.75rem;">Manage</a>
          </td>
        </tr>
      `).join('');
    }
  }

  // Load Recent Sales table with Receipt view action
  const sales = await window.NaqeebDB.fetchSalesStaff();
  const recentSales = sales.slice(0, 6);
  const sTableBody = document.getElementById('dashboard-recent-sales-tbody');

  if (sTableBody) {
    if (recentSales.length === 0) {
      sTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">No sales recorded yet. Click "Record Payment / Sale" to record a delivery.</td></tr>';
    } else {
      sTableBody.innerHTML = recentSales.map(sale => `
        <tr>
          <td>${sale.sale_date || new Date().toISOString().split('T')[0]}</td>
          <td><span class="receipt-number-badge" style="font-size: 0.82rem; padding: 2px 8px;">${sale.receipt_number || 'NM-RCP-000001'}</span></td>
          <td>${sale.vehicles ? `${sale.vehicles.model_year || ''} ${sale.vehicles.brand || ''} ${sale.vehicles.model || ''}` : 'Vehicle'}</td>
          <td>${sale.customers ? sale.customers.name : (sale.customer_name || 'Customer')}</td>
          <td><strong>${window.formatPKR(sale.sale_price)}</strong></td>
          <td>
            <button class="btn btn-gold btn-sm" style="padding: 4px 10px; font-size: 0.76rem;" onclick="window.viewReceipt('${sale.id}')">
              📄 View Receipt
            </button>
          </td>
        </tr>
      `).join('');
    }
  }
}

// ------------------------------------------------------------------------------
// 2. VEHICLE INVENTORY MANAGEMENT
// ------------------------------------------------------------------------------
async function loadVehiclesManagement() {
  const tbody = document.getElementById('vehicles-mgmt-tbody');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 40px;">Loading inventory records...</td></tr>';
  }

  currentVehiclesList = await window.NaqeebDB.fetchAllVehiclesStaff();
  renderVehiclesMgmtTable(currentVehiclesList);
  initVehicleModal();
}

function renderVehiclesMgmtTable(vehicles) {
  const tbody = document.getElementById('vehicles-mgmt-tbody');
  if (!tbody) return;

  if (!vehicles || vehicles.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 40px;">No vehicles found. Click "+ Add New Vehicle" above.</td></tr>';
    return;
  }

  tbody.innerHTML = vehicles.map(car => `
    <tr>
      <td>
        <strong>${car.model_year || ''} ${car.brand || ''} ${car.model || ''}</strong>
        <div style="font-size: 0.8rem; color: var(--text-muted);">${car.variant || ''}</div>
      </td>
      <td>${car.vehicle_origin || 'Pakistani / Local'}</td>
      <td><strong>${window.formatPKR(car.price)}</strong></td>
      <td>${car.mileage ? Number(car.mileage).toLocaleString() + ' km' : '-'}</td>
      <td>
        <span class="badge-status ${(car.status || 'available').toLowerCase()}">${car.status || 'Available'}</span>
        ${car.is_featured ? '<span class="featured-pill" style="position: static; display: inline-block; margin-left: 6px;">Featured</span>' : ''}
      </td>
      <td>${car.registration_city || 'Islamabad'}</td>
      <td>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-secondary btn-sm" style="padding: 4px 10px; font-size: 0.78rem;" onclick="window.openEditVehicleModal('${car.id}')">Edit</button>
          ${car.status === 'Available' ? `<button class="btn btn-primary btn-sm" style="padding: 4px 10px; font-size: 0.78rem;" onclick="window.quickMarkSold('${car.id}')">Mark Sold</button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

function initVehicleModal() {
  const modal = document.getElementById('vehicle-modal');
  const openBtn = document.getElementById('open-add-vehicle-btn');
  const closeBtn = document.getElementById('close-vehicle-modal-btn');
  const form = document.getElementById('vehicle-form');

  if (openBtn) {
    openBtn.onclick = (e) => {
      e.preventDefault();
      if (form) form.reset();
      const idInput = document.getElementById('vehicle-id-input');
      if (idInput) idInput.value = '';
      const titleEl = document.getElementById('vehicle-modal-title');
      if (titleEl) titleEl.textContent = 'Add New Vehicle';
      if (modal) modal.classList.add('open');
    };
  }

  if (closeBtn) {
    closeBtn.onclick = (e) => {
      e.preventDefault();
      if (modal) modal.classList.remove('open');
    };
  }

  if (modal) {
    modal.onclick = (e) => {
      if (e.target === modal) modal.classList.remove('open');
    };
  }

  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving Vehicle...';
      }

      try {
        const vehicleId = document.getElementById('vehicle-id-input')?.value || undefined;
        const vehicleData = {
          id: vehicleId,
          brand: document.getElementById('v-brand')?.value.trim() || 'Toyota',
          model: document.getElementById('v-model')?.value.trim() || 'Vehicle',
          variant: document.getElementById('v-variant')?.value.trim() || '',
          model_year: parseInt(document.getElementById('v-year')?.value) || 2024,
          price: parseInt(document.getElementById('v-price')?.value) || 5000000,
          mileage: parseInt(document.getElementById('v-mileage')?.value) || 0,
          fuel_type: document.getElementById('v-fuel')?.value || 'Petrol',
          transmission: document.getElementById('v-transmission')?.value || 'Automatic',
          engine_capacity: document.getElementById('v-engine')?.value.trim() || '1500cc',
          exterior_colour: document.getElementById('v-colour')?.value.trim() || 'White',
          registration_city: document.getElementById('v-reg-city')?.value.trim() || 'Islamabad',
          vehicle_origin: document.getElementById('v-origin')?.value || 'Pakistani / Local',
          condition_notes: document.getElementById('v-condition')?.value.trim() || '',
          description: document.getElementById('v-description')?.value.trim() || '',
          status: document.getElementById('v-status')?.value || 'Available',
          is_featured: !!document.getElementById('v-featured')?.checked
        };

        const fileInput = document.getElementById('v-images-input');
        const imageUrls = [];

        if (fileInput && fileInput.files && fileInput.files.length > 0) {
          for (let i = 0; i < fileInput.files.length; i++) {
            const file = fileInput.files[i];
            if (submitBtn) submitBtn.textContent = `Uploading photo ${i + 1}/${fileInput.files.length}...`;
            const uploadedUrl = await window.NaqeebDB.uploadVehicleImage(file);
            imageUrls.push(uploadedUrl);
          }
        }

        await window.NaqeebDB.saveVehicleRecord(vehicleData, imageUrls);

        if (modal) modal.classList.remove('open');
        await loadVehiclesManagement();
        alert('Vehicle successfully saved to inventory!');
      } catch (err) {
        console.error('Error saving vehicle:', err);
        alert('Failed to save vehicle: ' + err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Save Vehicle';
        }
      }
    };
  }
}

async function openEditVehicleModal(carId) {
  const car = currentVehiclesList.find(c => String(c.id) === String(carId));
  if (!car) return;

  const modal = document.getElementById('vehicle-modal');
  const idInput = document.getElementById('vehicle-id-input');
  if (idInput) idInput.value = car.id;

  const titleEl = document.getElementById('vehicle-modal-title');
  if (titleEl) titleEl.textContent = `Edit ${car.brand} ${car.model}`;

  if (document.getElementById('v-brand')) document.getElementById('v-brand').value = car.brand || '';
  if (document.getElementById('v-model')) document.getElementById('v-model').value = car.model || '';
  if (document.getElementById('v-variant')) document.getElementById('v-variant').value = car.variant || '';
  if (document.getElementById('v-year')) document.getElementById('v-year').value = car.model_year || '';
  if (document.getElementById('v-price')) document.getElementById('v-price').value = car.price || '';
  if (document.getElementById('v-mileage')) document.getElementById('v-mileage').value = car.mileage || '';
  if (document.getElementById('v-fuel')) document.getElementById('v-fuel').value = car.fuel_type || 'Petrol';
  if (document.getElementById('v-transmission')) document.getElementById('v-transmission').value = car.transmission || 'Automatic';
  if (document.getElementById('v-engine')) document.getElementById('v-engine').value = car.engine_capacity || '';
  if (document.getElementById('v-colour')) document.getElementById('v-colour').value = car.exterior_colour || '';
  if (document.getElementById('v-reg-city')) document.getElementById('v-reg-city').value = car.registration_city || '';
  if (document.getElementById('v-origin')) document.getElementById('v-origin').value = car.vehicle_origin || 'Pakistani / Local';
  if (document.getElementById('v-condition')) document.getElementById('v-condition').value = car.condition_notes || '';
  if (document.getElementById('v-description')) document.getElementById('v-description').value = car.description || '';
  if (document.getElementById('v-status')) document.getElementById('v-status').value = car.status || 'Available';
  if (document.getElementById('v-featured')) document.getElementById('v-featured').checked = !!car.is_featured;

  if (modal) modal.classList.add('open');
}

async function quickMarkSold(carId) {
  if (confirm('Mark this vehicle as SOLD? It will be archived to sales transactions and removed from active public inventory.')) {
    try {
      await window.NaqeebDB.updateVehicleStatus(carId, 'Sold');
      await loadVehiclesManagement();
      alert('Vehicle marked as SOLD successfully.');
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  }
}

// ------------------------------------------------------------------------------
// 3. CUSTOMER MANAGEMENT (CRM)
// ------------------------------------------------------------------------------
async function loadCustomersManagement() {
  const tbody = document.getElementById('customers-mgmt-tbody');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 40px;">Loading customer records...</td></tr>';
  }

  currentCustomersList = await window.NaqeebDB.fetchCustomersStaff();
  renderCustomersTable(currentCustomersList);
  initCustomerModal();
}

function renderCustomersTable(customers) {
  const tbody = document.getElementById('customers-mgmt-tbody');
  if (!tbody) return;

  if (!customers || customers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 40px;">No customer records yet. Click "+ Add Customer" to create one.</td></tr>';
    return;
  }

  tbody.innerHTML = customers.map(c => `
    <tr>
      <td><strong>${c.name}</strong></td>
      <td>${c.cnic || '-'}</td>
      <td><strong>${c.phone}</strong></td>
      <td>${c.email || '-'}</td>
      <td>${c.address || '-'}</td>
      <td>${c.notes || '-'}</td>
    </tr>
  `).join('');
}

function initCustomerModal() {
  const modal = document.getElementById('customer-modal');
  const openBtn = document.getElementById('open-add-customer-btn');
  const closeBtn = document.getElementById('close-customer-modal-btn');
  const form = document.getElementById('customer-form');

  if (openBtn) {
    openBtn.onclick = (e) => {
      e.preventDefault();
      if (form) form.reset();
      if (modal) modal.classList.add('open');
    };
  }

  if (closeBtn) {
    closeBtn.onclick = (e) => {
      e.preventDefault();
      if (modal) modal.classList.remove('open');
    };
  }

  if (modal) {
    modal.onclick = (e) => {
      if (e.target === modal) modal.classList.remove('open');
    };
  }

  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      try {
        const customerData = {
          name: document.getElementById('c-name')?.value.trim() || 'Valued Client',
          cnic: document.getElementById('c-cnic')?.value.trim() || '',
          phone: document.getElementById('c-phone')?.value.trim() || '',
          email: document.getElementById('c-email')?.value.trim() || '',
          address: document.getElementById('c-address')?.value.trim() || '',
          notes: document.getElementById('c-notes')?.value.trim() || ''
        };

        await window.NaqeebDB.saveCustomerRecord(customerData);
        if (modal) modal.classList.remove('open');
        form.reset();
        await loadCustomersManagement();
        alert('Customer record created successfully!');
      } catch (err) {
        alert('Error saving customer: ' + err.message);
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    };
  }
}

// ------------------------------------------------------------------------------
// 4. SALES MANAGEMENT & RECORD SALE FLOW
// ------------------------------------------------------------------------------
async function loadSalesManagement() {
  const tbody = document.getElementById('sales-mgmt-tbody');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 40px;">Loading sales ledger...</td></tr>';
  }

  const sales = await window.NaqeebDB.fetchSalesStaff();
  renderSalesTable(sales);
  initSaleModal();
}

function renderSalesTable(sales) {
  const tbody = document.getElementById('sales-mgmt-tbody');
  if (!tbody) return;

  if (!sales || sales.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 40px;">No sales transactions recorded yet. Click "+ Record New Sale" to record a payment / vehicle handover.</td></tr>';
    return;
  }

  tbody.innerHTML = sales.map(s => {
    const receiptNum = s.receipt_number || 'NM-RCP-000001';
    const vehTitle = s.vehicles ? `${s.vehicles.model_year || ''} ${s.vehicles.brand || ''} ${s.vehicles.model || ''}` : 'Vehicle';
    const custName = s.customers ? s.customers.name : (s.customer_name || 'Client');
    const isCleared = Number(s.remaining_amount) <= 0;

    return `
      <tr>
        <td>${s.sale_date || new Date().toISOString().split('T')[0]}</td>
        <td><span class="receipt-number-badge" style="font-size: 0.8rem; padding: 2px 8px;">${receiptNum}</span></td>
        <td><strong>${vehTitle}</strong></td>
        <td><strong>${custName}</strong></td>
        <td>${window.formatPKR(s.sale_price)}</td>
        <td>${window.formatPKR(s.amount_received)}</td>
        <td>${isCleared ? '<span style="color: #4ADE80; font-weight: 700;">Cleared</span>' : `<span style="color: #EF4444; font-weight: 700;">${window.formatPKR(s.remaining_amount)}</span>`}</td>
        <td>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button class="btn-receipt-action btn-primary" onclick="window.viewReceipt('${s.id}')" title="View Official Receipt">
              📄 View
            </button>
            <button class="btn-receipt-action btn-gold" onclick="window.downloadReceiptPDF('${s.id}')" title="Download PDF Receipt">
              📥 PDF
            </button>
            <button class="btn-receipt-action btn-secondary" onclick="window.printReceipt('${s.id}')" title="Print Receipt">
              🖨️ Print
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function initSaleModal() {
  const modal = document.getElementById('sale-modal');
  const openBtn = document.getElementById('open-record-sale-btn');
  const closeBtn = document.getElementById('close-sale-modal-btn');
  const form = document.getElementById('sale-form');

  const vSelect = document.getElementById('s-vehicle-select');
  const cSelect = document.getElementById('s-customer-select');

  const salePriceInput = document.getElementById('s-sale-price');
  const receivedInput = document.getElementById('s-received-amount');
  const remainingInput = document.getElementById('s-remaining-amount');

  const calcRemaining = () => {
    if (!salePriceInput || !receivedInput || !remainingInput) return;
    const sp = parseInt(salePriceInput.value) || 0;
    const recv = parseInt(receivedInput.value) || 0;
    remainingInput.value = Math.max(0, sp - recv);
  };

  if (openBtn) {
    openBtn.onclick = async (e) => {
      e.preventDefault();
      if (form) form.reset();

      const [vehicles, customers] = await Promise.all([
        window.NaqeebDB.fetchAvailableVehicles(),
        window.NaqeebDB.fetchCustomersStaff()
      ]);

      if (vSelect) {
        if (vehicles && vehicles.length > 0) {
          vSelect.innerHTML = '<option value="">Select Available Vehicle...</option>' +
            vehicles.map(v => `<option value="${v.id}" data-price="${v.price}">${v.model_year || ''} ${v.brand} ${v.model} (${window.formatPKR(v.price)})</option>`).join('');
        } else {
          vSelect.innerHTML = '<option value="">No available vehicles in stock</option>';
        }
      }

      if (cSelect) {
        if (customers && customers.length > 0) {
          cSelect.innerHTML = '<option value="">Select Customer...</option>' +
            customers.map(c => `<option value="${c.id}">${c.name} (${c.phone})</option>`).join('') +
            '<option value="custom_walkin">+ Walk-in Direct Client (Enter details below)</option>';
        } else {
          cSelect.innerHTML = '<option value="custom_walkin">Walk-in Direct Client</option>';
        }
      }

      const dateInput = document.getElementById('s-sale-date');
      if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
      }

      if (modal) modal.classList.add('open');
    };
  }

  if (closeBtn) {
    closeBtn.onclick = (e) => {
      e.preventDefault();
      if (modal) modal.classList.remove('open');
    };
  }

  if (modal) {
    modal.onclick = (e) => {
      if (e.target === modal) modal.classList.remove('open');
    };
  }

  if (vSelect && salePriceInput) {
    vSelect.onchange = () => {
      const selectedOption = vSelect.options[vSelect.selectedIndex];
      const defaultPrice = selectedOption.getAttribute('data-price');
      if (defaultPrice) {
        salePriceInput.value = defaultPrice;
        calcRemaining();
      }
    };
  }

  if (salePriceInput) salePriceInput.oninput = calcRemaining;
  if (receivedInput) receivedInput.oninput = calcRemaining;

  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Recording Payment & Generating Receipt...';
      }

      try {
        const vehicleId = vSelect ? vSelect.value : '';
        let customerId = cSelect ? cSelect.value : 'custom_walkin';
        const salePrice = parseInt(salePriceInput?.value) || 0;
        const amountReceived = parseInt(receivedInput?.value) || 0;

        if (!vehicleId) {
          alert('Please select an available vehicle.');
          if (submitBtn) submitBtn.disabled = false;
          return;
        }

        const saleData = {
          vehicle_id: vehicleId,
          customer_id: customerId,
          customer_name: document.getElementById('s-custom-cust-name')?.value.trim() || undefined,
          customer_phone: document.getElementById('s-custom-cust-phone')?.value.trim() || undefined,
          customer_cnic: document.getElementById('s-custom-cust-cnic')?.value.trim() || undefined,
          customer_address: document.getElementById('s-custom-cust-address')?.value.trim() || undefined,
          sale_date: document.getElementById('s-sale-date')?.value || new Date().toISOString().split('T')[0],
          sale_price: salePrice,
          amount_received: amountReceived,
          remaining_amount: Math.max(0, salePrice - amountReceived),
          payment_method: document.getElementById('s-payment-method')?.value || 'Cash',
          notes: document.getElementById('s-notes')?.value.trim() || ''
        };

        // Persist sale & generate permanent receipt
        const savedSale = await window.NaqeebDB.recordSaleRecord(saleData);

        if (modal) modal.classList.remove('open');
        form.reset();

        // Refresh sales management or dashboard
        const pageType = document.body.getAttribute('data-staff-page');
        if (pageType === 'sales') {
          await loadSalesManagement();
        } else if (pageType === 'dashboard') {
          await loadDashboardData();
        }

        // Show official Sale Success Confirmation with Receipt Options
        showSaleSuccessDialog(savedSale);
      } catch (err) {
        console.error('Error recording sale:', err);
        alert('Error recording sale: ' + err.message);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Confirm Sale & Mark Vehicle Sold';
        }
      }
    };
  }
}

// ------------------------------------------------------------------------------
// 5. SALE SUCCESS DIALOG & RECEIPT SYSTEM
// ------------------------------------------------------------------------------
function showSaleSuccessDialog(sale) {
  const modal = document.getElementById('sale-success-modal');
  if (!modal) {
    // If success modal element is not in DOM, open receipt modal directly
    window.viewReceipt(sale.id);
    return;
  }

  const vehName = sale.vehicles ? `${sale.vehicles.model_year || ''} ${sale.vehicles.brand || ''} ${sale.vehicles.model || ''}` : 'Vehicle';
  const custName = sale.customers ? sale.customers.name : 'Valued Client';
  const receiptNum = sale.receipt_number || 'NM-RCP-000001';

  document.getElementById('succ-receipt-num').textContent = receiptNum;
  document.getElementById('succ-vehicle-name').textContent = vehName;
  document.getElementById('succ-customer-name').textContent = custName;
  document.getElementById('succ-price').textContent = window.formatPKR(sale.sale_price);
  document.getElementById('succ-received').textContent = window.formatPKR(sale.amount_received);
  document.getElementById('succ-remaining').textContent = sale.remaining_amount > 0 ? window.formatPKR(sale.remaining_amount) : 'Cleared (Paid in Full)';

  // Hook up actions
  const viewBtn = document.getElementById('succ-btn-view-receipt');
  const pdfBtn = document.getElementById('succ-btn-download-pdf');
  const printBtn = document.getElementById('succ-btn-print');
  const closeBtn = document.getElementById('succ-btn-close');

  if (viewBtn) {
    viewBtn.onclick = (e) => {
      e.preventDefault();
      modal.classList.remove('open');
      window.viewReceipt(sale.id);
    };
  }

  if (pdfBtn) {
    pdfBtn.onclick = (e) => {
      e.preventDefault();
      window.downloadReceiptPDF(sale.id);
    };
  }

  if (printBtn) {
    printBtn.onclick = (e) => {
      e.preventDefault();
      window.printReceipt(sale.id);
    };
  }

  if (closeBtn) {
    closeBtn.onclick = (e) => {
      e.preventDefault();
      modal.classList.remove('open');
    };
  }

  modal.classList.add('open');
}

/**
 * Generate Complete Dealership Receipt HTML Document
 */
function buildReceiptDocumentHTML(sale) {
  const receiptNum = sale.receipt_number || 'NM-RCP-000001';
  const saleDateFormatted = sale.sale_date ? new Date(sale.sale_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-GB');
  const saleTime = new Date(sale.created_at || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const veh = sale.vehicles || {};
  const cust = sale.customers || {};

  const brandModel = `${veh.model_year || ''} ${veh.brand || ''} ${veh.model || ''}`.trim() || 'Automobile';
  const variant = veh.variant || 'Standard Trim';
  const color = veh.exterior_colour || 'Standard Factory Paint';
  const regCity = veh.registration_city || 'Islamabad';
  const engine = veh.engine_capacity || '1800cc';
  const trans = veh.transmission || 'Automatic';
  const fuel = veh.fuel_type || 'Petrol';
  const mileage = veh.mileage ? `${Number(veh.mileage).toLocaleString()} km` : 'Standard Showroom Mileage';
  const origin = veh.vehicle_origin || 'Pakistani / Local Assembly';

  const customerName = cust.name || 'Valued Client';
  const customerPhone = cust.phone || '-';
  const customerCNIC = cust.cnic || '-';
  const customerAddress = cust.address || 'Islamabad / Rawalpindi, Pakistan';
  const customerEmail = cust.email || '-';

  const totalPrice = Number(sale.sale_price) || 0;
  const amountPaid = Number(sale.amount_received) || 0;
  const remaining = Number(sale.remaining_amount) || Math.max(0, totalPrice - amountPaid);
  const isCleared = remaining <= 0;
  const paymentMethod = sale.payment_method || 'Cash';
  const notes = sale.notes || 'Vehicle inspected, verified, and handed over with complete registration documents.';

  return `
    <div class="receipt-paper" id="receipt-printable-document">
      <div class="receipt-watermark">NAQEEB MOTORS</div>

      <!-- 1. Header: Dealership Branding & Address -->
      <div class="receipt-header-row">
        <div class="receipt-brand-block">
          <img src="/assets/images/logo.png" alt="NaqeeB Motors Emblem" class="receipt-brand-logo" onerror="this.onerror=null; this.src='/assets/images/showroom.jpg';" />
          <div>
            <h1 class="receipt-brand-title">NAQEEB <span>MOTORS</span></h1>
            <div class="receipt-brand-tagline">The Drive Starts Here &bull; Islamabad</div>
          </div>
        </div>
        <div class="receipt-dealership-meta">
          <strong>NaqeeB Motors Dealership</strong><br />
          Street 1, Block C, Soan Gardens, Main Islamabad Expressway<br />
          Islamabad, Federal Capital Territory, Pakistan<br />
          Tel: +92 340 9272005 / +92 51 5738890<br />
          Email: info@naqeebmotors.com &bull; Web: www.naqeebmotors.com
        </div>
      </div>

      <!-- 2. Document Banner -->
      <div class="receipt-banner">
        <div>
          <h2 class="receipt-doc-title">OFFICIAL VEHICLE SALES RECEIPT & BILL OF SALE</h2>
          <div style="font-size: 0.78rem; color: #6B7280; margin-top: 2px;">
            Transaction Date: <strong>${saleDateFormatted}</strong> &bull; Time: <strong>${saleTime}</strong> &bull; Ref: <strong>${sale.id || 'NM-TX'}</strong>
          </div>
        </div>
        <div>
          <div class="receipt-number-badge">${receiptNum}</div>
        </div>
      </div>

      <!-- 3. Customer & Dealership Two-Column Info -->
      <div class="receipt-info-grid">
        <div class="receipt-card">
          <div class="receipt-card-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            PURCHASER / BUYER INFORMATION
          </div>
          <div class="receipt-key-val">
            <span class="receipt-key">Client Name:</span>
            <span class="receipt-val">${customerName}</span>
          </div>
          <div class="receipt-key-val">
            <span class="receipt-key">Contact Phone:</span>
            <span class="receipt-val">${customerPhone}</span>
          </div>
          <div class="receipt-key-val">
            <span class="receipt-key">CNIC / ID No:</span>
            <span class="receipt-val">${customerCNIC}</span>
          </div>
          <div class="receipt-key-val">
            <span class="receipt-key">Residential Address:</span>
            <span class="receipt-val">${customerAddress}</span>
          </div>
          ${customerEmail && customerEmail !== '-' ? `
            <div class="receipt-key-val">
              <span class="receipt-key">Email Address:</span>
              <span class="receipt-val">${customerEmail}</span>
            </div>
          ` : ''}
        </div>

        <div class="receipt-card">
          <div class="receipt-card-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
            ISSUING DEALERSHIP DESK
          </div>
          <div class="receipt-key-val">
            <span class="receipt-key">Dealership:</span>
            <span class="receipt-val">NaqeeB Motors Showroom</span>
          </div>
          <div class="receipt-key-val">
            <span class="receipt-key">Branch:</span>
            <span class="receipt-val">Soan Gardens, Islamabad</span>
          </div>
          <div class="receipt-key-val">
            <span class="receipt-key">Staff Account:</span>
            <span class="receipt-val">${currentStaffUser?.email || 'staff@naqeebmotors.com'}</span>
          </div>
          <div class="receipt-key-val">
            <span class="receipt-key">Sales Desk Hotline:</span>
            <span class="receipt-val">+92 340 9272005</span>
          </div>
          <div class="receipt-key-val">
            <span class="receipt-key">Inventory Status:</span>
            <span class="receipt-val" style="color: #E50914;">OFFICIALLY DELIVERED / SOLD</span>
          </div>
        </div>
      </div>

      <!-- 4. Vehicle Particulars Table -->
      <table class="receipt-table">
        <thead>
          <tr>
            <th colspan="4" style="background: #111827; letter-spacing: 0.08em;">VEHICLE IDENTIFICATION & TECHNICAL PARTICULARS</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="width: 25%; font-weight: 600; color: #4B5563;">Make & Model</td>
            <td style="width: 25%; font-weight: 800; color: #111827;">${brandModel}</td>
            <td style="width: 25%; font-weight: 600; color: #4B5563;">Variant / Package</td>
            <td style="width: 25%; font-weight: 700; color: #111827;">${variant}</td>
          </tr>
          <tr>
            <td style="font-weight: 600; color: #4B5563;">Model Year</td>
            <td style="font-weight: 700; color: #111827;">${veh.model_year || '2023'}</td>
            <td style="font-weight: 600; color: #4B5563;">Exterior Colour</td>
            <td style="font-weight: 700; color: #111827;">${color}</td>
          </tr>
          <tr>
            <td style="font-weight: 600; color: #4B5563;">Registration City</td>
            <td style="font-weight: 700; color: #111827;">${regCity}</td>
            <td style="font-weight: 600; color: #4B5563;">Engine Capacity</td>
            <td style="font-weight: 700; color: #111827;">${engine}</td>
          </tr>
          <tr>
            <td style="font-weight: 600; color: #4B5563;">Transmission & Fuel</td>
            <td style="font-weight: 700; color: #111827;">${trans} &bull; ${fuel}</td>
            <td style="font-weight: 600; color: #4B5563;">Vehicle Origin</td>
            <td style="font-weight: 700; color: #111827;">${origin}</td>
          </tr>
        </tbody>
      </table>

      <!-- 5. Financial Summary & Ledger Breakdown -->
      <div class="receipt-financial-box">
        <div class="receipt-financial-row">
          <span class="receipt-f-label" style="font-weight: 600; color: #374151;">Agreed Total Vehicle Price</span>
          <span class="receipt-f-val" style="font-weight: 800; color: #111827; font-size: 1.1rem;">${window.formatPKR(totalPrice)}</span>
        </div>
        <div class="receipt-financial-row">
          <span class="receipt-f-label" style="font-weight: 600; color: #374151;">Payment Mode / Mode of Settlement</span>
          <span class="receipt-f-val" style="font-weight: 700; color: #1F2937;">${paymentMethod}</span>
        </div>
        <div class="receipt-financial-row" style="background: #F0FDF4;">
          <span class="receipt-f-label" style="font-weight: 700; color: #166534;">Amount Received / Paid</span>
          <span class="receipt-f-val" style="font-weight: 800; color: #166534; font-size: 1.15rem;">${window.formatPKR(amountPaid)}</span>
        </div>
        <div class="receipt-financial-row">
          <span class="receipt-f-label" style="font-weight: 700; color: #374151;">Balance Remaining / Payable</span>
          <span class="receipt-f-val">
            ${isCleared ? `
              <span class="receipt-status-pill cleared">CLEARED (PAID IN FULL - PKR 0)</span>
            ` : `
              <span class="receipt-status-pill due">BALANCE DUE: ${window.formatPKR(remaining)}</span>
            `}
          </span>
        </div>
        <div class="receipt-financial-row total">
          <span class="receipt-f-label">TOTAL TRANSACTION VALUE</span>
          <span class="receipt-f-val">${window.formatPKR(totalPrice)}</span>
        </div>
      </div>

      <!-- 6. Special Terms & Conditions -->
      <div class="receipt-terms-box">
        <h5>Dealership Verification & Agreement Terms:</h5>
        <ol style="margin: 0; padding-left: 18px;">
          <li>The buyer confirms that the vehicle described above has been physically inspected, road-tested, and accepted in satisfactory condition.</li>
          <li>All original vehicle documents, registration files, and biometric transfer verifications are provided or processed in accordance with dealership policy.</li>
          <li>This document is an authentic sales receipt issued by NaqeeB Motors and serves as official proof of payment and vehicle handover.</li>
        </ol>
        ${notes && notes.length > 0 ? `
          <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed #D1D5DB; font-style: italic;">
            <strong>Transaction Notes:</strong> ${notes}
          </div>
        ` : ''}
      </div>

      <!-- 7. Signatures -->
      <div class="receipt-signatures-grid">
        <div class="receipt-sig-block">
          <div class="receipt-sig-line"></div>
          <div class="receipt-sig-label">Purchaser / Buyer Signature</div>
          <div class="receipt-sig-sub">${customerName} (CNIC: ${customerCNIC})</div>
        </div>

        <div class="receipt-sig-block">
          <div class="receipt-sig-line"></div>
          <div class="receipt-sig-label">Authorized Signatory & Official Stamp</div>
          <div class="receipt-sig-sub">NaqeeB Motors &bull; Soan Gardens, Islamabad</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 6. VIEW RECEIPT MODAL
 */
async function viewReceipt(saleId) {
  const sale = await window.NaqeebDB.fetchSaleById(saleId);
  if (!sale) {
    alert('Sale record not found.');
    return;
  }

  currentActiveReceiptSale = sale;
  const modal = document.getElementById('receipt-modal');
  const container = document.getElementById('receipt-modal-content-container');
  const titleBadge = document.getElementById('receipt-modal-number-display');

  if (titleBadge) {
    titleBadge.textContent = sale.receipt_number || 'NM-RCP-000001';
  }

  if (container) {
    container.innerHTML = buildReceiptDocumentHTML(sale);
  }

  if (modal) {
    modal.classList.add('open');
  }
}

/**
 * 7. DOWNLOAD RECEIPT AS PDF
 */
async function downloadReceiptPDF(saleId) {
  let sale = currentActiveReceiptSale;
  if (!sale || String(sale.id) !== String(saleId)) {
    sale = await window.NaqeebDB.fetchSaleById(saleId);
  }
  if (!sale) {
    alert('Sale record not found.');
    return;
  }

  // Ensure receipt document container is rendered
  let container = document.getElementById('receipt-modal-content-container');
  if (!container || !container.innerHTML.trim()) {
    const tempWrap = document.getElementById('receipt-render-scratch') || document.body;
    container = document.createElement('div');
    container.id = 'receipt-render-scratch';
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px';
    document.body.appendChild(container);
    container.innerHTML = buildReceiptDocumentHTML(sale);
  } else {
    container.innerHTML = buildReceiptDocumentHTML(sale);
  }

  const receiptElement = container.querySelector('#receipt-printable-document') || container;
  const receiptNum = sale.receipt_number || `NM-RCP-${Date.now()}`;
  const fileName = `Naqeeb_Motors_Receipt_${receiptNum}.pdf`;

  if (typeof html2pdf !== 'undefined') {
    const opt = {
      margin: [8, 8, 8, 8],
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(receiptElement).save().then(() => {
      console.log('Receipt PDF downloaded successfully:', fileName);
    }).catch(err => {
      console.warn('html2pdf export issue, triggering print fallback:', err);
      window.printReceipt(saleId);
    });
  } else {
    // Fallback to print
    window.printReceipt(saleId);
  }
}

/**
 * 8. PRINT RECEIPT
 */
async function printReceipt(saleId) {
  let sale = currentActiveReceiptSale;
  if (!sale || String(sale.id) !== String(saleId)) {
    sale = await window.NaqeebDB.fetchSaleById(saleId);
  }
  if (!sale) {
    alert('Sale record not found.');
    return;
  }

  currentActiveReceiptSale = sale;
  const modal = document.getElementById('receipt-modal');
  const container = document.getElementById('receipt-modal-content-container');

  if (container) {
    container.innerHTML = buildReceiptDocumentHTML(sale);
  }

  if (modal) {
    modal.classList.add('open');
  }

  // Small timeout to allow styles to settle, then open native print dialog
  setTimeout(() => {
    window.print();
  }, 250);
}

function initReceiptModalListeners() {
  const modal = document.getElementById('receipt-modal');
  const closeBtn = document.getElementById('close-receipt-modal-btn');
  const backBtn = document.getElementById('back-to-sales-btn');
  const downloadBtn = document.getElementById('download-receipt-pdf-btn');
  const printBtn = document.getElementById('print-receipt-btn');

  if (closeBtn) {
    closeBtn.onclick = (e) => {
      e.preventDefault();
      if (modal) modal.classList.remove('open');
    };
  }

  if (backBtn) {
    backBtn.onclick = (e) => {
      e.preventDefault();
      if (modal) modal.classList.remove('open');
    };
  }

  if (modal) {
    modal.onclick = (e) => {
      if (e.target === modal) modal.classList.remove('open');
    };
  }

  if (downloadBtn) {
    downloadBtn.onclick = (e) => {
      e.preventDefault();
      if (currentActiveReceiptSale) {
        window.downloadReceiptPDF(currentActiveReceiptSale.id);
      }
    };
  }

  if (printBtn) {
    printBtn.onclick = (e) => {
      e.preventDefault();
      if (currentActiveReceiptSale) {
        window.printReceipt(currentActiveReceiptSale.id);
      }
    };
  }
}

// Global exposure
window.openEditVehicleModal = openEditVehicleModal;
window.quickMarkSold = quickMarkSold;
window.viewReceipt = viewReceipt;
window.downloadReceiptPDF = downloadReceiptPDF;
window.printReceipt = printReceipt;
