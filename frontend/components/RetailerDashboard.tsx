"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, Fragment } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ShoppingBag, DollarSign, Clock, Package, Search, ChevronDown, ChevronRight, PlusCircle, ShoppingBasket } from "lucide-react";
import { AddFromWholesaler } from './AddFromWholesaler';
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
  shopInventory: {
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
  stockQuantity: string;
  price: string;
  productId: string;
  warehouseInventoryId: string | null;
  warehouseStock: string | null;
}

interface WholesaleOrder {
    id: string;
    createdAt: string;
    status: string;
    totalAmount: string;
    warehouse: {
        name: string;
    };
    orderItems: {
        quantity: string;
        warehouseInventory: {
            product: {
                name: string;
                imageURLs: string[];
            }
        }
    }[];
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
        case 'to_return': return 'bg-orange-100 text-orange-600 border-orange-200 animate-pulse';
        default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
}

export default function RetailerDashboard() {
    const [addProductOpen, setAddProductOpen] = useState(false);
    const [addFromScratchOpen, setAddFromScratchOpen] = useState(false);
    const [addFromWholesalerOpen, setAddFromWholesalerOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    
    const [orders, setOrders] = useState<Order[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [wholesaleOrders, setWholesaleOrders] = useState<WholesaleOrder[]>([]);
    const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
    const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
    const [productToRestock, setProductToRestock] = useState<InventoryItem | null>(null);
    const [restockQuantity, setRestockQuantity] = useState(1);
    const [restockMode, setRestockMode] = useState<'wholesale' | 'manual'>('wholesale');
    const [userProfile, setUserProfile] = useState<any>(null); // State to store user profile

    const [summaryStats, setSummaryStats] = useState({
        totalSales: 0,
        orderCount: 0,
        productCount: 0,
        pendingOrders: 0,
    });
    const [salesChartData, setSalesChartData] = useState<{ month: string; sales: number }[]>([]);
    const [restockPrice, setRestockPrice] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);


    const fetchData = async () => {
        try {
            setLoading(true);
            const [ordersRes, inventoryRes, addressesRes, wholesaleOrdersRes, userProfileRes] = await Promise.all([
                fetch(`${API_BASE_URL}/seller-orders`, { credentials: 'include' }),
                fetch(`${API_BASE_URL}/inventory`, { credentials: 'include' }),
                fetch(`${API_BASE_URL}/addresses`, { credentials: 'include' }),
                fetch(`${API_BASE_URL}/wholesale-orders`, {credentials: 'include' }),
                fetch(`${API_BASE_URL}/me`, { credentials: 'include' }) // Fetch user profile
            ]);

            if (!ordersRes.ok || !inventoryRes.ok || !addressesRes.ok || !wholesaleOrdersRes.ok || !userProfileRes.ok) {
                throw new Error('Failed to fetch dashboard data');
            }

            const ordersData: Order[] = await ordersRes.json();
            const inventoryData: { products: InventoryItem[] } = await inventoryRes.json();
            const addressesData: DeliveryAddress[] = await addressesRes.json();
            const wholesaleOrdersData: { orders: WholesaleOrder[] } = await wholesaleOrdersRes.json();
            const userProfileData = await userProfileRes.json(); // Get user profile data
            
            setOrders(ordersData);
            setInventory(inventoryData.products);
            setAddresses(addressesData);
            setWholesaleOrders(wholesaleOrdersData.orders);
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
                const hasItemToReturn = order.orderItems.some(item => item.status === 'to_return');
                if (['pending', 'processed', 'shipped'].includes(order.status) || hasItemToReturn) {
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
        const loadRazorpay = () => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.async = true;
            document.body.appendChild(script);
        };
        loadRazorpay();
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

    const handleReturnStatusChange = async (orderItemId: string, newStatus: string) => {
        if (newStatus !== 'returned') return;
        try {
            const res = await fetch(`${API_BASE_URL}/returns/${orderItemId}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'returned' }),
            });
            if (!res.ok) throw new Error(`Failed to process return for item ${orderItemId}`);
            await fetchData();
        } catch (error) {
            console.error('Error processing return:', error);
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
        setRestockPrice(parseFloat(item.price));
        if (item.warehouseInventoryId) {
            setRestockMode('wholesale');
        } else {
            setRestockMode('manual');
        }
    }
    
    const confirmWholesaleRestock = async () => {
        if (!productToRestock || restockQuantity <= 0) {
            toast.error("Invalid quantity or product.");
            return;
        }
        
        setIsSubmitting(true);
    
        try {
            const createOrderRes = await fetch(`${API_BASE_URL}/orders/create-wholesale-razorpay-order`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    warehouseInventoryId: productToRestock.warehouseInventoryId,
                    quantity: restockQuantity,
                }),
            });
    
            const createOrderData = await createOrderRes.json();
            if (!createOrderRes.ok) {
                throw new Error(createOrderData.message || "Failed to create Razorpay order");
            }
    
            const { order: razorpayOrder } = createOrderData;
    
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                name: "Oblito Wholesale Restock",
                description: `Payment for ${productToRestock.name}`,
                order_id: razorpayOrder.id,
                handler: async function (response: any) {
                    const verifyPayload = {
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        warehouseInventoryId: productToRestock.warehouseInventoryId,
                        quantity: restockQuantity,
                        shopPrice: restockPrice
                    };
    
                    const verifyRes = await fetch(`${API_BASE_URL}/orders/verify-wholesale-payment`, {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(verifyPayload),
                    });
    
                    const verifyData = await verifyRes.json();
    
                    if (verifyRes.ok) {
                        toast.success(`Successfully restocked ${productToRestock.name}!`);
                        setProductToRestock(null);
                        fetchData();
                    } else {
                        toast.error(verifyData.message || "Payment verification failed");
                    }
                },
                prefill: {
                    name: userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : "",
                    email: userProfile ? userProfile.email : "",
                },
                theme: {
                    color: "#3399cc"
                }
            };
            //@ts-ignore
            const rzp = new window.Razorpay(options);
            rzp.open();
    
        } catch (error: any) {
            console.error("Error during wholesale restock:", error);
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmManualRestock = async () => {
        if (!productToRestock || restockQuantity <= 0) {
            toast.error("Invalid quantity or product.");
            return;
        }

        try {
            const payload = {
                quantity: restockQuantity,
            };

            const res = await fetch(`${API_BASE_URL}/inventory/${productToRestock.id}`, {
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

    if (loading && !orders.length) {
        return <div className="min-h-screen bg-gray-50 p-6 flex justify-center items-center">Loading...</div>
    }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* --- TOP NAVBAR --- */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Retailer Dashboard</h1>
        <div className="flex items-center gap-4">
            <Button className="bg-[#febd69] hover:bg-[#f5a623] text-black font-medium" onClick={() => setAddProductOpen(true)}>+ Add Product</Button>
            <Avatar>
                <AvatarImage src={userProfile?.profilePictureUrl || undefined} alt={userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : "Retailer"} />
                <AvatarFallback>{userProfile ? `${userProfile.firstName?.charAt(0)}${userProfile.lastName?.charAt(0)}` : "RT"}</AvatarFallback>
            </Avatar>
        </div>
      </div>

      {/* --- SUMMARY CARDS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle>Total Sales</CardTitle><DollarSign className="h-5 w-5 text-green-500" /></CardHeader><CardContent><p className="text-2xl font-bold">₹{summaryStats.totalSales.toFixed(2)}</p><p className="text-sm text-gray-500">This year</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle>Orders</CardTitle><ShoppingBag className="h-5 w-5 text-blue-500" /></CardHeader><CardContent><p className="text-2xl font-bold">{summaryStats.orderCount}</p><p className="text-sm text-gray-500">Total orders</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle>Products</CardTitle><Package className="h-5 w-5 text-orange-500" /></CardHeader><CardContent><p className="text-2xl font-bold">{summaryStats.productCount}</p><p className="text-sm text-gray-500">Total products in shop</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle>Pending Orders</CardTitle><Clock className="h-5 w-5 text-purple-500" /></CardHeader><CardContent><p className="text-2xl font-bold">{summaryStats.pendingOrders}</p><p className="text-sm text-gray-500">Require action</p></CardContent></Card>
      </div>

      {/* --- ANALYTICS + TABS --- */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="orders">Recent Orders</TabsTrigger><TabsTrigger value="inventory">Inventory</TabsTrigger><TabsTrigger value="wholesale">Wholesale Orders</TabsTrigger></TabsList>
        <TabsContent value="overview"><Card><CardHeader><CardTitle>Sales Analytics</CardTitle></CardHeader><CardContent className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={salesChartData}><XAxis dataKey="month" /><YAxis /><Tooltip /><Bar dataKey="sales" fill="#4f46e5" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card></TabsContent>
        <TabsContent value="orders">
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Orders</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left border-b">
                                            <th className="py-2 w-12"></th>
                                            <th className="py-2">Order ID</th>
                                            <th>Date</th>
                                            <th>Customer & Address</th>
                                            <th>Total</th>
                                            <th>Overall Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.slice(0, 10).map((order) => (
                                            <Fragment key={order.id}>
                                                {(() => {
                                                    const hasReturnItem = order.orderItems.some(item => item.status === 'to_return');
                                                    const orderRowClassName = `border-b ${hasReturnItem ? 'bg-red-50/50 border-red-200' : 'hover:bg-gray-50'}`;
                                                    return (
                                                        <tr className={orderRowClassName}>
                                                            <td className="py-2 text-center"><Button variant="ghost" size="sm" onClick={() => toggleOrderExpansion(order.id)}>{expandedOrders.includes(order.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</Button></td>
                                                            <td className="py-2 font-mono text-xs">{order.id.substring(0, 8)}...</td>
                                                            <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                                            <td>
                                                                <div>
                                                                    <p className="font-medium text-gray-900">{order.customer.firstName} {order.customer.lastName}</p>
                                                                    {order.deliveryAddress && (
                                                                        <p className="text-xs text-gray-500 mt-1">{order.deliveryAddress.streetAddress}, {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.postalCode}</p>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td>${parseFloat(order.totalAmount).toFixed(2)}</td>
                                                            <td><span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColorClass(order.status)}`}>{order.status}</span></td>
                                                        </tr>
                                                    );
                                                })()}
                                                {expandedOrders.includes(order.id) && (
                                                    <tr className="bg-gray-50/50">
                                                        <td colSpan={6} className="p-0">
                                                            <div className="p-4">
                                                                <h4 className="font-bold mb-2 text-xs uppercase text-gray-500">Order Items</h4>
                                                                <div className="space-y-2">
                                                                    {order.orderItems.map(item => {
                                                                        const isReturn = item.status === 'to_return';
                                                                        const isFinalState = ['delivered', 'returned', 'cancelled'].includes(item.status);
                                                                        return (
                                                                            <div key={item.id} className="flex justify-between items-center p-2 rounded-md">
                                                                                <div className="flex items-center gap-3">
                                                                                    <img src={item.shopInventory.product.imageURLs[0]} alt={item.shopInventory.product.name} className="w-10 h-10 rounded-lg bg-gray-200 object-cover" />
                                                                                    <div>
                                                                                        <p className="font-medium text-gray-800">{item.shopInventory.product.name}</p>
                                                                                        <p className="text-xs text-gray-500">Qty: {item.quantity} · ₹{item.priceAtPurchase}</p>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColorClass(item.status)}`}>{item.status.replace('_', ' ')}</span>
                                                                                    {isReturn && (<Button size="sm" onClick={() => handleReturnStatusChange(item.id, 'returned')}>Mark as Returned</Button>)}
                                                                                    {!isFinalState && !isReturn && (
                                                                                        <>
                                                                                            <Button size="sm" variant="outline" onClick={() => handleOrderItemStatusChange(item.id, 'shipped')}>Mark Shipped</Button>
                                                                                            <Button size="sm" onClick={() => handleOrderItemStatusChange(item.id, 'delivered')}>Mark Delivered</Button>
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    </TabsContent>
        <TabsContent value="inventory"><Card><CardHeader><CardTitle>Inventory Status</CardTitle></CardHeader><CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{inventory.map((item) => (<Card key={item.id} className="p-4"><CardTitle className="text-sm">{item.name}</CardTitle><p className={`mt-2 font-medium ${parseInt(item.stockQuantity) < 10 ? "text-red-500" : "text-green-600"}`}>{item.stockQuantity} in stock</p><Button onClick={() => handleRestockClick(item)} className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4">{item.warehouseInventoryId ? 'Restock from Wholesaler' : 'Manual Restock'}</Button></Card>))}</CardContent></Card></TabsContent>
        <TabsContent value="wholesale"><Card><CardHeader><CardTitle>Wholesale Orders</CardTitle></CardHeader><CardContent><table className="w-full text-sm"><thead><tr className="text-left border-b"><th className="py-2">Order ID</th><th>Date</th><th>Wholesaler</th><th>Items</th><th>Total</th><th>Status</th></tr></thead><tbody>{wholesaleOrders.map((order) => (<tr key={order.id} className="border-b hover:bg-gray-50"><td className="py-2 font-mono text-xs">{order.id.substring(0, 8)}...</td><td>{new Date(order.createdAt).toLocaleDateString()}</td><td>{order.warehouse?.name || 'N/A'}</td><td>{order.orderItems.map(item => `${item.quantity}x ${item.warehouseInventory.product.name}`).join(', ')}</td><td>₹{parseFloat(order.totalAmount).toFixed(2)}</td><td><span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColorClass(order.status)}`}>{order.status}</span></td></tr>))}</tbody></table></CardContent></Card></TabsContent>
      </Tabs>

        {/* --- DIALOGS --- */}
      <Dialog open={addProductOpen} onOpenChange={setAddProductOpen}><DialogContent><DialogHeader><DialogTitle>Add a New Product</DialogTitle></DialogHeader><div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4"><button className="p-6 border rounded-lg text-left hover:bg-gray-100 transition-colors" onClick={() => { setAddProductOpen(false); setAddFromScratchOpen(true); }}><PlusCircle className="w-8 h-8 mb-2 text-gray-700"/><h3 className="font-semibold">Create New Product</h3><p className="text-sm text-gray-500">Define a completely new product from scratch.</p></button><button className="p-6 border rounded-lg text-left hover:bg-gray-100 transition-colors" onClick={() => { setAddProductOpen(false); setAddFromWholesalerOpen(true); }}><ShoppingBasket className="w-8 h-8 mb-2 text-gray-700"/><h3 className="font-semibold">Add from Wholesaler</h3><p className="text-sm text-gray-500">Browse and stock products from wholesalers.</p></button></div></DialogContent></Dialog>
      <Dialog open={addFromScratchOpen} onOpenChange={setAddFromScratchOpen}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>Add Product from Scratch</DialogTitle></DialogHeader><AddProduct onClose={() => { setAddFromScratchOpen(false); fetchData(); }} /></DialogContent></Dialog>
      <Dialog open={addFromWholesalerOpen} onOpenChange={setAddFromWholesalerOpen}><DialogContent className="sm:max-w-4xl"><DialogHeader><DialogTitle>Add Product from Wholesaler</DialogTitle></DialogHeader><AddFromWholesaler onClose={() => setAddFromWholesalerOpen(false)} onProductAdded={fetchData} /></DialogContent></Dialog>
      <Dialog open={!!productToRestock} onOpenChange={() => setProductToRestock(null)}>
        <DialogContent>
            <DialogHeader><DialogTitle>{restockMode === 'wholesale' ? 'Restock from Wholesaler' : 'Manual Restock'}: {productToRestock?.name}</DialogTitle></DialogHeader>
            <div className="py-4 space-y-4">
                <p className="text-sm text-gray-600">
                    {restockMode === 'wholesale' 
                        ? `Enter the quantity you wish to order from the wholesaler. (Available: ${productToRestock?.warehouseStock || 'N/A'})`
                        : `Enter the quantity to add to the current stock.`
                    }
                </p>
                <div>
                    <Label htmlFor="restock-quantity">Quantity</Label>
                    <Input id="restock-quantity" type="number" value={restockQuantity} onChange={(e) => setRestockQuantity(parseInt(e.target.value) || 1)} min="1" max={restockMode === 'wholesale' && productToRestock?.warehouseStock ? parseInt(productToRestock.warehouseStock) : undefined} />
                </div>
                 {restockMode === 'wholesale' && (
                    <div>
                        <Label htmlFor="restock-price">Your Selling Price (₹)</Label>
                        <Input id="restock-price" type="number" value={restockPrice} onChange={(e) => setRestockPrice(parseFloat(e.target.value) || 0)} />
                    </div>
                )}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setProductToRestock(null)}>Cancel</Button>
                <Button onClick={restockMode === 'wholesale' ? confirmWholesaleRestock : confirmManualRestock} disabled={isSubmitting}>
                    {isSubmitting ? 'Processing...' : 'Confirm'}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}