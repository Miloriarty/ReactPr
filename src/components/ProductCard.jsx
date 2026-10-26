import {useContext} from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";
import {CartContext} from "../context/CartContext.jsx";
import {AuthContext} from "../context/AuthContext.jsx";

function ProductCard({id, name, description, duration, price, finalPrice, discount, image}) {
    const {items, dispatch} = useContext(CartContext);
    const {user} = useContext(AuthContext);
    const isAdmin = user?.role === "admin";
    const navigate = useNavigate();
    const inCart = items.find(i => i.id === id)?.qty ?? 0;
    const product = { id, name, price: finalPrice, image };

    return (
        <div className="product-card">
            <div className="product-card-info">
                {discount > 0 && <span className="discount-badge">-{discount}%</span>}
                <img className="product-card-image" src={image} alt={name} />
                <p className="product-card-name">{name}</p>
                <p className="product-card-description">{description}</p>
                <p className="product-card-price">Duration: {duration} min</p>
                <p className="product-card-price">
                    Price: {discount > 0 && <s>{price}</s>} {finalPrice}
                </p>
                {!isAdmin && (
                    <>
                        <span>In cart: {inCart}</span>
                        <button className="btn-add" onClick={() => dispatch({ type: "add", product })}>Add to cart</button>
                    </>
                )}

                {!isAdmin && inCart > 0 && (
                    <>
                        <button className="btn-remove"
                                onClick={() => dispatch({ type: "decrease", id: product.id })}
                        >Remove</button>
                        <button className="btn-add"
                                onClick={() => navigate("/cart")}
                        >Go to cart</button>
                    </>
                )}
            </div>
        </div>
    )
}

export default ProductCard;
