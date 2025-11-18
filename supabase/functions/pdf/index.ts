import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

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

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const pageWidth = 595; // A4 width in points
    const pageHeight = 842; // A4 height in points
    const margin = 50;
    const contentWidth = pageWidth - 2 * margin;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let yPosition = pageHeight - margin;

    const addNewPageIfNeeded = (requiredSpace: number) => {
      if (yPosition - requiredSpace < margin) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        yPosition = pageHeight - margin;
        return true;
      }
      return false;
    };

    // Header
    page.drawText('HEADS Interior', {
      x: margin,
      y: yPosition,
      size: 24,
      font: boldFont,
      color: rgb(0.13, 0.54, 0.54), // Teal color
    });
    yPosition -= 30;

    page.drawText('Quotation', {
      x: margin,
      y: yPosition,
      size: 18,
      font: boldFont,
    });
    yPosition -= 20;

    const quoteDate = new Date(quote.quote_date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    page.drawText(`Date: ${quoteDate}`, {
      x: margin,
      y: yPosition,
      size: 10,
      font: regularFont,
      color: rgb(0.4, 0.4, 0.4),
    });
    yPosition -= 30;

    // Customer Details
    addNewPageIfNeeded(80);
    
    page.drawText('Customer Details', {
      x: margin,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: rgb(0.13, 0.54, 0.54),
    });
    yPosition -= 20;

    page.drawText(`Name: ${customer.name}`, {
      x: margin,
      y: yPosition,
      size: 11,
      font: regularFont,
    });
    yPosition -= 15;

    page.drawText(`Phone: ${customer.phone}`, {
      x: margin,
      y: yPosition,
      size: 11,
      font: regularFont,
    });
    yPosition -= 15;

    if (customer.alternate_phone) {
      page.drawText(`Alternate Phone: ${customer.alternate_phone}`, {
        x: margin,
        y: yPosition,
        size: 11,
        font: regularFont,
      });
      yPosition -= 15;
    }

    page.drawText(`Address: ${customer.address}`, {
      x: margin,
      y: yPosition,
      size: 11,
      font: regularFont,
    });
    yPosition -= 30;

    // Selected Items
    addNewPageIfNeeded(40);
    
    page.drawText('Selected Items', {
      x: margin,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: rgb(0.13, 0.54, 0.54),
    });
    yPosition -= 25;

    // Render items by room
    for (const [roomName, roomItems] of Object.entries(groupedItems)) {
      addNewPageIfNeeded(60);

      // Room name
      page.drawText(roomName, {
        x: margin,
        y: yPosition,
        size: 12,
        font: boldFont,
      });
      yPosition -= 20;

      // Items in this room
      for (const item of roomItems as any[]) {
        const itemHeight = item.description ? 35 : 20;
        addNewPageIfNeeded(itemHeight + 20);

        // Item name with quantity
        const itemText = `• ${item.item_name} (Qty: ${item.quantity || 1})`;
        page.drawText(itemText, {
          x: margin + 15,
          y: yPosition,
          size: 10,
          font: regularFont,
        });
        yPosition -= 15;

        // Item description - handle newlines and word wrapping
        if (item.description) {
          const descLines = item.description.split('\n');
          const maxWidth = contentWidth - 30;

          for (const line of descLines) {
            if (!line.trim()) continue;

            const words = line.split(' ');
            let currentLine = '';

            for (const word of words) {
              const testLine = currentLine + word + ' ';
              const testWidth = italicFont.widthOfTextAtSize(testLine, 9);
              
              if (testWidth > maxWidth && currentLine !== '') {
                addNewPageIfNeeded(15);
                page.drawText(currentLine.trim(), {
                  x: margin + 30,
                  y: yPosition,
                  size: 9,
                  font: italicFont,
                  color: rgb(0.4, 0.4, 0.4),
                });
                yPosition -= 12;
                currentLine = word + ' ';
              } else {
                currentLine = testLine;
              }
            }

            if (currentLine.trim() !== '') {
              addNewPageIfNeeded(15);
              page.drawText(currentLine.trim(), {
                x: margin + 30,
                y: yPosition,
                size: 9,
                font: italicFont,
                color: rgb(0.4, 0.4, 0.4),
              });
              yPosition -= 12;
            }
          }
        }

        yPosition -= 8;
      }

      yPosition -= 10;
    }

    const pdfBytes = await pdfDoc.save();
    const arrayBuffer = pdfBytes.buffer as ArrayBuffer;

    return new Response(arrayBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="quotation-${quoteId}.pdf"`,
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
