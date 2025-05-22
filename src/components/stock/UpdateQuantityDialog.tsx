
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { StockItem } from "@/context/StockContext";

interface UpdateQuantityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: StockItem | null;
  onUpdate: (id: string, quantity: number, isIncrement: boolean) => void;  // Alterado de number para string
}

export const UpdateQuantityDialog: React.FC<UpdateQuantityDialogProps> = ({
  open,
  onOpenChange,
  item,
  onUpdate,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [operation, setOperation] = useState<"add" | "subtract">("add");

  if (!item) return null;

  const handleSubmit = () => {
    onUpdate(item.id, quantity, operation === "add");
    onOpenChange(false);
    setQuantity(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Atualizar Quantidade: {item.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium mb-2">Quantidade Atual:</p>
            <p className="text-2xl font-bold">
              {item.quantity} {item.unit}
            </p>
          </div>

          <RadioGroup 
            defaultValue="add" 
            className="grid grid-cols-2 gap-4"
            value={operation}
            onValueChange={(value) => setOperation(value as "add" | "subtract")}
          >
            <div className="flex items-center space-x-2 border rounded-md p-3">
              <RadioGroupItem value="add" id="add" />
              <Label htmlFor="add" className="flex items-center cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Adicionar
              </Label>
            </div>
            <div className="flex items-center space-x-2 border rounded-md p-3">
              <RadioGroupItem value="subtract" id="subtract" />
              <Label htmlFor="subtract" className="flex items-center cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Remover
              </Label>
            </div>
          </RadioGroup>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade ({item.unit})</Label>
            <Input 
              id="quantity" 
              type="number" 
              min="1" 
              value={quantity} 
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))} 
            />
          </div>

          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium mb-1">Nova quantidade após operação:</p>
            <p className="text-lg font-bold">
              {operation === "add" 
                ? `${item.quantity} + ${quantity} = ${item.quantity + quantity}`
                : `${item.quantity} - ${quantity} = ${Math.max(0, item.quantity - quantity)}`
              } {item.unit}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
