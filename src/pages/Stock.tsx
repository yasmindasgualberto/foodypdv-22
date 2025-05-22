
import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddStockItemDialog } from "@/components/stock/AddStockItemDialog";
import { EditStockItemDialog } from "@/components/stock/EditStockItemDialog";
import { UpdateQuantityDialog } from "@/components/stock/UpdateQuantityDialog";
import { DeleteConfirmDialog } from "@/components/stock/DeleteConfirmDialog";
import { StockItemDetailsDialog } from "@/components/stock/StockItemDetailsDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStock, StockItem } from "@/context/StockContext";
import { toast } from "sonner";

const Stock = () => {
  const { stockItems, addStockItem, updateStockItem, updateQuantity, deleteStockItem, getStockStatus, getStockCategories, getStockValue } = useStock();
  
  const [filter, setFilter] = useState<string>("Todos");
  const [search, setSearch] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [isQuantityDialogOpen, setIsQuantityDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);

  // Dados para os cards informativos
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    categories: 0,
    totalValue: 0
  });

  useEffect(() => {
    // Calcular estatísticas
    const totalItems = stockItems.length;
    const lowStockItems = stockItems.filter(item => item.quantity <= item.minStock).length;
    const uniqueCategories = new Set(stockItems.map(item => item.category)).size;
    const totalValue = stockItems.reduce((sum, item) => sum + (item.quantity * (item.purchasePrice || 0)), 0);
    
    setStats({
      totalItems,
      lowStockItems,
      categories: uniqueCategories,
      totalValue
    });
  }, [stockItems]);

  // Filtragem de itens
  const filteredItems = stockItems.filter(item => {
    // Filtro por categoria
    if (filter !== "Todos" && item.category !== filter) return false;
    
    // Filtro por pesquisa (nome)
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    
    return true;
  });

  const handleAddItem = (newItem: Omit<StockItem, "id" | "lastUpdate">) => {
    // Esta função é usada no contexto
    addStockItem(newItem);
    toast.success("Item adicionado ao estoque com sucesso!");
  };

  const handleEditItem = (id: string, updatedItem: Partial<StockItem>) => {
    updateStockItem(id, updatedItem);
    setIsEditDialogOpen(false);
    toast.success("Item atualizado com sucesso!");
  };

  const handleUpdateQuantity = (id: string, quantity: number, isIncrement: boolean) => {
    updateQuantity(id, quantity, isIncrement);
    setIsQuantityDialogOpen(false);
    
    if (isIncrement) {
      toast.success(`Quantidade adicionada: ${quantity} unidades`);
    } else {
      toast.success(`Quantidade removida: ${quantity} unidades`);
    }
  };

  const handleDeleteItem = (id: string) => {
    deleteStockItem(id);
    setIsDeleteDialogOpen(false);
    toast.success("Item removido do estoque!");
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Estoque" subtitle="Gerenciamento de Inventário" />
        <main className="flex-1 p-6 overflow-auto">
          {/* Cards de resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
              <CardContent className="p-6">
                <div className="text-sm font-medium text-muted-foreground mb-1">Total de Itens</div>
                <div className="text-2xl font-bold">{stats.totalItems}</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
              <CardContent className="p-6">
                <div className="text-sm font-medium text-muted-foreground mb-1">Estoque Baixo</div>
                <div className="text-2xl font-bold">{stats.lowStockItems}</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
              <CardContent className="p-6">
                <div className="text-sm font-medium text-muted-foreground mb-1">Categorias</div>
                <div className="text-2xl font-bold">{stats.categories}</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20">
              <CardContent className="p-6">
                <div className="text-sm font-medium text-muted-foreground mb-1">Valor Total</div>
                <div className="text-2xl font-bold">R$ {stats.totalValue.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>
          
          {/* Barra de ações */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="w-full sm:w-64">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todas as categorias</SelectItem>
                  {getStockCategories().map((category) => (
                    category !== "Todos" && <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={() => setIsAddDialogOpen(true)}>
              Adicionar Item
            </Button>
          </div>
          
          {/* Tabela de itens */}
          <div className="bg-white rounded-md shadow">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Mín.</TableHead>
                  <TableHead>Preço Custo</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum item encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.id.substring(0, 8)}...</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className={`mr-2 ${item.quantity <= item.minStock ? 'text-red-500 font-bold' : ''}`}>
                            {item.quantity}
                          </span>
                          {item.quantity <= item.minStock && (
                            <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                              Baixo
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.minStock}</TableCell>
                      <TableCell>R$ {(item.purchasePrice || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item);
                              setIsDetailsDialogOpen(true);
                            }}
                          >
                            Detalhes
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item);
                              setIsQuantityDialogOpen(true);
                            }}
                          >
                            Qtd
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            Editar
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setSelectedItem(item);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            Excluir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </main>
      </div>
      
      {/* Diálogos */}
      <AddStockItemDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddItem}
      />
      
      <EditStockItemDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        item={selectedItem}
        onSubmit={handleEditItem}
      />
      
      <UpdateQuantityDialog
        open={isQuantityDialogOpen}
        onOpenChange={setIsQuantityDialogOpen}
        item={selectedItem}
        onUpdate={handleUpdateQuantity}
      />
      
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        item={selectedItem}
        onConfirm={handleDeleteItem}
      />
      
      <StockItemDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        item={selectedItem}
        getStockStatus={getStockStatus}
      />
    </div>
  );
};

export default Stock;
