# NaqeeB Motors — Official Dealership Web Platform

A website and management portal built for **NaqeeB Motors** (Street 1, Block C, Soan Gardens, Islamabad).

---

## 🌟 Key Features

### 🚘 Public Automotive Showroom
- **Cinematic Hero**: Fullscreen Google Flow video (`Space → Earth → Pakistan → Islamabad → NaqeeB Motors`) with calibrated dark gradient and scroll-driven parallax.
- **Dynamic Vehicle Showcase**: Desktop horizontal scroll and touch-friendly card grid connected directly to Supabase.
- **Detailed Car Pages (`/cars/[id]`)**: Full photo gallery switcher, detailed specs, condition inspection report, and direct WhatsApp pre-filled inquiry.
- **Smart Inventory Filters**: Filter by Pakistani / Local vs. Japanese / Imported, Transmission, Fuel Type, and keyword search.
- **Verified Business Grounding**: Google 4.2★ rating, Abdullah Khan & Arsalan Ayub testimonials, 12+ years experience, 1721+ cars sold.
- **Direct Contacts**: One-touch phone dialing, WhatsApp, and Google Maps location.

### 🛡️ Secure Staff Management Portal (`/staff`)
- **Restricted Access**: Supabase Authentication with NO public user registration.
- **Real-Time KPIs**: Total Vehicles, Available Stock, Sold Count, Registered Clients.
- **Inventory CRUD**: Add, edit, archive vehicles and upload high-res photos directly to Supabase Storage (`vehicle-images`).
- **Client CRM**: Manage buyers and transaction contacts with CNIC and phone records.
- **Sales & Automatic Sold Trigger**: Recording a sale instantly transitions the vehicle to `Sold` status and archives it from the public showroom.

---

## 🚀 Setup & Supabase Database Configuration

### 1. Database Schema & RLS Setup
1. Go to your [Supabase SQL Editor](https://supabase.com/dashboard/project/pvkysazaazmguczsqebs/sql).
2. Open `supabase_schema.sql` from this repository.
3. Paste and run the entire script. This creates:
   - `profiles`, `vehicles`, `vehicle_images`, `customers`, and `sales` tables.
   - Row Level Security (RLS) policies protecting customer and sales data.
   - Storage Bucket `vehicle-images` for car photos.
   - Database trigger for automatic `Sold` status updates.

### 2. Creating Your First Staff Login
1. Go to [Supabase Authentication > Users](https://supabase.com/dashboard/project/pvkysazaazmguczsqebs/auth/users).
2. Click **Add User** -> **Create User**.
3. Enter your staff email (e.g. `staff@naqeebmotors.com`) and a strong password.
4. Go to `/staff/index.html` and sign in.

---

## 💻 Local Development

```bash
# Start local development server
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🌐 Vercel / GitHub Deployment
This project is configured for Vercel with clean URL routing (`vercel.json`).
Push this repository to GitHub and import into Vercel for instant deployment.
