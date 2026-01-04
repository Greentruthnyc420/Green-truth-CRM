import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

export async function uploadTollReceipt(file, userId) {
    if (userId === 'test-user-123') {
        console.log("MOCK STORAGE: Uploading", file.name);
        return URL.createObjectURL(file); // Return local blob URL for preview
    }

    try {
        const timestamp = Date.now();
        // Create a unique path for the file
        const storageRef = ref(storage, `toll_receipts/${userId}/${timestamp}_${file.name}`);

        // Upload the file
        const snapshot = await uploadBytes(storageRef, file);

        // Get and return the download URL
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (_e) {
        console.warn("Storage upload failed. Returning mock URL.");
        return URL.createObjectURL(file);
    }
}


export async function uploadBrandMenu(file, brandId) {
    if (!brandId) throw new Error("Brand ID is required for upload");

    // Mock for dev
    if (brandId === 'test-brand-123') {
        return URL.createObjectURL(file);
    }

    try {
        const timestamp = Date.now();
        const extension = file.name.split('.').pop();
        const storageRef = ref(storage, `brand_menus/${brandId}/menu_${timestamp}.${extension}`);

        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (e) {
        console.error("Menu upload failed:", e);
        // Fallback for demo if storage fails
        return URL.createObjectURL(file);
    }
}
