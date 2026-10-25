import { createContext, useEffect, useReducer } from "react";

export const CartContext = createContext(null);

const STORAGE_KEY = "cart";

function CartReducer(items, action) {
    switch (action.type) {
        case "add": {
            const existing = items.find(item => item.id === action.product.id);

            if (existing) {
                return items.map(i =>
                    i.id === existing.id ? {...i, qty: i.qty + 1} : i
                )
            }
            return [...items, {...action.product, qty: 1}];
        }

        case "decrease":
            return items
                .map(i => (i.id === action.id ? {...i, qty: i.qty - 1 } : i))
                .filter(i => i.qty > 0);

        case "remove":
            return items.filter(i => i.id !== action.id);

        case "clear":
            return [];

        default:
            return items;
    }
}

function loadCart() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function CartProvider({children}) {
    const [items, dispatch] = useReducer(CartReducer, [], loadCart);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch {
        }
    }, [items]);

    const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

    return (
        <CartContext.Provider value={{items, total, dispatch}}>
            {children}
        </CartContext.Provider>
    );
}