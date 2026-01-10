const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function calculateCommission(invoiceId) {
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('id, rep_id, total')
    .eq('id', invoiceId)
    .single();

  if (invoiceError) {
    console.error('Error fetching invoice:', invoiceError);
    return;
  }

  if (!invoice) {
    console.error('Invoice not found');
    return;
  }

  const commissionAmount = invoice.total * 0.05;

  const { error: commissionError } = await supabase
    .from('commissions')
    .insert([
      {
        rep_id: invoice.rep_id,
        invoice_id: invoice.id,
        amount: commissionAmount,
        status: 'pending',
      },
    ]);

  if (commissionError) {
    console.error('Error inserting commission:', commissionError);
  }
}

module.exports = { calculateCommission };
