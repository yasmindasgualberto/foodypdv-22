
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { Pedido, ItemPedido } from '@/types/supabase';

// Tipos
export type OrderItem = {
  id?: string;
  name: string;
  quantity: number;
  notes: string;
  productId?: string;
  price?: number;
};

export type DeliveryInfo = {
  clientName: string;
  phone: string;
  address: string;
  number: string;
  complement?: string;
  neighborhood: string;
  reference?: string;
};

export type Order = {
  id: string;
  type: "Mesa" | "Retirada" | "Delivery";
  identifier: string;
  time: string;
  status: "pending" | "in-progress" | "ready" | "completed" | "paid";
  items: OrderItem[];
  deliveryInfo?: DeliveryInfo;
  hasServiceFee?: boolean;
  totalAmount?: number;
  paymentMethod?: "Dinheiro" | "Crédito" | "Débito" | "Pix";
  shiftId?: string;
};

export type Shift = {
  id: string;
  startTime: string;
  endTime?: string;
  operatorName: string;
  initialAmount: number;
  closingAmount?: number;
  closingCashAmount?: number;
  closingDebitAmount?: number;
  closingCreditAmount?: number;
  closingPixAmount?: number;
  status: "active" | "closed";
  cashTransactions: number;
  cardTransactions: number;
  pixTransactions: number;
  totalTransactions: number;
};

type OrderContextType = {
  orders: Order[];
  shifts: Shift[];
  currentShift: Shift | null;
  addOrder: (order: Omit<Order, "id" | "time" | "status">) => Promise<string | null>;
  updateOrderStatus: (orderId: string, newStatus: Order["status"]) => Promise<void>;
  getNextOrderId: () => Promise<number>;
  addItemsToOrder: (orderId: string, newItems: OrderItem[]) => Promise<void>;
  processPayment: (orderId: string, paymentMethod: Order["paymentMethod"]) => Promise<void>;
  calculateOrderTotal: (order: Order) => number;
  openShift: (operatorName: string, initialAmount: number) => Promise<Shift | null>;
  closeShift: (closingValues: {
    total: number;
    cash: number;
    debit: number;
    credit: number;
    pix: number;
  }) => Promise<Shift | null>;
  isShiftActive: () => boolean;
  loading: boolean;
  refreshOrders: () => Promise<void>;
  refreshShifts: () => Promise<void>;
};

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrders deve ser usado dentro de um OrderProvider");
  }
  return context;
};

export const OrderProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  // Mapear dados do Supabase para o formato da aplicação
  const mapPedidoToOrder = async (pedido: Pedido): Promise<Order> => {
    try {
      // Buscar itens do pedido
      const { data: itens, error: itensError } = await supabase
        .from('itens_pedido')
        .select('*')
        .eq('pedido_id', pedido.id);
        
      if (itensError) {
        console.error("Erro ao buscar itens do pedido:", itensError);
        throw itensError;
      }

      // Mapear itens para o formato da aplicação
      const orderItems = await Promise.all((itens || []).map(async (item) => {
        let productName = `Item #${item.id}`;
        
        if (item.produto_id) {
          // Buscar nome do produto
          const { data: produto } = await supabase
            .from('produtos')
            .select('nome')
            .eq('id', item.produto_id)
            .single();
            
          if (produto) {
            productName = produto.nome;
          }
        }
        
        return {
          id: item.id,
          name: productName,
          quantity: item.quantidade,
          notes: item.observacoes || "",
          productId: item.produto_id,
          price: Number(item.preco_unitario)
        };
      }));

      // Determinar tipo de pedido
      let orderType: "Mesa" | "Retirada" | "Delivery" = "Retirada";
      if (pedido.mesa) orderType = "Mesa";
      
      // Criar objeto de pedido
      const order: Order = {
        id: pedido.id,
        type: orderType,
        identifier: pedido.mesa || pedido.cliente_nome || "Cliente",
        time: new Date(pedido.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: pedido.status as any,
        items: orderItems,
        totalAmount: Number(pedido.valor_total),
        paymentMethod: pedido.metodo_pagamento as any,
        hasServiceFee: false // Valor padrão
      };

      return order;
    } catch (error) {
      console.error("Erro ao mapear pedido:", error);
      throw error;
    }
  };

  // Carregar pedidos do Supabase
  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Erro ao buscar pedidos:", error);
        toast.error("Erro ao carregar pedidos");
        return;
      }

      // Mapear pedidos com seus itens
      const mappedOrders = await Promise.all(
        (pedidos || []).map(mapPedidoToOrder)
      );

      setOrders(mappedOrders);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
      toast.error("Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  };

  // Carregar turnos do Supabase (implementar quando houver tabela de turnos)
  const fetchShifts = async () => {
    // TODO: Implementar busca de turnos do Supabase quando a tabela existir
    // Por enquanto, usando dados do localStorage
    try {
      const savedShifts = localStorage.getItem("shifts");
      if (savedShifts) {
        const parsedShifts = JSON.parse(savedShifts);
        setShifts(parsedShifts);
        
        // Configurar turno ativo, se houver
        const activeShift = parsedShifts.find((shift: any) => shift.status === "active");
        if (activeShift) {
          setCurrentShift(activeShift);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar turnos:", error);
    }
  };

  // Carregar dados quando o componente montar ou quando a sessão mudar
  useEffect(() => {
    if (session) {
      fetchOrders();
      fetchShifts();
    }
  }, [session]);

  // Função para obter o próximo ID de pedido (número sequencial)
  const getNextOrderId = async () => {
    try {
      // Buscar o último pedido para obter um número sequencial
      const { data: ultimoPedido } = await supabase
        .from('pedidos')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1);
        
      // Começa com 1001 se não houver pedidos
      return ultimoPedido && ultimoPedido.length > 0 ? 1001 + orders.length : 1001;
    } catch (error) {
      console.error("Erro ao obter próximo ID:", error);
      return 1001;
    }
  };

  // Verificar se existe um turno ativo
  const isShiftActive = () => {
    return currentShift !== null && currentShift.status === "active";
  };

  // Abrir um novo turno
  const openShift = async (operatorName: string, initialAmount: number) => {
    // Verificar se já existe um turno ativo
    if (isShiftActive()) {
      toast.error("Já existe um turno ativo. Feche o turno atual antes de abrir um novo.");
      return null;
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString();
    const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    try {
      // TODO: Implementar criação de turno no Supabase quando a tabela existir
      // Por enquanto, usando localStorage
      // Criar novo turno
      const newShift: Shift = {
        id: String(shifts.length > 0 ? Math.max(...shifts.map(shift => Number(shift.id))) + 1 : 1),
        startTime: `${formattedDate} ${formattedTime}`,
        operatorName,
        initialAmount,
        status: "active",
        cashTransactions: 0,
        cardTransactions: 0,
        pixTransactions: 0,
        totalTransactions: 0
      };
      
      const updatedShifts = [...shifts, newShift];
      setShifts(updatedShifts);
      setCurrentShift(newShift);
      
      // Salvar no localStorage temporariamente
      localStorage.setItem("shifts", JSON.stringify(updatedShifts));
      
      return newShift;
    } catch (error) {
      console.error("Erro ao abrir turno:", error);
      toast.error("Erro ao abrir turno");
      return null;
    }
  };

  // Fechar um turno ativo
  const closeShift = async (closingValues: {
    total: number;
    cash: number;
    debit: number;
    credit: number;
    pix: number;
  }) => {
    if (!isShiftActive() || !currentShift) {
      toast.error("Não há turno ativo para fechar.");
      return null;
    }
    
    const now = new Date();
    const formattedDate = now.toLocaleDateString();
    const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    try {
      // TODO: Implementar fechamento de turno no Supabase quando a tabela existir
      // Por enquanto, usando localStorage
      const closedShift: Shift = {
        ...currentShift,
        endTime: `${formattedDate} ${formattedTime}`,
        closingAmount: closingValues.total,
        closingCashAmount: closingValues.cash,
        closingDebitAmount: closingValues.debit,
        closingCreditAmount: closingValues.credit,
        closingPixAmount: closingValues.pix,
        status: "closed"
      };
      
      const updatedShifts = shifts.map(shift => 
        shift.id === currentShift.id ? closedShift : shift
      );
      
      setShifts(updatedShifts);
      setCurrentShift(null);
      
      // Salvar no localStorage temporariamente
      localStorage.setItem("shifts", JSON.stringify(updatedShifts));
      
      return closedShift;
    } catch (error) {
      console.error("Erro ao fechar turno:", error);
      toast.error("Erro ao fechar turno");
      return null;
    }
  };

  // Adicionar novo pedido
  const addOrder = async (order: Omit<Order, "id" | "time" | "status">) => {
    try {
      // Calcular total do pedido
      let totalAmount = 0;
      
      // Inserir pedido no Supabase
      const { data: newPedido, error } = await supabase
        .from('pedidos')
        .insert({
          cliente_nome: order.identifier,
          mesa: order.type === "Mesa" ? order.identifier : null,
          status: "pending",
          valor_total: 0, // Será atualizado depois de inserir os itens
          metodo_pagamento: null,
          pago: false,
          observacoes: ""
        })
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar pedido:", error);
        toast.error("Erro ao criar pedido");
        return null;
      }

      // Inserir itens do pedido
      for (const item of order.items) {
        let produtoId = null;
        let precoUnitario = 0;
        
        // Buscar produto para obter ID e preço
        if (item.productId) {
          produtoId = item.productId;
        } else {
          // Buscar produto pelo nome
          const { data: produto } = await supabase
            .from('produtos')
            .select('id, preco')
            .ilike('nome', item.name)
            .single();
            
          if (produto) {
            produtoId = produto.id;
            precoUnitario = produto.preco;
          }
        }
        
        // Se preço não foi definido, usar o preço do produto
        if (item.price !== undefined) {
          precoUnitario = item.price;
        }
        
        // Adicionar valor ao total
        totalAmount += precoUnitario * item.quantity;
        
        // Inserir item
        const { error: itemError } = await supabase
          .from('itens_pedido')
          .insert({
            pedido_id: newPedido.id,
            produto_id: produtoId,
            quantidade: item.quantity,
            preco_unitario: precoUnitario,
            observacoes: item.notes
          });
          
        if (itemError) {
          console.error("Erro ao inserir item do pedido:", itemError);
        }
      }
      
      // Aplicar taxa de serviço se necessário
      if (order.hasServiceFee) {
        totalAmount *= 1.1; // 10% de taxa
      }
      
      // Atualizar o valor total do pedido
      const { error: updateError } = await supabase
        .from('pedidos')
        .update({ valor_total: totalAmount })
        .eq('id', newPedido.id);
        
      if (updateError) {
        console.error("Erro ao atualizar valor total:", updateError);
      }
      
      // Recarregar pedidos
      await fetchOrders();
      
      toast.success(`Pedido #${await getNextOrderId()} criado com sucesso!`);
      return newPedido.id;
    } catch (error) {
      console.error("Erro ao adicionar pedido:", error);
      toast.error("Erro ao adicionar pedido");
      return null;
    }
  };

  // Atualizar status do pedido
  const updateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      console.log(`Atualizando pedido ${orderId} para status: ${newStatus}`);
      
      // Se o pedido estiver sendo marcado como completo, marcar como pronto para pagamento
      const status = newStatus === "completed" ? "ready" : newStatus;
      
      // Atualizar status no Supabase
      const { error } = await supabase
        .from('pedidos')
        .update({ status })
        .eq('id', orderId);
        
      if (error) {
        console.error("Erro ao atualizar status:", error);
        toast.error("Erro ao atualizar status do pedido");
        return;
      }
      
      // Recarregar pedidos
      await fetchOrders();
      
      if (newStatus === "completed") {
        toast.success("Pedido concluído e pronto para pagamento");
      } else {
        toast.success(`Status do pedido atualizado para: ${newStatus}`);
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status do pedido");
    }
  };

  // Processar pagamento de pedido
  const processPayment = async (orderId: string, paymentMethod: Order["paymentMethod"]) => {
    try {
      // Verificar se existe um turno ativo
      if (!isShiftActive() || !currentShift) {
        toast.error("Não é possível processar pagamentos sem um turno ativo. Por favor, abra um turno primeiro.");
        return;
      }
      
      // Atualizar pedido no Supabase
      const { error } = await supabase
        .from('pedidos')
        .update({ 
          status: "paid",
          metodo_pagamento: paymentMethod,
          pago: true
        })
        .eq('id', orderId);
        
      if (error) {
        console.error("Erro ao processar pagamento:", error);
        toast.error("Erro ao processar pagamento");
        return;
      }
      
      // Atualizar estatísticas do turno atual
      if (currentShift) {
        // TODO: Implementar atualização de turno no Supabase quando a tabela existir
        // Por enquanto, usando localStorage
        const updatedShift = { ...currentShift };
        
        // Incrementar contadores com base no método de pagamento
        if (paymentMethod === "Dinheiro") {
          updatedShift.cashTransactions += 1;
        } else if (paymentMethod === "Crédito" || paymentMethod === "Débito") {
          updatedShift.cardTransactions += 1;
        } else if (paymentMethod === "Pix") {
          updatedShift.pixTransactions += 1;
        }
        
        updatedShift.totalTransactions += 1;
        
        // Atualizar estado do turno
        const updatedShifts = shifts.map(shift => 
          shift.id === currentShift.id ? updatedShift : shift
        );
        
        setShifts(updatedShifts);
        setCurrentShift(updatedShift);
        
        // Salvar no localStorage temporariamente
        localStorage.setItem("shifts", JSON.stringify(updatedShifts));
      }
      
      // Recarregar pedidos
      await fetchOrders();
      
      toast.success("Pagamento processado com sucesso!");
    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
      toast.error("Erro ao processar pagamento");
    }
  };

  // Calcular valor total do pedido
  const calculateOrderTotal = (order: Order) => {
    // Usar totalAmount se já estiver definido
    if (order.totalAmount !== undefined) {
      return order.totalAmount;
    }
    
    // Calcular com base nos itens
    const subtotal = order.items.reduce((total, item) => {
      const price = item.price || 0;
      return total + (price * item.quantity);
    }, 0);

    // Aplicar taxa de serviço de 10% se estiver habilitada
    return order.hasServiceFee ? subtotal * 1.1 : subtotal;
  };

  // Adicionar itens a um pedido existente
  const addItemsToOrder = async (orderId: string, newItems: OrderItem[]) => {
    try {
      // Buscar pedido atual para calcular novo valor total
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', orderId)
        .single();
        
      if (pedidoError) {
        console.error("Erro ao buscar pedido:", pedidoError);
        toast.error("Erro ao adicionar itens ao pedido");
        return;
      }
      
      // Calcular valor adicional
      let valorAdicional = 0;
      
      // Adicionar novos itens
      for (const item of newItems) {
        let produtoId = null;
        let precoUnitario = 0;
        
        // Buscar produto pelo nome para obter ID e preço
        if (item.productId) {
          produtoId = item.productId;
        } else {
          const { data: produto } = await supabase
            .from('produtos')
            .select('id, preco')
            .ilike('nome', item.name)
            .single();
            
          if (produto) {
            produtoId = produto.id;
            precoUnitario = Number(produto.preco);
          }
        }
        
        // Se preço foi definido, usar esse valor
        if (item.price !== undefined) {
          precoUnitario = item.price;
        }
        
        // Adicionar valor ao total
        valorAdicional += precoUnitario * item.quantity;
        
        // Verificar se o item já existe com as mesmas observações
        const { data: existingItems } = await supabase
          .from('itens_pedido')
          .select('*')
          .eq('pedido_id', orderId)
          .eq('produto_id', produtoId)
          .eq('observacoes', item.notes || '');
          
        if (existingItems && existingItems.length > 0) {
          // Atualizar quantidade do item existente
          const existingItem = existingItems[0];
          const novaQuantidade = existingItem.quantidade + item.quantity;
          
          const { error: updateError } = await supabase
            .from('itens_pedido')
            .update({ quantidade: novaQuantidade })
            .eq('id', existingItem.id);
            
          if (updateError) {
            console.error("Erro ao atualizar item existente:", updateError);
          }
        } else {
          // Inserir novo item
          const { error: insertError } = await supabase
            .from('itens_pedido')
            .insert({
              pedido_id: orderId,
              produto_id: produtoId,
              quantidade: item.quantity,
              preco_unitario: precoUnitario,
              observacoes: item.notes
            });
            
          if (insertError) {
            console.error("Erro ao inserir novo item:", insertError);
          }
        }
      }
      
      // Atualizar valor total do pedido
      const novoTotal = Number(pedido.valor_total) + valorAdicional;
      
      const { error: updateError } = await supabase
        .from('pedidos')
        .update({ valor_total: novoTotal })
        .eq('id', orderId);
        
      if (updateError) {
        console.error("Erro ao atualizar valor total:", updateError);
      }
      
      // Recarregar pedidos
      await fetchOrders();
      
      toast.success("Itens adicionados ao pedido com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar itens ao pedido:", error);
      toast.error("Erro ao adicionar itens ao pedido");
    }
  };

  // Função para recarregar pedidos manualmente
  const refreshOrders = async () => {
    await fetchOrders();
  };

  // Função para recarregar turnos manualmente
  const refreshShifts = async () => {
    await fetchShifts();
  };

  return (
    <OrderContext.Provider value={{ 
      orders, 
      shifts,
      currentShift,
      addOrder, 
      updateOrderStatus,
      getNextOrderId,
      addItemsToOrder,
      processPayment,
      calculateOrderTotal,
      openShift,
      closeShift,
      isShiftActive,
      loading,
      refreshOrders,
      refreshShifts
    }}>
      {children}
    </OrderContext.Provider>
  );
};
