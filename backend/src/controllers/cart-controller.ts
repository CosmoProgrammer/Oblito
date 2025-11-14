import { z } from 'zod';

import db from '../db/index.js';
import { carts } from '../db/schema/carts.js';
import { cartItems } from '../db/schema/cartItems.js';
import { shopInventory } from '../db/schema/shopInventory.js';
import { products } from '../db/schema/products.js';
import { eq, and, sql } from 'drizzle-orm';

import { addToCartSchema, updateCartItemSchema } from '../validation/cart-validation.js';

async function getOrCreateCart(userId: string) {
    const existingCart = await db.select().from(carts).where(eq(carts.customerId, userId)).limit(1);
    if (!existingCart[0] || existingCart.length <= 0) {
        const newCart = await db.insert(carts).values({
            customerId: userId
        }).returning();
        return newCart[0];
    } else {
        return existingCart[0];
    }
}

export const handleGetCart = async (req: any, res: any) => {
    try {
        const user = req.user as { 
            id: string, 
            email: string, 
            profilePictureUrl: string | null, 
            firstName: string, 
            lastName: string, 
            role: 'customer' | 'retailer' | 'wholesaler' 
        };
        
        const cart = await db.select().from(carts).where(eq(carts.customerId, user.id)).limit(1);

        if(cart.length === 0 || !cart[0]){ return res.json({ items: [], total: 0 }); }

        const items = await db.select({
                cartItemId: cartItems.id,
                quantity: cartItems.quantity,
                productId: shopInventory.productId,
                name: products.name,
                imageUrl: products.imageURLs,
                price: shopInventory.price,
                stockAvailable: shopInventory.stockQuantity,
            })
            .from(cartItems)
            .innerJoin(shopInventory, eq(cartItems.shopInventoryId, shopInventory.id))
            .innerJoin(products, eq(shopInventory.productId, products.id))
            .where(eq(cartItems.cartId, cart[0].id));

        res.json({
            items: items,
            total: items.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0),
        });
    } catch (e) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ errors: e.issues });
        }
        console.error('Error fetching cart:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const handlePostCart = async (req: any, res: any) => {
    try {
        const user = req.user as { 
            id: string, 
            email: string, 
            profilePictureUrl: string | null, 
            firstName: string, 
            lastName: string, 
            role: 'customer' | 'retailer' | 'wholesaler' 
        };
        const { shopInventoryId, quantity } = addToCartSchema.parse(req.body);

        const cart = await getOrCreateCart(user.id);

        const existingCartItem = await db.select().from(cartItems).where(and(
            eq(cartItems.cartId, cart!.id),
            eq(cartItems.shopInventoryId, shopInventoryId)
        )).limit(1);

        if(existingCartItem.length > 0 && existingCartItem[0]) {
            const currentQty = Number(existingCartItem[0].quantity);
            const newQty = currentQty + quantity;

            await db.update(cartItems)
                .set({ quantity: newQty.toString() })
                .where(eq(cartItems.id, existingCartItem[0].id));

            return res.json({ message: "Cart updated", cartItemId: existingCartItem[0].id });
        } else {
            const newItem = await db.insert(cartItems).values({
                cartId: cart!.id,
                shopInventoryId: shopInventoryId,
                quantity: quantity.toString(),
            }).returning();

            return res.status(201).json({ message: "Item added to cart", cartItemId: newItem[0]!.id });
        }
    } catch (e) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ errors: e.issues });
        }
        console.error('Error adding to cart:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const handlePutCart = async (req: any, res: any) => {
    try {
        const cartItemId = req.params.id;
        const { quantity } = updateCartItemSchema.parse(req.body);
        const user = req.user as { 
            id: string, 
            email: string, 
            profilePictureUrl: string | null, 
            firstName: string, 
            lastName: string, 
            role: 'customer' | 'retailer' | 'wholesaler' 
        };

        const cart = await db.select().from(carts).where(eq(carts.customerId, user.id)).limit(1);

        if (cart.length === 0) return res.status(404).json({ message: "Cart not found" });

        const updated = await db.update(cartItems)
            .set({ quantity: quantity.toString() })
            .where(and(
                eq(cartItems.id, cartItemId),
                eq(cartItems.cartId, cart[0]!.id)
            ))
            .returning();

        if (updated.length === 0) {
            return res.status(404).json({ message: "Item not found in cart" });
        }
    } catch (e) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ errors: e.issues });
        }
        console.error('Error updating cart:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export const handleDeleteCartItem = async (req: any, res: any) => {
    try {
        const cartItemId = req.params.id;
        const user = req.user as { 
            id: string, 
            email: string, 
            profilePictureUrl: string | null, 
            firstName: string, 
            lastName: string, 
            role: 'customer' | 'retailer' | 'wholesaler' 
        };

        const cart = await db.select().from(carts).where(eq(carts.customerId, user.id)).limit(1);
        if (cart.length === 0) return res.status(404).json({ message: "Cart not found" });

        const deleted = await db.delete(cartItems)
            .where(and(
                eq(cartItems.id, cartItemId),
                eq(cartItems.cartId, cart[0]!.id)
            ))
            .returning();

        if (deleted.length === 0) {
            return res.status(404).json({ message: "Item not found in cart" });
        }

        res.json({ message: "Item removed from cart" });
    } catch (e) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ errors: e.issues });
        }
        console.error('Error deleting cart item:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
}