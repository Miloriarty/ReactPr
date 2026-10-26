import { useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { getCategories, createCategory } from "../api/categories";
import { getServices, setServiceDiscount } from "../api/services";
import { getUsers, getCoupons, setUserCoupon } from "../api/users";

function AdminPage() {
    const { user } = useContext(AuthContext);
    const userId = user?.user_id;
    const [categories, setCategories] = useState([]);
    const [services, setServices] = useState([]);
    const [users, setUsers] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [newCategory, setNewCategory] = useState("");
    const [discounts, setDiscounts] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);

    const loadAll = async () => {
        try {
            setLoading(true);
            const [c, s, u, cp] = await Promise.all([
                getCategories(), getServices(), getUsers(userId), getCoupons(userId),
            ]);
            setCategories(c);
            setServices(s);
            setUsers(u);
            setCoupons(cp);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === "admin") loadAll();
    }, [user]);

    const run = async (action, successText) => {
        try {
            setError(null);
            await action();
            setMessage(successText);
            await loadAll();
            return true;
        } catch (err) {
            setMessage(null);
            setError(err.message);
            return false;
        }
    };

    const saveDiscounts = () => {
        const changed = services.filter(s =>
            s.service_id in discounts && discounts[s.service_id] !== s.discount_percent
        );
        if (!changed.length) return setMessage("Nothing to save");
        const invalid = changed.find(s => {
            const d = discounts[s.service_id];
            return !Number.isInteger(d) || (d !== 0 && (d < 10 || d > 90));
        });
        if (invalid) {
            setMessage(null);
            return setError(`Discount for "${invalid.name}" must be from 10 to 90% (or 0 to remove it)`);
        }
        run(
            () => Promise.all(
                changed.map(s => setServiceDiscount(s.service_id, discounts[s.service_id], userId))
            ),
            "Discounts saved"
        ).then(ok => ok && setDiscounts({}));
    };

    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== "admin") return <p className="error">Admins only</p>;
    if (loading) return <p>Loading data...</p>;

    return (
        <div className="admin">
            {error && <p className="error">Error: {error}</p>}
            {message && <p>{message}</p>}

            <section>
                <h2>Categories</h2>
                <form onSubmit={e => {
                    e.preventDefault();
                    const name = newCategory.trim();
                    if (!name) return setError("Enter category name");
                    if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
                        setMessage(null);
                        return setError(`Category "${name}" already exists`);
                    }
                    run(() =>
                        createCategory(name, userId), "Category added")
                        .then(ok => ok && setNewCategory(""));
                }}>
                    <input
                        placeholder="New category"
                        value={newCategory}
                        onChange={e =>
                            setNewCategory(e.target.value)
                    }
                    />
                    <button className="btn-add" type="submit">Add</button>
                </form>
                <p>{categories.map(c => c.name).join(", ")}</p>
            </section>

            <section>
                <h2>Product discounts</h2>
                {services.map(s => (
                    <div key={s.service_id} className="admin-row">
                        <span>{s.name} ({s.price})</span>
                        <input
                            type="number"
                            min="0"
                            max="90"
                            value={discounts[s.service_id] ?? s.discount_percent}
                            onChange={e =>
                                setDiscounts(d => ({ ...d, [s.service_id]: Number(e.target.value) }))
                        }
                        />
                        <span>%</span>
                    </div>
                ))}
                <button className="btn-add" onClick={saveDiscounts}>Save discounts</button>
            </section>

            <section>
                <h2>Personal coupons</h2>
                {users.map(u => (
                    <div key={u.user_id} className="admin-row">
                        <span>{u.email}</span>
                        <select
                            value={u.coupon_id ?? ""}
                            onChange={e => {
                                const couponId = e.target.value ? Number(e.target.value) : null;
                                run(() =>
                                        setUserCoupon(u.user_id, couponId, userId),
                                        `Coupon for ${u.email} saved`
                                );
                            }}
                        >
                            <option value="">No coupon</option>
                            {coupons.map(c => (
                                <option key={c.coupon_id} value={c.coupon_id}>
                                    {c.name} (-{c.discount_percent}%)
                                </option>
                            ))}
                        </select>
                    </div>
                ))}
            </section>
        </div>
    );
}

export default AdminPage;
