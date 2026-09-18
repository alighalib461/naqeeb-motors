/**
 * NaqeeB Motors - Vehicle Showcase & Dynamic Homepage Inventory Renderer
 */

document.addEventListener('DOMContentLoaded', () => {
  loadShowcaseVehicles();
  initHorizontalScrollSync();
});

/**
 * Load Showcase Vehicles from Supabase / Local Storage
 */
async function loadShowcaseVehicles() {
  const container = document.getElementById('showcase-cards-container');
  if (!container) return;

  try {
    let vehicles = await window.NaqeebDB.fetchAvailableVehicles();

    if (!vehicles || vehicles.length === 0) {
      vehicles = window.NaqeebDB.SEED_VEHICLES || [];
    }

    container.innerHTML = vehicles.map((car, index) => {
      const primaryImg = (window.NaqeebDB && window.NaqeebDB.getVehiclePrimaryImage)
        ? window.NaqeebDB.getVehiclePrimaryImage(car)
        : (car.image_url || '/assets/images/showroom.jpg');

      const originStr = String(car.vehicle_origin || 'Pakistani / Local');
      const isJapanese = originStr.toLowerCase().includes('japan');
      const originClass = isJapanese ? 'japanese' : 'pakistani';
      const originLabel = isJapanese ? 'Japanese Import' : 'Local / PK';

      const priceFormatted = window.formatPKR ? window.formatPKR(car.price) : `PKR ${car.price}`;
      const brandModel = `${car.model_year || ''} ${car.brand || ''} ${car.model || ''}`.trim();

      return `
        <div class="vehicle-card" data-index="${index}">
          <div class="vehicle-card-image-wrap">
            <img src="${primaryImg}" alt="${brandModel}" loading="lazy" onerror="this.onerror=null; this.src='/assets/images/showroom.jpg';" />
            <span class="origin-badge ${originClass}">${originLabel}</span>
            ${car.is_featured ? '<span class="featured-pill">Featured</span>' : ''}
          </div>
          <div class="vehicle-card-body">
            <div class="vehicle-title-row">
              <h3 class="vehicle-brand-model">${brandModel}</h3>
              <div class="vehicle-variant">${car.variant || 'Standard Trim'}</div>
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
            <div style="display: flex; gap: 10px; margin-top: auto; padding-top: 14px;">
              <a href="/car-details.html?id=${car.id}" class="btn btn-gold btn-sm" style="flex: 1; text-align: center; justify-content: center;">
                View Details
              </a>
              <a href="https://wa.me/923409272005?text=Hi%20NaqeeB%20Motors,%20I%20am%20inquiring%20about%20the%20${encodeURIComponent(brandModel)}%20(${encodeURIComponent(priceFormatted)})." target="_blank" class="btn btn-primary btn-sm" style="padding: 10px 14px;" title="WhatsApp Inquiry">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error('Error in loadShowcaseVehicles:', err);
  }
}

/**
 * Sync horizontal scroll with mouse wheel on desktop
 */
function initHorizontalScrollSync() {
  const container = document.getElementById('showcase-cards-container');
  if (!container) return;

  container.addEventListener('wheel', (evt) => {
    if (Math.abs(evt.deltaY) > Math.abs(evt.deltaX)) {
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      if ((evt.deltaY > 0 && container.scrollLeft < maxScrollLeft) ||
          (evt.deltaY < 0 && container.scrollLeft > 0)) {
        evt.preventDefault();
        container.scrollLeft += evt.deltaY * 1.5;
      }
    }
  }, { passive: false });
}
