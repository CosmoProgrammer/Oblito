"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type OrderItem = {
  id: string;
  orderId: string;
  shopInventoryId: string;
  quantity: string | number;
  name?: string;
  productName?: string;
  price?: string | number;
  image?: string;
  imageUrl?: string;
  shopName?: string;
};

type Order = {
  id: string;
  orderNumber?: string;
  date?: string;
  createdAt?: string;
  total?: number;
  totalAmount?: string | number;
  status: "pending" | "processed" | "delivered" | "cancelled";
  orderItems?: OrderItem[];
  items?: OrderItem[];
  paymentMethod?: string;
  shops?: Set<string>;
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

const API_BASE_URL = "http://localhost:8000";
const ORDERS_PER_PAGE = 10;

export default function ReturnsAndOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [activeTab, setActiveTab] = useState<"orders" | "returns">("orders");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchOrdersAndReturns();
  }, []);

  const fetchOrdersAndReturns = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch orders from backend
      const ordersRes = await fetch(`${API_BASE_URL}/orders`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        console.log("Orders response:", ordersData);

        // Handle both array and object responses
        const ordersList = Array.isArray(ordersData) ? ordersData : ordersData.orders || [];
        
        // Group orders by orderId (consolidate multiple seller orders)
        const ordersMap = new Map<string, Order>();

        ordersList.forEach((order: any) => {
          const itemsArray = order.orderItems || order.items || [];
          
          // Transform items with proper mapping
          const transformedItems = Array.isArray(itemsArray)
            ? itemsArray.map((item: any) => ({
                id: item.id,
                orderId: item.orderId,
                shopInventoryId: item.shopInventoryId,
                quantity: parseInt(item.quantity || 1),
                name: item.shopInventory?.product?.name || item.productName || "Product",
                price: parseFloat(item.priceAtPurchase || 0),
                image: item.shopInventory?.product?.imageURLs?.[0] || item.imageUrl || "https://placehold.co/80x80",
                shopName: order.shop?.name || "Unknown Shop",
              }))
            : [];

          const orderId = order.id;

          if (ordersMap.has(orderId)) {
            // Order already exists, merge items
            const existingOrder = ordersMap.get(orderId)!;
            existingOrder.orderItems = [...(existingOrder.orderItems || []), ...transformedItems];
          } else {
            // New order
            ordersMap.set(orderId, {
              id: orderId,
              orderNumber: order.orderNumber || `ORD-${orderId?.slice(0, 8).toUpperCase()}`,
              date: order.date || order.createdAt || new Date().toISOString(),
              total: parseFloat(order.totalAmount || order.total || 0),
              status: order.status || "pending",
              paymentMethod: order.paymentMethod,
              orderItems: transformedItems,
            });
          }
        });

        // Convert map to array
        const consolidatedOrders = Array.from(ordersMap.values());
        setOrders(consolidatedOrders);
        setCurrentPage(1); // Reset to first page
      } else {
        setError("Failed to load orders");
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Error loading orders");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Are you sure you want to cancel order ${orderNumber}? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      const data = await res.json();

      if (res.ok) {
        // Refresh the orders list instead of just removing from state
        // This ensures we get the updated status from backend
        await fetchOrdersAndReturns();
        setError(null);
      } else {
        const errorMsg = data.message || data.error || "Failed to cancel order";
        setError(errorMsg);
        console.error("Cancel order error:", data);
      }
    } catch (err: any) {
      console.error("Error cancelling order:", err);
      setError("Error cancelling order");
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
      case "processed":
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

  const canCancelOrder = (status: string) => {
    return status === "pending";
  };

  // Pagination logic
  const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE);
  const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
  const endIndex = startIndex + ORDERS_PER_PAGE;
  const paginatedOrders = orders.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisible = 5;

    // Previous button
    items.push(
      <PaginationItem key="prev">
        <PaginationPrevious
          onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
        />
      </PaginationItem>
    );

    // Calculate page range
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    // First page
    if (startPage > 1) {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => handlePageChange(1)}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
      if (startPage > 2) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }

    // Middle pages
    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <PaginationItem key={page}>
          <PaginationLink
            onClick={() => handlePageChange(page)}
            isActive={page === currentPage}
            className="cursor-pointer"
          >
            {page}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => handlePageChange(totalPages)}
            className="cursor-pointer"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Next button
    items.push(
      <PaginationItem key="next">
        <PaginationNext
          onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
        />
      </PaginationItem>
    );

    return items;
  };

  return (
    <div className="min-h-screen bg-[#FFE4C4]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Returns & Orders</h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-6 flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-700 hover:text-red-900 font-bold"
            >
              ✕
            </button>
          </div>
        )}

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
            Return Requests (0)
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
              <>
                {paginatedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-lg shadow-sm p-6 space-y-4"
                  >
                    <div className="flex justify-between items-start border-b pb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order {order.orderNumber}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Ordered on{" "}
                          {new Date(order.date || order.createdAt || "").toLocaleDateString("en-US", {
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

                    {/* Order Items - Grouped by Shop */}
                    <div className="space-y-4">
                      {order.orderItems && order.orderItems.length > 0 ? (
                        (() => {
                          // Group items by shop
                          const itemsByShop = new Map<string, OrderItem[]>();
                          order.orderItems.forEach((item) => {
                            const shop = item.shopName || "Unknown Shop";
                            if (!itemsByShop.has(shop)) {
                              itemsByShop.set(shop, []);
                            }
                            itemsByShop.get(shop)!.push(item);
                          });

                          return Array.from(itemsByShop.entries()).map(([shopName, shopItems]) => (
                            <div key={shopName} className="border-l-4 border-[#febd69] pl-4">
                              <p className="text-sm font-semibold text-gray-700 mb-2">From: {shopName}</p>
                              <div className="space-y-3">
                                {shopItems.map((item) => (
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
                                      ${item.price ? (parseFloat(String(item.price)) * parseInt(String(item.quantity))).toFixed(2) : "N/A"}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ));
                        })()
                      ) : (
                        <p className="text-gray-500 text-sm">No items in this order</p>
                      )}
                    </div>

                    <div className="flex justify-between items-center border-t pt-4">
                      <span className="font-semibold text-gray-900">
                        Total: ${parseFloat(String(order.total || 0)).toFixed(2)}
                      </span>
                      <div className="flex gap-3">
                        <Link href={`/track-order?orderNumber=${order.orderNumber}`}>
                          <Button variant="outline" size="sm">
                            Track Order
                          </Button>
                        </Link>
                        {canCancelOrder(order.status) ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelOrder(order.id, order.orderNumber || "")}
                            disabled={loading}
                            className="flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Cancel Order
                          </Button>
                        ) : order.status === "cancelled" ? (
                          <Button variant="outline" size="sm" disabled>
                            Order Cancelled
                          </Button>
                        ) : (
                          order.status === "delivered" && (
                            <Button variant="outline" size="sm" disabled>
                              Request Return (Coming Soon)
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-8">
                    <Pagination>
                      <PaginationContent>{renderPaginationItems()}</PaginationContent>
                    </Pagination>
                  </div>
                )}

                {/* Pagination Info */}
                <div className="text-center text-gray-600 mt-4">
                  Showing {startIndex + 1}-{Math.min(endIndex, orders.length)} of {orders.length} orders (Page {currentPage} of {totalPages})
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-500">Returns feature coming soon</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
