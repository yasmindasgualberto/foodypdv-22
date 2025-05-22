import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { useOrders } from "@/context/OrderContext";
import { format } from "date-fns";

const Dashboard = () => {
  const { orders, calculateOrderTotal } = useOrders();
  const [dashboardData, setDashboardData] = useState({
    salesValue: 0,
    ordersCount: 0,
    averageTicket: 0,
    lowStockItems: 7, // Mantendo esse valor fixo por enquanto, pois não temos gestão de estoque implementada
    topProducts: [] as { name: string; quantity: number }[],
    recentOrders: [] as any[],
    salesTrend: 0,
    ordersTrend: 0
  });

  useEffect(() => {
    // Pegando somente pedidos pagos
    const completedOrders = orders.filter(order => order.status === "paid");
    
    // Calculando valores para hoje
    const today = format(new Date(), "yyyy-MM-dd");
    const todayOrders = completedOrders.filter(order => {
      // Como não temos a data completa nos pedidos, estamos simulando que todos são de hoje
      return true; 
    });
    
    // Calculando valor total de vendas
    const totalSales = todayOrders.reduce((sum, order) => {
      return sum + calculateOrderTotal(order);
    }, 0);
    
    // Calculando ticket médio
    const avgTicket = todayOrders.length > 0 ? totalSales / todayOrders.length : 0;
    
    // Calculando produtos mais vendidos
    const productCounts: Record<string, number> = {};
    
    todayOrders.forEach(order => {
      order.items.forEach((item: { name: string; quantity: number }) => {
        if (productCounts[item.name]) {
          productCounts[item.name] += item.quantity;
        } else {
          productCounts[item.name] = item.quantity;
        }
      });
    });
    
    const topProducts = Object.entries(productCounts)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
    
    // Pegando pedidos recentes
    const recentOrders = [...todayOrders]
      .sort((a, b) => {
        // Adaptação para ids que agora são strings
        const idA = typeof a.id === 'number' ? a.id : 0;
        const idB = typeof b.id === 'number' ? b.id : 0;
        return idB - idA;
      })
      .slice(0, 5)
      .map(order => ({
        id: order.id,
        identifier: order.identifier,
        type: order.type,
        total: calculateOrderTotal(order)
      }));
    
    // Tendência simulada com base no número de pedidos
    // Em uma aplicação real, isso compararia com dias anteriores
    const salesTrend = todayOrders.length > 2 ? 8 : todayOrders.length > 0 ? 3 : 0;
    const ordersTrend = todayOrders.length > 2 ? 12 : todayOrders.length > 0 ? 5 : 0;
    
    setDashboardData({
      salesValue: totalSales,
      ordersCount: todayOrders.length,
      averageTicket: avgTicket,
      lowStockItems: 7, // Mantido fixo
      topProducts,
      recentOrders,
      salesTrend,
      ordersTrend
    });
  }, [orders, calculateOrderTotal]);

  // Formatar valor em reais
  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Dashboard" subtitle="Resumo do sistema" />
        <main className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Vendas Hoje"
              value={formatCurrency(dashboardData.salesValue)}
              description="Total de vendas"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              }
              trend={dashboardData.salesTrend > 0 ? "up" : "neutral"}
              trendValue={dashboardData.salesTrend > 0 ? `${dashboardData.salesTrend}%` : "0%"}
            />
            <StatCard
              title="Pedidos Hoje"
              value={dashboardData.ordersCount.toString()}
              description="Total de pedidos"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
              }
              trend={dashboardData.ordersTrend > 0 ? "up" : "neutral"}
              trendValue={dashboardData.ordersTrend > 0 ? `${dashboardData.ordersTrend}%` : "0%"}
            />
            <StatCard
              title="Ticket Médio"
              value={formatCurrency(dashboardData.averageTicket)}
              description="Valor médio por pedido"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                  <line x1="2" y1="10" x2="22" y2="10"></line>
                </svg>
              }
              trend={dashboardData.averageTicket > 0 ? "up" : "neutral"}
              trendValue={dashboardData.averageTicket > 0 ? "3%" : "0%"}
            />
            <StatCard
              title="Itens Baixos"
              value={dashboardData.lowStockItems.toString()}
              description="Produtos com estoque baixo"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path>
                  <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"></path>
                  <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"></path>
                </svg>
              }
              trend="down"
              trendValue="2 itens"
              className="border-l-4 border-pdv-danger"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-card rounded-lg p-6 shadow">
              <h2 className="text-lg font-medium mb-4">Vendas dos Últimos 7 dias</h2>
              <div className="h-64 flex items-center justify-center border-t pt-4 mt-2">
                <div className="text-muted-foreground">Gráfico de vendas será exibido aqui</div>
              </div>
            </div>

            <div className="bg-card rounded-lg p-6 shadow">
              <h2 className="text-lg font-medium mb-4">Produtos Mais Vendidos</h2>
              <div className="space-y-4">
                {dashboardData.topProducts.length > 0 ? (
                  dashboardData.topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between pb-2 border-b">
                      <span>{product.name}</span>
                      <span className="font-medium">{product.quantity} un</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    Nenhum produto vendido hoje
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="bg-card rounded-lg p-6 shadow">
              <h2 className="text-lg font-medium mb-4">Pedidos Recentes</h2>
              {dashboardData.recentOrders.length > 0 ? (
                <div className="space-y-2">
                  {dashboardData.recentOrders.map((order, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          order.type === "Mesa" ? "bg-pdv-accent" : 
                          order.type === "Delivery" ? "bg-pdv-secondary" : "bg-pdv-primary"
                        }`}></div>
                        <span>Pedido #{order.id}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {order.identifier}
                        </span>
                        <span className="font-medium">{formatCurrency(order.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  Nenhum pedido recente
                </div>
              )}
            </div>

            <div className="bg-card rounded-lg p-6 shadow">
              <h2 className="text-lg font-medium mb-4">Formas de Pagamento</h2>
              <div className="h-64 flex items-center justify-center border-t pt-4 mt-2">
                <div className="text-muted-foreground">Gráfico de pagamentos será exibido aqui</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
