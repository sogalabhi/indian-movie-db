-- ============================================
-- Review Helpfulness Table
-- ============================================
-- Stores helpful/not helpful votes on reviews

CREATE TABLE IF NOT EXISTS public.review_helpfulness (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE NOT NULL,
  helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, review_id)
);

CREATE INDEX IF NOT EXISTS idx_review_helpfulness_review_id ON public.review_helpfulness(review_id);

-- Enable RLS
ALTER TABLE public.review_helpfulness ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "review_helpfulness_select_all" ON public.review_helpfulness
  FOR SELECT USING (true);

CREATE POLICY "review_helpfulness_insert_own" ON public.review_helpfulness
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "review_helpfulness_update_own" ON public.review_helpfulness
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "review_helpfulness_delete_own" ON public.review_helpfulness
  FOR DELETE USING (auth.uid() = user_id);

