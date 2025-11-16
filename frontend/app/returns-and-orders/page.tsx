"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Order = {
  id: string;
  orderNumber: string;
  date: string;
  total: number;
  status: "pending" | "shipped" | "delivered" | "cancelled";
  items: OrderItem[];
};

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

type ReturnRequest = {
  id: string;
  orderNumber: string;
  itemName: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | "refunded";
  requestDate: string;
  refundAmount: number;
};

export default function ReturnsAndOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [activeTab, setActiveTab] = useState<"orders" | "returns">("orders");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrdersAndReturns();
  }, []);

  const fetchOrdersAndReturns = async () => {
    setLoading(true);
    setError(null);
    try {
      // Mock data - replace with actual API calls
      const mockOrders: Order[] = [
        {
          id: "1",
          orderNumber: "ORD-001",
          date: "2025-01-15",
          total: 129.99,
          status: "delivered",
          items: [
            {
              id: "1",
              name: "Product 1",
              price: 29.99,
              quantity: 2,
              image: "https://placehold.co/100x100",
            },
            {
              id: "2",
              name: "Product 2",
              price: 70.01,
              quantity: 1,
              image: "https://placehold.co/100x100",
            },
          ],
        },
        {
          id: "2",
          orderNumber: "ORD-002",
          date: "2025-01-10",
          total: 89.99,
          status: "shipped",
          items: [
            {
              id: "3",
              name: "Product 3",
              price: 89.99,
              quantity: 1,
              image: "https://placehold.co/100x100",
            },
          ],
        },
      ];

      const mockReturns: ReturnRequest[] = [
        {
          id: "1",
          orderNumber: "ORD-001",
          itemName: "Product 1",
          reason: "Defective",
          status: "approved",
          requestDate: "2025-01-16",
          refundAmount: 59.98,
        },
      ];

      setOrders(mockOrders);
      setReturns(mockReturns);
    } catch (err) {
      setError("Failed to load orders and returns");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
      case "approved":
      case "refunded":
        return "text-green-600 bg-green-50";
      case "shipped":
        return "text-blue-600 bg-blue-50";
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      case "cancelled":
      case "rejected":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="min-h-screen bg-[#FFE4C4]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Returns & Orders</h1>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-6">{error}</div>}

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-gray-300">
          <button
            onClick={() => setActiveTab("orders")}
            className={`py-3 px-6 font-semibold transition-colors ${
              activeTab === "orders"
                ? "text-[#febd69] border-b-2 border-[#febd69]"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Your Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab("returns")}
            className={`py-3 px-6 font-semibold transition-colors ${
              activeTab === "returns"
                ? "text-[#febd69] border-b-2 border-[#febd69]"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Return Requests ({returns.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : activeTab === "orders" ? (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-gray-500">You have no orders yet</p>
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-lg shadow-sm p-6 space-y-4"
                >
                  <div className="flex justify-between items-start border-b pb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order {order.orderNumber}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Ordered on{" "}
                        {new Date(order.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex gap-4 items-center">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center border-t pt-4">
                    <span className="font-semibold text-gray-900">
                      Total: ${order.total.toFixed(2)}
                    </span>
                    <div className="flex gap-3 border-t pt-4">
                      <Link href={`/track-order?orderNumber=${order.orderNumber}`}>
                        <Button variant="outline" size="sm">
                          Track Order
                        </Button>
                      </Link>
                      {order.status === "delivered" && (
                        <Button variant="outline" size="sm">
                          Request Return
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {returns.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-gray-500">You have no return requests</p>
              </div>
            ) : (
              returns.map((returnReq) => (
                <div
                  key={returnReq.id}
                  className="bg-white rounded-lg shadow-sm p-6 space-y-4"
                >
                  <div className="flex justify-between items-start border-b pb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Return for Order {returnReq.orderNumber}
                      </h3>
                      <p className="text-sm text-gray-600">{returnReq.itemName}</p>
                      <p className="text-sm text-gray-500">
                        Requested on{" "}
                        {new Date(returnReq.requestDate).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(
                        returnReq.status
                      )}`}
                    >
                      {returnReq.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-4">
                    <div>
                      <p className="text-sm text-gray-600">Reason</p>
                      <p className="font-medium text-gray-900">
                        {returnReq.reason}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Refund Amount</p>
                      <p className="font-semibold text-green-600">
                        ${returnReq.refundAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 border-t pt-4">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    {returnReq.status === "pending" && (
                      <Button variant="destructive" size="sm">
                        Cancel Request
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
