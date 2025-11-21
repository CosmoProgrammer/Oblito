"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Truck, Package, XCircle } from "lucide-react";

const API_BASE_URL = "http://localhost:8000";

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
  status: "pending" | "processed" | "shipped" | "delivered" | "cancelled" | "to_return" | "returned";
};

type OrderStatus = "pending" | "processed" | "shipped" | "delivered" | "cancelled";

type TrackingStep = {
  status: OrderStatus;
  label: string;
  date: string;
  time: string;
  location: string;
  completed: boolean;
  icon: React.ReactNode;
};

type Order = {
  id: string;
  orderNumber: string;
  date: string;
  total: number;
  status: OrderStatus;
  estimatedDelivery: string;
  carrier: string;
  trackingNumber: string;
  items: OrderItem[];
  timeline: TrackingStep[];
};

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const orderItemId = searchParams.get("orderItemId");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails(orderId, orderItemId);
    } else {
      setError("No order ID provided.");
      setLoading(false);
    }
  }, [orderId, orderItemId]);

  const getOverallStatus = (items: OrderItem[]): OrderStatus => {
    const statuses = items.map(item => item.status);
    if (statuses.every(s => s === 'cancelled')) return 'cancelled';
    if (statuses.every(s => s === 'delivered' || s === 'returned')) return 'delivered';
    if (statuses.some(s => s === 'shipped')) return 'shipped';
    if (statuses.some(s => s === 'processed')) return 'processed';
    return 'pending';
  };
  
  const generateTimeline = (itemStatus: OrderStatus, orderDate: string): TrackingStep[] => {
    const statusOrderMap: Record<OrderStatus, number> = {
      'pending': 0,
      'processed': 1,
      'shipped': 2,
      'delivered': 3,
      'cancelled': -1 // Not part of normal progression, handled separately if needed
    };

    const currentStatusOrder = statusOrderMap[itemStatus];

    const timeline: TrackingStep[] = [
      { status: 'pending', label: 'Order Placed', date: '', time: '', location: 'Online', completed: false, icon: <CheckCircle className="w-6 h-6 text-gray-400" /> },
      { status: 'processed', label: 'Processing', date: 'Pending', time: '', location: 'Warehouse', completed: false, icon: <Clock className="w-6 h-6 text-gray-400" /> },
      { status: 'shipped', label: 'Shipped', date: 'Pending', time: '', location: 'Distribution Center', completed: false, icon: <Truck className="w-6 h-6 text-gray-400" /> },
      { status: 'delivered', label: 'Delivered', date: 'Pending', time: '', location: 'Your Address', completed: false, icon: <Package className="w-6 h-6 text-gray-400" /> },
    ];
  
    const date = new Date(orderDate);
    const formattedDate = date.toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' });
    const formattedTime = date.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });
  
    for (let i = 0; i < timeline.length; i++) {
        if (statusOrderMap[timeline[i].status] <= currentStatusOrder) {
            timeline[i].completed = true;
            timeline[i].icon = <CheckCircle className="w-6 h-6 text-green-600" />;
            timeline[i].date = formattedDate; // Use order date for all completed steps for now
            timeline[i].time = formattedTime;
        } else {
            // Once we pass the current status, subsequent steps are not completed
            break; 
        }
    }
    return timeline;
  };

  const fetchOrderDetails = async (id: string, itemId: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/orders`, { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch orders.");
      
      const data = await res.json();
      const orders = data.orders || [];
      const foundOrder = orders.find((o: any) => o.id === id);

      if (!foundOrder) {
        setError("Order not found.");
        setLoading(false);
        return;
      }

      const items: OrderItem[] = foundOrder.orderItems.map((item: any) => ({
        id: item.id,
        name: item.shopInventory?.product?.name || 'Product',
        quantity: parseInt(item.quantity, 10),
        price: parseFloat(item.priceAtPurchase),
        image: item.shopInventory?.product?.imageURLs?.[0] || 'https://placehold.co/80x80',
        status: item.status,
      }));
      
      let status: OrderStatus;
      let itemsToShow = items;
      let total = parseFloat(foundOrder.totalAmount);

      if (itemId) {
        const singleItem = items.find(item => item.id === itemId);
        if (singleItem) {
            if (singleItem.status === 'to_return' || singleItem.status === 'returned') {
                status = 'delivered';
            } else {
                status = singleItem.status;
            }
            itemsToShow = [singleItem];
            total = singleItem.price * singleItem.quantity;
        } else {
            setError("Item not found in this order.");
            status = getOverallStatus(items);
        }
    } else {
      status = getOverallStatus(items);
    }
      
      const timeline = generateTimeline(status, foundOrder.createdAt);

      const estimatedDeliveryDate = new Date(foundOrder.createdAt);
      estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 5);

      setOrder({
        id: foundOrder.id,
        orderNumber: `ORD-${foundOrder.id.slice(0, 8).toUpperCase()}`,
        date: foundOrder.createdAt,
        total,
        status: status,
        estimatedDelivery: estimatedDeliveryDate.toISOString(),
        carrier: "Internal Shipping",
        trackingNumber: foundOrder.id,
        items: itemsToShow,
        timeline: timeline,
      });

    } catch (err) {
      setError("Failed to load order details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-700 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg text-center shadow-sm">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-lg font-semibold text-red-800">{error || "Order not found"}</p>
            <Link href="/returns-and-orders">
              <Button className="mt-6" variant="outline">Back to Orders</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link href="/returns-and-orders" className="text-gray-600 hover:text-gray-900 mb-4 inline-block group">
            <span className="group-hover:-translate-x-1 inline-block transition-transform">←</span> Back to Orders
          </Link>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
            {orderItemId ? `Track Item` : `Track Order ${order.orderNumber}`}
          </h1>
          <p className="text-gray-500">
            Ordered on {new Date(order.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Delivery Status</h2>

              <div className="space-y-8">
                {order.timeline.map((step, index) => (
                  <div key={step.status} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`rounded-full p-3 ${step.completed ? 'bg-green-100' : 'bg-gray-100'}`}>
                        {step.icon}
                      </div>
                      {index < order.timeline.length - 1 && (
                        <div className={`w-0.5 h-20 mt-2 ${step.completed ? "bg-green-600" : "bg-gray-300"}`}/>
                      )}
                    </div>

                    <div className="flex-1 pb-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{step.label}</h3>
                          <p className="text-sm text-gray-500">{step.location}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{step.date}</p>
                          <p className="text-sm text-gray-500">{step.time}</p>
                        </div>
                      </div>
                      {step.completed && (
                        <p className="text-sm text-green-600 font-medium">✓ Completed</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 pt-8 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Shipping Information</h3>
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div>
                    <p className="text-gray-500">Carrier</p>
                    <p className="font-medium text-gray-900">{order.carrier}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Tracking Number</p>
                    <p className="font-medium text-gray-900 font-mono">{order.trackingNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Current Status</p>
                    <p className="font-medium text-gray-900 capitalize">{order.status}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Estimated Delivery</p>
                    <p className="font-medium text-gray-900">
                      {new Date(order.estimatedDelivery).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg border"/>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      <p className="font-semibold text-gray-900 text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-gray-900 pt-3 border-t border-gray-200">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button className="w-full">Contact Support</Button>
                <Link href="/returns-and-orders" className="block">
                  <Button variant="outline" className="w-full">Back to Orders</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}
