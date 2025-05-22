import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useOrders, DeliveryInfo } from "@/context/OrderContext";
import { Form, FormItem, FormLabel, FormControl, FormField } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { useProducts, Product } from "@/context/ProductContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image } from "lucide-react";

// Modificando o tipo CartItem para usar string como id
type CartItem = {
  id: string;  // Mudado de number para string
  name: string;
  price: number;
  quantity: number;
  observation: string;
  imageUrl?: string;
};

// Schema para os dados de entrega
const deliveryFormSchema = z.object({
  clientName: z.string().min(3, "Nome do cliente deve ter pelo menos 3 caracteres"),
  phone: z.string().min(8, "Telefone deve ter pelo menos 8 dígitos"),
  address: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, "Bairro é obrigatório"),
  reference: z.string().optional(),
});

type DeliveryFormData = z.infer<typeof deliveryFormSchema>;

const PDV = () => {
  const { addOrder } = useOrders();
  const { products } = useProducts(); // Usando produtos do ProductContext
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState("mesa");
  const [tableNumber, setTableNumber] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [observationDialogOpen, setObservationDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [observation, setObservation] = useState("");
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [applyServiceFee, setApplyServiceFee] = useState(false);

  // Obter categorias únicas dos produtos
  const categories = ["Todos", ...new Set(products
    .filter(product => product.active) // Apenas produtos ativos
    .map(product => product.category))];

  // Filtrar produtos baseados na categoria ativa e pesquisa
  const filteredProducts = products.filter((product) => {
    // Apenas produtos ativos
    if (!product.active) return false;
    
    // Filtragem por categoria e pesquisa
    const matchesCategory = activeCategory === "Todos" || product.category === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  // Form de entrega com react-hook-form
  const deliveryForm = useForm<DeliveryFormData>({
    resolver: zodResolver(deliveryFormSchema),
    defaultValues: {
      clientName: "",
      phone: "",
      address: "",
      number: "",
      complement: "",
      neighborhood: "",
      reference: "",
    },
  });

  const openObservationDialog = (product: Product) => {
    setCurrentProduct(product);
    setObservation("");
    setObservationDialogOpen(true);
  };

  const addToCartWithObservation = () => {
    if (!currentProduct) return;
    
    setCart((prevCart) => {
      // Verificar se já existe um item com o mesmo ID e mesma observação
      const existingItemIndex = prevCart.findIndex(
        (item) => 
          item.id === currentProduct.id && 
          item.observation === observation
      );
      
      if (existingItemIndex >= 0) {
        // Se o item já existe com a mesma observação, aumente a quantidade
        return prevCart.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      // Adicionar novo item com observação
      return [
        ...prevCart, 
        { 
          id: currentProduct.id,
          name: currentProduct.name,
          price: currentProduct.price,
          quantity: 1,
          observation,
          imageUrl: currentProduct.imageUrl
        }
      ];
    });
    
    setObservationDialogOpen(false);
    toast.success(`${currentProduct.name} adicionado ao carrinho`);
  };

  const removeFromCart = (index: number) => {
    setCart((prevCart) =>
      prevCart.filter((_, i) => i !== index)
    );
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setCart((prevCart) =>
      prevCart.map((item, i) =>
        i === index ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const updateObservation = (index: number, newObservation: string) => {
    setCart((prevCart) =>
      prevCart.map((item, i) =>
        i === index ? { ...item, observation: newObservation } : item
      )
    );
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    const serviceFee = applyServiceFee ? subtotal * 0.1 : 0;
    return subtotal + serviceFee;
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const calculateServiceFee = () => {
    return applyServiceFee ? calculateSubtotal() * 0.1 : 0;
  };

  const handleFinishOrder = () => {
    if (cart.length === 0) return;
    
    // Se for um pedido de delivery, abra o modal de dados de entrega
    if (orderType === "delivery") {
      setDeliveryDialogOpen(true);
      return;
    }
    
    // Para outros tipos de pedido, finalize normalmente
    finalizeOrder();
  };
  
  const finalizeOrder = (deliveryData?: DeliveryFormData) => {
    // Converter itens do carrinho para o formato do KDS
    const kdsItems = cart.map(item => ({
      name: item.name,
      quantity: item.quantity,
      notes: item.observation
    }));
    
    // Determinar o tipo de pedido e identificador para o KDS
    let orderTypeKDS: "Mesa" | "Retirada" | "Delivery";
    let identifier: string;
    
    switch (orderType) {
      case "mesa":
        orderTypeKDS = "Mesa";
        identifier = `Mesa ${tableNumber || 'N/A'}`;
        break;
      case "retirada":
        orderTypeKDS = "Retirada";
        identifier = "Balcão";
        break;
      case "delivery":
        orderTypeKDS = "Delivery";
        identifier = deliveryData ? `${deliveryData.clientName} - ${deliveryData.phone}` : "Cliente";
        break;
      default:
        orderTypeKDS = "Mesa";
        identifier = "N/A";
    }
    
    // Adaptar os dados de entrega para o formato DeliveryInfo
    let deliveryInfo: DeliveryInfo | undefined = undefined;
    
    if (orderType === "delivery" && deliveryData) {
      deliveryInfo = {
        clientName: deliveryData.clientName,
        phone: deliveryData.phone,
        address: deliveryData.address,
        number: deliveryData.number,
        complement: deliveryData.complement,
        neighborhood: deliveryData.neighborhood,
        reference: deliveryData.reference
      };
    }
    
    // Adicionar o pedido ao contexto para aparecer no KDS
    addOrder({
      type: orderTypeKDS,
      identifier,
      items: kdsItems,
      deliveryInfo,
      hasServiceFee: applyServiceFee
    });
    
    console.log("Pedido finalizado:", {
      items: cart,
      type: orderType,
      table: tableNumber,
      deliveryData,
      total: calculateTotal(),
      hasServiceFee: applyServiceFee
    });
    
    // Limpa o carrinho após finalizar o pedido
    setCart([]);
    setDeliveryDialogOpen(false);
    
    toast.success("Pedido finalizado com sucesso e enviado para a cozinha!");
  };
  
  const handleDeliveryFormSubmit = (data: DeliveryFormData) => {
    finalizeOrder(data);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="PDV" subtitle="Ponto de Venda" />
        <div className="flex-1 flex overflow-hidden">
          {/* Products Section */}
          <div className="flex-1 flex flex-col overflow-hidden border-r">
            <div className="p-4 border-b">
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                  </svg>
                  <span className="ml-2">Filtros</span>
                </Button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={activeCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveCategory(category)}
                    className="whitespace-nowrap"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <Card 
                    key={product.id} 
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => openObservationDialog(product)}
                  >
                    <CardContent className="p-4 flex flex-col items-center">
                      <div className="w-full aspect-square bg-muted rounded-md mb-3 flex items-center justify-center overflow-hidden">
                        {product.imageUrl ? (
                          <Avatar className="h-full w-full rounded-md">
                            <AvatarImage src={product.imageUrl} alt={product.name} className="object-cover" />
                            <AvatarFallback className="bg-muted rounded-md">
                              <Image className="h-8 w-8" />
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="14.31" y1="8" x2="20.05" y2="17.94"></line>
                            <line x1="9.69" y1="8" x2="21.17" y2="8"></line>
                            <line x1="7.38" y1="12" x2="13.12" y2="2.06"></line>
                            <line x1="9.69" y1="16" x2="3.95" y2="6.06"></line>
                            <line x1="14.31" y1="16" x2="2.83" y2="16"></line>
                            <line x1="16.62" y1="12" x2="10.88" y2="21.94"></line>
                          </svg>
                        )}
                      </div>
                      <h3 className="font-medium text-center">{product.name}</h3>
                      <p className="text-pdv-primary font-bold mt-2">
                        R$ {product.price.toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
          
          {/* Order Section */}
          <div className="w-96 flex flex-col overflow-hidden bg-card">
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium mb-2">Detalhes do Pedido</h2>
              <Tabs defaultValue="mesa" value={orderType} onValueChange={setOrderType}>
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="mesa">Mesa</TabsTrigger>
                  <TabsTrigger value="retirada">Retirada</TabsTrigger>
                  <TabsTrigger value="delivery">Delivery</TabsTrigger>
                </TabsList>
                <TabsContent value="mesa" className="mt-2">
                  <Input
                    placeholder="Número da Mesa"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                  />
                </TabsContent>
                <TabsContent value="retirada" className="mt-2">
                  <p className="text-sm text-muted-foreground">
                    Pedido para retirada no balcão
                  </p>
                </TabsContent>
                <TabsContent value="delivery" className="mt-2">
                  <p className="text-sm text-muted-foreground">
                    Adicione os dados de entrega na próxima tela
                  </p>
                </TabsContent>
              </Tabs>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                  <p className="mt-4">Carrinho vazio</p>
                  <p className="text-sm">Adicione itens ao pedido</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item, index) => (
                    <div key={index} className="flex flex-col pb-4 border-b">
                      <div className="flex justify-between">
                        <div className="flex flex-1 gap-2">
                          {item.imageUrl && (
                            <Avatar className="h-10 w-10 rounded-md">
                              <AvatarImage src={item.imageUrl} alt={item.name} className="object-cover" />
                              <AvatarFallback className="bg-muted rounded-md">
                                <Image className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div>
                            <div className="flex justify-between">
                              <p className="font-medium">{item.name}</p>
                              <button 
                                onClick={() => removeFromCart(index)}
                                className="text-pdv-danger hover:text-red-700 transition-colors ml-2"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 6h18"></path>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                              </button>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              R$ {item.price.toFixed(2)} x {item.quantity}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center ml-4">
                          <div className="flex items-center border rounded-md">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(index, item.quantity - 1)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                              </svg>
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(index, item.quantity + 1)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                              </svg>
                            </Button>
                          </div>
                          <p className="ml-4 font-medium">
                            R$ {(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Área de observação */}
                      <div className="mt-2 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        
                        <Input 
                          placeholder="Adicionar observação" 
                          value={item.observation} 
                          onChange={(e) => updateObservation(index, e.target.value)}
                          className="text-sm h-8 flex-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="border-t p-4 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>R$ {calculateSubtotal().toFixed(2)}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="service-fee" 
                  checked={applyServiceFee}
                  onCheckedChange={(checked) => setApplyServiceFee(checked === true)}
                />
                <label htmlFor="service-fee" className="text-sm text-muted-foreground cursor-pointer">
                  Aplicar taxa de serviço (10%)
                </label>
                <span className="text-sm ml-auto">
                  R$ {calculateServiceFee().toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between font-medium text-lg pt-2 border-t">
                <span>Total</span>
                <span>R$ {calculateTotal().toFixed(2)}</span>
              </div>
              <Button 
                className="w-full"
                disabled={cart.length === 0}
                onClick={handleFinishOrder}
              >
                Finalizar Pedido
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Diálogo de Observação */}
      <Dialog open={observationDialogOpen} onOpenChange={setObservationDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{currentProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col space-y-4">
              {currentProduct?.imageUrl && (
                <div className="flex justify-center">
                  <Avatar className="h-24 w-24 rounded-md">
                    <AvatarImage src={currentProduct.imageUrl} alt={currentProduct.name} className="object-cover" />
                    <AvatarFallback className="bg-muted rounded-md">
                      <Image className="h-12 w-12" />
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span>Preço</span>
                <span className="font-medium">R$ {currentProduct?.price.toFixed(2)}</span>
              </div>
            </div>
            <div>
              <label htmlFor="observation" className="text-sm font-medium">
                Alguma observação?
              </label>
              <Textarea
                id="observation"
                placeholder="Ex: Sem cebola, sem tomate, molho à parte, etc."
                className="mt-1"
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button 
              variant="outline" 
              onClick={() => setObservationDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={addToCartWithObservation}>
              Adicionar ao Pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de Dados de Entrega */}
      <Dialog open={deliveryDialogOpen} onOpenChange={setDeliveryDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Dados para Entrega</DialogTitle>
            <DialogDescription>
              Preencha os dados do cliente para realizar a entrega
            </DialogDescription>
          </DialogHeader>
          
          <Form {...deliveryForm}>
            <form onSubmit={deliveryForm.handleSubmit(handleDeliveryFormSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={deliveryForm.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Cliente</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={deliveryForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={deliveryForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua, Avenida, etc." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={deliveryForm.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input placeholder="123" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={deliveryForm.control}
                  name="complement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complemento</FormLabel>
                      <FormControl>
                        <Input placeholder="Apto, Bloco, etc." {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={deliveryForm.control}
                  name="neighborhood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu bairro" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={deliveryForm.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ponto de Referência</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Próximo à padaria, prédio azul, etc." 
                        {...field} 
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={() => setDeliveryDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  Finalizar Pedido
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PDV;
