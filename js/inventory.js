/**
 * NaqeeB Motors - Public Inventory Filter & Search Engine
 */

let allVehicles = [];

document.addEventListener('DOMContentLoaded', () => {
  initInventoryPage();
});

async function initInventoryPage() {
  const gridContainer = document.getElementById('inventory-grid');
  if (!gridContainer) return;

  gridContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 60px; color: var(--text-muted); font-family: var(--font-subheading); font-size: 1.1rem;">Loading verified vehicle fleet...</div>';

  try {
    const data = await window.NaqeebDB.fetchAvailableVehicles();
    allVehicles = (data && data.length > 0) ? data : (window.NaqeebDB.SEED_VEHICLES || []);
  } catch (err) {
    console.warn('Error in initInventoryPage, falling back to seed inventory:', err);
    allVehicles = window.NaqeebDB.SEED_VEHICLES || [];
  }

  renderVehicles(allVehicles);
  attachFilterListeners();
}

function renderVehicles(vehicles) {
  const container = document.getElementById('inventory-grid');
  const countBadge = document.getElementById('inventory-count');
  if (!container) return;

  const validVehicles = (vehicles || []).filter(v => v && (v.status === 'Available' || !v.status));

  if (countBadge) {
    countBadge.textContent = `${validVehicles.length} Vehicle${validVehicles.length === 1 ? '' : 's'} Available`;
  }

  if (validVehicles.length === 0) {
    container.innerHTML = `
      <div class="empty-inventory-state" style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
        <svg style="width: 56px; height: 56px; margin-bottom: 16px; color: var(--brand-gold);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
        <h3 style="font-size: 1.5rem; margin-bottom: 8px;">No Vehicles Matching Your Criteria</h3>
        <p style="color: var(--text-muted); max-width: 480px; margin: 0 auto 24px;">Try resetting your filters or contact our showroom directly on WhatsApp for incoming stock.</p>
        <a href="https://wa.me/923409272005?text=Hello%20NaqeeB%20Motors,%20I%20am%20looking%20for%20a%20car." target="_blank" class="btn btn-gold btn-sm">Inquire on WhatsApp</a>
      </div>
    `;
    return;
  }

  container.innerHTML = validVehicles.map(car => {
    const originStr = String(car.vehicle_origin || 'Pakistani / Local');
    const isJapanese = originStr.toLowerCase().includes('japan');
    const originClass = isJapanese ? 'japanese' : 'pakistani';
    const originLabel = isJapanese ? 'Japanese Import' : 'Local / PK';

    const primaryImg = (window.NaqeebDB && window.NaqeebDB.getVehiclePrimaryImage)
      ? window.NaqeebDB.getVehiclePrimaryImage(car)
      : (car.image_url || '/assets/images/showroom.jpg');

    const priceFormatted = window.formatPKR ? window.formatPKR(car.price) : `PKR ${car.price}`;
    const brandModel = `${car.model_year || ''} ${car.brand || ''} ${car.model || ''}`.trim();

    return `
      <div class="vehicle-card" style="display: flex; flex-direction: column;">
        <div class="vehicle-card-image-wrap">
          <img src="${primaryImg}" alt="${brandModel}" loading="lazy" onerror="this.onerror=null; this.src='/assets/images/showroom.jpg';" />
          <span class="origin-badge ${originClass}">${originLabel}</span>
          ${car.is_featured ? '<span class="featured-pill">Featured</span>' : ''}
        </div>
        <div class="vehicle-card-body" style="display: flex; flex-direction: column; flex: 1;">
          <div class="vehicle-title-row">
            <h3 class="vehicle-brand-model">${brandModel}</h3>
            <div class="vehicle-variant">${car.variant || 'Standard Trim'} &bull; <span style="color: var(--text-muted);">${car.registration_city || 'Islamabad'}</span></div>
          </div>
          <div class="vehicle-price-tag">
            ${priceFormatted}
          </div>
          <div class="vehicle-specs-grid">
            <div class="spec-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>${car.mileage ? Number(car.mileage).toLocaleString() + ' km' : 'N/A'}</span>
            </div>
            <div class="spec-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span>${car.transmission || 'Automatic'}</span>
            </div>
            <div class="spec-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              <span>${car.fuel_type || 'Petrol'}</span>
            </div>
            <div class="spec-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              <span>${car.engine_capacity || 'N/A'}</span>
            </div>
          </div>
          <div style="display: flex; gap: 10px; margin-top: auto; padding-top: 16px;">
            <a href="/car-details.html?id=${car.id}" class="btn btn-gold btn-sm" style="flex: 1; text-align: center; justify-content: center;">
              View Details
            </a>
            <a href="https://wa.me/923409272005?text=Hi%20NaqeeB%20Motors,%20I%20am%20inquiring%20about%20the%20${encodeURIComponent(brandModel)}%20(${encodeURIComponent(priceFormatted)})." target="_blank" class="btn btn-primary btn-sm" style="padding: 10px 14px;" title="WhatsApp Instant Inquiry">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function attachFilterListeners() {
  const searchInput = document.getElementById('search-input');
  const originBtns = document.querySelectorAll('.origin-filter-btn');
  const transmissionSelect = document.getElementById('filter-transmission');
  const fuelSelect = document.getElementById('filter-fuel');

  let activeOrigin = 'All';

  const applyFilters = () => {
    const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const transVal = transmissionSelect ? transmissionSelect.value : 'All';
    const fuelVal = fuelSelect ? fuelSelect.value : 'All';

    const filtered = allVehicles.filter(car => {
      if (!car) return false;
      const originStr = String(car.vehicle_origin || 'Pakistani / Local');

      // Origin match
      if (activeOrigin === 'Pakistani' && !originStr.toLowerCase().includes('pakistan') && !originStr.toLowerCase().includes('local')) return false;
      if (activeOrigin === 'Japanese' && !originStr.toLowerCase().includes('japan') && !originStr.toLowerCase().includes('import')) return false;

      // Search match
      if (searchVal) {
        const text = `${car.brand || ''} ${car.model || ''} ${car.variant || ''} ${car.model_year || ''} ${car.registration_city || ''}`.toLowerCase();
        if (!text.includes(searchVal)) return false;
      }

      // Transmission match
      if (transVal !== 'All' && String(car.transmission).toLowerCase() !== transVal.toLowerCase()) return false;

      // Fuel match
      if (fuelVal !== 'All' && String(car.fuel_type).toLowerCase() !== fuelVal.toLowerCase()) return false;

      return true;
    });

    renderVehicles(filtered);
  };

  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (transmissionSelect) transmissionSelect.addEventListener('change', applyFilters);
  if (fuelSelect) fuelSelect.addEventListener('change', applyFilters);

  originBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      originBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeOrigin = btn.getAttribute('data-origin') || 'All';
      applyFilters();
    });
  });
}
