"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle, Trash2, Edit2 } from "lucide-react";

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

type PaymentMethod = "credit_card" | "upi" | "cash_on_delivery";

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

const API_BASE_URL = "http://localhost:8000";

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"address" | "payment" | "review">("address");

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("credit_card");
  const [cardDetails, setCardDetails] = useState({
    cardName: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });
  const [upiId, setUpiId] = useState("");

  // Order state
  const [orderData, setOrderData] = useState<any>(null);
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);

  useEffect(() => {
    fetchCart();
    fetchAddresses();
  }, []);

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
    if (!paymentMethod) {
      setError("Please select a payment method");
      return;
    }

    // Validate card details if credit card
    if (paymentMethod === "credit_card") {
      if (!cardDetails.cardNumber || !cardDetails.expiryDate || !cardDetails.cvv) {
        setError("Please enter valid card details");
        return;
      }
    }

    // Validate UPI if UPI
    if (paymentMethod === "upi" && !upiId) {
      setError("Please enter a valid UPI ID");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Calculate and store order summary BEFORE clearing cart
      const subtotal = cartItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
      const tax = subtotal * 0.08;
      const orderSum: OrderSummary = {
        subtotal,
        tax,
        total: subtotal + tax,
        itemCount: cartItems.length,
      };

      // Prepare order payload
      const orderPayload = {
        deliveryAddressId: selectedAddress,
        paymentMethod: paymentMethod,
      };

      console.log("Placing order with payload:", orderPayload);

      // POST order to backend
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      console.log("Order response:", res.status, data);

      if (res.ok) {
        setError(null);
        
        // Store order summary BEFORE clearing cart
        setOrderSummary(orderSum);
        
        // Clear cart after storing summary
        setCartItems([]);
        
        setStep("review");

        // Fetch the created order data
        await fetchAndSetOrderData();
      } else {
        const errorMsg = data.message || data.error || "Failed to place order";
        setError(errorMsg);
        console.error("Order error:", data);
      }
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
      <div className="min-h-screen bg-[#FFE4C4] flex items-center justify-center">
        <p className="text-gray-600">Loading checkout...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFE4C4]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Checkout</h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {/* Step Indicator */}
        <div className="flex justify-between mb-8">
          <div
            className={`flex-1 text-center pb-4 ${
              step === "address" ? "border-b-4 border-[#febd69]" : "border-b-2 border-gray-200"
            }`}
          >
            <p className={`font-bold ${step === "address" ? "text-[#febd69]" : "text-gray-600"}`}>
              1. Shipping Address
            </p>
          </div>
          <div className="flex-1" />
          <div
            className={`flex-1 text-center pb-4 ${
              step === "payment" ? "border-b-4 border-[#febd69]" : "border-b-2 border-gray-200"
            }`}
          >
            <p className={`font-bold ${step === "payment" ? "text-[#febd69]" : "text-gray-600"}`}>
              2. Payment Method
            </p>
          </div>
          <div className="flex-1" />
          <div
            className={`flex-1 text-center pb-4 ${
              step === "review" ? "border-b-4 border-[#febd69]" : "border-b-2 border-gray-200"
            }`}
          >
            <p className={`font-bold ${step === "review" ? "text-[#febd69]" : "text-gray-600"}`}>
              3. Review & Place Order
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-8">
            {step === "address" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Shipping Address</h2>

                  {/* Existing Addresses */}
                  {addresses.length > 0 && (
                    <div className="space-y-3 mb-8">
                      <h3 className="font-semibold text-gray-900">Your Addresses</h3>
                      {addresses.map((addr) => {
                        const displayStreet = addr.street || addr.streetAddress || "No street address";
                        return (
                          <div
                            key={addr.id}
                            className="flex items-start p-4 border rounded-lg hover:bg-gray-50 group"
                          >
                            <input
                              type="radio"
                              name="address"
                              value={addr.id}
                              checked={selectedAddress === addr.id}
                              onChange={(e) => setSelectedAddress(e.target.value)}
                              className="mt-1 mr-4"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{displayStreet}</p>
                              <p className="text-sm text-gray-600">
                                {addr.city}, {addr.state} {addr.postalCode}, {addr.country}
                              </p>
                              {addr.isPrimary && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mt-2 inline-block">
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEditAddress(addr)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                title="Edit address"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteAddress(addr.id || "")}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                                title="Delete address"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add/Edit Address Form */}
                  {!showNewAddress ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowNewAddress(true)}
                    >
                      + Add New Address
                    </Button>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 p-6 rounded-lg space-y-4">
                      <h3 className="font-semibold text-gray-900">
                        {editingAddressId ? "Edit Address" : "New Address"}
                      </h3>
                      <input
                        type="text"
                        placeholder="Street Address"
                        value={newAddress.street || newAddress.streetAddress || ""}
                        onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value, streetAddress: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="City"
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                        <input
                          type="text"
                          placeholder="State"
                          value={newAddress.state}
                          onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Postal Code"
                          value={newAddress.postalCode}
                          onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                        <input
                          type="text"
                          placeholder="Country"
                          value={newAddress.country}
                          onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                      </div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newAddress.isPrimary}
                          onChange={(e) => setNewAddress({ ...newAddress, isPrimary: e.target.checked })}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700">Set as default address</span>
                      </label>
                      <div className="flex gap-3">
                        <Button
                          onClick={handleAddNewAddress}
                          disabled={loading}
                          className="flex-1 bg-[#febd69] hover:bg-[#f5a623] text-black"
                        >
                          {loading ? "Saving..." : editingAddressId ? "Update Address" : "Save Address"}
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={handleCancelEdit}
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === "payment" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment Method</h2>

                {/* Credit Card */}
                <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50" style={{borderColor: paymentMethod === "credit_card" ? "#febd69" : "#e5e7eb"}}>
                  <input
                    type="radio"
                    name="payment"
                    value="credit_card"
                    checked={paymentMethod === "credit_card"}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="mt-1 mr-4"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Credit Card</p>
                    <p className="text-sm text-gray-600">Visa, Mastercard, or American Express</p>
                  </div>
                </label>

                {paymentMethod === "credit_card" && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <input
                      type="text"
                      placeholder="Cardholder Name"
                      value={cardDetails.cardName}
                      onChange={(e) => setCardDetails({ ...cardDetails, cardName: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Card Number (16 digits)"
                      maxLength={16}
                      value={cardDetails.cardNumber}
                      onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value.replace(/\D/g, "") })}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="MM/YY"
                        maxLength={5}
                        value={cardDetails.expiryDate}
                        onChange={(e) => setCardDetails({ ...cardDetails, expiryDate: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder="CVV"
                        maxLength={3}
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/\D/g, "") })}
                        className="w-full px-4 py-2 border rounded-lg"
                      />
                    </div>
                  </div>
                )}

                {/* UPI */}
                <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50" style={{borderColor: paymentMethod === "upi" ? "#febd69" : "#e5e7eb"}}>
                  <input
                    type="radio"
                    name="payment"
                    value="upi"
                    checked={paymentMethod === "upi"}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="mt-1 mr-4"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">UPI</p>
                    <p className="text-sm text-gray-600">Google Pay, PhonePe, Paytm, or any UPI app</p>
                  </div>
                </label>

                {paymentMethod === "upi" && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <input
                      type="text"
                      placeholder="UPI ID (example@upi)"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                )}

                {/* Cash on Delivery */}
                <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50" style={{borderColor: paymentMethod === "cash_on_delivery" ? "#febd69" : "#e5e7eb"}}>
                  <input
                    type="radio"
                    name="payment"
                    value="cash_on_delivery"
                    checked={paymentMethod === "cash_on_delivery"}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="mt-1 mr-4"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Cash on Delivery</p>
                    <p className="text-sm text-gray-600">Pay when your order arrives</p>
                  </div>
                </label>
              </div>
            )}

            {step === "review" && (
              <div className="space-y-6">
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h2>
                  <p className="text-gray-600 mb-2">Thank you for your order. You will receive a confirmation email shortly.</p>
                  
                  {orderData && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left">
                      <p className="text-sm text-gray-600 mb-3"><strong>Order Details:</strong></p>
                      <p className="text-sm"><strong>Order Number:</strong> {orderData.orderNumber}</p>
                      <p className="text-sm"><strong>Status:</strong> {orderData.status}</p>
                      <p className="text-sm"><strong>Total Amount:</strong> ${orderData.totalAmount}</p>
                      <p className="text-sm"><strong>Payment Method:</strong> {orderData.paymentMethod}</p>
                    </div>
                  )}

                  <Link href="/returns-and-orders">
                    <Button className="bg-[#febd69] hover:bg-[#f5a623] text-black mt-6">
                      View My Orders
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="bg-white rounded-lg shadow-sm p-6 h-fit sticky top-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
              {/* Show items from orderSummary if on review page, otherwise from cartItems */}
              {step === "review" && orderSummary ? (
                <p className="text-sm text-gray-600">
                  {orderSummary.itemCount} item{orderSummary.itemCount !== 1 ? 's' : ''} ordered
                </p>
              ) : (
                cartItems.map((item) => (
                  <div key={item.cartItemId} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.name} x {item.quantity}
                    </span>
                    <span className="font-medium">
                      ${(Number(item.price) * Number(item.quantity)).toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${step === "review" && orderSummary ? orderSummary.subtotal.toFixed(2) : total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (est.)</span>
                <span>${step === "review" && orderSummary ? orderSummary.tax.toFixed(2) : tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-3 border-t border-gray-200">
                <span>Total</span>
                <span>${step === "review" && orderSummary ? orderSummary.total.toFixed(2) : grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3">
              {step === "address" && (
                <Button
                  onClick={() => setStep("payment")}
                  disabled={!selectedAddress}
                  className="w-full bg-[#febd69] hover:bg-[#f5a623] text-black font-bold"
                >
                  Continue to Payment
                </Button>
              )}
              {step === "payment" && (
                <>
                  <Button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="w-full bg-[#febd69] hover:bg-[#f5a623] text-black font-bold"
                  >
                    {loading ? "Placing Order..." : "Place Order"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setStep("address")}
                    className="w-full"
                    disabled={loading}
                  >
                    Back to Address
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
