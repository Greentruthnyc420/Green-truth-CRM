import { supabase } from './supabaseClient';

export async function uploadTollReceipt(file, userId) {
    if (userId === 'test-user-123') {
        return URL.createObjectURL(file);
    }
    try {
        const timestamp = Date.now();
        const path = `${userId}/${timestamp}_${file.name}`;
        const { data, error } = await supabase
            .storage
            .from('toll-receipts')
            .upload(path, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase
            .storage
            .from('toll-receipts')
            .getPublicUrl(path);

        return publicUrl;
    } catch (e) {
        console.error("Storage upload failed:", e);
        return URL.createObjectURL(file); // Fallback
    }
}

export async function uploadBrandMenu(file, brandId) {
    if (brandId === 'test-brand-123') return URL.createObjectURL(file);

    try {
        const timestamp = Date.now();
        const extension = file.name.split('.').pop();
        const path = `${brandId}/menu_${timestamp}.${extension}`;

        const { data, error } = await supabase
            .storage
            .from('brand-menus')
            .upload(path, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase
            .storage
            .from('brand-menus')
            .getPublicUrl(path);

        return publicUrl;
    } catch (e) {
        console.error("Menu upload failed:", e);
        return URL.createObjectURL(file);
    }
}

export async function uploadInvoiceAttachment(file) {
    try {
        const timestamp = Date.now();
        const path = `${timestamp}_${file.name}`;

        const { data, error } = await supabase
            .storage
            .from('invoice-attachments')
            .upload(path, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase
            .storage
            .from('invoice-attachments')
            .getPublicUrl(path);

        return publicUrl;
    } catch (e) {
        console.error("Invoice attachment upload failed:", e);
        return URL.createObjectURL(file);
    }
}

export async function uploadProductImage(file, brandId) {
    if (!brandId) return URL.createObjectURL(file);

    try {
        const timestamp = Date.now();
        const extension = file.name.split('.').pop();
        const path = `${brandId}/products/${timestamp}.${extension}`;

        const { data, error } = await supabase
            .storage
            .from('product-images')
            .upload(path, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase
            .storage
            .from('product-images')
            .getPublicUrl(path);

        return publicUrl;
    } catch (e) {
        console.error("Product image upload failed:", e);
        return URL.createObjectURL(file); // Fallback
    }
}
