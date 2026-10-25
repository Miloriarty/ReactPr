import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard.jsx";
import CategoryAside from "../components/CategoryAside.jsx";
import { getServices } from "../api/services";
import { getCategories } from "../api/categories";

function CatalogPage() {
    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selected, setSelected] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        getCategories().then(setCategories).catch(err => setError(err.message));
    }, []);

    const loadServices = async () => {
        try {
            setLoading(true);
            setServices(await getServices(selected));
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadServices();
    }, [selected]);

    const toggleCategory = (id) =>
        setSelected(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));

    return (
        <div className="catalog-layout">
            <CategoryAside
                categories={categories}
                selected={selected}
                onToggle={toggleCategory}
                onReset={() => setSelected([])}
            />

            <section className="catalog-content">
                {loading && <p>Loading foxes...</p>}

                {!loading && error && (
                    <div className="error">
                        <p>Error: {error}</p>
                        <button className="btn-add" onClick={loadServices}>Try again</button>
                    </div>
                )}

                {!loading && !error && services.length === 0 && <p>Nothing found</p>}

                {!loading && !error && (
                    <div className="catalog">
                        {services.map(s => (
                            <ProductCard
                                key={s.service_id}
                                id={s.service_id}
                                name={s.name}
                                description={s.description}
                                duration={s.duration_minutes}
                                price={s.price}
                                finalPrice={s.final_price}
                                discount={s.discount_percent}
                                image={s.image_url}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

export default CatalogPage;
