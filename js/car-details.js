/**
 * NaqeeB Motors - Vehicle Detail Page Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  loadVehicleDetails();
});

async function loadVehicleDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const vehicleId = urlParams.get('id');

  const container = document.getElementById('vehicle-detail-content');
  if (!container) return;

  if (!vehicleId) {
    container.innerHTML = `
      <div style="text-align: center; padding: 140px 24px;">
        <h2 style="font-size: 2.2rem; margin-bottom: 12px;">Vehicle Not Specified</h2>
        <p style="margin: 0 0 24px; color: var(--text-muted);">Please select a vehicle from our verified inventory catalog.</p>
        <a href="/inventory.html" class="btn btn-primary">Browse Inventory</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="text-align: center; padding: 140px 24px; color: var(--text-muted); font-family: var(--font-subheading); font-size: 1.1rem;">
      Loading vehicle details from showroom database...
    </div>
  `;

  let car = null;
  try {
    car = await window.NaqeebDB.fetchVehicleById(vehicleId);
  } catch (err) {
    console.error('Error fetching vehicle details:', err);
  }

  if (!car) {
    container.innerHTML = `
      <div style="text-align: center; padding: 140px 24px;">
        <h2 style="font-size: 2.2rem; margin-bottom: 12px;">Vehicle Not Found or Sold</h2>
        <p style="margin: 0 0 24px; color: var(--text-muted);">The vehicle you are looking for is either no longer available or was recently delivered to a client.</p>
        <a href="/inventory.html" class="btn btn-primary">Browse Available Inventory</a>
      </div>
    `;
    return;
  }

  // Update Page Title
  const brandModel = `${car.model_year || ''} ${car.brand || ''} ${car.model || ''}`.trim();
  document.title = `${brandModel} | NaqeeB Motors Islamabad`;

  const images = (car.vehicle_images && car.vehicle_images.length > 0)
    ? car.vehicle_images.map(img => img.image_url)
    : ['/assets/images/showroom.jpg'];

  const originStr = String(car.vehicle_origin || 'Pakistani / Local');
  const isJapanese = originStr.toLowerCase().includes('japan');
  const originClass = isJapanese ? 'japanese' : 'pakistani';
  const originLabel = isJapanese ? 'Japanese Imported' : 'Pakistani / Local';

  const formattedPrice = window.formatPKR(car.price);
  const whatsappMessage = encodeURIComponent(
    `Hello NaqeeB Motors! I am interested in the ${brandModel} (${car.variant || 'Standard'}) listed for ${formattedPrice}. Is it currently available at your Soan Gardens showroom?`
  );

  container.innerHTML = `
    <div class="container" style="padding-top: 130px; padding-bottom: 80px;">
      <!-- Breadcrumb -->
      <div style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 24px; font-family: var(--font-subheading);">
        <a href="/" style="color: var(--text-secondary);">Home</a> &bull;
        <a href="/inventory.html" style="color: var(--text-secondary);">Inventory</a> &bull;
        <span style="color: var(--brand-red); font-weight: 600;">${car.brand || ''} ${car.model || ''}</span>
      </div>

      <div class="detail-layout" style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 48px; align-items: start;">
        
        <!-- Left: Image Gallery -->
        <div class="gallery-column">
          <div class="gallery-main" style="position: relative; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border-subtle); background: #000; min-height: 380px;">
            <img id="active-gallery-image" src="${images[0]}" alt="${brandModel}" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.src='/assets/images/showroom.jpg'" />
          </div>
          <div class="gallery-thumbs" style="display: flex; gap: 12px; margin-top: 14px; overflow-x: auto; padding-bottom: 6px;">
            ${images.map((url, idx) => `
              <div class="gallery-thumb ${idx === 0 ? 'active' : ''}" onclick="window.switchGalleryImage('${url}', this)" style="width: 84px; height: 60px; flex-shrink: 0; border-radius: var(--radius-sm); overflow: hidden; border: 2px solid ${idx === 0 ? 'var(--brand-red)' : 'var(--border-subtle)'}; cursor: pointer;">
                <img src="${url}" alt="Thumbnail ${idx + 1}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='/assets/images/showroom.jpg'" />
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Right: Information & Contact Actions -->
        <div class="info-column">
          <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 12px; flex-wrap: wrap;">
            <span class="origin-badge ${originClass}" style="position: static;">${originLabel}</span>
            <span style="font-family: var(--font-subheading); font-weight: 600; font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase;">
              Reg: ${car.registration_city || 'Unregistered'}
            </span>
          </div>

          <h1 style="font-size: clamp(2.2rem, 3.8vw, 3.2rem); margin-bottom: 4px; line-height: 1.1;">
            ${brandModel}
          </h1>
          <div style="font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 18px; font-family: var(--font-subheading); font-weight: 500;">
            ${car.variant || 'Standard Edition'}
          </div>

          <div class="vehicle-price-tag" style="font-size: 2.4rem; margin-bottom: 28px; color: var(--brand-gold);">
            ${formattedPrice}
          </div>

          <!-- Quick Specs Grid -->
          <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 24px; margin-bottom: 32px;">
            <h4 style="font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--brand-gold); margin-bottom: 16px;">
              Key Specifications
            </h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 0.92rem;">
              <div><strong style="color: var(--text-muted); display: block; font-size: 0.78rem; text-transform: uppercase;">ENGINE</strong> ${car.engine_capacity || 'N/A'}</div>
              <div><strong style="color: var(--text-muted); display: block; font-size: 0.78rem; text-transform: uppercase;">TRANSMISSION</strong> ${car.transmission || 'Automatic'}</div>
              <div><strong style="color: var(--text-muted); display: block; font-size: 0.78rem; text-transform: uppercase;">FUEL TYPE</strong> ${car.fuel_type || 'Petrol'}</div>
              <div><strong style="color: var(--text-muted); display: block; font-size: 0.78rem; text-transform: uppercase;">MILEAGE</strong> ${car.mileage ? Number(car.mileage).toLocaleString() + ' km' : 'N/A'}</div>
              <div><strong style="color: var(--text-muted); display: block; font-size: 0.78rem; text-transform: uppercase;">EXTERIOR COLOUR</strong> ${car.exterior_colour || 'N/A'}</div>
              <div><strong style="color: var(--text-muted); display: block; font-size: 0.78rem; text-transform: uppercase;">STATUS</strong> <span class="badge-status ${(car.status || 'available').toLowerCase()}">${car.status || 'Available'}</span></div>
            </div>
          </div>

          <!-- CTAs -->
          <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 32px;">
            <a href="https://wa.me/923409272005?text=${whatsappMessage}" target="_blank" class="btn btn-gold" style="width: 100%; justify-content: center;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              WHATSAPP ABOUT THIS CAR
            </a>
            <a href="tel:+923409272005" class="btn btn-primary" style="width: 100%; justify-content: center;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              CALL DEALERSHIP (+92 340 9272005)
            </a>
          </div>

          <!-- Description & Condition Notes -->
          ${car.condition_notes ? `
            <div style="margin-bottom: 24px; padding: 18px; background: rgba(229, 9, 20, 0.08); border-left: 3px solid var(--brand-red); border-radius: var(--radius-sm);">
              <h4 style="font-size: 0.9rem; margin-bottom: 6px; color: #FFFFFF; font-weight: 600;">Condition Notes</h4>
              <p style="font-size: 0.9rem; color: #E2E2E8; margin: 0; font-family: var(--font-body);">${car.condition_notes}</p>
            </div>
          ` : ''}

          ${car.description ? `
            <div style="margin-top: 24px;">
              <h4 style="font-size: 1.1rem; margin-bottom: 10px; color: #FFFFFF; font-weight: 600;">Vehicle Overview</h4>
              <p style="font-size: 0.95rem; line-height: 1.7; color: var(--text-secondary); font-family: var(--font-body);">${car.description}</p>
            </div>
          ` : ''}

        </div>
      </div>
    </div>
  `;
}

function switchGalleryImage(url, thumbEl) {
  const mainImg = document.getElementById('active-gallery-image');
  if (mainImg) mainImg.src = url;

  document.querySelectorAll('.gallery-thumb').forEach(el => {
    el.classList.remove('active');
    el.style.borderColor = 'var(--border-subtle)';
  });
  if (thumbEl) {
    thumbEl.classList.add('active');
    thumbEl.style.borderColor = 'var(--brand-red)';
  }
}

window.switchGalleryImage = switchGalleryImage;
