"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";


const categories=['Electronics', 'Books', 'Clothing', 'Home', 'Toys'];

export function AddProduct({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    images: ["", "", "", "", ""],
    isProxyItem: false,
    categories: [] as string[],
    stockQuantity: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData({ ...formData, images: newImages });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Simulate product upload
    console.log("Product added:", formData);
    toast.success("✅ Product added successfully!");
    onClose();
  };

  const toggleCategory = (category: string) => {
    setFormData((prev) => {
      const newCats = prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category];
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
            <Label htmlFor="price">Price ($)</Label>
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
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <div key={cat} className="flex items-center space-x-2">
                  <Checkbox
                    id={cat}
                    checked={formData.categories.includes(cat)}
                    onCheckedChange={() => toggleCategory(cat)}
                  />
                  <Label htmlFor={cat} className="text-sm font-normal">
                    {cat}
                  </Label>
                </div>
              ))}
            </div>
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
            <Label>Product Images (5 URLs)</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {formData.images.map((img, i) => (
                <Input
                  key={i}
                  type="file"
                  placeholder={`Image ${i + 1} URL`}
                  value={img}
                  onChange={(e) => handleImageChange(i, e.target.value)}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#febd69] hover:bg-[#f5a623] text-black">
              Add Product
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
    </div>
  );
}
