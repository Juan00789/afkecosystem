// src/modules/products/components/products-management.tsx
'use client';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Edit, Archive, Upload } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Image from 'next/image';
import type { Product } from '../types';

const productSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  description: z.string().min(10, 'Description is too short'),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
});

type ProductFormData = z.infer<typeof productSchema>;

export function ProductsManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);

  const { control, handleSubmit, reset, setValue } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: '', description: '', price: 0, stock: 0 },
  });

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'products'), where('providerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(productsList);
    });
    return () => unsubscribe();
  }, [user]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProductImageFile(file);
      setProductImagePreview(URL.createObjectURL(file));
    }
  };

  const handleOpenDialog = (product: Product | null = null) => {
    setEditingProduct(product);
    setProductImageFile(null);
    if (product) {
        reset(product);
        setProductImagePreview(product.imageUrl || null);
    } else {
      reset({ name: '', description: '', price: 0, stock: 0 });
      setProductImagePreview(null);
    }
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: ProductFormData) => {
    if (!user) return;
    setIsLoading(true);

    try {
      let imageUrl = editingProduct?.imageUrl || '';
      if (productImageFile) {
        const imageRef = ref(storage, `product-images/${user.uid}-${Date.now()}-${productImageFile.name}`);
        const snapshot = await uploadBytes(imageRef, productImageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }
      
      const productData = { ...data, imageUrl };

      if (editingProduct) {
        const productRef = doc(db, 'products', editingProduct.id);
        await updateDoc(productRef, productData);
        toast({ title: 'Éxito', description: 'Producto actualizado.' });
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          providerId: user.uid,
        });
        toast({ title: 'Éxito', description: 'Nuevo producto añadido a tu almacén.' });
      }
      setIsDialogOpen(false);
      reset();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({ title: 'Error', description: 'No se pudo guardar el producto.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteDoc(doc(db, 'products', productId));
      toast({ title: 'Producto Eliminado', description: 'El producto ha sido eliminado de tu almacén.' });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar el producto.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mi Almacén de Productos</h1>
        <p className="text-muted-foreground">Gestiona el inventario de los productos que ofreces.</p>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Tu Catálogo de Productos</CardTitle>
                    <CardDescription>Añade, edita o elimina los productos de tu inventario.</CardDescription>
                </div>
                <DialogTrigger asChild>
                    <Button onClick={() => handleOpenDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Añadir Producto
                    </Button>
                </DialogTrigger>
            </div>
          </CardHeader>
          <CardContent>
             {products.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map((product) => (
                        <TableRow key={product.id}>
                            <TableCell className="font-medium flex items-center gap-4">
                               <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden">
                                 {product.imageUrl ? (
                                    <Image src={product.imageUrl} alt={product.name} width={48} height={48} className="object-cover" data-ai-hint="product"/>
                                 ) : (
                                    <Archive className="h-6 w-6 text-muted-foreground"/>
                                 )}
                               </div>
                               <div>
                                 {product.name}
                                 <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs">{product.description}</p>
                               </div>
                            </TableCell>
                            <TableCell>${product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            <TableCell>{product.stock}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(product)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                       <Button variant="ghost" size="icon">
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                        Esta acción eliminará permanentemente el producto "{product.name}".
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteProduct(product.id)}>
                                        Eliminar
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
                ) : (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">Tu almacén está vacío. ¡Añade tu primer producto!</p>
                </div>
             )}
          </CardContent>
        </Card>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Producto' : 'Añadir Nuevo Producto'}</DialogTitle>
            <DialogDescription>
              Completa los detalles de tu producto.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-6">
             <div className="space-y-2">
                <Label htmlFor="name">Nombre del Producto</Label>
                <Controller name="name" control={control} render={({ field }) => <Input id="name" {...field} />} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Controller name="description" control={control} render={({ field }) => <Textarea id="description" {...field} />} />
                {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="price">Precio ($)</Label>
                    <Controller name="price" control={control} render={({ field }) => <Input id="price" type="number" step="0.01" {...field} />} />
                    {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="stock">Cantidad en Stock</Label>
                    <Controller name="stock" control={control} render={({ field }) => <Input id="stock" type="number" {...field} />} />
                    {errors.stock && <p className="text-sm text-destructive">{errors.stock.message}</p>}
                </div>
            </div>
            <div className="space-y-2">
                <Label>Imagen del Producto (Opcional)</Label>
                <div className="flex items-center gap-4">
                    <div className="w-32 h-32 rounded border flex items-center justify-center bg-muted/50 overflow-hidden">
                        {productImagePreview ? (
                            <Image src={productImagePreview} alt="Product preview" width={128} height={128} className="object-cover w-full h-full" data-ai-hint="product"/>
                        ) : (
                            <span className="text-xs text-muted-foreground">Previsualización</span>
                        )}
                    </div>
                    <Input id="product-image-upload" type="file" accept="image/png, image/jpeg" onChange={handleFileChange} className="hidden" />
                    <Button type="button" variant="outline" onClick={() => document.getElementById('product-image-upload')?.click()}>
                        <Upload className="w-4 h-4 mr-2" />
                        {productImagePreview ? 'Cambiar Imagen' : 'Subir Imagen'}
                    </Button>
                </div>
            </div>
            <DialogFooter>
                 <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar Producto'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
