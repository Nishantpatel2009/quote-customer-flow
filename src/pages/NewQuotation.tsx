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
  default_description: string;
  display_order: number;
}

const ROOMS = ["Foyer", "Hall", "Puja Room", "Dining", "Kitchen", "Bedroom", "Gazebo"];

const NewQuotation = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [masterItems, setMasterItems] = useState<MasterItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<
    Record<string, { selected: boolean; description: string; quantity: number }>
  >({});
  const [roomStates, setRoomStates] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMasterItems();
  }, []);

  const fetchMasterItems = async () => {
    try {
      const { data, error } = await supabase
        .from("master_items")
        .select("*")
        .order("display_order");

      if (error) throw error;
      setMasterItems(data || []);
      
      // Initialize selected items state
      const initialState: Record<string, { selected: boolean; description: string; quantity: number }> = {};
      data?.forEach(item => {
        initialState[item.id] = { selected: false, description: item.default_description || "", quantity: 1 };
      });
      setSelectedItems(initialState);
    } catch (error) {
      console.error("Error fetching items:", error);
      toast({
        title: "Error",
        description: "Failed to load items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Create quote
      const { data: quote, error: quoteError } = await supabase
        .from("quotes")
        .insert({
          customer_id: customerId,
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Create quote items for selected items
      const quoteItems = masterItems
        .filter(item => selectedItems[item.id]?.selected)
        .map(item => ({
          quote_id: quote.id,
          room_name: item.room_name,
          item_name: item.item_name,
          description: selectedItems[item.id].description,
          quantity: selectedItems[item.id].quantity || 1,
          is_selected: true,
        }));

      if (quoteItems.length > 0) {
        const { error: itemsError } = await supabase
          .from("quote_items")
          .insert(quoteItems);

        if (itemsError) throw itemsError;
      }

      toast({
        title: "Success",
        description: "Quotation saved successfully",
      });

      navigate(`/quote/${quote.id}`);
    } catch (error) {
      console.error("Error saving quotation:", error);
      toast({
        title: "Error",
        description: "Failed to save quotation",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        selected: !prev[itemId]?.selected,
      },
    }));
  };

  const updateItemDescription = (itemId: string, description: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        description,
      },
    }));
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        quantity: Math.max(1, quantity),
      },
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="p-8">
          <p className="text-muted-foreground">Loading quotation form...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(`/customer/${customerId}`)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Customer
        </Button>

        <div className="max-w-4xl mx-auto">
          <Card className="p-8 shadow-elegant mb-6">
            <h1 className="text-3xl font-bold mb-2">New Quotation</h1>
            <p className="text-muted-foreground">
              Select items for each room to include in the quotation
            </p>
          </Card>

          <div className="space-y-4">
            {ROOMS.map(room => {
              const roomItems = masterItems.filter(item => item.room_name === room);
              return (
                <RoomSection
                  key={room}
                  roomName={room}
                  items={roomItems}
                  selectedItems={selectedItems}
                  roomEnabled={roomStates[room] || false}
                  onToggleRoom={(enabled) => setRoomStates(prev => ({ ...prev, [room]: enabled }))}
                  onToggleItem={toggleItemSelection}
                  onUpdateDescription={updateItemDescription}
                  onUpdateQuantity={updateItemQuantity}
                />
              );
            })}
          </div>

          <Card className="p-6 mt-6 sticky bottom-4 shadow-elegant">
            <Button onClick={handleSave} className="w-full" size="lg" disabled={saving}>
              {saving ? "Saving..." : "Save Quotation"}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NewQuotation;
