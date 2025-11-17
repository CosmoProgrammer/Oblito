import { email, z } from 'zod';

import db from '../db/index.js';
import { users } from '../db/schema/users.js';
import { addresses } from '../db/schema/addresses.js';
import { shops } from '../db/schema/shops.js';
import { warehouses } from '../db/schema/warehouses.js';

import { eq, and, ne } from 'drizzle-orm';

import { updateProfileSchema, addressSchema, entitySettingsSchema, uploadQuerySchema } from '../validation/user-validation.js';
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