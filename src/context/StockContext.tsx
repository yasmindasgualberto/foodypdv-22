
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { EstoqueItem } from "@/types/supabase";

// Definição dos tipos
export type StockItemCategory = "Ingredientes" | "Vegetais" | "Bebidas" | "Descartáveis" | "Outros";

export interface StockItem {
  id: string;
  name: string;
  category: StockItemCategory;
  quantity: number;
  unit: string;
  minStock: number;
  purchasePrice?: number;
  lastUpdate?: string;
  imageUrl?: string;
  productId?: string;
}

interface StockContextType {
  stockItems: StockItem[];
  loading: boolean;
  addStockItem: (item: Omit<StockItem, "id" | "lastUpdate">) => Promise<void>;
  updateStockItem: (id: string, item: Partial<StockItem>) => Promise<void>;
  deleteStockItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number, isIncrement: boolean) => Promise<void>;
  getStockStatus: (item: StockItem) => { status: string; color: string };
  getLowStockItems: () => StockItem[];
  getStockCategories: () => string[];
  getStockValue: () => number;
  refreshStock: () => Promise<void>;
}

// Criação do contexto
const StockContext = createContext<StockContextType | undefined>(undefined);

export const StockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  // Função para mapear dados do Supabase para o formato da aplicação
  const mapSupabaseToStockItem = async (estoqueItem: EstoqueItem): Promise<StockItem> => {
    let productName = "Item sem produto";
    let productImageUrl = "";
    
    if (estoqueItem.produto_id) {
      try {
        // Buscar informações do produto associado
        const { data: produto, error } = await supabase
          .from('produtos')
          .select('*')
          .eq('id', estoqueItem.produto_id)
          .single();
          
        if (!error && produto) {
          productName = produto.nome;
          productImageUrl = produto.imagem_url || "";
        }
      } catch (error) {
        console.error("Erro ao buscar produto para item de estoque:", error);
      }
    }

    return {
      id: estoqueItem.id,
      name: productName,
      category: "Ingredientes" as StockItemCategory, // Categoria padrão
      quantity: Number(estoqueItem.quantidade || 0),
      unit: estoqueItem.unidade || "un",
      minStock: Number(estoqueItem.estoque_minimo || 0),
      purchasePrice: estoqueItem.preco_compra ? Number(estoqueItem.preco_compra) : undefined,
      lastUpdate: estoqueItem.ultima_atualizacao,
      imageUrl: productImageUrl,
      productId: estoqueItem.produto_id || undefined
    };
  };

  // Carregar itens de estoque do Supabase
  const fetchStockItems = async () => {
    try {
      setLoading(true);
      
      const { data: estoqueItems, error } = await supabase
        .from('estoque')
        .select('*');

      if (error) {
        console.error("Erro ao buscar itens de estoque:", error);
        toast.error("Erro ao carregar dados do estoque");
        setLoading(false);
        return;
      }

      // Mapear itens de estoque com detalhes dos produtos
      const mappedItems = await Promise.all(
        (estoqueItems || []).map(mapSupabaseToStockItem)
      );

      setStockItems(mappedItems);
    } catch (error) {
      console.error("Erro ao buscar dados de estoque:", error);
      toast.error("Erro ao carregar dados do estoque");
    } finally {
      setLoading(false);
    }
  };

  // Carregar estoque quando o componente montar ou quando a sessão mudar
  useEffect(() => {
    if (session) {
      fetchStockItems();
    }
  }, [session]);

  // Adicionar novo item ao estoque
  const addStockItem = async (item: Omit<StockItem, "id" | "lastUpdate">) => {
    try {
      let productId = item.productId;
      
      // Se não tem um produto associado e tem um nome, verificar se existe ou criar um novo
      if (!productId && item.name) {
        const { data: existingProduct, error: findError } = await supabase
          .from('produtos')
          .select('id')
          .eq('nome', item.name)
          .single();
        
        if (!findError && existingProduct) {
          productId = existingProduct.id;
        } else {
          // Criar um novo produto
          const { data: newProduct, error: createError } = await supabase
            .from('produtos')
            .insert({
              nome: item.name,
              preco: 0, // Preço padrão
              disponivel: true
            })
            .select()
            .single();
            
          if (!createError && newProduct) {
            productId = newProduct.id;
          }
        }
      }
      
      // Inserir item no estoque
      const { data, error } = await supabase
        .from('estoque')
        .insert({
          produto_id: productId,
          quantidade: item.quantity,
          unidade: item.unit,
          estoque_minimo: item.minStock,
          preco_compra: item.purchasePrice
        })
        .select()
        .single();

      if (error) {
        console.error("Erro ao adicionar item ao estoque:", error);
        toast.error("Erro ao adicionar item ao estoque");
        return;
      }

      toast.success(`Item "${item.name}" adicionado ao estoque`);
      await fetchStockItems(); // Recarregar lista de itens
    } catch (error) {
      console.error("Erro ao adicionar item ao estoque:", error);
      toast.error("Erro ao adicionar item ao estoque");
    }
  };

  // Atualizar item do estoque
  const updateStockItem = async (id: string, updatedItem: Partial<StockItem>) => {
    try {
      // Preparar dados para atualização
      const updateData: any = {};
      
      if (updatedItem.quantity !== undefined) updateData.quantidade = updatedItem.quantity;
      if (updatedItem.unit !== undefined) updateData.unidade = updatedItem.unit;
      if (updatedItem.minStock !== undefined) updateData.estoque_minimo = updatedItem.minStock;
      if (updatedItem.purchasePrice !== undefined) updateData.preco_compra = updatedItem.purchasePrice;
      
      // Sempre atualizar a data da última atualização
      updateData.ultima_atualizacao = new Date().toISOString();

      // Atualizar item no Supabase
      const { error } = await supabase
        .from('estoque')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error("Erro ao atualizar item do estoque:", error);
        toast.error("Erro ao atualizar item do estoque");
        return;
      }

      // Se o nome foi alterado, atualizar o nome do produto associado
      if (updatedItem.name !== undefined) {
        // Buscar o item de estoque para obter o ID do produto
        const { data: estoqueItem } = await supabase
          .from('estoque')
          .select('produto_id')
          .eq('id', id)
          .single();
          
        if (estoqueItem && estoqueItem.produto_id) {
          // Atualizar nome do produto
          const { error: prodError } = await supabase
            .from('produtos')
            .update({ nome: updatedItem.name })
            .eq('id', estoqueItem.produto_id);
            
          if (prodError) {
            console.error("Erro ao atualizar nome do produto:", prodError);
          }
        }
      }

      toast.success(`Item atualizado com sucesso`);
      await fetchStockItems(); // Recarregar lista de itens
    } catch (error) {
      console.error("Erro ao atualizar item do estoque:", error);
      toast.error("Erro ao atualizar item do estoque");
    }
  };

  // Deletar item do estoque
  const deleteStockItem = async (id: string) => {
    try {
      const itemName = stockItems.find(item => item.id === id)?.name;
      
      // Deletar item no Supabase
      const { error } = await supabase
        .from('estoque')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Erro ao deletar item do estoque:", error);
        toast.error("Erro ao deletar item do estoque");
        return;
      }

      if (itemName) {
        toast.success(`Item "${itemName}" removido do estoque`);
      }
      
      await fetchStockItems(); // Recarregar lista de itens
    } catch (error) {
      console.error("Erro ao deletar item do estoque:", error);
      toast.error("Erro ao deletar item do estoque");
    }
  };

  // Atualizar quantidade (adicionar ou subtrair)
  const updateQuantity = async (id: string, quantity: number, isIncrement: boolean) => {
    try {
      // Buscar item atual
      const { data: currentItem, error: getError } = await supabase
        .from('estoque')
        .select('*')
        .eq('id', id)
        .single();
        
      if (getError) {
        console.error("Erro ao buscar item do estoque:", getError);
        toast.error("Erro ao atualizar quantidade");
        return;
      }

      // Calcular nova quantidade
      const currentQuantity = Number(currentItem?.quantidade || 0);
      const newQuantity = isIncrement ? currentQuantity + quantity : Math.max(0, currentQuantity - quantity);
      
      // Atualizar no Supabase
      const { error } = await supabase
        .from('estoque')
        .update({
          quantidade: newQuantity,
          ultima_atualizacao: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error("Erro ao atualizar quantidade:", error);
        toast.error("Erro ao atualizar quantidade");
        return;
      }

      // Buscar informações do item para alertas
      const item = stockItems.find(item => item.id === id);
      
      // Se a quantidade for muito baixa, emitir um alerta
      if (item && newQuantity <= item.minStock) {
        toast.warning(`Estoque baixo de "${item.name}": ${newQuantity} ${item.unit} (mínimo: ${item.minStock})`);
      }
      
      // Recarregar dados
      await fetchStockItems();
    } catch (error) {
      console.error("Erro ao atualizar quantidade:", error);
      toast.error("Erro ao atualizar quantidade");
    }
  };

  // Verificar status do estoque (Ok, Baixo, Crítico, Esgotado)
  const getStockStatus = (item: StockItem) => {
    if (item.quantity <= 0) return { status: "Esgotado", color: "bg-red-500" };
    if (item.quantity < item.minStock) return { status: "Crítico", color: "bg-pdv-accent" };
    if (item.quantity < item.minStock * 1.5) return { status: "Baixo", color: "bg-amber-500" };
    return { status: "Ok", color: "bg-pdv-secondary" };
  };

  // Obter itens com estoque baixo
  const getLowStockItems = () => {
    return stockItems.filter(item => item.quantity < item.minStock);
  };

  // Obter categorias únicas
  const getStockCategories = () => {
    const categories = [...new Set(stockItems.map(item => item.category))];
    return ["Todos", ...categories];
  };

  // Calcular valor total do estoque
  const getStockValue = () => {
    return stockItems.reduce((total, item) => {
      return total + (item.quantity * (item.purchasePrice || 0));
    }, 0);
  };

  // Função para recarregar estoque manualmente
  const refreshStock = async () => {
    await fetchStockItems();
  };

  return (
    <StockContext.Provider value={{
      stockItems,
      loading,
      addStockItem,
      updateStockItem,
      deleteStockItem,
      updateQuantity,
      getStockStatus,
      getLowStockItems,
      getStockCategories,
      getStockValue,
      refreshStock
    }}>
      {children}
    </StockContext.Provider>
  );
};

// Hook personalizado para usar o contexto
export const useStock = () => {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error("useStock deve ser usado dentro de um StockProvider");
  }
  return context;
};
