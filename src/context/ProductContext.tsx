
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Produto } from "@/types/supabase";
import { useAuth } from "./AuthContext";

// Definição dos tipos
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  active: boolean;
  imageUrl: string;
}

interface ProductContextType {
  products: Product[];
  addProduct: (product: Omit<Product, "id">) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProductById: (id: string) => Promise<Product | undefined>;
  getProductCategories: () => Promise<string[]>;
  loading: boolean;
  refreshProducts: () => Promise<void>;
}

// Criação do contexto
const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  // Função para converter dados do Supabase para o formato do aplicativo
  const mapSupabaseToProduct = (produto: Produto, categorias: any[]): Product => {
    // Encontrar o nome da categoria pelo ID
    const categoria = categorias.find(cat => cat.id === produto.categoria_id);
    const categoryName = categoria ? categoria.nome : "Sem Categoria";

    return {
      id: produto.id,
      name: produto.nome,
      category: categoryName,
      price: Number(produto.preco),
      stock: 0, // Será preenchido depois com base nos dados de estoque
      active: produto.disponivel,
      imageUrl: produto.imagem_url || "",
    };
  };

  // Carregar produtos do Supabase
  const fetchProducts = async () => {
    try {
      setLoading(true);

      // Buscar categorias primeiro para mapear os IDs para nomes
      const { data: categorias, error: catError } = await supabase
        .from('categorias')
        .select('*');

      if (catError) {
        console.error("Erro ao buscar categorias:", catError);
        toast.error("Erro ao carregar categorias");
        return;
      }

      // Buscar produtos
      const { data: produtos, error: prodError } = await supabase
        .from('produtos')
        .select('*');

      if (prodError) {
        console.error("Erro ao buscar produtos:", prodError);
        toast.error("Erro ao carregar produtos");
        return;
      }

      // Buscar dados do estoque
      const { data: estoqueItems, error: estError } = await supabase
        .from('estoque')
        .select('*');

      if (estError) {
        console.error("Erro ao buscar estoque:", estError);
      }

      // Mapear produtos com dados de estoque
      const mappedProducts = produtos.map(produto => {
        const product = mapSupabaseToProduct(produto, categorias || []);
        
        // Adicionar dados de estoque se disponíveis
        if (estoqueItems) {
          const estoqueItem = estoqueItems.find(item => item.produto_id === produto.id);
          if (estoqueItem) {
            product.stock = Number(estoqueItem.quantidade || 0);
          }
        }
        
        return product;
      });

      setProducts(mappedProducts);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      toast.error("Erro ao carregar dados dos produtos");
    } finally {
      setLoading(false);
    }
  };

  // Carregar produtos quando o componente montar ou quando a sessão mudar
  useEffect(() => {
    if (session) {
      fetchProducts();
    }
  }, [session]);

  // Adicionar novo produto
  const addProduct = async (product: Omit<Product, "id">) => {
    try {
      // Obter o ID da categoria
      const { data: categoryData, error: catError } = await supabase
        .from('categorias')
        .select('id')
        .eq('nome', product.category)
        .single();

      if (catError && catError.code !== 'PGRST116') {
        console.error("Erro ao buscar categoria:", catError);
        toast.error("Erro ao buscar categoria");
        return;
      }

      const categoria_id = categoryData?.id || null;

      // Inserir novo produto no Supabase
      const { data, error } = await supabase
        .from('produtos')
        .insert({
          nome: product.name,
          descricao: "",
          preco: product.price,
          imagem_url: product.imageUrl,
          categoria_id,
          disponivel: product.active,
          destaque: false
        })
        .select()
        .single();

      if (error) {
        console.error("Erro ao adicionar produto:", error);
        toast.error("Erro ao adicionar produto");
        return;
      }

      // Se o produto foi adicionado com sucesso, adicionar entrada no estoque
      if (data) {
        const { error: estError } = await supabase
          .from('estoque')
          .insert({
            produto_id: data.id,
            quantidade: product.stock,
            unidade: 'un',
            estoque_minimo: 0
          });

        if (estError) {
          console.error("Erro ao adicionar estoque:", estError);
          toast.error("Produto adicionado, mas houve erro ao registrar estoque");
        }
      }

      toast.success(`Produto "${product.name}" adicionado com sucesso`);
      await fetchProducts(); // Recarregar lista de produtos
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      toast.error("Erro ao adicionar produto");
    }
  };

  // Atualizar produto
  const updateProduct = async (id: string, updatedProduct: Partial<Product>) => {
    try {
      // Se a categoria foi atualizada, obter o ID da nova categoria
      let categoria_id = undefined;
      
      if (updatedProduct.category) {
        const { data: categoryData, error: catError } = await supabase
          .from('categorias')
          .select('id')
          .eq('nome', updatedProduct.category)
          .single();

        if (!catError) {
          categoria_id = categoryData?.id;
        }
      }

      // Preparar dados para atualização
      const updateData: any = {};
      
      if (updatedProduct.name !== undefined) updateData.nome = updatedProduct.name;
      if (updatedProduct.price !== undefined) updateData.preco = updatedProduct.price;
      if (updatedProduct.imageUrl !== undefined) updateData.imagem_url = updatedProduct.imageUrl;
      if (categoria_id !== undefined) updateData.categoria_id = categoria_id;
      if (updatedProduct.active !== undefined) updateData.disponivel = updatedProduct.active;

      // Atualizar produto no Supabase
      const { error } = await supabase
        .from('produtos')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error("Erro ao atualizar produto:", error);
        toast.error("Erro ao atualizar produto");
        return;
      }

      // Se o estoque foi atualizado, atualizar tabela de estoque
      if (updatedProduct.stock !== undefined) {
        // Verificar se já existe um registro de estoque para este produto
        const { data: estoqueExistente, error: checkError } = await supabase
          .from('estoque')
          .select('*')
          .eq('produto_id', id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error("Erro ao verificar estoque:", checkError);
        }

        if (estoqueExistente) {
          // Atualizar registro existente
          const { error: estError } = await supabase
            .from('estoque')
            .update({
              quantidade: updatedProduct.stock,
              ultima_atualizacao: new Date().toISOString()
            })
            .eq('produto_id', id);

          if (estError) {
            console.error("Erro ao atualizar estoque:", estError);
          }
        } else {
          // Criar novo registro de estoque
          const { error: estError } = await supabase
            .from('estoque')
            .insert({
              produto_id: id,
              quantidade: updatedProduct.stock,
              unidade: 'un',
              estoque_minimo: 0
            });

          if (estError) {
            console.error("Erro ao criar estoque:", estError);
          }
        }
      }

      toast.success(`Produto atualizado com sucesso`);
      await fetchProducts(); // Recarregar lista de produtos
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      toast.error("Erro ao atualizar produto");
    }
  };

  // Deletar produto
  const deleteProduct = async (id: string) => {
    try {
      const productName = products.find(product => product.id === id)?.name;
      
      // Deletar produto no Supabase
      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Erro ao deletar produto:", error);
        toast.error("Erro ao deletar produto");
        return;
      }

      // Também deletar registros de estoque associados
      const { error: estError } = await supabase
        .from('estoque')
        .delete()
        .eq('produto_id', id);

      if (estError) {
        console.error("Erro ao deletar estoque:", estError);
      }

      toast.success(`Produto "${productName}" removido com sucesso`);
      await fetchProducts(); // Recarregar lista de produtos
    } catch (error) {
      console.error("Erro ao deletar produto:", error);
      toast.error("Erro ao deletar produto");
    }
  };

  // Obter produto por ID
  const getProductById = async (id: string) => {
    // Primeiro verificar se já está carregado localmente
    const localProduct = products.find(product => product.id === id);
    if (localProduct) return localProduct;

    try {
      // Buscar do Supabase se não estiver em cache
      const { data: produto, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error("Erro ao buscar produto:", error);
        return undefined;
      }

      // Buscar categorias para mapear o ID para nome
      const { data: categorias } = await supabase
        .from('categorias')
        .select('*');

      // Buscar dados de estoque
      const { data: estoqueItem } = await supabase
        .from('estoque')
        .select('*')
        .eq('produto_id', id)
        .single();

      // Mapear para o formato do aplicativo
      const mappedProduct = mapSupabaseToProduct(produto, categorias || []);
      if (estoqueItem) {
        mappedProduct.stock = Number(estoqueItem.quantidade || 0);
      }

      return mappedProduct;
    } catch (error) {
      console.error("Erro ao buscar produto por ID:", error);
      return undefined;
    }
  };

  // Obter categorias únicas
  const getProductCategories = async () => {
    try {
      // Buscar todas as categorias do Supabase
      const { data: categorias, error } = await supabase
        .from('categorias')
        .select('nome')
        .eq('ativa', true);

      if (error) {
        console.error("Erro ao buscar categorias:", error);
        return ["Todos"];
      }

      // Mapear para array de strings de nomes
      const categoryNames = categorias?.map(cat => cat.nome) || [];
      
      // Adicionar "Todos" no início
      return ["Todos", ...categoryNames];
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
      return ["Todos"];
    }
  };

  // Função para recarregar produtos manualmente
  const refreshProducts = async () => {
    await fetchProducts();
  };

  return (
    <ProductContext.Provider value={{
      products,
      addProduct,
      updateProduct,
      deleteProduct,
      getProductById,
      getProductCategories,
      loading,
      refreshProducts
    }}>
      {children}
    </ProductContext.Provider>
  );
};

// Hook personalizado para usar o contexto
export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProducts deve ser usado dentro de um ProductProvider");
  }
  return context;
};
