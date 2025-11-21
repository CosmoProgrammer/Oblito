"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Trash2, Package, Truck, CheckCircle, Clock, XCircle, Search, ArrowRight, Undo2 } from "lucide-react";
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
  status?: "pending" | "processed" | "shipped" | "delivered" | "cancelled" | "to_return" | "returned";
  orderNumber?: string;
  date?: string | Date;
};

type Order = {
  id: string;
  orderNumber?: string;
  date?: string;
  createdAt?: string;
  total?: number;
  totalAmount?: string | number;
  status: "pending" | "processed" | "shipped" | "delivered" | "cancelled";
  overallStatus?: "pending" | "processed" | "shipped" | "delivered" | "cancelled";
  orderItems?: OrderItem[];
  items?: OrderItem[];
  paymentMethod?: string;
  shops?: Set<string>;
};

const API_BASE_URL = "http://localhost:8000";
const ORDERS_PER_PAGE = 10;

const getOverallOrderStatus = (items: OrderItem[]): "pending" | "processed" | "shipped" | "delivered" | "cancelled" => {
    const statuses = items.map(item => item.status);
    if (statuses.every(s => s === 'cancelled')) return 'cancelled';
    if (statuses.every(s => s === 'delivered' || s === 'returned')) return 'delivered';
    if (statuses.some(s => s === 'shipped')) return 'shipped';
    if (statuses.some(s => s === 'processed')) return 'processed';
    return 'pending';
};

export default function ReturnsAndOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [returnRequests, setReturnRequests] = useState<OrderItem[]>([]);
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
      const ordersRes = await fetch(`${API_BASE_URL}/orders`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        const ordersList = Array.isArray(ordersData) ? ordersData : ordersData.orders || [];
        
        const returns: OrderItem[] = [];

        const transformedOrders: Order[] = ordersList.map((order: any) => {
          const itemsArray = order.orderItems || [];
          
          const transformedItems: OrderItem[] = itemsArray.map((item: any) => {
              const orderItem: OrderItem = {
                id: item.id,
                orderId: order.id,
                shopInventoryId: item.shopInventoryId,
                quantity: parseInt(item.quantity, 10) || 1,
                name: item.shopInventory?.product?.name || "Product",
                price: parseFloat(item.priceAtPurchase) || 0,
                image: item.shopInventory?.product?.imageURLs?.[0] || "https://placehold.co/80x80",
                shopName: order.shop?.name || "Unknown Shop",
                status: item.status,
                orderNumber: `ORD-${order.id?.slice(0, 8).toUpperCase()}`,
                date: order.createdAt || new Date().toISOString(),
              };
              if (item.status === 'to_return' || item.status === 'returned') {
                returns.push(orderItem);
              }
              return orderItem;
            });

          return {
            id: order.id,
            orderNumber: `ORD-${order.id?.slice(0, 8).toUpperCase()}`,
            date: order.createdAt || new Date().toISOString(),
            total: parseFloat(order.totalAmount || 0),
            status: order.status || "pending",
            overallStatus: getOverallOrderStatus(transformedItems),
            paymentMethod: order.paymentMethod,
            orderItems: transformedItems,
          };
        });

        setOrders(transformedOrders);
        setReturnRequests(returns);
        setCurrentPage(1);
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

  const handleReturnItem = async (orderItemId: string) => {
    if (!confirm("Are you sure you want to request a return for this item?")) {
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/returns/request`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ orderItemId }),
        });

        const data = await res.json();

        if (res.ok) {
            alert("Return requested successfully!");
            fetchOrdersAndReturns();
        } else {
            throw new Error(data.message || "Failed to request return.");
        }
    } catch (err: any) {
        alert(err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
      case "approved":
      case "returned":
        return "text-green-700 bg-green-50 border-green-100";
      case "processed":
      case "shipped":
        return "text-blue-700 bg-blue-50 border-blue-100";
      case "pending":
        return "text-yellow-700 bg-yellow-50 border-yellow-100";
      case "to_return":
        return "text-purple-700 bg-purple-50 border-purple-100";
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
      case "to_return":
      case "returned":
        return <Undo2 className="w-4 h-4 mr-1.5" />;
      default:
        return <Package className="w-4 h-4 mr-1.5" />;
    }
  };

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
    const totalP = activeTab === 'orders' ? totalPages : Math.ceil(returnRequests.length / ORDERS_PER_PAGE);

    items.push(
      <PaginationItem key="prev">
        <PaginationPrevious
          onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-gray-100 rounded-md"}
        />
      </PaginationItem>
    );

    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalP, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

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

    if (endPage < totalP) {
      if (endPage < totalP - 1) {
        items.push(<PaginationItem key="ellipsis-end"><PaginationEllipsis /></PaginationItem>);
      }
      items.push(
        <PaginationItem key={totalP}>
          <PaginationLink onClick={() => handlePageChange(totalP)} className="cursor-pointer hover:bg-gray-100 rounded-md">{totalP}</PaginationLink>
        </PaginationItem>
      );
    }

    items.push(
      <PaginationItem key="next">
        <PaginationNext
          onClick={() => currentPage < totalP && handlePageChange(currentPage + 1)}
          className={currentPage === totalP ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-gray-100 rounded-md"}
        />
      </PaginationItem>
    );

    return items;
  };
  
  const paginatedReturns = returnRequests.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Returns & Orders</h1>
            <p className="text-gray-500 mt-2">Track, manage and return your orders</p>
          </div>
          
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
            Return Requests ({returnRequests.length})
            {activeTab === "returns" && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-700"></div>
            )}
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-gray-700 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium">Loading your data...</p>
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
                        {order.overallStatus === 'pending' && (
                            <Button variant="destructive" size="sm" onClick={() => handleCancelOrder(order.id, order.orderNumber!)}>
                                <XCircle className="w-4 h-4 mr-2" />
                                Cancel Order
                            </Button>
                        )}
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusColor(
                            order.overallStatus!
                          )}`}
                        >
                          {getStatusIcon(order.overallStatus!)}
                          {order.overallStatus}
                        </span>
                      </div>
                    </div>

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
                                        <div className="mt-2 flex gap-2">
                                            {item.status !== 'to_return' && item.status !== 'returned' && item.status !== 'cancelled' && (
                                                <Link href={`/track-order?orderId=${order.id}&orderItemId=${item.id}`}>
                                                <Button variant="outline" size="sm" className="rounded-lg">
                                                    Track Package
                                                </Button>
                                                </Link>
                                            )}
                                            {item.status === "delivered" && (
                                                <Button variant="outline" size="sm" className="rounded-lg" onClick={() => handleReturnItem(item.id)}>
                                                    Return Item
                                                </Button>
                                            )}
                                        </div>
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
                    </div>
                  </div>
                ))}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-12">
                    <Pagination>
                      <PaginationContent>{renderPaginationItems()}</PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {returnRequests.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200">
                  <Undo2 className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No return requests</h3>
                <p className="text-gray-500">You haven't requested any returns yet.</p>
              </div>
            ) : (
              <>
                {paginatedReturns.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="flex gap-4 sm:gap-6 items-start">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row justify-between items-start">
                          <div>
                            <Link href={`/product/${item.shopInventoryId}`} className="text-base font-bold text-gray-900 hover:text-gray-700 transition-colors line-clamp-1">
                              {item.name}
                            </Link>
                            <p className="text-sm text-gray-500 mt-1">Order #: {item.orderNumber}</p>
                          </div>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusColor(item.status!)}`}>
                            {getStatusIcon(item.status!)}
                            {item.status!.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">Quantity: {item.quantity}</p>
                        <p className="text-sm font-bold text-gray-900 mt-2">
                          ${item.price ? (parseFloat(String(item.price)) * parseInt(String(item.quantity))).toFixed(2) : "N/A"}
                        </p>
                         <p className="text-xs text-gray-400 mt-1">
                            Return requested for order placed on {new Date(item.date!).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric"})}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {Math.ceil(returnRequests.length / ORDERS_PER_PAGE) > 1 && (
                  <div className="flex justify-center mt-12">
                    <Pagination>
                      <PaginationContent>{renderPaginationItems()}</PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
