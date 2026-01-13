import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function useCart() {
    return useContext(CartContext);
}

export function CartProvider({ children }) {
    const [cart, setCart] = useState(() => {
        try {
            const savedCart = localStorage.getItem('dispensary_cart');
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (error) {
            console.error('Failed to parse cart from localStorage:', error);
            // Clear corrupted data
            localStorage.removeItem('dispensary_cart');
            return [];
        }
    });
    const [isCartOpen, setIsCartOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('dispensary_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product, orderType = 'case') => {
        setCart(prevCart => {
            const cartItemId = `${product.id}-${orderType}`;
            const existingItem = prevCart.find(item => item.cartItemId === cartItemId);

            if (existingItem) {
                return prevCart.map(item =>
                    item.cartItemId === cartItemId
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }

            return [...prevCart, {
                ...product,
                cartItemId,
                orderType,
                quantity: 1
            }];
        });
        setIsCartOpen(true);
    };

    const removeFromCart = (cartItemId) => {
        setCart(prevCart => prevCart.filter(item => item.cartItemId !== cartItemId));
    };

    const updateQuantity = (cartItemId, quantity) => {
        if (quantity < 1) {
            removeFromCart(cartItemId);
            return;
        }
        setCart(prevCart =>
            prevCart.map(item =>
                item.cartItemId === cartItemId
                    ? { ...item, quantity: quantity }
                    : item
            )
        );
    };

    const clearCart = () => {
        setCart([]);
    };

    const cartTotal = cart.reduce((total, item) => {
        const itemPrice = item.orderType === 'case'
            ? item.price * (item.caseSize || 1)
            : item.price;
        return total + (itemPrice * item.quantity);
    }, 0);
    const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

    const value = {
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        isCartOpen,
        setIsCartOpen
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}
