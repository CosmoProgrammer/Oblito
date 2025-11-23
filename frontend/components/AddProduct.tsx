import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react"; // Import Loader2

interface Category {
  id: string;
  name: string;
}

const API_BASE_URL = "http://localhost:8000";

export function AddProduct({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    images: [] as File[],
    isProxyItem: false,
    categories: [] as string[], // Now stores category IDs
    stockQuantity: "",
  });

  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [fetchingCategories, setFetchingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      setFetchingCategories(true);
      try {
        const res = await fetch(`${API_BASE_URL}/categories`);
        if (!res.ok) throw new Error("Failed to fetch categories");
        const data = await res.json();
        setAvailableCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to load product categories.");
      } finally {
        setFetchingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({ ...formData, images: Array.from(e.target.files) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    toast.loading("Adding product...");

    if (formData.categories.length === 0) {
        toast.dismiss();
        toast.error("Please select at least one category.");
        setIsSubmitting(false);
        return;
    }

    try {
        const imageUrls = await Promise.all(
            formData.images.map(async (file) => {
                // 1. Get presigned URL
                const presignedUrlRes = await fetch(
                    `${API_BASE_URL}/products/upload-url?fileName=${file.name}&fileType=${file.type}`,
                    { credentials: 'include' }
                );
                if (!presignedUrlRes.ok) {
                    throw new Error(`Failed to get presigned URL for ${file.name}`);
                }
                const { uploadUrl, finalUrl } = await presignedUrlRes.json();

                // 2. Upload to S3
                await fetch(uploadUrl, {
                    method: 'PUT',
                    body: file,
                    headers: { 'Content-Type': file.type },
                });

                return finalUrl;
            })
        );


        const payload = {
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            stockQuantity: parseInt(formData.stockQuantity),
            categoryId: formData.categories[0], // Send category ID
            imageUrls: imageUrls,
        };

        const res = await fetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || "Failed to create product.");
        }

        toast.dismiss();
        toast.success("✅ Product added successfully!");
        onClose();

    } catch (error: any) {
        console.error("Product creation error:", error);
        toast.dismiss();
        toast.error(error.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  const toggleCategory = (categoryId: string) => { // Takes category ID
    setFormData((prev) => {
      const newCats = prev.categories.includes(categoryId)
        ? prev.categories.filter((id) => id !== categoryId)
        : [...prev.categories, categoryId];
      return { ...prev, categories: newCats };
    });
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto p-4">
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add New Product</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter product name"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the product"
              required
            />
          </div>

          <div>
            <Label htmlFor="price">Price (₹)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              placeholder="Enter price"
              required
              min="0"
              step="0.01"
            />
          </div>


           <div>
            <Label htmlFor="stockQuantity">Stock Quantity</Label>
            <Input
              id="stockQuantity"
              name="stockQuantity"
              type="number"
              value={formData.stockQuantity}
              onChange={handleChange}
              placeholder="Enter qty in stock"
              required
              min="0"
              step="1"
            />
          </div>
          
           {/* --- Category Checkboxes --- */}
          <div>
            <Label className="mb-2 block">Categories</Label>
            {fetchingCategories ? (
                <div className="flex items-center justify-center p-4"><Loader2 className="animate-spin" /></div>
            ) : (
                <div className="grid grid-cols-2 gap-2">
                  {availableCategories.map((cat) => (
                    <div key={cat.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={cat.id}
                        checked={formData.categories.includes(cat.id)}
                        onCheckedChange={() => toggleCategory(cat.id)}
                      />
                      <Label htmlFor={cat.id} className="text-sm font-normal">
                        {cat.name}
                      </Label>
                    </div>
                  ))}
                </div>
            )}
          </div>

          {/* --- Proxy Item Checkbox --- */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isProxyItem"
              checked={formData.isProxyItem}
              onCheckedChange={(checked : boolean | "indeterminate" | undefined) =>
                setFormData({ ...formData, isProxyItem: checked as boolean })
              }
            />
            <Label htmlFor="isProxyItem">Is Proxy Item</Label>
          </div>


          <div>
            <Label>Product Images</Label>
            <Input
              type="file"
              multiple
              onChange={handleImageChange}
              accept="image/*"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#febd69] hover:bg-[#f5a623] text-black" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Product'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
    </div>
  );
}
