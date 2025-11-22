"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle, Trash2, Edit2, MapPin, CreditCard, Truck, ShoppingBag, ArrowRight, Plus, ChevronRight } from "lucide-react";

type Address = {
  id?: string;
  streetAddress?: string; // Changed from street
  street?: string; // Keep for backward compatibility
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isPrimary: boolean;
};

type PaymentMethod = "razorpay" | "cash_on_delivery";

type CartItem = {
  cartItemId: string;
  quantity: number;
  productId: string;
  name: string;
  price: string | number;
  imageUrl: string | string[];
};

type OrderSummary = {
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
};

type User = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePictureUrl: string | null;
}

const API_BASE_URL = "http://localhost:8000";

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"address" | "payment" | "review">("address");
  const [user, setUser] = useState<User | null>(null);

  // Address state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState<Address>({
    street: "",
    streetAddress: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    isPrimary: false,
  });

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("razorpay");
  
  // Order state
  const [orderData, setOrderData] = useState<any>(null);
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);

  useEffect(() => {
    const loadRazorpay = () => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
    };
    loadRazorpay();
    fetchCart();
    fetchAddresses();
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/auth/user`, {
            credentials: 'include',
        });
        const data = await res.json();
        if(res.ok) {
            setUser(data);
        }
    } catch (err) {
        console.error("Error fetching user:", err);
    }
  }

  const fetchCart = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/cart`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        const items = (data.items || []).map((item: CartItem) => ({
          ...item,
          quantity: Number(item.quantity),
          price: Number(item.price),
        }));
        setCartItems(items);
      }
    } catch (err) {
      console.error("Error fetching cart:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/addresses`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      const data = await res.json();
      if (res.ok) {
        const addressList = (data.addresses || data || []).map((addr: any, index: number) => ({
          ...addr,
          // Normalize field names - handle both streetAddress and street
          street: addr.street || addr.streetAddress || "",
          streetAddress: addr.streetAddress || addr.street || "",
          id: addr.id,
        }));
        setAddresses(addressList);
        if (addressList.length > 0) {
          setSelectedAddress(addressList[0].id || "");
        }
      }
    } catch (err) {
      console.error("Error fetching addresses:", err);
      setError("Failed to load addresses");
    }
  };

  const handleAddNewAddress = async () => {
    const streetValue = newAddress.street || newAddress.streetAddress;
    if (!streetValue || !newAddress.city || !newAddress.state || !newAddress.postalCode) {
      setError("Please fill all address fields");
      return;
    }

    setLoading(true);
    try {
      const url = editingAddressId
        ? `${API_BASE_URL}/addresses/${editingAddressId}`
        : `${API_BASE_URL}/addresses`;

      const method = editingAddressId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          streetAddress: streetValue,
          city: newAddress.city,
          state: newAddress.state,
          postalCode: newAddress.postalCode,
          country: newAddress.country,
          isPrimary: newAddress.isPrimary,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        if (editingAddressId) {
          // Update existing address
          setAddresses(
            addresses.map((addr) =>
              addr.id === editingAddressId 
                ? { 
                    ...addr, 
                    ...newAddress, 
                    id: editingAddressId,
                    streetAddress: streetValue,
                    street: streetValue,
                  } 
                : addr
            )
          );
          setEditingAddressId(null);
        } else {
          // Add new address with guaranteed unique ID
          const createdAddress = { 
            ...newAddress, 
            street: streetValue,
            streetAddress: streetValue,
            id: data.id || `addr-${Date.now()}`,
          };
          setAddresses([...addresses, createdAddress]);
          setSelectedAddress(createdAddress.id);
        }
        setShowNewAddress(false);
        setNewAddress({
          street: "",
          streetAddress: "",
          city: "",
          state: "",
          postalCode: "",
          country: "",
          isPrimary: false,
        });
        setError(null);
      } else {
        setError(data.message || "Failed to save address");
      }
    } catch (err) {
      console.error("Error saving address:", err);
      setError("Failed to save address");
    } finally {
      setLoading(false);
    }
  };

  const handleEditAddress = (address: Address) => {
    setNewAddress({
      ...address,
      street: address.street || address.streetAddress || "",
      streetAddress: address.streetAddress || address.street || "",
    });
    setEditingAddressId(address.id || "");
    setShowNewAddress(true);
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm("Are you sure you want to delete this address?")) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log("Deleting address:", addressId);
      
      const res = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      const data = await res.json();
      console.log("Delete response:", res.status, data);

      if (res.ok) {
        // Only remove from UI after successful backend deletion
        setAddresses(addresses.filter((addr) => addr.id !== addressId));
        
        // If deleted address was selected, select a different one
        if (selectedAddress === addressId) {
          const remainingAddresses = addresses.filter((addr) => addr.id !== addressId);
          if (remainingAddresses.length > 0) {
            setSelectedAddress(remainingAddresses[0].id || "");
          } else {
            setSelectedAddress("");
          }
        }
        
        setError(null);
        console.log("Address deleted successfully");
      } else {
        // Detailed error logging
        console.error("Delete failed:", {
          status: res.status,
          message: data.message,
          error: data.error,
          fullResponse: data
        });
        
        const errorMsg = data.message || data.error || "Failed to delete address";
        setError(errorMsg);
      }
    } catch (err: any) {
      console.error("Error deleting address:", err);
      setError(err.message || "Error deleting address");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setShowNewAddress(false);
    setEditingAddressId(null);
    setNewAddress({
      street: "",
      streetAddress: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      isPrimary: false,
    });
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
        setError("Please select a delivery address");
        return;
    }
    if (paymentMethod === 'cash_on_delivery') {
        // Handle cash on delivery separately
        console.log("Placing order with cash on delivery");
        return;
    }

    setLoading(true);
    setError(null);
    try {
        const createOrderRes = await fetch(`${API_BASE_URL}/orders/create-razorpay-order`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
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
            name: "Oblito",
            description: "Order Payment",
            order_id: razorpayOrder.id,
            handler: async function (response: any) {
                const verifyPayload = {
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    deliveryAddressId: selectedAddress,
                    paymentMethod: 'razorpay'
                };

                const verifyRes = await fetch(`${API_BASE_URL}/orders/verify-payment`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify(verifyPayload),
                });

                const verifyData = await verifyRes.json();

                if (verifyRes.ok) {
                    const subtotal = cartItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
                    const tax = subtotal * 0.08;
                    const orderSum: OrderSummary = {
                        subtotal,
                        tax,
                        total: subtotal + tax,
                        itemCount: cartItems.length,
                    };
                    setOrderSummary(orderSum);
                    setCartItems([]);
                    setStep("review");
                    await fetchAndSetOrderData();
                } else {
                    setError(verifyData.message || "Payment verification failed");
                }
            },
            prefill: {
                name: user ? `${user.firstName} ${user.lastName}` : "",
                email: user ? user.email : "",
            },
            theme: {
                color: "#3399cc"
            }
        };
        //@ts-ignore
        const rzp = new window.Razorpay(options);
        rzp.open();

    } catch (err: any) {
        console.error("Error placing order:", err);
        setError(err.message || "Failed to place order");
    } finally {
        setLoading(false);
    }
};


  const fetchAndSetOrderData = async () => {
    try {
      // Fetch orders from backend
      const res = await fetch(`${API_BASE_URL}/orders`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      const data = await res.json();
      console.log("Fetched orders:", data);

      if (res.ok) {
        // Get the most recent order (first one, since they're ordered by creation date)
        const ordersList = Array.isArray(data) ? data : data.orders || [];
        
        if (ordersList.length > 0) {
          // Get the most recent order
          const mostRecentOrder = ordersList[0];
          setOrderData({
            // id: mostRecentOrder.id,
            orderNumber: mostRecentOrder.orderNumber || `ORD-${mostRecentOrder.id?.slice(0, 8).toUpperCase()}`,
            status: mostRecentOrder.status,
            totalAmount: mostRecentOrder.totalAmount,
            paymentMethod: mostRecentOrder.paymentMethod,
          });
          console.log("Set order data:", mostRecentOrder);
        }
      } else {
        console.error("Failed to fetch orders:", data);
      }
    } catch (err) {
      console.error("Error fetching order data:", err);
    }
  };

  const total = cartItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
  const tax = total * 0.08;
  const grandTotal = total + tax;

  if (loading && step === "address") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium">Loading checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <h1 className="text-4xl font-extrabold text-gray-900 mb-10 tracking-tight">Checkout</h1>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r shadow-sm">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Step Indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10 rounded-full"></div>
            
            {/* Step 1 */}
            <div className={`flex flex-col items-center gap-2 bg-gray-50 px-4 ${step === "address" ? "opacity-100" : "opacity-70"}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all ${step === "address" || step === "payment" || step === "review" ? "bg-gray-700 text-white shadow-md scale-110" : "bg-gray-300 text-gray-600"}`}>
                {step === "payment" || step === "review" ? <CheckCircle className="w-6 h-6" /> : "1"}
              </div>
              <span className="font-bold text-sm text-gray-900">Shipping</span>
            </div>

            {/* Step 2 */}
            <div className={`flex flex-col items-center gap-2 bg-gray-50 px-4 ${step === "payment" ? "opacity-100" : "opacity-70"}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all ${step === "payment" || step === "review" ? "bg-gray-700 text-white shadow-md scale-110" : "bg-gray-300 text-gray-600"}`}>
                {step === "review" ? <CheckCircle className="w-6 h-6" /> : "2"}
              </div>
              <span className="font-bold text-sm text-gray-900">Payment</span>
            </div>

            {/* Step 3 */}
            <div className={`flex flex-col items-center gap-2 bg-gray-50 px-4 ${step === "review" ? "opacity-100" : "opacity-70"}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all ${step === "review" ? "bg-gray-700 text-white shadow-md scale-110" : "bg-gray-300 text-gray-600"}`}>
                3
              </div>
              <span className="font-bold text-sm text-gray-900">Review</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
              {step === "address" && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                      <MapPin className="w-6 h-6 text-gray-700" />
                      Shipping Address
                    </h2>
                    {!showNewAddress && (
                      <Button
                        onClick={() => setShowNewAddress(true)}
                        className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl"
                      >
                        <Plus className="w-4 h-4 mr-2" /> Add New
                      </Button>
                    )}
                  </div>

                  {/* Existing Addresses */}
                  {addresses.length > 0 && !showNewAddress && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map((addr) => {
                        const displayStreet = addr.street || addr.streetAddress || "No street address";
                        const isSelected = selectedAddress === addr.id;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => setSelectedAddress(addr.id || "")}
                            className={`relative p-5 border-2 rounded-2xl cursor-pointer transition-all hover:shadow-md ${
                              isSelected 
                                ? "border-gray-700 bg-gray-700/5" 
                                : "border-gray-100 hover:border-gray-200"
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-gray-700" : "border-gray-300"}`}>
                                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-gray-700" />}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleEditAddress(addr); }}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addr.id || ""); }}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            
                            <p className="font-bold text-gray-900 mb-1">{displayStreet}</p>
                            <p className="text-sm text-gray-500 mb-3">
                              {addr.city}, {addr.state} {addr.postalCode}
                            </p>
                            <p className="text-sm text-gray-500 uppercase tracking-wider font-medium text-xs">{addr.country}</p>
                            
                            {addr.isPrimary && (
                              <span className="absolute top-4 right-4 text-[10px] font-bold bg-gray-900 text-white px-2 py-1 rounded-full">
                                DEFAULT
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add/Edit Address Form */}
                  {showNewAddress && (
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 animate-in fade-in slide-in-from-top-4">
                      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        {editingAddressId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        {editingAddressId ? "Edit Address" : "New Address"}
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Street Address</label>
                          <input
                            type="text"
                            value={newAddress.street || newAddress.streetAddress || ""}
                            onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value, streetAddress: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-400 focus:border-transparent outline-none transition-all"
                            placeholder="123 Main St"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">City</label>
                            <input
                              type="text"
                              value={newAddress.city}
                              onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-400 focus:border-transparent outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">State</label>
                            <input
                              type="text"
                              value={newAddress.state}
                              onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-400 focus:border-transparent outline-none transition-all"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Postal Code</label>
                            <input
                              type="text"
                              value={newAddress.postalCode}
                              onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-400 focus:border-transparent outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Country</label>
                            <input
                              type="text"
                              value={newAddress.country}
                              onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-400 focus:border-transparent outline-none transition-all"
                            />
                          </div>
                        </div>
                        <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-white transition-colors">
                          <input
                            type="checkbox"
                            checked={newAddress.isPrimary}
                            onChange={(e) => setNewAddress({ ...newAddress, isPrimary: e.target.checked })}
                            className="w-5 h-5 text-gray-700 focus:ring-gray-400"
                          />
                          <span className="text-sm font-medium text-gray-700">Set as default address</span>
                        </label>
                        <div className="flex gap-3 pt-2">
                          <Button
                            onClick={handleAddNewAddress}
                            disabled={loading}
                            className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-bold py-6 rounded-xl"
                          >
                            {loading ? "Saving..." : editingAddressId ? "Update Address" : "Save Address"}
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 py-6 rounded-xl border-gray-200"
                            onClick={handleCancelEdit}
                            disabled={loading}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === "payment" && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <CreditCard className="w-6 h-6 text-gray-700" />
                    Payment Method
                  </h2>

                  <div className="grid grid-cols-1 gap-4">
                    <label className={`flex items-center p-5 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === "razorpay" ? "border-gray-700 bg-gray-700/5" : "border-gray-100 hover:border-gray-200"}`}>
                      <input
                        type="radio"
                        name="payment"
                        value="razorpay"
                        checked={paymentMethod === "razorpay"}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="w-5 h-5 text-gray-700 focus:ring-gray-400 mr-4"
                      />
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">Razorpay</p>
                        <p className="text-sm text-gray-500">Pay securely with Razorpay</p>
                      </div>
                      <CreditCard className="w-6 h-6 text-gray-400" />
                    </label>

                    <label className={`flex items-center p-5 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === "cash_on_delivery" ? "border-gray-700 bg-gray-700/5" : "border-gray-100 hover:border-gray-200"}`}>
                      <input
                        type="radio"
                        name="payment"
                        value="cash_on_delivery"
                        checked={paymentMethod === "cash_on_delivery"}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="w-5 h-5 text-gray-700 focus:ring-gray-400 mr-4"
                      />
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">Cash on Delivery</p>
                        <p className="text-sm text-gray-500">Pay when your order arrives</p>
                      </div>
                      <Truck className="w-6 h-6 text-gray-400" />
                    </label>
                  </div>
                </div>
              )}

              {step === "review" && (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-300">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                  <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Order Placed Successfully!</h2>
                  <p className="text-gray-500 mb-8 text-lg">Thank you for your purchase. We've sent a confirmation email to your inbox.</p>
                  
                  {orderData && (
                    <div className="max-w-md mx-auto bg-gray-50 rounded-2xl p-6 text-left border border-gray-200 mb-8">
                      <h3 className="font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">Order Receipt</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Order Number</span>
                          <span className="font-mono font-medium">{orderData.orderNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Status</span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 capitalize">
                            {orderData.status}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Payment Method</span>
                          <span className="capitalize">{orderData.paymentMethod.replace(/_/g, " ")}</span>
                        </div>
                        <div className="flex justify-between pt-3 border-t border-gray-200">
                          <span className="font-bold text-gray-900">Total Amount</span>
                          <span className="font-bold text-gray-900 text-lg">${orderData.totalAmount}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <Link href="/returns-and-orders">
                    <Button className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-6 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                      View My Orders
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-gray-700" />
                Order Summary
              </h2>

              <div className="space-y-4 mb-6 pb-6 border-b border-dashed border-gray-200 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {step === "review" && orderSummary ? (
                  <p className="text-gray-500 italic text-center py-4">
                    {orderSummary.itemCount} item{orderSummary.itemCount !== 1 ? 's' : ''} in this order
                  </p>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.cartItemId} className="flex justify-between items-start gap-4">
                      <div className="flex gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <img 
                            src={Array.isArray(item.imageUrl) ? item.imageUrl[0] : item.imageUrl} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.name}</p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-medium text-sm">
                        ${(Number(item.price) * Number(item.quantity)).toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">${step === "review" && orderSummary ? orderSummary.subtotal.toFixed(2) : total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded text-xs">Free</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (8%)</span>
                  <span className="font-medium">${step === "review" && orderSummary ? orderSummary.tax.toFixed(2) : tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-end pt-4 border-t border-gray-100">
                  <span className="font-bold text-gray-900 text-lg">Total</span>
                  <span className="font-extrabold text-gray-900 text-2xl">
                    ${step === "review" && orderSummary ? orderSummary.total.toFixed(2) : grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {step === "address" && (
                  <Button
                    onClick={() => setStep("payment")}
                    disabled={!selectedAddress}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-6 rounded-xl shadow-md hover:shadow-lg transition-all"
                  >
                    Continue to Payment <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
                {step === "payment" && (
                  <>
                    <Button
                      onClick={handlePlaceOrder}
                      disabled={loading}
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-6 rounded-xl shadow-md hover:shadow-lg transition-all"
                    >
                      {loading ? "Processing..." : "Place Order"}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setStep("address")}
                      className="w-full py-6 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                      disabled={loading}
                    >
                      Back to Address
                    </Button>
                  </>
                )}
              </div>
              
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                Secure SSL Encryption
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

