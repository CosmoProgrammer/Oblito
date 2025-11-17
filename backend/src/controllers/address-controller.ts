import { z } from 'zod';

import db from '../db/index.js';
import { addresses } from '../db/schema/addresses.js';
import { eq, and, desc } from 'drizzle-orm';

import { addressSchema, updateAddressSchema } from '../validation/address-validation.js';

async function geocodeAddress(street: string, city: string, country: string) {
    const searchNominatim = async (q: string) => {
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`;
            const response = await fetch(url, {
                headers: { 'User-Agent': 'Oblito/1.0' }
            });
            
            if (!response.ok) return null;
            const data = await response.json();
            
            if (data && data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lon: parseFloat(data[0].lon),
                    display_name: data[0].display_name
                };
            }
            return null;
        } catch (error) {
            console.error("Geocoding error:", error);
            return null;
        }
    };

    const fullQuery = `${street}, ${city}, ${country}`;
    let result = await searchNominatim(fullQuery);
    
    if (!result && street.includes(',')) {
        console.log("Exact match failed, trying broader search...");
        const broaderStreet = street.split(',').slice(1).join(',').trim(); 
        const broaderQuery = `${broaderStreet}, ${city}, ${country}`;
        result = await searchNominatim(broaderQuery);
    }

    if (!result) {
        console.log("Broader search failed, falling back to City...");
        result = await searchNominatim(`${city}, ${country}`);
    }

    return result;
}

export const handleGetAddresses = async (req: any, res: any) => {
    try {
        const user = req.user as { 
            id: string, 
            email: string, 
            profilePictureUrl: string | null, 
            firstName: string, 
            lastName: string, 
            role: 'customer' | 'retailer' | 'wholesaler' 
        };

        const userAddresses = await db.query.addresses.findMany({
            where: eq(addresses.userId, user.id),
            orderBy: [desc(addresses.isPrimary), desc(addresses.createdAt)]
        });

        const response = userAddresses.map(addr => ({
            ...addr,
            latitude: addr.location[1],
            longitude: addr.location[0]
        }));

        res.json(response);
    } catch (e) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ errors: e.issues });
        }
        console.error('Error getting addresses:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const handlePostAddress = async (req: any, res: any) => {
    try {
        const user = req.user as { 
            id: string, 
            email: string, 
            profilePictureUrl: string | null, 
            firstName: string, 
            lastName: string, 
            role: 'customer' | 'retailer' | 'wholesaler' 
        };
        const data = addressSchema.parse(req.body);

        let coords = { lat: 0, lon: 0 };
        const geoResult = await geocodeAddress(data.streetAddress, data.city, data.country);

        if (geoResult) {
            coords = geoResult;
        } else {
            console.warn("Warning: Address could not be geocoded. Saving with (0,0).");
        }

        await db.transaction(async (tx) => {
            if (data.isPrimary) {
                await tx.update(addresses)
                    .set({ isPrimary: false })
                    .where(eq(addresses.userId, user.id));
            }

            // 3. Insert with calculated location
            await tx.insert(addresses).values({
                userId: user.id,
                streetAddress: data.streetAddress,
                city: data.city,
                state: data.state,
                postalCode: data.postalCode,
                country: data.country,
                location: [ coords.lon, coords.lat ], 
                isPrimary: data.isPrimary
            });
        });

        res.status(201).json({ message: "Address added successfully" });
        
    } catch (e) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ errors: e.issues });
        }
        console.error('Error posting address:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const handlePatchAddress = async (req: any, res: any) => {
    try {
        const user = req.user as { 
            id: string, 
            email: string, 
            profilePictureUrl: string | null, 
            firstName: string, 
            lastName: string, 
            role: 'customer' | 'retailer' | 'wholesaler' 
        };
        const addressId = req.params.id;
        const updateData = updateAddressSchema.parse(req.body);

        const existing = await db.query.addresses.findFirst({
            where: and(eq(addresses.id, addressId), eq(addresses.userId, user.id))
        });
        if (!existing) return res.status(404).json({ message: "Address not found" });
        
        await db.transaction(async (tx) => {
            if (updateData.isPrimary === true) {
                await tx.update(addresses)
                    .set({ isPrimary: false })
                    .where(eq(addresses.userId, user.id));
            }

            const valuesToUpdate: any = { ...updateData };

            const hasAddressChanged = updateData.streetAddress || updateData.city || updateData.country;
            
            if (hasAddressChanged) {
                const street = updateData.streetAddress ?? existing.streetAddress;
                const city = updateData.city ?? existing.city;
                const country = updateData.country ?? existing.country;

                const geoResult = await geocodeAddress(street, city, country);
                
                if (geoResult) {
                    valuesToUpdate.location = { x: geoResult.lon, y: geoResult.lat };
                }
            }

            await tx.update(addresses)
                .set(valuesToUpdate)
                .where(eq(addresses.id, addressId));
        });

        res.json({ message: "Address updated successfully" });
    } catch (e) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ errors: e.issues });
        }
        console.error('Error updating address:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const handleDeleteAddress = async (req: any, res: any) => {
    try {
        const user = req.user as { 
            id: string, 
            email: string, 
            profilePictureUrl: string | null, 
            firstName: string, 
            lastName: string, 
            role: 'customer' | 'retailer' | 'wholesaler' 
        };
        const addressId = req.params.id;

        const existing = await db.query.addresses.findFirst({
            where: and(eq(addresses.id, addressId), eq(addresses.userId, user.id))
        });
        if (!existing) return res.status(404).json({ message: "Address not found" });

        await db.delete(addresses).where(eq(addresses.id, addressId));

        res.json({ message: "Address deleted successfully" });
    } catch (e) {
        if (e instanceof z.ZodError) {
            return res.status(400).json({ errors: e.issues });
        }
        console.error('Error deleting address:', e);
        res.status(500).json({ message: 'Internal server error' });
    }
};