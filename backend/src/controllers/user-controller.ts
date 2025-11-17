import { z } from 'zod';

import db from '../db/index.js';
import { users } from '../db/schema/users.js';
import { addresses } from '../db/schema/addresses.js';
import { shops } from '../db/schema/shops.js';
import { warehouses } from '../db/schema/warehouses.js';

import { eq, and, ne } from 'drizzle-orm';

import { updateProfileSchema, entitySettingsSchema, uploadQuerySchema } from '../validation/user-validation.js';
import { getS3UploadUrlForProfile } from '../services/s3-service.js';

export const handleGetMe = async (req: any, res: any) => {
    try {
        const user = req.user as { 
            id: string, 
            email: string, 
            profilePictureUrl: string | null, 
            firstName: string, 
            lastName: string, 
            role: 'customer' | 'retailer' | 'wholesaler' 
        };

        const dbUser = await db.query.users.findFirst({
            where: eq(users.id, user.id),
            with: {},
        });

        if (!dbUser) return res.status(404).json({ message: "User not found" });

        let entityDetails = null;

        if (dbUser.role === 'retailer') {
            entityDetails = await db.query.shops.findFirst({ where: eq(shops.ownerId, user.id) });
        } else if (dbUser.role === 'wholesaler') {
            entityDetails = await db.query.warehouses.findFirst({ where: eq(warehouses.ownerId, user.id) });
        }

        const { passwordHash, ...safeUser } = dbUser;

        res.json({ 
            user: safeUser, 
            entity: entityDetails 
        });
    } catch (e) {
            console.log('Error getting user details:', e);
            if (e instanceof z.ZodError) {
                return res.status(400).json({ errors: e.issues });
            }
            console.error('Error fetching user details:', e);
            
            res.status(500).json({ message: e })
    }
};

export const handlePatchMe = async (req: any, res: any) => {
    try {
        const user = req.user as { 
            id: string, 
            email: string, 
            profilePictureUrl: string | null, 
            firstName: string, 
            lastName: string, 
            role: 'customer' | 'retailer' | 'wholesaler' 
        };

        const data = updateProfileSchema.parse(req.body);
        if (data.phone) {
            const existing = await db.query.users.findFirst({
                where: and(eq(users.phone, data.phone), ne(users.id, user.id))
            });
            if (existing) return res.status(409).json({ message: "Phone number already in use" });
        }

        const updatedUser = await db.update(users)
            .set(data)
            .where(eq(users.id, user.id))
            .returning({
                id: users.id,
                email: users.email,
                phone: users.phone,
                firstName: users.firstName,
                lastName: users.lastName,
                role: users.role,
                profilePictureUrl: users.profilePictureUrl,
                createdAt: users.createdAt,
                googleId: users.googleId,
            });
        
        const safeUser = updatedUser[0];
        res.json({ message: "Profile updated", user: safeUser });
    } catch (e) {
            console.log('Error patching user details:', e);
            if (e instanceof z.ZodError) {
                return res.status(400).json({ errors: e.issues });
            }
            console.error('Error patching user details:', e);
            
            res.status(500).json({ message: e })
    }
};

export const handleGetUploadUrl = async (req: any, res: any) => {
    try {
        console.log('Received upload URL request with query:', req.query);
        const { fileName, fileType } = uploadQuerySchema.parse(req.query);
        const { uploadUrl, finalUrl } = await getS3UploadUrlForProfile(fileName, fileType);
        console.log('Generated final url:', finalUrl);
        console.log('Signed URL:', uploadUrl);
        res.json({ uploadUrl, finalUrl });
    } catch (e) {
        console.log('Error generating upload URL:', e);
        if (e instanceof z.ZodError) {
            return res.status(400).json({ errors: e.issues });
        }
        console.error('Error generating upload URL:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const handleGetShop = async (req: any, res: any) => {
    try {
        const user = req.user as { 
            id: string, 
            email: string, 
            profilePictureUrl: string | null, 
            firstName: string, 
            lastName: string, 
            role: 'customer' | 'retailer' | 'wholesaler' 
        };

        const result = await db.select()
            .from(shops)
            .leftJoin(addresses, eq(shops.addressId, addresses.id))
            .where(eq(shops.ownerId, user.id))
            .limit(1);

        if (result.length === 0 || !result[0]) {
            return res.status(404).json({ message: "Shop not found" });
        }

        const { shops: shopData, addresses: addressData } = result[0];

        res.json({
            ...shopData,
            address: addressData || null
        });        
    } catch (e) {
            console.log('Error getting shop details:', e);
            if (e instanceof z.ZodError) {
                return res.status(400).json({ errors: e.issues });
            }
            console.error('Error getting shop details:', e);
            
            res.status(500).json({ message: e })
    }
};

export const handleGetWarehouse = async (req: any, res: any) => {
    try {
        const user = req.user as { 
            id: string, 
            email: string, 
            profilePictureUrl: string | null, 
            firstName: string, 
            lastName: string, 
            role: 'customer' | 'retailer' | 'wholesaler' 
        };

        const result = await db.select()
            .from(warehouses)
            .leftJoin(addresses, eq(warehouses.addressId, addresses.id))
            .where(eq(warehouses.ownerId, user.id))
            .limit(1);

        if (result.length === 0 || !result[0]) {
            return res.status(404).json({ message: "Warehouse not found" });
        }

        const { warehouses: warehouseData, addresses: addressData } = result[0];

        res.json({
            ...warehouseData,
            address: addressData || null
        });        
    } catch (e) {
            console.log('Error getting warehouse details:', e);
            if (e instanceof z.ZodError) {
                return res.status(400).json({ errors: e.issues });
            }
            console.error('Error getting warehouse details:', e);
            
            res.status(500).json({ message: e })
    }
};

export const handlePatchShop = async (req: any, res: any) => {
    try {
        const user = req.user as { 
            id: string, 
            email: string, 
            profilePictureUrl: string | null, 
            firstName: string, 
            lastName: string, 
            role: 'customer' | 'retailer' | 'wholesaler' 
        };

        const { name, description, addressId } = entitySettingsSchema.parse(req.body);

        if (addressId) {
            const addr = await db.query.addresses.findFirst({
                where: and(eq(addresses.id, addressId), eq(addresses.userId, user.id))
            });
            if (!addr) return res.status(400).json({ message: "Invalid address ID" });
        }

        const updatedShop = await db.update(shops)
            .set({ name, description, addressId })
            .where(eq(shops.ownerId, user.id))
            .returning();

        if (!updatedShop.length) return res.status(404).json({ message: "Shop not found" });

        res.json({ message: "Shop updated", shop: updatedShop[0] });
    } catch (e) {
            console.log('Error patching shop details:', e);
            if (e instanceof z.ZodError) {
                return res.status(400).json({ errors: e.issues });
            }
            console.error('Error patching shop details:', e);
            
            res.status(500).json({ message: e })
    }
};

export const handlePatchWarehouse = async (req: any, res: any) => {
    try {
        const user = req.user as { 
            id: string, 
            email: string, 
            profilePictureUrl: string | null, 
            firstName: string, 
            lastName: string, 
            role: 'customer' | 'retailer' | 'wholesaler' 
        };

        const { name, addressId } = entitySettingsSchema.parse(req.body);

        if (addressId) {
            const addr = await db.query.addresses.findFirst({
                where: and(eq(addresses.id, addressId), eq(addresses.userId, user.id))
            });
            if (!addr) return res.status(400).json({ message: "Invalid address ID" });
        }

        const updatedWarehouse = await db.update(warehouses)
            .set({ name, addressId })
            .where(eq(warehouses.ownerId, user.id))
            .returning();

        if (!updatedWarehouse.length) return res.status(404).json({ message: "Warehouse not found" });

        res.json({ message: "Warehouse updated", warehouse: updatedWarehouse[0] });
    } catch (e) {
            console.log('Error patching warehouse details:', e);
            if (e instanceof z.ZodError) {
                return res.status(400).json({ errors: e.issues });
            }
            console.error('Error patching warehouse details:', e);
            
            res.status(500).json({ message: e })
    }
};