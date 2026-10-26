import { createContext, useContext, useEffect, useReducer } from "react";
import { AuthContext } from "./AuthContext.jsx";

export const CartContext = createContext(null);

const storageKey = (user) => `cart:${user ? user.user_id : "guest"}`;

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

function loadCart(key) {
    try {
        const raw = localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function CartStateReducer(state, action) {
    if (action.type === "load") {
        return { key: action.key, items: loadCart(action.key) };
    }
    return { ...state, items: CartReducer(state.items, action) };
}

export function CartProvider({children}) {
    const { user } = useContext(AuthContext);
    const key = storageKey(user);
    const [state, dispatch] = useReducer(
        CartStateReducer, key, k => ({ key: k, items: loadCart(k) })
    );
    const { items } = state;

    useEffect(() => {
        if (state.key !== key) dispatch({ type: "load", key });
    }, [key, state.key]);

    useEffect(() => {
        try {
            localStorage.setItem(state.key, JSON.stringify(items));
        } catch {
        }
    }, [state.key, items]);

    const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

    return (
        <CartContext.Provider value={{items, total, dispatch}}>
            {children}
        </CartContext.Provider>
    );
}