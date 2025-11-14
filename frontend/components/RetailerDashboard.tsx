"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {useState} from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ShoppingBag, DollarSign, TrendingUp, Package, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AddProduct } from "./AddProduct";

// Sample sales data for the chart
const salesData = [
  { month: "Jan", sales: 4000 },
  { month: "Feb", sales: 3000 },
  { month: "Mar", sales: 5000 },
  { month: "Apr", sales: 4500 },
  { month: "May", sales: 6000 },
  { month: "Jun", sales: 7000 },
];

const dummyInventory = [
  { name: "Wireless Mouse", stock: 24, id:"1"},
  { name: "Bluetooth Headphones", stock: 8, id:"2" },
  { name: "Smart Watch", stock: 42, id:"3" },
  { name: "Keyboard", stock: 12, id:"4" },
  { name: "Webcam", stock: 19, id:"5"},
];

function handlePlaceOrder(productId: string, productName:string)
{
   alert(`Order placed with wholesaler for product ID: ${productId} and product name: ${productName}`);
}


export default function RetailerDashboard() {
    const [open, setOpen] = useState(false);
    const [inventory, setInventory] = useState(dummyInventory);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* --- TOP NAVBAR --- */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Retailer Dashboard</h1>

        <div className="flex items-center gap-4">
            <Button
            className="bg-[#febd69] hover:bg-[#f5a623] text-black font-medium"
            onClick={() => setOpen(true)}
          >
            + Add Product
          </Button>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="Search products..." className="pl-9 w-64" />
          </div>
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="Retailer" />
            <AvatarFallback>RT</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* --- SUMMARY CARDS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Total Sales</CardTitle>
            <DollarSign className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">$24,320</p>
            <p className="text-sm text-gray-500">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Orders</CardTitle>
            <ShoppingBag className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">1,203</p>
            <p className="text-sm text-gray-500">+8% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Products</CardTitle>
            <Package className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">438</p>
            <p className="text-sm text-gray-500">+5 new added</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Growth</CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">+18.4%</p>
            <p className="text-sm text-gray-500">This quarter</p>
          </CardContent>
        </Card>
      </div>

      {/* --- ANALYTICS + TABS --- */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Recent Orders</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Sales Analytics</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sales" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2">Order ID</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: "#9823", date: "Oct 31", name: "Alice", total: "$120", status: "Delivered" },
                    { id: "#9824", date: "Nov 1", name: "Ravi", total: "$89", status: "Pending" },
                    { id: "#9825", date: "Nov 2", name: "Sonia", total: "$300", status: "Shipped" },
                  ].map((order, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="py-2">{order.id}</td>
                      <td>{order.date}</td>
                      <td>{order.name}</td>
                      <td>{order.total}</td>
                      <td>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            order.status === "Delivered"
                              ? "bg-green-100 text-green-600"
                              : order.status === "Pending"
                              ? "bg-yellow-100 text-yellow-600"
                              : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Status</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventory
              .map((item, i) => (
                <Card key={i} className="p-4">
                  <CardTitle className="text-sm">{item.name}</CardTitle>
                  <p
                    className={`mt-2 font-medium ${
                      item.stock < 10 ? "text-red-500" : "text-green-600"
                    }`}
                  >
                    {item.stock} in stock
                  </p>
                  <Button
                  onClick={() => handlePlaceOrder(item.id, item.name)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Place Order from Wholesaler
                </Button>
                </Card>
              ))}

            </CardContent>
          </Card>

        </TabsContent>
      </Tabs>

        {/* --- ADD PRODUCT DIALOG --- */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
          </DialogHeader>
          <AddProduct onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>

    </div>
  );
}
