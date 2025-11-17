import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Phone, MapPin, Plus, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  name: string;
  phone: string;
  alternate_phone: string | null;
  address: string;
}

interface Quote {
  id: string;
  quote_date: string;
  created_at: string;
}

const CustomerDetail = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerData();
  }, [customerId]);

  const fetchCustomerData = async () => {
    try {
      const [customerRes, quotesRes] = await Promise.all([
        supabase.from("customers").select("*").eq("id", customerId).single(),
        supabase
          .from("quotes")
          .select("*")
          .eq("customer_id", customerId)
          .order("created_at", { ascending: false }),
      ]);

      if (customerRes.error) throw customerRes.error;
      if (quotesRes.error) throw quotesRes.error;

      setCustomer(customerRes.data);
      setQuotes(quotesRes.data || []);
    } catch (error) {
      console.error("Error fetching customer data:", error);
      toast({
        title: "Error",
        description: "Failed to load customer data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="p-8">
          <p className="text-muted-foreground">Loading customer details...</p>
        </Card>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="p-8">
          <p className="text-muted-foreground">Customer not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/existing-customers")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Customers
        </Button>

        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="p-8 shadow-elegant">
            <h1 className="text-3xl font-bold mb-6">{customer.name}</h1>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Phone className="w-5 h-5" />
                <span>{customer.phone}</span>
                {customer.alternate_phone && (
                  <span className="text-sm">/ {customer.alternate_phone}</span>
                )}
              </div>
              <div className="flex items-start gap-3 text-muted-foreground">
                <MapPin className="w-5 h-5 mt-1" />
                <span>{customer.address}</span>
              </div>
            </div>
          </Card>

          <Card className="p-8 shadow-elegant">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Quotations</h2>
              <Button onClick={() => navigate(`/new-quotation/${customerId}`)}>
                <Plus className="w-4 h-4 mr-2" />
                New Quotation
              </Button>
            </div>

            {quotes.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No quotations yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {quotes.map((quote) => (
                  <Card
                    key={quote.id}
                    className="p-4 hover:shadow-card transition-all cursor-pointer"
                    onClick={() => navigate(`/quote/${quote.id}`)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">
                          Quote Date: {new Date(quote.quote_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Created: {new Date(quote.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;
