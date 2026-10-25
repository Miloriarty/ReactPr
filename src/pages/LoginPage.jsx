import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { login } from "../api/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(email, password) {
    const errors = {};
    if (!email.trim()) errors.email = "Enter email";
    else if (!EMAIL_RE.test(email)) errors.email = "Invalid email";
    if (!password) errors.password = "Enter password";
    return errors;
}

function LoginPage() {
    const navigate = useNavigate();
    const { signIn } = useContext(AuthContext);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const found = validate(email, password);
        setErrors(found);
        setServerError(null);
        if (Object.keys(found).length) return;

        try {
            setLoading(true);
            signIn(await login(email, password));
            navigate("/", { replace: true });
        } catch (err) {
            setServerError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="login-form" onSubmit={handleSubmit} noValidate>
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
            />
            {errors.email && <span className="error">{errors.email}</span>}

            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
            />
            {errors.password && <span className="error">{errors.password}</span>}

            {serverError && <span className="error">{serverError}</span>}
            <button className="btn-add" type="submit" disabled={loading}>
                {loading ? "Logging in..." : "Log in"}
            </button>
        </form>
    );
}

export default LoginPage;
