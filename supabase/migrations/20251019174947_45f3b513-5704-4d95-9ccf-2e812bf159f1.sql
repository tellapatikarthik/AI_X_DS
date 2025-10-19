-- Create storage bucket for uploaded datasets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'datasets',
  'datasets',
  false,
  52428800, -- 50MB limit
  ARRAY['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain']
);

-- Create datasets table to track uploaded files
CREATE TABLE public.datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  columns_schema JSONB, -- Store column names and types
  row_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create transformations table to store data transformations
CREATE TABLE public.transformations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  transformation_type TEXT NOT NULL, -- filter, aggregate, join, pivot, etc.
  config JSONB NOT NULL, -- transformation configuration
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create dashboards table
CREATE TABLE public.dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  layout JSONB, -- Store dashboard layout configuration
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create visualizations table to store charts
CREATE TABLE public.visualizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES public.dashboards(id) ON DELETE CASCADE,
  dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  chart_type TEXT NOT NULL, -- bar, line, pie, area, scatter, etc.
  config JSONB NOT NULL, -- Chart configuration (axes, colors, filters)
  position JSONB, -- Position in dashboard grid
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transformations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visualizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for datasets
CREATE POLICY "Users can view their own datasets"
  ON public.datasets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own datasets"
  ON public.datasets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own datasets"
  ON public.datasets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own datasets"
  ON public.datasets FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for transformations
CREATE POLICY "Users can view their own transformations"
  ON public.transformations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transformations"
  ON public.transformations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transformations"
  ON public.transformations FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for dashboards
CREATE POLICY "Users can view their own dashboards"
  ON public.dashboards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public dashboards"
  ON public.dashboards FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can create their own dashboards"
  ON public.dashboards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dashboards"
  ON public.dashboards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dashboards"
  ON public.dashboards FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for visualizations
CREATE POLICY "Users can view their own visualizations"
  ON public.visualizations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own visualizations"
  ON public.visualizations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own visualizations"
  ON public.visualizations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own visualizations"
  ON public.visualizations FOR DELETE
  USING (auth.uid() = user_id);

-- Storage policies for datasets bucket
CREATE POLICY "Users can upload their own files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'datasets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'datasets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'datasets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_datasets_updated_at
  BEFORE UPDATE ON public.datasets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dashboards_updated_at
  BEFORE UPDATE ON public.dashboards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_visualizations_updated_at
  BEFORE UPDATE ON public.visualizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();