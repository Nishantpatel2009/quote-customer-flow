import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface MasterItem {
  id: string;
  room_name: string;
  item_name: string;
  default_description: string;
  display_order: number;
}

interface RoomSectionProps {
  roomName: string;
  items: MasterItem[];
  selectedItems: Record<string, { selected: boolean; description: string; quantity: number }>;
  roomEnabled: boolean;
  onToggleRoom: (enabled: boolean) => void;
  onToggleItem: (itemId: string) => void;
  onUpdateDescription: (itemId: string, description: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
}

const RoomSection = ({
  roomName,
  items,
  selectedItems,
  roomEnabled,
  onToggleRoom,
  onToggleItem,
  onUpdateDescription,
  onUpdateQuantity,
}: RoomSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <div className="p-6 flex items-center justify-between hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-4">
              <Switch
                checked={roomEnabled}
                onCheckedChange={(checked) => {
                  onToggleRoom(checked);
                  if (checked) setIsOpen(true);
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <h2 className="text-xl font-semibold">{roomName}</h2>
            </div>
            <ChevronDown
              className={`w-5 h-5 transition-transform duration-200 ${
                isOpen ? "transform rotate-180" : ""
              }`}
            />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {roomEnabled && (
            <div className="px-6 pb-6 space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="p-4 bg-muted/30">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`item-${item.id}`} className="font-medium">
                        {item.item_name}
                      </Label>
                      <Switch
                        id={`item-${item.id}`}
                        checked={selectedItems[item.id]?.selected || false}
                        onCheckedChange={() => onToggleItem(item.id)}
                      />
                    </div>
                    
                    {selectedItems[item.id]?.selected && (
                      <div className="space-y-3 animate-in slide-in-from-top-2">
                        <div className="space-y-2">
                          <Label htmlFor={`qty-${item.id}`} className="text-sm text-muted-foreground">
                            Quantity
                          </Label>
                          <Input
                            id={`qty-${item.id}`}
                            type="number"
                            min="1"
                            value={selectedItems[item.id]?.quantity || 1}
                            onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                            className="w-24"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`desc-${item.id}`} className="text-sm text-muted-foreground">
                            Description
                          </Label>
                          <Textarea
                            id={`desc-${item.id}`}
                            value={selectedItems[item.id]?.description || ""}
                            onChange={(e) => onUpdateDescription(item.id, e.target.value)}
                            placeholder="Enter item description"
                            rows={3}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default RoomSection;
