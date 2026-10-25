function CategoryAside({ categories, selected, onToggle, onReset }) {
    return (
        <aside className="category-aside">
            <h3>Categories</h3>
            {categories.map(c => (
                <label key={c.category_id} className="category-item">
                    <input
                        type="checkbox"
                        checked={selected.includes(c.category_id)}
                        onChange={() => onToggle(c.category_id)}
                    />
                    {c.name}
                </label>
            ))}
            {selected.length > 0 && (
                <button className="btn-remove" onClick={onReset}>Reset</button>
            )}
        </aside>
    );
}

export default CategoryAside;
