import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const quoteId = url.pathname.split('/').pop();

    if (!quoteId) {
      throw new Error('Quote ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching quote:', quoteId);

    // Fetch quote data
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (quoteError) {
      console.error('Quote error:', quoteError);
      throw quoteError;
    }

    // Fetch customer data
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', quote.customer_id)
      .single();

    if (customerError) {
      console.error('Customer error:', customerError);
      throw customerError;
    }

    // Fetch quote items
    const { data: items, error: itemsError } = await supabase
      .from('quote_items')
      .select('*')
      .eq('quote_id', quoteId)
      .eq('is_selected', true)
      .order('room_name, item_name');

    if (itemsError) {
      console.error('Items error:', itemsError);
      throw itemsError;
    }

    console.log('Found items:', items?.length);

    // Group items by room
    const groupedItems = items.reduce((acc: any, item: any) => {
      if (!acc[item.room_name]) {
        acc[item.room_name] = [];
      }
      acc[item.room_name].push(item);
      return acc;
    }, {});

    // Generate HTML for PDF
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #333;
    }
    .header {
      text-align: center;
      margin-bottom: 25px;
      border-bottom: 3px solid #228b8b;
      padding-bottom: 15px;
    }
    .company-name {
      font-size: 28pt;
      font-weight: bold;
      color: #228b8b;
      margin-bottom: 5px;
    }
    .doc-title {
      font-size: 18pt;
      font-weight: bold;
      color: #333;
      margin-bottom: 5px;
    }
    .date {
      font-size: 10pt;
      color: #666;
    }
    .section {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 14pt;
      font-weight: bold;
      color: #228b8b;
      margin-bottom: 8px;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 4px;
    }
    .customer-info {
      background: #f8f8f8;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 10px;
    }
    .customer-info p {
      margin-bottom: 4px;
      font-size: 10pt;
    }
    .room-section {
      margin-bottom: 18px;
      page-break-inside: avoid;
    }
    .room-title {
      font-size: 12pt;
      font-weight: bold;
      color: #333;
      margin-bottom: 8px;
      background: #e8f4f4;
      padding: 6px 10px;
      border-left: 4px solid #228b8b;
    }
    .item {
      margin-left: 15px;
      margin-bottom: 10px;
      page-break-inside: avoid;
    }
    .item-name {
      font-weight: bold;
      color: #333;
      font-size: 10pt;
    }
    .item-description {
      margin-left: 15px;
      margin-top: 3px;
      color: #666;
      font-size: 9pt;
      font-style: italic;
    }
    @media print {
      body {
        margin: 0;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">HEADS Interior</div>
    <div class="doc-title">Quotation</div>
    <div class="date">Date: ${new Date(quote.quote_date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })}</div>
  </div>

  <div class="section">
    <div class="section-title">Customer Details</div>
    <div class="customer-info">
      <p><strong>Name:</strong> ${customer.name}</p>
      <p><strong>Phone:</strong> ${customer.phone}</p>
      ${customer.alternate_phone ? `<p><strong>Alternate Phone:</strong> ${customer.alternate_phone}</p>` : ''}
      <p><strong>Address:</strong> ${customer.address}</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Selected Items</div>
    ${Object.entries(groupedItems).map(([roomName, roomItems]: [string, any]) => `
      <div class="room-section">
        <div class="room-title">${roomName}</div>
        ${(roomItems as any[]).map(item => `
          <div class="item">
            <div class="item-name">• ${item.item_name}</div>
            ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `).join('')}
  </div>

  <script>
    // Auto-print when loaded (user can save as PDF from print dialog)
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
    `;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
