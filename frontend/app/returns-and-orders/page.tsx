"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Trash2, Package, Truck, CheckCircle, Clock, XCircle, Search, ArrowRight } from "lucide-react";
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
        return "text-green-700 bg-green-50 border-green-100";
      case "processed":
      case "shipped":
        return "text-blue-700 bg-blue-50 border-blue-100";
      case "pending":
        return "text-yellow-700 bg-yellow-50 border-yellow-100";
      case "cancelled":
      case "rejected":
        return "text-red-700 bg-red-50 border-red-100";
      default:
        return "text-gray-700 bg-gray-50 border-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="w-4 h-4 mr-1.5" />;
      case "processed":
      case "shipped":
        return <Truck className="w-4 h-4 mr-1.5" />;
      case "pending":
        return <Clock className="w-4 h-4 mr-1.5" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 mr-1.5" />;
      default:
        return <Package className="w-4 h-4 mr-1.5" />;
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
          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-gray-100 rounded-md"}
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
          <PaginationLink onClick={() => handlePageChange(1)} className="cursor-pointer hover:bg-gray-100 rounded-md">1</PaginationLink>
        </PaginationItem>
      );
      if (startPage > 2) {
        items.push(<PaginationItem key="ellipsis-start"><PaginationEllipsis /></PaginationItem>);
      }
    }

    // Middle pages
    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <PaginationItem key={page}>
          <PaginationLink
            onClick={() => handlePageChange(page)}
            isActive={page === currentPage}
            className={`cursor-pointer rounded-md ${page === currentPage ? 'bg-gray-700 text-white font-bold hover:bg-gray-600' : 'hover:bg-gray-100'}`}
          >
            {page}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<PaginationItem key="ellipsis-end"><PaginationEllipsis /></PaginationItem>);
      }
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => handlePageChange(totalPages)} className="cursor-pointer hover:bg-gray-100 rounded-md">{totalPages}</PaginationLink>
        </PaginationItem>
      );
    }

    // Next button
    items.push(
      <PaginationItem key="next">
        <PaginationNext
          onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-gray-100 rounded-md"}
        />
      </PaginationItem>
    );

    return items;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Returns & Orders</h1>
            <p className="text-gray-500 mt-2">Track, manage and return your orders</p>
          </div>
          
          {/* Search Orders */}
          <div className="relative w-full md:w-72">
            <input 
              type="text" 
              placeholder="Search by Order # or Product..." 
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-400 focus:border-transparent outline-none text-sm shadow-sm"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r shadow-sm mb-8 flex justify-between items-center">
            <p className="text-sm text-red-700 font-medium">{error}</p>
            <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("orders")}
            className={`py-3 px-6 font-semibold text-sm transition-all relative ${
              activeTab === "orders"
                ? "text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Your Orders ({orders.length})
            {activeTab === "orders" && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-700"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("returns")}
            className={`py-3 px-6 font-semibold text-sm transition-all relative ${
              activeTab === "returns"
                ? "text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Return Requests (0)
            {activeTab === "returns" && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-700"></div>
            )}
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-gray-700 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium">Loading your orders...</p>
          </div>
        ) : activeTab === "orders" ? (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No orders yet</h3>
                <p className="text-gray-500">Looks like you haven't placed any orders yet.</p>
              </div>
            ) : (
              <>
                {paginatedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md"
                  >
                    {/* Order Header */}
                    <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-sm">
                        <div>
                          <p className="text-gray-500 uppercase text-xs font-bold tracking-wider mb-1">Order Placed</p>
                          <p className="font-medium text-gray-900">
                            {new Date(order.date || order.createdAt || "").toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 uppercase text-xs font-bold tracking-wider mb-1">Total</p>
                          <p className="font-medium text-gray-900">
                            ${parseFloat(String(order.total || 0)).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 uppercase text-xs font-bold tracking-wider mb-1">Order #</p>
                          <p className="font-medium text-gray-900">{order.orderNumber}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusIcon(order.status)}
                          {order.status}
                        </span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="p-6">
                      <div className="space-y-6">
                        {order.orderItems && order.orderItems.length > 0 ? (
                          (() => {
                            const itemsByShop = new Map<string, OrderItem[]>();
                            order.orderItems.forEach((item) => {
                              const shop = item.shopName || "Unknown Shop";
                              if (!itemsByShop.has(shop)) {
                                itemsByShop.set(shop, []);
                              }
                              itemsByShop.get(shop)!.push(item);
                            });

                            return Array.from(itemsByShop.entries()).map(([shopName, shopItems]) => (
                              <div key={shopName} className="space-y-4">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Package className="w-4 h-4" />
                                  <span>Sold by <span className="font-medium text-gray-900">{shopName}</span></span>
                                </div>
                                
                                <div className="space-y-4">
                                  {shopItems.map((item) => (
                                    <div key={item.id} className="flex gap-4 sm:gap-6 items-start">
                                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                                        <img
                                          src={item.image}
                                          alt={item.name}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <Link href={`/product/${item.shopInventoryId}`} className="text-base font-bold text-gray-900 hover:text-gray-700 transition-colors line-clamp-1">
                                          {item.name}
                                        </Link>
                                        <p className="text-sm text-gray-500 mt-1">Quantity: {item.quantity}</p>
                                        <p className="text-sm font-bold text-gray-900 mt-2">
                                          ${item.price ? (parseFloat(String(item.price)) * parseInt(String(item.quantity))).toFixed(2) : "N/A"}
                                        </p>
                                      </div>
                                      <div className="hidden sm:block">
                                        <Link href={`/product/${item.shopInventoryId}`}>
                                          <Button variant="outline" size="sm" className="rounded-lg">
                                            Buy Again
                                          </Button>
                                        </Link>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ));
                          })()
                        ) : (
                          <p className="text-gray-500 text-sm italic">No items details available</p>
                        )}
                      </div>

                      <div className="mt-6 pt-6 border-t border-gray-100 flex flex-wrap gap-3 justify-end">
                        <Link href={`/track-order?orderNumber=${order.orderNumber}`}>
                          <Button variant="outline" className="rounded-xl border-gray-200 hover:bg-gray-50">
                            Track Package
                          </Button>
                        </Link>
                        
                        {canCancelOrder(order.status) ? (
                          <Button
                            variant="destructive"
                            onClick={() => handleCancelOrder(order.id, order.orderNumber || "")}
                            disabled={loading}
                            className="rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 shadow-none"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Cancel Order
                          </Button>
                        ) : order.status === "cancelled" ? (
                          <Button variant="ghost" disabled className="text-gray-400">
                            Order Cancelled
                          </Button>
                        ) : (
                          order.status === "delivered" && (
                            <Button variant="outline" disabled className="rounded-xl opacity-50 cursor-not-allowed">
                              Return Items
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-12">
                    <Pagination>
                      <PaginationContent>{renderPaginationItems()}</PaginationContent>
                    </Pagination>
                  </div>
                )}

                {/* Pagination Info */}
                <div className="text-center text-gray-500 text-sm mt-4">
                  Showing {startIndex + 1}-{Math.min(endIndex, orders.length)} of {orders.length} orders
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No returns yet</h3>
              <p className="text-gray-500">You don't have any active return requests.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
