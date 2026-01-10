-- Create the commissions table
CREATE TABLE commissions (
    id SERIAL PRIMARY KEY,
    rep_id UUID REFERENCES auth.users(id),
    invoice_id INT,
    amount NUMERIC,
    status VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create a function to calculate commission
CREATE OR REPLACE FUNCTION public.handle_paid_invoice()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate 5% commission
  INSERT INTO public.commissions(rep_id, invoice_id, amount, status)
  VALUES(NEW.rep_id, NEW.id, NEW.total * 0.05, 'pending');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to run the function when an invoice is paid
CREATE TRIGGER on_invoice_paid
  AFTER UPDATE OF status ON public.invoices
  FOR EACH ROW
  WHEN (NEW.status = 'paid' AND OLD.status <> 'paid')
  EXECUTE PROCEDURE public.handle_paid_invoice();
