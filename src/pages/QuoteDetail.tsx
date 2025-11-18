import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Edit, Trash2, Eye, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Quote {
  id: string;
  customer_id: string;
  quote_date: string;
}

interface QuoteItem {
  id: string;
  room_name: string;
  item_name: string;
  description: string;
}

interface Customer {
  name: string;
  phone: string;
  address: string;
}

const QuoteDetail = () => {
  const { quoteId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuoteData();
  }, [quoteId]);

  const fetchQuoteData = async () => {
    try {
      const { data: quoteData, error: quoteError } = await supabase
        .from("quotes")
        .select("*")
        .eq("id", quoteId)
        .single();

      if (quoteError) throw quoteError;

      const { data: itemsData, error: itemsError } = await supabase
        .from("quote_items")
        .select("*")
        .eq("quote_id", quoteId)
        .eq("is_selected", true);

      if (itemsError) throw itemsError;

      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("name, phone, address")
        .eq("id", quoteData.customer_id)
        .single();

      if (customerError) throw customerError;

      setQuote(quoteData);
      setItems(itemsData || []);
      setCustomer(customerData);
    } catch (error) {
      console.error("Error fetching quote data:", error);
      toast({
        title: "Error",
        description: "Failed to load quote",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from("quotes").delete().eq("id", quoteId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Quote deleted successfully",
      });

      navigate(`/customer/${quote?.customer_id}`);
    } catch (error) {
      console.error("Error deleting quote:", error);
      toast({
        title: "Error",
        description: "Failed to delete quote",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `https://ndkvtjdtwnkqfpixfxda.supabase.co/functions/v1/pdf/${quoteId}`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token || ''}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quotation-${quoteId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "PDF downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "Error",
        description: "Failed to download PDF",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="p-8">
          <p className="text-muted-foreground">Loading quote...</p>
        </Card>
      </div>
    );
  }

  if (!quote || !customer) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="p-8">
          <p className="text-muted-foreground">Quote not found</p>
        </Card>
      </div>
    );
  }

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.room_name]) {
      acc[item.room_name] = [];
    }
    acc[item.room_name].push(item);
    return acc;
  }, {} as Record<string, QuoteItem[]>);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(`/customer/${quote.customer_id}`)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Customer
        </Button>

        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="p-8 shadow-elegant">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">Quotation</h1>
                <p className="text-muted-foreground">
                  Date: {new Date(quote.quote_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="mb-6 p-4 bg-muted/30 rounded-lg">
              <h3 className="font-semibold mb-2">Customer Details</h3>
              <p className="text-sm">{customer.name}</p>
              <p className="text-sm text-muted-foreground">{customer.phone}</p>
              <p className="text-sm text-muted-foreground">{customer.address}</p>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Selected Items</h3>
              {Object.entries(groupedItems).map(([room, roomItems]) => (
                <div key={room} className="space-y-3">
                  <h4 className="font-semibold text-lg text-primary">{room}</h4>
                  <div className="space-y-2 pl-4">
                    {roomItems.map((item) => (
                      <Card key={item.id} className="p-4 bg-muted/20">
                        <p className="font-medium">{item.item_name}</p>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.description}
                          </p>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 shadow-card">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="outline" className="w-full">
                <Eye className="w-4 h-4 mr-2" />
                View
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/quote/${quoteId}/edit`)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Quotation</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this quotation? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleDownloadPDF}
              >
                📄 Download PDF
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/customer/${quote.customer_id}`)}
              >
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QuoteDetail;
