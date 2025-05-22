
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrders, Order } from "@/context/OrderContext";
import { toast } from "sonner";

const KDS = () => {
  const { orders, updateOrderStatus } = useOrders();
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  
  const handleStatusChange = (orderId: string, newStatus: Order["status"]) => {
    updateOrderStatus(orderId, newStatus);
    toast.success(`Pedido #${orderId} atualizado para ${translateStatus(newStatus)}`);
  };

  const handleBulkComplete = () => {
    if (selectedOrders.length === 0) {
      return toast.error("Selecione pelo menos um pedido para finalizar");
    }
    
    selectedOrders.forEach(orderId => {
      updateOrderStatus(orderId, "completed");
    });
    
    toast.success(`${selectedOrders.length} pedidos finalizados com sucesso`);
    setSelectedOrders([]);
  };

  const translateStatus = (status: string) => {
    switch (status) {
      case "pending": return "Pendente";
      case "in-progress": return "Em Preparo";
      case "ready": return "Pronto";
      case "completed": return "Entregue";
      default: return status;
    }
  };
  
  // Finaliza automaticamente os pedidos prontos no carregamento
  useEffect(() => {
    const readyOrders = orders.filter(order => order.status === "ready");
    if (readyOrders.length > 0) {
      readyOrders.forEach(order => {
        updateOrderStatus(order.id, "completed");
      });
      
      toast.success(`${readyOrders.length} pedidos finalizados automaticamente.`);
    }
  }, []);

  const pendingOrders = orders.filter(order => order.status === "pending");
  const inProgressOrders = orders.filter(order => order.status === "in-progress");
  const readyOrders = orders.filter(order => order.status === "ready");
  
  const handleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-pdv-accent text-black";
      case "in-progress": return "bg-pdv-primary text-white";
      case "ready": return "bg-pdv-secondary text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };
  
  const renderOrderCard = (order: Order) => (
    <Card key={order.id} className="mb-4">
      <CardHeader className={`${getStatusColor(order.status)} py-2 px-4 rounded-t-lg`}>
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">
            <span className="font-bold">#{order.id}</span> - {order.type}: {order.identifier}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={order.status === "pending" ? "bg-white text-black" : "bg-white/20 text-white"}>
              {order.time}
            </Badge>
            <input 
              type="checkbox" 
              checked={selectedOrders.includes(order.id)} 
              onChange={() => handleOrderSelection(order.id)} 
              className="h-5 w-5 accent-pdv-secondary rounded" 
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <ul className="space-y-2 mb-4">
          {order.items.map((item, idx) => (
            <li key={idx} className="flex justify-between items-start">
              <div>
                <span className="font-medium">{item.quantity}x {item.name}</span>
                {item.notes && (
                  <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                )}
              </div>
              <input type="checkbox" className="h-5 w-5 accent-pdv-secondary" />
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="bg-muted/20 px-4 py-3 flex justify-between">
        {order.status === "pending" && (
          <Button 
            variant="default" 
            className="bg-pdv-primary hover:bg-pdv-primary/80 w-full"
            onClick={() => handleStatusChange(order.id, "in-progress")}
          >
            Iniciar Preparo
          </Button>
        )}
        {order.status === "in-progress" && (
          <Button 
            variant="default" 
            className="bg-pdv-secondary hover:bg-pdv-secondary/80 w-full"
            onClick={() => handleStatusChange(order.id, "ready")}
          >
            Marcar como Pronto
          </Button>
        )}
        {order.status === "ready" && (
          <Button 
            variant="default" 
            className="bg-gray-500 hover:bg-gray-600 w-full"
            onClick={() => handleStatusChange(order.id, "completed")}
          >
            Entregue
          </Button>
        )}
      </CardFooter>
    </Card>
  );
  
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="KDS" subtitle="Sistema de Exibição da Cozinha" />
        <main className="flex-1 p-6 overflow-auto">
          <Tabs defaultValue="all" className="w-full">
            <div className="flex justify-between items-center mb-6">
              <TabsList>
                <TabsTrigger value="all">
                  Todos <Badge className="ml-2 bg-gray-500">{orders.length - orders.filter(o => o.status === "completed").length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pendentes <Badge className="ml-2 bg-pdv-accent text-black">{pendingOrders.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="in-progress">
                  Em Preparo <Badge className="ml-2 bg-pdv-primary">{inProgressOrders.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="ready">
                  Prontos <Badge className="ml-2 bg-pdv-secondary">{readyOrders.length}</Badge>
                </TabsTrigger>
              </TabsList>
              
              <div className="flex gap-2">
                <Button 
                  variant="default" 
                  size="sm"
                  className="bg-pdv-secondary hover:bg-pdv-secondary/80"
                  disabled={selectedOrders.length === 0}
                  onClick={handleBulkComplete}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  Finalizar Selecionados
                </Button>
                <Button variant="outline" size="sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                  </svg>
                  Filtrar
                </Button>
                <Button variant="outline" size="sm">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Adicionar
                </Button>
              </div>
            </div>
            
            <TabsContent value="all">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orders
                  .filter(order => order.status !== "completed")
                  .map(renderOrderCard)}
                
                {orders.filter(order => order.status !== "completed").length === 0 && (
                  <div className="col-span-full flex justify-center items-center p-8">
                    <p className="text-muted-foreground">Não há pedidos em aberto no momento.</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="pending">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingOrders.map(renderOrderCard)}
                
                {pendingOrders.length === 0 && (
                  <div className="col-span-full flex justify-center items-center p-8">
                    <p className="text-muted-foreground">Não há pedidos pendentes no momento.</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="in-progress">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inProgressOrders.map(renderOrderCard)}
                
                {inProgressOrders.length === 0 && (
                  <div className="col-span-full flex justify-center items-center p-8">
                    <p className="text-muted-foreground">Não há pedidos em preparo no momento.</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="ready">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {readyOrders.map(renderOrderCard)}
                
                {readyOrders.length === 0 && (
                  <div className="col-span-full flex justify-center items-center p-8">
                    <p className="text-muted-foreground">Não há pedidos prontos no momento.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default KDS;
