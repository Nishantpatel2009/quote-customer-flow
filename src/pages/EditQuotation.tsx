import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import RoomSection from "@/components/RoomSection";

interface MasterItem {
  id: string;
  room_name: string;
  item_name: string;
  default_description: string | null;
  display_order: number;
}

interface Quote {
  id: string;
  customer_id: string;
  quote_date: string;
}

interface Customer {
  name: string;
}

const EditQuotation = () => {
  const { quoteId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [masterItems, setMasterItems] = useState<MasterItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<
    Record<string, { selected: boolean; description: string }>
  >({});
  const [roomStates, setRoomStates] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [quoteId]);

  const fetchData = async () => {
    try {
      // Fetch quote
      const { data: quoteData, error: quoteError } = await supabase
        .from("quotes")
        .select("*")
        .eq("id", quoteId)
        .single();

      if (quoteError) throw quoteError;
      setQuote(quoteData);

      // Fetch customer
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("name")
        .eq("id", quoteData.customer_id)
        .single();

      if (customerError) throw customerError;
      setCustomer(customerData);

      // Fetch master items
      const { data: masterData, error: masterError } = await supabase
        .from("master_items")
        .select("*")
        .order("room_name, display_order");

      if (masterError) throw masterError;
      setMasterItems(masterData || []);

      // Fetch existing quote items
      const { data: itemsData, error: itemsError } = await supabase
        .from("quote_items")
        .select("*")
        .eq("quote_id", quoteId);

      if (itemsError) throw itemsError;

      // Build selectedItems from existing quote items
      const selected: Record<string, { selected: boolean; description: string }> = {};
      const rooms: Record<string, boolean> = {};

      itemsData?.forEach((quoteItem) => {
        const masterItem = masterData?.find(
          (m) =>
            m.room_name === quoteItem.room_name &&
            m.item_name === quoteItem.item_name
        );

        if (masterItem) {
          selected[masterItem.id] = {
            selected: quoteItem.is_selected,
            description: quoteItem.description || masterItem.default_description || "",
          };

          if (quoteItem.is_selected) {
            rooms[quoteItem.room_name] = true;
          }
        }
      });

      setSelectedItems(selected);
      setRoomStates(rooms);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load quotation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRoom = (roomName: string, enabled: boolean) => {
    setRoomStates((prev) => ({ ...prev, [roomName]: enabled }));
    
    if (!enabled) {
      // Deselect all items in this room
      const roomItemIds = masterItems
        .filter((item) => item.room_name === roomName)
        .map((item) => item.id);

      setSelectedItems((prev) => {
        const updated = { ...prev };
        roomItemIds.forEach((id) => {
          if (updated[id]) {
            updated[id] = { ...updated[id], selected: false };
          }
        });
        return updated;
      });
    }
  };

  const handleToggleItem = (itemId: string) => {
    const item = masterItems.find((i) => i.id === itemId);
    if (!item) return;

    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: {
        selected: !prev[itemId]?.selected,
        description: prev[itemId]?.description || item.default_description || "",
      },
    }));
  };

  const handleUpdateDescription = (itemId: string, description: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        description,
      },
    }));
  };

  const handleSave = async () => {
    if (!quote) return;

    setSaving(true);
    try {
      // Delete all existing quote items
      const { error: deleteError } = await supabase
        .from("quote_items")
        .delete()
        .eq("quote_id", quoteId);

      if (deleteError) throw deleteError;

      // Build items to insert
      const itemsToInsert = masterItems
        .filter((item) => selectedItems[item.id]?.selected)
        .map((item) => ({
          quote_id: quoteId,
          room_name: item.room_name,
          item_name: item.item_name,
          description: selectedItems[item.id]?.description || null,
          is_selected: true,
        }));

      if (itemsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("quote_items")
          .insert(itemsToInsert);

        if (insertError) throw insertError;
      }

      toast({
        title: "Success",
        description: "Quotation updated successfully",
      });

      navigate(`/quote/${quoteId}`);
    } catch (error) {
      console.error("Error saving quotation:", error);
      toast({
        title: "Error",
        description: "Failed to update quotation",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="p-8">
          <p className="text-muted-foreground">Loading quotation...</p>
        </Card>
      </div>
    );
  }

  if (!quote || !customer) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="p-8">
          <p className="text-muted-foreground">Quotation not found</p>
        </Card>
      </div>
    );
  }

  const rooms = Array.from(new Set(masterItems.map((item) => item.room_name)));

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(`/quote/${quoteId}`)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Quote
        </Button>

        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="p-8 shadow-elegant">
            <h1 className="text-3xl font-bold mb-2">Edit Quotation</h1>
            <p className="text-muted-foreground mb-6">
              Customer: {customer.name}
            </p>

            <div className="space-y-4">
              {rooms.map((room) => {
                const roomItems = masterItems.filter(
                  (item) => item.room_name === room
                );

                return (
                  <RoomSection
                    key={room}
                    roomName={room}
                    items={roomItems}
                    selectedItems={selectedItems}
                    roomEnabled={roomStates[room] || false}
                    onToggleRoom={(enabled) => handleToggleRoom(room, enabled)}
                    onToggleItem={handleToggleItem}
                    onUpdateDescription={handleUpdateDescription}
                  />
                );
              })}
            </div>

            <div className="mt-8 flex gap-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/quote/${quoteId}`)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EditQuotation;
