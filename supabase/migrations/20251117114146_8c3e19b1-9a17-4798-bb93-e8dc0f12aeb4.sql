-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  alternate_phone TEXT,
  address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since no auth yet)
CREATE POLICY "Allow all operations on customers" 
ON public.customers 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create quotes table
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  quote_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow all operations on quotes" 
ON public.quotes 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create master items table (predefined items for each room)
CREATE TABLE public.master_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_name TEXT NOT NULL,
  item_name TEXT NOT NULL,
  default_description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.master_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow all operations on master_items" 
ON public.master_items 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create quote items table (selected items for each quote)
CREATE TABLE public.quote_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  room_name TEXT NOT NULL,
  item_name TEXT NOT NULL,
  description TEXT,
  is_selected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow all operations on quote_items" 
ON public.quote_items 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Insert master items for all rooms
INSERT INTO public.master_items (room_name, item_name, default_description, display_order) VALUES
-- Foyer/Entry items
('Foyer', 'Foyer Console', 'Elegant console table for entryway', 1),
('Foyer', 'Entry Light Wall Hanging', 'Decorative wall lighting', 2),
('Foyer', 'Flower Vase & Flower', 'Decorative vase with fresh flowers', 3),
('Foyer', 'Artifacts', 'Decorative artifacts and sculptures', 4),
('Foyer', 'Photo Frame', 'Wall-mounted photo frames', 5),
('Foyer', 'Mirror', 'Decorative wall mirror', 6),

-- Hall items
('Hall', 'TV Unit', 'Modern TV stand with storage', 1),
('Hall', 'Sofa Set', 'Comfortable seating arrangement', 2),
('Hall', 'Center Table', 'Coffee table for living area', 3),
('Hall', 'Side Tables', 'End tables for sofa', 4),
('Hall', 'Carpet/Rug', 'Area rug for living space', 5),
('Hall', 'Curtains', 'Window treatment', 6),
('Hall', 'Wall Art', 'Paintings and wall decor', 7),
('Hall', 'Ceiling Light', 'Main lighting fixture', 8),

-- Puja Room items
('Puja Room', 'Temple/Mandir', 'Wooden or marble temple', 1),
('Puja Room', 'Bell', 'Brass or metal puja bell', 2),
('Puja Room', 'Diya Stand', 'Oil lamp holder', 3),
('Puja Room', 'Storage Cabinet', 'For puja items storage', 4),
('Puja Room', 'Ceiling Light', 'Traditional lighting', 5),

-- Dining Room items
('Dining', 'Dining Table', '6-seater dining table', 1),
('Dining', 'Dining Chairs', 'Set of 6 chairs', 2),
('Dining', 'Crockery Unit', 'Display and storage unit', 3),
('Dining', 'Chandelier', 'Dining area lighting', 4),
('Dining', 'Wall Decor', 'Paintings or wall art', 5),

-- Kitchen items
('Kitchen', 'Modular Kitchen', 'Complete modular kitchen setup', 1),
('Kitchen', 'Chimney', 'Kitchen exhaust system', 2),
('Kitchen', 'Hob', 'Gas or induction cooktop', 3),
('Kitchen', 'Water Purifier', 'RO water purifier', 4),
('Kitchen', 'Microwave', 'Built-in or countertop', 5),
('Kitchen', 'Refrigerator', 'Kitchen refrigerator', 6),
('Kitchen', 'Kitchen Lighting', 'Under-cabinet and ceiling lights', 7),

-- Bedroom items
('Bedroom', 'Bed', 'King or queen size bed', 1),
('Bedroom', 'Wardrobe', 'Built-in or standalone', 2),
('Bedroom', 'Side Tables', 'Bedside tables (2)', 3),
('Bedroom', 'Dressing Table', 'With mirror and storage', 4),
('Bedroom', 'Curtains', 'Window treatment', 5),
('Bedroom', 'Lighting', 'Ceiling and bedside lamps', 6),
('Bedroom', 'Carpet', 'Bedroom floor covering', 7),

-- Gazebo/Garden items
('Gazebo', 'Outdoor Furniture', 'Garden chairs and table', 1),
('Gazebo', 'Planters', 'Decorative plant pots', 2),
('Gazebo', 'Garden Lights', 'Outdoor lighting', 3),
('Gazebo', 'Fountain', 'Water feature', 4),
('Gazebo', 'Swing', 'Garden swing or jhula', 5);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at
BEFORE UPDATE ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();