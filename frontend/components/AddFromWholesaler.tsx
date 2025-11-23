"use client";

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from './ui/dialog';
import { toast } from "sonner";
import { Loader2, CreditCard } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';

const API_BASE_URL = "http://localhost:8000";

interface WarehouseProduct {
    id: string; // This is warehouseInventoryId
    name: string;
    description: string;
    price: string; // This is the wholesale price
    stockQuantity: string;
    imageURLs: string[];
}

interface Pagination {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
}
type User = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePictureUrl: string | null;
}
type PaymentMethod = "razorpay" | "cash_on_delivery";


export function AddFromWholesaler({ onClose, onProductAdded }: { onClose: () => void; onProductAdded: () => void; }) {
    const [products, setProducts] = useState<WarehouseProduct[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [user, setUser] = useState<User | null>(null);

    const [selectedProduct, setSelectedProduct] = useState<WarehouseProduct | null>(null);
    const [listingDetails, setListingDetails] = useState({ price: '', stockQuantity: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("razorpay");

    
    useEffect(() => {
        const loadRazorpay = () => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.async = true;
            document.body.appendChild(script);
        };
        loadRazorpay();
        fetchUser();

        const fetchProducts = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    page: page.toString(),
                    limit: '6',
                    search: searchTerm,
                });
                const res = await fetch(`${API_BASE_URL}/warehouse-products?${params.toString()}`, { credentials: 'include' });
                if (!res.ok) throw new Error("Failed to fetch wholesale products");
                const data = await res.json();
                setProducts(data.products);
                setPagination(data.pagination);
            } catch (error) {
                console.error(error);
                toast.error("Failed to load wholesale products.");
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(() => fetchProducts(), 300); // Debounce search
        return () => clearTimeout(timer);

    }, [page, searchTerm]);

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

    const handleAddClick = (product: WarehouseProduct) => {
        setSelectedProduct(product);
        setListingDetails({ price: '', stockQuantity: '' });
    };

    const handleConfirmListing = async () => {
        if (!selectedProduct || !listingDetails.price || !listingDetails.stockQuantity) {
            toast.error("Please provide a price and quantity.");
            return;
        }

        setIsSubmitting(true);

        if (paymentMethod === 'razorpay') {
            try {
                const createOrderRes = await fetch(`${API_BASE_URL}/orders/create-wholesale-razorpay-order`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        warehouseInventoryId: selectedProduct.id,
                        quantity: parseInt(listingDetails.stockQuantity),
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
                    name: "Oblito Wholesale",
                    description: `Payment for ${selectedProduct.name}`,
                    order_id: razorpayOrder.id,
                    handler: async function (response: any) {
                        const verifyPayload = {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            warehouseInventoryId: selectedProduct.id,
                            quantity: parseInt(listingDetails.stockQuantity),
                            shopPrice: parseFloat(listingDetails.price)
                        };

                        const verifyRes = await fetch(`${API_BASE_URL}/orders/verify-wholesale-payment`, {
                            method: 'POST',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(verifyPayload),
                        });

                        const verifyData = await verifyRes.json();

                        if (verifyRes.ok) {
                            toast.success(`Successfully listed ${selectedProduct.name}!`);
                            setSelectedProduct(null);
                            onProductAdded();
                            onClose();
                        } else {
                            toast.error(verifyData.message || "Payment verification failed");
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

            } catch (error: any) {
                console.error(error);
                toast.error(error.message);
            } finally {
                setIsSubmitting(false);
            }
        } else {
            // Handle other payment methods like cash on delivery
            try {
                const res = await fetch(`${API_BASE_URL}/wholesale-orders`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        warehouseInventoryId: selectedProduct.id,
                        quantity: parseInt(listingDetails.stockQuantity),
                        paymentMethod: 'cash_on_delivery',
                        isProxyItem: false,
                        shopPrice: parseFloat(listingDetails.price)
                    }),
                });
                if (!res.ok) {
                     const errorData = await res.json();
                     throw new Error(errorData.message || "Failed to create listing.");
                }
                
                toast.success(`Successfully listed ${selectedProduct.name}!`);
                setSelectedProduct(null);
                onProductAdded(); 
                onClose();
    
            } catch (error: any) {
                console.error(error);
                toast.error(error.message);
            } finally {
                setIsSubmitting(false);
            }
        }
    };
    
    return (
        <div className="max-h-[80vh] flex flex-col">
            <div className="p-4 sticky top-0 bg-white z-10 border-b">
                <Input 
                    placeholder="Search wholesale products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="overflow-y-auto flex-grow">
                {loading && <div className="flex justify-center items-center p-8"><Loader2 className="animate-spin" /></div>}
                {!loading && products.length === 0 && <p className="text-center p-4 text-gray-500">No wholesale products found.</p>}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                    {products.map(product => (
                        <div key={product.id} className="border rounded-lg p-4 flex flex-col transition-shadow hover:shadow-md">
                            <img src={product.imageURLs?.[0] || '/placeholder.svg'} alt={product.name} className="w-full h-32 object-cover rounded-md mb-4 bg-gray-100" />
                            <h3 className="font-semibold text-sm line-clamp-2 flex-grow">{product.name}</h3>
                            <div className="mt-4 pt-4 border-t">
                                <p className="text-lg font-bold">₹{product.price}</p>
                                <p className="text-xs text-gray-500">{product.stockQuantity} in stock (Wholesaler)</p>
                                <Button className="w-full mt-2" size="sm" onClick={() => handleAddClick(product)}>Add to my Store</Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {pagination && pagination.totalPages > 1 && (
                <div className="p-4 border-t flex justify-center items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Previous</Button>
                    <span className="text-sm font-medium">Page {page} of {pagination.totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === pagination.totalPages}>Next</Button>
                </div>
            )}

            {/* Dialog for setting price and quantity */}
            <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>List "{selectedProduct?.name}" in your store</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-gray-600">This product costs you ₹{selectedProduct?.price}. Set your selling price and how many units you want to stock.</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Your Selling Price (₹)</label>
                                <Input 
                                    type="number" 
                                    placeholder={`e.g. ${(parseFloat(selectedProduct?.price || '0') * 1.2).toFixed(2)}`}
                                    value={listingDetails.price}
                                    onChange={e => setListingDetails({...listingDetails, price: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Quantity to stock</label>
                                <Input
                                    type="number"
                                    max={selectedProduct?.stockQuantity}
                                    placeholder={`Max: ${selectedProduct?.stockQuantity}`}
                                    value={listingDetails.stockQuantity}
                                    onChange={e => setListingDetails({...listingDetails, stockQuantity: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Payment Method</Label>
                            <RadioGroup
                                value={paymentMethod}
                                onValueChange={(value: any) => setPaymentMethod(value)}
                                className="flex gap-4"
                            >
                                <Label htmlFor="razorpay" className={`flex items-center gap-2 border rounded-md p-3 w-full cursor-pointer ${paymentMethod === 'razorpay' ? 'border-blue-500' : ''}`}>
                                    <RadioGroupItem value="razorpay" id="razorpay"/>
                                    <CreditCard className="w-5 h-5"/>
                                    <span>Razorpay</span>
                                </Label>
                                <Label htmlFor="cod" className={`flex items-center gap-2 border rounded-md p-3 w-full cursor-pointer ${paymentMethod === 'cash_on_delivery' ? 'border-blue-500' : ''}`}>
                                    <RadioGroupItem value="cash_on_delivery" id="cod"/>
                                    <span>Cash on Delivery</span>
                                </Label>
                            </RadioGroup>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        {paymentMethod === 'razorpay' ? (
                            <Button onClick={handleConfirmListing} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Pay with Razorpay
                            </Button>
                        ) : (
                            <Button onClick={handleConfirmListing} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirm Listing
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
