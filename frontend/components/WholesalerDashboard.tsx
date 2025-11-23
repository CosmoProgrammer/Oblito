"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, Fragment } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ShoppingBag, DollarSign, Clock, Package, Search, ChevronDown, ChevronRight, PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AddProduct } from "./AddProduct";
import { toast } from "sonner";

// Types
interface OrderItem {
  id: string;
  quantity: number;
  priceAtPurchase: string;
  status: string;
  orderId: string;
  warehouseInventory: {
    product: {
      name: string;
      imageURLs: string[];
    }
  }
}

interface DeliveryAddress {
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface Order {
  id: string;
  createdAt: string;
  customer: {
    firstName: string;
    lastName: string;
  };
  totalAmount: string;
  status: string;
  orderItems: OrderItem[];
  deliveryAddress: DeliveryAddress;
}

interface InventoryItem {
  id: string;
  name: string;
  stock: string;
  price: string;
  productId: string;
}

const API_BASE_URL = "http://localhost:8000";

function getStatusColorClass(status: string) {
    switch (status) {
        case 'delivered':
        case 'returned':
            return 'bg-green-100 text-green-600 border-green-200';
        case 'shipped': return 'bg-indigo-100 text-indigo-600 border-indigo-200';
        case 'processed': return 'bg-blue-100 text-blue-600 border-blue-200';
        case 'pending': return 'bg-yellow-100 text-yellow-600 border-yellow-200';
        case 'cancelled': return 'bg-red-100 text-red-600 border-red-200';
        default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
}

export default function WholesalerDashboard() {
    const [addProductOpen, setAddProductOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    
    const [orders, setOrders] = useState<Order[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
    const [productToRestock, setProductToRestock] = useState<InventoryItem | null>(null);
    const [restockQuantity, setRestockQuantity] = useState(1);
    const [userProfile, setUserProfile] = useState<any>(null); // State to store user profile

    const [summaryStats, setSummaryStats] = useState({
        totalSales: 0,
        orderCount: 0,
        productCount: 0,
        pendingOrders: 0,
    });
    const [salesChartData, setSalesChartData] = useState<{ month: string; sales: number }[]>([]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [ordersRes, inventoryRes, userProfileRes] = await Promise.all([
                fetch(`${API_BASE_URL}/seller-orders`, { credentials: 'include' }),
                fetch(`${API_BASE_URL}/inventory`, { credentials: 'include' }),
                fetch(`${API_BASE_URL}/me`, { credentials: 'include' }) // Fetch user profile
            ]);

            if (!ordersRes.ok || !inventoryRes.ok || !userProfileRes.ok) {
                throw new Error('Failed to fetch dashboard data');
            }

            const ordersData: Order[] = await ordersRes.json();
            const inventoryData: { products: InventoryItem[] } = await inventoryRes.json();
            const userProfileData = await userProfileRes.json(); // Get user profile data
            
            setOrders(ordersData);
            setInventory(inventoryData.products);
            setUserProfile(userProfileData); // Set user profile


            let totalSales = 0;
            let pendingOrders = 0;
            const salesByMonth = new Map<string, number>();
            const currentYear = new Date().getFullYear();

            ordersData.forEach(order => {
                const orderDate = new Date(order.createdAt);
                if (orderDate.getFullYear() === currentYear) {
                    totalSales += parseFloat(order.totalAmount);
                    const month = orderDate.toLocaleString('default', { month: 'short' });
                    salesByMonth.set(month, (salesByMonth.get(month) || 0) + parseFloat(order.totalAmount));
                }
                if (['pending', 'processed'].includes(order.status)) {
                    pendingOrders++;
                }
            });
            
            const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const chartData = monthOrder.map(month => ({
                month,
                sales: salesByMonth.get(month) || 0
            }));

            setSummaryStats({
                totalSales,
                orderCount: ordersData.length,
                productCount: inventoryData.products.length,
                pendingOrders,
            });
            setSalesChartData(chartData);

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOrderItemStatusChange = async (orderItemId: string, newStatus: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/seller-orders/items/${orderItemId}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) throw new Error(`Failed to update item ${orderItemId}`);
            await fetchData();
        } catch (error) {
            console.error('Error updating order item status:', error);
        }
    };
    
    const toggleOrderExpansion = (orderId: string) => {
        setExpandedOrders(prev => 
            prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
        );
    };

    function handleRestockClick(item: InventoryItem) {
        setProductToRestock(item);
        setRestockQuantity(1);
    }
    
    const confirmManualRestock = async () => {
        if (!productToRestock || restockQuantity <= 0) {
            toast.error("Invalid quantity or product.");
            return;
        }

        try {
            const payload = {
                quantity: restockQuantity,
            };

            const res = await fetch(`${API_BASE_URL}/inventory/warehouse/${productToRestock.id}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to restock product.");
            }

            toast.success(`Restocked ${restockQuantity}x ${productToRestock.name}`);
            setProductToRestock(null);
            fetchData();
        } catch (error: any) {
            toast.error(error.message);
            console.error("Error with manual restock:", error);
        }
    };

    if (loading && !inventory.length) {
        return <div className="min-h-screen bg-gray-50 p-6 flex justify-center items-center">Loading...</div>
    }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* --- TOP NAVBAR --- */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Wholesaler Dashboard</h1>
        <div className="flex items-center gap-4">
            <Button className="bg-[#febd69] hover:bg-[#f5a623] text-black font-medium" onClick={() => setAddProductOpen(true)}>+ Add Product</Button>
            <Avatar>
                <AvatarImage src={userProfile?.profilePictureUrl || undefined} alt={userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : "Wholesaler"} />
                <AvatarFallback>{userProfile ? `${userProfile.firstName?.charAt(0)}${userProfile.lastName?.charAt(0)}` : "WS"}</AvatarFallback>
            </Avatar>
        </div>
      </div>

      {/* --- SUMMARY CARDS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle>Total Sales</CardTitle><DollarSign className="h-5 w-5 text-green-500" /></CardHeader><CardContent><p className="text-2xl font-bold">₹{summaryStats.totalSales.toFixed(2)}</p><p className="text-sm text-gray-500">This year</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle>Orders Received</CardTitle><ShoppingBag className="h-5 w-5 text-blue-500" /></CardHeader><CardContent><p className="text-2xl font-bold">{summaryStats.orderCount}</p><p className="text-sm text-gray-500">Total orders from retailers</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle>Products</CardTitle><Package className="h-5 w-5 text-orange-500" /></CardHeader><CardContent><p className="text-2xl font-bold">{summaryStats.productCount}</p><p className="text-sm text-gray-500">Products in warehouse</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle>Pending Orders</CardTitle><Clock className="h-5 w-5 text-purple-500" /></CardHeader><CardContent><p className="text-2xl font-bold">{summaryStats.pendingOrders}</p><p className="text-sm text-gray-500">Require action</p></CardContent></Card>
      </div>

      {/* --- ANALYTICS + TABS --- */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="orders">Retailer Orders</TabsTrigger><TabsTrigger value="inventory">Inventory</TabsTrigger></TabsList>
        <TabsContent value="overview"><Card><CardHeader><CardTitle>Sales Analytics</CardTitle></CardHeader><CardContent className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={salesChartData}><XAxis dataKey="month" /><YAxis /><Tooltip /><Bar dataKey="sales" fill="#4f46e5" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card></TabsContent>
        <TabsContent value="orders"><Card><CardHeader><CardTitle>Recent Orders from Retailers</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><thead><tr className="text-left border-b"><th className="py-2 w-12"></th><th className="py-2">Order ID</th><th>Date</th><th>Retailer & Address</th><th>Total</th><th>Overall Status</th></tr></thead><tbody>{orders.slice(0, 10).map((order) => (<Fragment key={order.id}><tr className="border-b hover:bg-gray-50"><td className="py-2 text-center"><Button variant="ghost" size="sm" onClick={() => toggleOrderExpansion(order.id)}>{expandedOrders.includes(order.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</Button></td><td className="py-2 font-mono text-xs">{order.id.substring(0, 8)}...</td><td>{new Date(order.createdAt).toLocaleDateString()}</td><td><div><p className="font-medium text-gray-900">{order.customer.firstName} {order.customer.lastName}</p>{order.deliveryAddress && (<p className="text-xs text-gray-500 mt-1">{order.deliveryAddress.streetAddress}, {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.postalCode}</p>)}</div></td><td>₹{parseFloat(order.totalAmount).toFixed(2)}</td><td><span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColorClass(order.status)}`}>{order.status}</span></td></tr>{expandedOrders.includes(order.id) && (<tr className="bg-gray-50/50"><td colSpan={6} className="p-0"><div className="p-4"><h4 className="font-bold mb-2 text-xs uppercase text-gray-500">Order Items</h4><div className="space-y-2">{order.orderItems.map(item => (<div key={item.id} className="flex justify-between items-center p-2 rounded-md border bg-white"><div className="flex items-center gap-3"><Avatar className="w-10 h-10 rounded-md border"><AvatarImage src={item.warehouseInventory.product.imageURLs?.[0]} /><AvatarFallback>{item.warehouseInventory.product.name.charAt(0)}</AvatarFallback></Avatar><div><p className="font-medium">{item.warehouseInventory.product.name}</p><p className="text-xs text-gray-500">Qty: {item.quantity}</p></div></div><div className="flex items-center gap-4"><span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColorClass(item.status)}`}>{item.status}</span><select disabled={['delivered', 'cancelled'].includes(item.status)} value={item.status} onChange={(e) => handleOrderItemStatusChange(item.id, e.target.value)} className="text-xs border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"><option value="pending">Pending</option><option value="processed">Processed</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option></select></div></div>))}</div></div></td></tr>)}</Fragment>))}</tbody></table></CardContent></Card></TabsContent>
        <TabsContent value="inventory"><Card><CardHeader><CardTitle>Warehouse Inventory</CardTitle></CardHeader><CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{inventory.map((item) => (<Card key={item.id} className="p-4"><CardTitle className="text-sm">{item.name}</CardTitle><p className={`mt-2 font-medium ${parseInt(item.stock) < 10 ? "text-red-500" : "text-green-600"}`}>{item.stock} in stock</p><p className="text-sm text-gray-500">₹{item.price}</p><Button onClick={() => handleRestockClick(item)} className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4">Restock</Button></Card>))}</CardContent></Card></TabsContent>
      </Tabs>

      {/* --- DIALOGS --- */}
      <Dialog open={addProductOpen} onOpenChange={setAddProductOpen}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>Add New Product to Warehouse</DialogTitle></DialogHeader><AddProduct onClose={() => { setAddProductOpen(false); fetchData(); }} /></DialogContent></Dialog>
      <Dialog open={!!productToRestock} onOpenChange={() => setProductToRestock(null)}>
        <DialogContent>
            <DialogHeader><DialogTitle>Restock: {productToRestock?.name}</DialogTitle></DialogHeader>
            <div className="py-4 space-y-4">
                <p className="text-sm text-gray-600">Enter the quantity to add to the current stock.</p>
                <div>
                    <Label htmlFor="restock-quantity">Quantity</Label>
                    <Input id="restock-quantity" type="number" value={restockQuantity} onChange={(e) => setRestockQuantity(parseInt(e.target.value) || 1)} min="1" />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setProductToRestock(null)}>Cancel</Button>
                <Button onClick={confirmManualRestock}>Confirm</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}