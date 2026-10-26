import { useContext, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext.jsx";
import { AuthContext } from "../context/AuthContext.jsx";
import { createAppointments } from "../api/appointments";

function CartPage() {
    const { items, total, dispatch } = useContext(CartContext);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [done, setDone] = useState(false);

    const couponPercent = user?.coupon_percent ?? 0;
    const finalTotal = Math.round(total * (100 - couponPercent)) / 100;

    const handleCheckout = async () => {
        if (!user) {
            navigate("/login");
            return;
        }
        try {
            setLoading(true);
            setError(null);
            await createAppointments(
                items.map(i => ({ service_id: i.id, quantity: i.qty })),
                user.user_id
            );
            dispatch({ type: "clear" });
            setDone(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (user?.role === "admin") return <Navigate to="/" replace />;
    if (done) return <p>Order placed</p>;
    if (items.length === 0) return <p>Cart is empty</p>;

    return (
        <div>
            {items.map(i => (
                <div key={i.id} style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {i.image && (
                            <img
                                src={i.image}
                                alt={i.name}
                                width={24}
                                height={24}
                                style={{ objectFit: "cover" }}
                            />
                        )}
                        {i.name}
                    </span>

                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <button
                            onClick={() => dispatch({ type: "decrease", id: i.id })}
                        >
                            −
                        </button>
                        <span>{i.qty}</span>
                        <button
                            onClick={() => dispatch({ type: "add", product: i })}
                        >
                            +
                        </button>
                    </div>

                    <span>{i.price * i.qty}</span>
                    <button className="btn-remove" onClick={() => dispatch({ type: "remove", id: i.id })}>
                        Remove
                    </button>
                </div>
            ))}
            {couponPercent > 0 && (
                <p>Subtotal: {total} - Coupon {user.coupon_name}: -{couponPercent}%</p>
            )}
            <h3>Total: {finalTotal}</h3>
            {error && <p className="error">Error: {error}</p>}
            <button className="btn-add" onClick={handleCheckout} disabled={loading}>
                {loading ? "Placing order..." : user ? "Checkout" : "Log in to checkout"}
            </button>
        </div>
    );
}

export default CartPage;
