"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Truck, Package } from "lucide-react";

type OrderStatus = "placed" | "processing" | "shipped" | "delivered";

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
  orderNumber: string;
  date: string;
  total: number;
  status: OrderStatus;
  estimatedDelivery: string;
  carrier: string;
  trackingNumber: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    image: string;
  }[];
  timeline: TrackingStep[];
};

export default function TrackOrderPage() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber") || "ORD-001";
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderNumber]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      // Mock data - replace with actual API call
      const mockOrder: Order = {
        orderNumber: orderNumber,
        date: "2025-01-15",
        total: 129.99,
        status: "shipped",
        estimatedDelivery: "2025-01-20",
        carrier: "FedEx",
        trackingNumber: "1234567890",
        items: [
          {
            id: "1",
            name: "Product 1",
            quantity: 2,
            price: 29.99,
            image: "https://placehold.co/80x80",
          },
          {
            id: "2",
            name: "Product 2",
            quantity: 1,
            price: 70.01,
            image: "https://placehold.co/80x80",
          },
        ],
        timeline: [
          {
            status: "placed",
            label: "Order Placed",
            date: "Jan 15, 2025",
            time: "10:30 AM",
            location: "Online",
            completed: true,
            icon: <CheckCircle className="w-6 h-6 text-green-600" />,
          },
          {
            status: "processing",
            label: "Processing",
            date: "Jan 16, 2025",
            time: "2:45 PM",
            location: "Warehouse",
            completed: true,
            icon: <Clock className="w-6 h-6 text-green-600" />,
          },
          {
            status: "shipped",
            label: "Shipped",
            date: "Jan 17, 2025",
            time: "9:15 AM",
            location: "Distribution Center",
            completed: true,
            icon: <Truck className="w-6 h-6 text-green-600" />,
          },
          {
            status: "delivered",
            label: "Estimated Delivery",
            date: "Jan 20, 2025",
            time: "by 8:00 PM",
            location: "Your Address",
            completed: false,
            icon: <Package className="w-6 h-6 text-gray-400" />,
          },
        ],
      };

      setOrder(mockOrder);
    } catch (err) {
      setError("Failed to load order details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFE4C4] flex items-center justify-center">
        <p className="text-gray-600">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#FFE4C4]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-100 text-red-700 p-6 rounded-lg text-center">
            <p className="text-lg font-semibold">{error || "Order not found"}</p>
            <Link href="/returns-and-orders">
              <Button className="mt-4">Back to Orders</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFE4C4]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/returns-and-orders" className="text-[#000000] hover:underline mb-4 inline-block">
            ← Back to Orders
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Track Order {order.orderNumber}
          </h1>
          <p className="text-gray-600">
            Ordered on {new Date(order.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tracking Timeline */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Delivery Status</h2>

              {/* Timeline */}
              <div className="space-y-8">
                {order.timeline.map((step, index) => (
                  <div key={step.status} className="flex gap-4">
                    {/* Icon */}
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-gray-100 p-3">
                        {step.icon}
                      </div>
                      {index < order.timeline.length - 1 && (
                        <div
                          className={`w-0.5 h-20 mt-2 ${
                            step.completed ? "bg-green-600" : "bg-gray-300"
                          }`}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {step.label}
                          </h3>
                          <p className="text-sm text-gray-600">{step.location}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {step.date}
                          </p>
                          <p className="text-sm text-gray-600">{step.time}</p>
                        </div>
                      </div>
                      {step.completed && (
                        <p className="text-sm text-green-600 font-medium">
                          ✓ Completed
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping Info */}
              <div className="mt-10 pt-8 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Shipping Information</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600">Carrier</p>
                    <p className="font-medium text-gray-900">{order.carrier}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tracking Number</p>
                    <p className="font-medium text-gray-900 font-mono">
                      {order.trackingNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Current Status</p>
                    <p className="font-medium text-gray-900 capitalize">
                      {order.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estimated Delivery</p>
                    <p className="font-medium text-gray-900">
                      {new Date(order.estimatedDelivery).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric" }
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h2>

              {/* Items */}
              <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">
                        {item.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Qty: {item.quantity}
                      </p>
                      <p className="font-semibold text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-gray-900 pt-3 border-t border-gray-200">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button className="w-full bg-[#febd69] hover:bg-[#f5a623] text-black font-semibold">
                  Contact Support
                </Button>
                <Link href="/returns-and-orders" className="block">
                  <Button variant="outline" className="w-full">
                    Back to Orders
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
