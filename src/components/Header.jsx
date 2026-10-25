import { NavLink } from "react-router-dom";
import {ThemeContext} from "../context/ThemeContext";
import {CartContext} from "../context/CartContext";
import {AuthContext} from "../context/AuthContext";
import {useContext} from "react";

const linkStyle = ({ isActive }) => ({
    color: isActive ? "var(--primary)" : "var(--text-muted)",
    fontWeight: isActive ? "bold" : "normal",
    textDecoration: "none",
});

function Header() {
    const { theme, toggleTheme } = useContext(ThemeContext);
    const { items } = useContext(CartContext);
    const { user, signOut } = useContext(AuthContext);
    const count = items.reduce((s, i) => s + i.qty, 0);

    return (
        <header style={{ display: "flex", gap: 20, alignItems: "center", padding: 16 }}>
            <NavLink to="/" style={linkStyle} end>Catalog</NavLink>
            <NavLink to="/cart" style={linkStyle}>Cart: {count}</NavLink>
            {user?.role === "admin" && <NavLink to="/admin" style={linkStyle}>Admin</NavLink>}
            {user ? (
                <>
                    <span>{user.email}</span>
                    <button onClick={signOut}>Log out</button>
                </>
            ) : (
                <NavLink to="/login" style={linkStyle}>Login</NavLink>
            )}
            <button onClick={toggleTheme} style={{ marginLeft: "auto" }}>
                {theme === "dark" ? "light" : "dark"}
            </button>
        </header>
    );
}
export default Header;
