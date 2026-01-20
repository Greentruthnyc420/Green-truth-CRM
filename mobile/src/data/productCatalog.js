// Product catalog for mobile - mirrors web version
// This can be imported from the shared source or duplicated for offline support

export const PRODUCT_CATALOG = {
    jusbud: {
        id: 'jusbud',
        name: 'JUSBUD',
        description: 'Premium Pre-Rolls',
        products: [
            {
                id: 'jusbud-preroll-sd',
                name: '2-Pack 1G Pre-Rolls - Sour Diesel',
                category: 'Pre-Rolls',
                retailPrice: 25,
                wholesalePrice: 18,
                caseSize: 32,
                image: null,
            },
            {
                id: 'jusbud-preroll-og',
                name: '2-Pack 1G Pre-Rolls - OG Kush',
                category: 'Pre-Rolls',
                retailPrice: 25,
                wholesalePrice: 18,
                caseSize: 32,
                image: null,
            },
        ],
    },
    sillynice: {
        id: 'sillynice',
        name: 'Silly Nice',
        description: 'Premium Concentrates',
        products: [
            {
                id: 'sn-diamond-sauce',
                name: 'Diamond Sauce Cart 1G',
                category: 'Vapes',
                retailPrice: 45,
                wholesalePrice: 32,
                caseSize: 24,
                image: null,
            },
            {
                id: 'sn-live-resin',
                name: 'Live Resin Badder 1G',
                category: 'Concentrates',
                retailPrice: 50,
                wholesalePrice: 35,
                caseSize: 20,
                image: null,
            },
        ],
    },
    helios: {
        id: 'helios',
        name: 'Helios',
        description: 'Craft Flower',
        products: [
            {
                id: 'helios-flower-35',
                name: 'Premium Flower 3.5g',
                category: 'Flower',
                retailPrice: 40,
                wholesalePrice: 28,
                caseSize: 20,
                image: null,
            },
            {
                id: 'helios-flower-7',
                name: 'Premium Flower 7g',
                category: 'Flower',
                retailPrice: 70,
                wholesalePrice: 50,
                caseSize: 12,
                image: null,
            },
        ],
    },
};

// Flatten products for marketplace display
export const getAllProducts = () => {
    const allProducts = [];
    Object.values(PRODUCT_CATALOG).forEach(brand => {
        brand.products.forEach(product => {
            allProducts.push({
                ...product,
                brandId: brand.id,
                brandName: brand.name,
            });
        });
    });
    return allProducts;
};

// Get products by brand
export const getProductsByBrand = (brandId) => {
    const brand = PRODUCT_CATALOG[brandId];
    if (!brand) return [];
    return brand.products.map(p => ({
        ...p,
        brandId: brand.id,
        brandName: brand.name,
    }));
};

export default PRODUCT_CATALOG;
