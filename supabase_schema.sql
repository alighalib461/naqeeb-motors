-- ==============================================================================
-- NAQEEB MOTORS — SUPABASE DATABASE SCHEMA & ROW LEVEL SECURITY (RLS)
-- Run this script in your Supabase SQL Editor: https://supabase.com/dashboard/project/pvkysazaazmguczsqebs/sql
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES (Staff & Admin Users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated staff to read profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated staff to update their profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 2. VEHICLES (Car Inventory)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    variant TEXT,
    model_year INTEGER NOT NULL,
    price BIGINT NOT NULL,
    mileage INTEGER NOT NULL,
    fuel_type TEXT NOT NULL DEFAULT 'Petrol',
    transmission TEXT NOT NULL DEFAULT 'Automatic',
    engine_capacity TEXT NOT NULL,
    exterior_colour TEXT NOT NULL,
    registration_city TEXT DEFAULT 'Unregistered',
    vehicle_origin TEXT NOT NULL DEFAULT 'Pakistani / Local' CHECK (vehicle_origin IN ('Pakistani / Local', 'Japanese / Imported')),
    condition_notes TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Sold', 'Archived')),
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for vehicles
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Public can view available and featured vehicles
CREATE POLICY "Public can view available vehicles"
    ON public.vehicles FOR SELECT
    TO anon, authenticated
    USING (status = 'Available');

-- Authenticated staff have full access
CREATE POLICY "Staff can view all vehicles"
    ON public.vehicles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Staff can insert vehicles"
    ON public.vehicles FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Staff can update vehicles"
    ON public.vehicles FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Staff can delete vehicles"
    ON public.vehicles FOR DELETE
    TO authenticated
    USING (true);

-- ------------------------------------------------------------------------------
-- 3. VEHICLE IMAGES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vehicle_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for vehicle_images
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view vehicle images"
    ON public.vehicle_images FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Staff can insert vehicle images"
    ON public.vehicle_images FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Staff can update vehicle images"
    ON public.vehicle_images FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Staff can delete vehicle images"
    ON public.vehicle_images FOR DELETE
    TO authenticated
    USING (true);

-- ------------------------------------------------------------------------------
-- 4. CUSTOMERS (Confidential Dealership Records)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    cnic TEXT,
    phone TEXT NOT NULL,
    address TEXT,
    email TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Strictly authenticated staff only
CREATE POLICY "Staff can view customers"
    ON public.customers FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Staff can insert customers"
    ON public.customers FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Staff can update customers"
    ON public.customers FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Staff can delete customers"
    ON public.customers FOR DELETE
    TO authenticated
    USING (true);

-- ------------------------------------------------------------------------------
-- 5. SALES (Transaction History)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_number TEXT UNIQUE,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    sale_price BIGINT NOT NULL,
    amount_received BIGINT NOT NULL DEFAULT 0,
    remaining_amount BIGINT NOT NULL DEFAULT 0,
    payment_method TEXT DEFAULT 'Cash',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for sales
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view sales records"
    ON public.sales FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Staff can insert sales records"
    ON public.sales FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Staff can update sales records"
    ON public.sales FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Staff can delete sales records"
    ON public.sales FOR DELETE
    TO authenticated
    USING (true);

-- ------------------------------------------------------------------------------
-- 6. AUTOMATION TRIGGERS
-- ------------------------------------------------------------------------------

-- Trigger 1: Automatically mark vehicle as SOLD when a sale record is inserted
CREATE OR REPLACE FUNCTION public.handle_new_sale()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.vehicles
    SET status = 'Sold', updated_at = NOW()
    WHERE id = NEW.vehicle_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_after_sale_inserted ON public.sales;
CREATE TRIGGER tr_after_sale_inserted
AFTER INSERT ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_sale();

-- Trigger 2: Auto-update updated_at timestamp on vehicle changes
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_vehicle_updated_at ON public.vehicles;
CREATE TRIGGER tr_vehicle_updated_at
BEFORE UPDATE ON public.vehicles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 7. SUPABASE STORAGE SETUP FOR VEHICLE IMAGES
-- ------------------------------------------------------------------------------
-- Create bucket 'vehicle-images' if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-images', 'vehicle-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Public read, authenticated uploads
DROP POLICY IF EXISTS "Public can view vehicle images in storage" ON storage.objects;
CREATE POLICY "Public can view vehicle images in storage"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'vehicle-images');

DROP POLICY IF EXISTS "Staff can upload vehicle images" ON storage.objects;
CREATE POLICY "Staff can upload vehicle images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vehicle-images');

DROP POLICY IF EXISTS "Staff can update vehicle images" ON storage.objects;
CREATE POLICY "Staff can update vehicle images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'vehicle-images');

DROP POLICY IF EXISTS "Staff can delete vehicle images" ON storage.objects;
CREATE POLICY "Staff can delete vehicle images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'vehicle-images');
