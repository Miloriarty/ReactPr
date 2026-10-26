import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { login, register } from "../api/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(email, password, confirm, isRegister) {
    const errors = {};
    if (!email.trim()) errors.email = "Enter email";
    else if (!EMAIL_RE.test(email)) errors.email = "Invalid email";
    if (!password) errors.password = "Enter password";
    else if (isRegister && password.length < 4) errors.password = "Password must be at least 4 characters";
    if (isRegister && password !== confirm) errors.confirm = "Passwords do not match";
    return errors;
}

function LoginPage() {
    const navigate = useNavigate();
    const { signIn } = useContext(AuthContext);
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState(null);
    const [loading, setLoading] = useState(false);

    const toggleMode = () => {
        setIsRegister(!isRegister);
        setErrors({});
        setServerError(null);
        setConfirm("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const found = validate(email, password, confirm, isRegister);
        setErrors(found);
        setServerError(null);
        if (Object.keys(found).length) return;

        try {
            setLoading(true);
            const submit = isRegister ? register : login;
            signIn(await submit(email, password));
            navigate("/", { replace: true });
        } catch (err) {
            setServerError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const submitLabel = isRegister
        ? (loading ? "Signing up..." : "Sign up")
        : (loading ? "Logging in..." : "Log in");

    return (
        <form className="login-form" onSubmit={handleSubmit} noValidate>
            <h2>{isRegister ? "Sign up" : "Log in"}</h2>

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

            {isRegister && (
                <>
                    <input
                        type="password"
                        placeholder="Confirm password"
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                    />
                    {errors.confirm && <span className="error">{errors.confirm}</span>}
                </>
            )}

            {serverError && <span className="error">{serverError}</span>}
            <button className="btn-add" type="submit" disabled={loading}>
                {submitLabel}
            </button>
            <button className="btn-remove" type="button" onClick={toggleMode} disabled={loading}>
                {isRegister ? "Already have an account? Log in" : "No account? Sign up"}
            </button>
        </form>
    );
}

export default LoginPage;
