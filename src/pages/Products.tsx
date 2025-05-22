
import { useState, useRef } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Pencil, EyeIcon, Trash2, ImageIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProducts, Product } from "@/context/ProductContext";

// Mock data para categorias
const mockCategories = [
  { id: 1, name: "Lanches", productsCount: 12, active: true },
  { id: 2, name: "Porções", productsCount: 8, active: true },
  { id: 3, name: "Bebidas", productsCount: 15, active: true },
  { id: 4, name: "Combos", productsCount: 6, active: true },
  { id: 5, name: "Sobremesas", productsCount: 9, active: true },
  { id: 6, name: "Entradas", productsCount: 4, active: false },
  { id: 7, name: "Vegano", productsCount: 3, active: true },
];

const Products = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isNewProductDialogOpen, setIsNewProductDialogOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editIsUploading, setEditIsUploading] = useState(false);
  
  // Utilizando o contexto de produtos
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  
  // Refs para os inputs de arquivo (para resetá-los quando necessário)
  const newImageInputRef = useRef<HTMLInputElement>(null);
  const editImageInputRef = useRef<HTMLInputElement>(null);
  
  const [editedProduct, setEditedProduct] = useState<any>({
    name: "",
    category: "",
    price: 0,
    stock: 0,
    active: true,
    imageUrl: ""
  });
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: 0,
    stock: 0,
    active: true,
    imageUrl: ""
  });

  // Filter products based on search query and active filter
  const filteredProducts = products.filter(
    (product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = 
        activeFilter === "all" ||
        (activeFilter === "active" && product.active) ||
        (activeFilter === "inactive" && !product.active) ||
        (activeFilter === "out-of-stock" && product.stock === 0);
      
      return matchesSearch && matchesFilter;
    }
  );

  // Handler para o botão Novo Produto
  const handleNewProduct = () => {
    setNewProduct({
      name: "",
      category: "",
      price: 0,
      stock: 0,
      active: true,
      imageUrl: ""
    });
    setImagePreview(null);
    setIsNewProductDialogOpen(true);
    toast.info("Novo produto", {
      description: "Adicionando um novo produto ao catálogo",
    });
  };

  // Handler para upload de imagem para novo produto
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar o tipo de arquivo
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/avif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Formato de imagem não suportado. Use PNG, JPG, JPEG, WEBP ou AVIF.");
      if (newImageInputRef.current) {
        newImageInputRef.current.value = '';
      }
      return;
    }

    // Simular upload (em um app real, isso enviaria para um servidor)
    setIsUploading(true);

    // Criar URL para preview da imagem
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const imageUrl = event.target.result as string;
        setImagePreview(imageUrl);
        setNewProduct({
          ...newProduct,
          imageUrl: imageUrl
        });
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handler para upload de imagem para edição de produto
  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar o tipo de arquivo
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/avif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Formato de imagem não suportado. Use PNG, JPG, JPEG, WEBP ou AVIF.");
      if (editImageInputRef.current) {
        editImageInputRef.current.value = '';
      }
      return;
    }

    // Simular upload (em um app real, isso enviaria para um servidor)
    setEditIsUploading(true);

    // Criar URL para preview da imagem
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const imageUrl = event.target.result as string;
        setEditImagePreview(imageUrl);
        setEditedProduct({
          ...editedProduct,
          imageUrl: imageUrl
        });
        setEditIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handler para salvar novo produto
  const handleSaveNewProduct = () => {
    addProduct({
      name: newProduct.name,
      category: newProduct.category,
      price: newProduct.price,
      stock: newProduct.stock,
      active: newProduct.active,
      imageUrl: newProduct.imageUrl
    });
    
    setIsNewProductDialogOpen(false);
    setImagePreview(null);
  };

  // Handler para o botão de Editar
  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setEditedProduct({
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      active: product.active,
      imageUrl: product.imageUrl || ""
    });
    setEditImagePreview(product.imageUrl || null);
    setIsEditDialogOpen(true);
    toast.info("Editar produto", {
      description: `Editando produto: ${product.name}`,
    });
  };

  // Handler para salvar edição de produto
  const handleSaveEdit = () => {
    if (!selectedProduct) return;
    
    updateProduct(selectedProduct.id, editedProduct);
    setIsEditDialogOpen(false);
  };

  // Handler para o botão de Visualizar
  const handleView = (product: Product) => {
    setSelectedProduct(product);
    setIsViewDialogOpen(true);
    toast.info("Visualizar produto", {
      description: `Visualizando detalhes do produto: ${product.name}`,
    });
  };

  // Handler para o botão de Excluir
  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  // Handler para confirmar exclusão
  const handleConfirmDelete = () => {
    if (selectedProduct) {
      deleteProduct(selectedProduct.id);
      setIsDeleteDialogOpen(false);
    }
  };

  // Handler para mudança de campo de edição
  const handleEditFieldChange = (field: string, value: any) => {
    setEditedProduct({
      ...editedProduct,
      [field]: value
    });
  };

  // Handler para mudança de campo do novo produto
  const handleNewProductFieldChange = (field: string, value: any) => {
    setNewProduct({
      ...newProduct,
      [field]: value
    });
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Produtos" subtitle="Gerenciamento de Produtos" />
        <main className="flex-1 p-6 overflow-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-2 w-1/3">
              <Input
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                    </svg>
                    {activeFilter === "all" && "Todos"}
                    {activeFilter === "active" && "Ativos"}
                    {activeFilter === "inactive" && "Inativos"}
                    {activeFilter === "out-of-stock" && "Sem estoque"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setActiveFilter("all")}>
                    Todos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveFilter("active")}>
                    Ativos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveFilter("inactive")}>
                    Inativos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveFilter("out-of-stock")}>
                    Sem estoque
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={handleNewProduct}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Novo Produto
              </Button>
            </div>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  {/* Removido o cabeçalho para a coluna ID */}
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Estoque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    {/* Removida a célula que mostra o ID */}
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded bg-muted mr-2 flex items-center justify-center text-muted-foreground overflow-hidden">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-8 h-8 object-cover" />
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 20V10m-6 10V6M6 20v-4"></path>
                            </svg>
                          )}
                        </div>
                        <span>{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right">R$ {product.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      {product.stock === 0 ? (
                        <span className="text-pdv-danger font-medium">{product.stock}</span>
                      ) : product.stock < 10 ? (
                        <span className="text-pdv-accent font-medium">{product.stock}</span>
                      ) : (
                        <span>{product.stock}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={product.active ? "bg-pdv-secondary" : "bg-muted"}>
                        {product.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEdit(product)}
                          title="Editar produto"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleView(product)}
                          title="Visualizar produto"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-pdv-danger"
                          onClick={() => handleDeleteClick(product)}
                          title="Excluir produto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </main>
      </div>

      {/* Diálogo de adição de novo produto */}
      <Dialog open={isNewProductDialogOpen} onOpenChange={setIsNewProductDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Produto</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para adicionar um novo produto ao catálogo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Área para upload de imagem */}
            <div className="flex justify-center mb-2">
              <div className="relative">
                <Avatar className="h-24 w-24 cursor-pointer border-2 border-dashed border-gray-300 p-1">
                  <AvatarImage src={imagePreview || ""} />
                  <AvatarFallback className="text-muted-foreground bg-muted">
                    <ImageIcon className="h-12 w-12" />
                  </AvatarFallback>
                </Avatar>
                <Input
                  ref={newImageInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,.avif"
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  disabled={isUploading}
                />
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Clique na imagem para anexar uma foto (PNG, JPG, JPEG, WEBP, AVIF)
            </p>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right font-medium">Nome</label>
              <Input 
                className="col-span-3" 
                value={newProduct.name} 
                onChange={(e) => handleNewProductFieldChange("name", e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right font-medium">Categoria</label>
              <Select 
                value={newProduct.category}
                onValueChange={(value) => handleNewProductFieldChange("category", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {mockCategories
                    .filter(category => category.active)
                    .map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right font-medium">Preço (R$)</label>
              <Input 
                type="number" 
                step="0.01" 
                className="col-span-3" 
                value={newProduct.price} 
                onChange={(e) => handleNewProductFieldChange("price", parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right font-medium">Estoque</label>
              <Input 
                type="number" 
                className="col-span-3" 
                value={newProduct.stock} 
                onChange={(e) => handleNewProductFieldChange("stock", parseInt(e.target.value) || 0)}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right font-medium">Status</label>
              <div className="col-span-3 flex items-center space-x-2">
                <input
                  type="checkbox" 
                  checked={newProduct.active}
                  onChange={(e) => handleNewProductFieldChange("active", e.target.checked)}
                  className="h-4 w-4"
                />
                <span>Ativo</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewProductDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveNewProduct}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de edição de produto */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
            <DialogDescription>
              Faça as alterações desejadas no produto e clique em Salvar para aplicá-las.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Área para upload de imagem */}
            <div className="flex justify-center mb-2">
              <div className="relative">
                <Avatar className="h-24 w-24 cursor-pointer border-2 border-dashed border-gray-300 p-1">
                  <AvatarImage src={editImagePreview || ""} />
                  <AvatarFallback className="text-muted-foreground bg-muted">
                    <ImageIcon className="h-12 w-12" />
                  </AvatarFallback>
                </Avatar>
                <Input
                  ref={editImageInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,.avif"
                  onChange={handleEditImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  disabled={editIsUploading}
                />
                {editIsUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Clique na imagem para anexar uma foto (PNG, JPG, JPEG, WEBP, AVIF)
            </p>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right font-medium">Nome</label>
              <Input 
                className="col-span-3" 
                value={editedProduct.name} 
                onChange={(e) => handleEditFieldChange("name", e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right font-medium">Categoria</label>
              <Select 
                value={editedProduct.category}
                onValueChange={(value) => handleEditFieldChange("category", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {mockCategories
                    .filter(category => category.active)
                    .map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right font-medium">Preço (R$)</label>
              <Input 
                type="number" 
                step="0.01" 
                className="col-span-3" 
                value={editedProduct.price} 
                onChange={(e) => handleEditFieldChange("price", parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right font-medium">Estoque</label>
              <Input 
                type="number" 
                className="col-span-3" 
                value={editedProduct.stock} 
                onChange={(e) => handleEditFieldChange("stock", parseInt(e.target.value) || 0)}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right font-medium">Status</label>
              <div className="col-span-3 flex items-center space-x-2">
                <input
                  type="checkbox" 
                  checked={editedProduct.active}
                  onChange={(e) => handleEditFieldChange("active", e.target.checked)}
                  className="h-4 w-4"
                />
                <span>Ativo</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de visualização de produto */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Produto</DialogTitle>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="grid gap-4 py-4">
              {/* Exibir a imagem do produto se houver */}
              {selectedProduct.imageUrl && (
                <div className="flex justify-center mb-4">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={selectedProduct.imageUrl} alt={selectedProduct.name} />
                    <AvatarFallback className="text-muted-foreground bg-muted">
                      <ImageIcon className="h-16 w-16" />
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
              
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right font-medium">ID:</span>
                <span className="col-span-3">{selectedProduct.id}</span>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right font-medium">Nome:</span>
                <span className="col-span-3">{selectedProduct.name}</span>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right font-medium">Categoria:</span>
                <span className="col-span-3">{selectedProduct.category}</span>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right font-medium">Preço:</span>
                <span className="col-span-3">R$ {selectedProduct.price.toFixed(2)}</span>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right font-medium">Estoque:</span>
                <span className="col-span-3">{selectedProduct.stock}</span>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right font-medium">Status:</span>
                <span className="col-span-3">
                  <Badge className={selectedProduct.active ? "bg-pdv-secondary" : "bg-muted"}>
                    {selectedProduct.active ? "Ativo" : "Inativo"}
                  </Badge>
                </span>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o produto "{selectedProduct?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-pdv-danger hover:bg-pdv-danger/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Products;
