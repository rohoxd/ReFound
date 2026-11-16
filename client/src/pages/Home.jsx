import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getListings, getMeta } from '../api.js';
import ListingCard from '../components/ListingCard.jsx';

const PAGE_SIZE = 12;

export default function Home() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const type = params.get('type') || '';
  const category = params.get('category') || '';
  const status = params.get('status') || '';
  const hasFilters = Boolean(q || type || category || status);

  const [categories, setCategories] = useState([]);
  const [searchText, setSearchText] = useState(q);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const pageRef = useRef(1);

  // Category list for the filter dropdown.
  useEffect(() => {
    getMeta()
      .then((m) => setCategories(m.categories))
      .catch(() => {});
  }, []);

  // Keep the search box in sync when the URL changes (e.g. "Clear filters").
  useEffect(() => {
    setSearchText(q);
  }, [q]);

  // Update the URL shortly after the person stops typing.
  useEffect(() => {
    if (searchText.trim() === q) return undefined;
    const t = setTimeout(() => updateParam('q', searchText.trim()), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  function updateParam(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  // Load the first page whenever the filters change.
  useEffect(() => {
    const controller = new AbortController();
    pageRef.current = 1;
    setLoading(true);
    setError('');
    getListings({ q, type, category, status, page: 1, limit: PAGE_SIZE }, controller.signal)
      .then((data) => {
        setItems(data.items);
        setTotal(data.total);
        setHasMore(data.hasMore);
        setError('');
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err.message);
        setLoading(false);
      });
    return () => controller.abort();
  }, [q, type, category, status]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const nextPage = pageRef.current + 1;
      const data = await getListings({ q, type, category, status, page: nextPage, limit: PAGE_SIZE });
      pageRef.current = nextPage;
      setItems((prev) => [...prev, ...data.items]);
      setHasMore(data.hasMore);
      setTotal(data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }

  function clearFilters() {
    setSearchText('');
    setParams({}, { replace: true });
  }

  return (
    <div className="page">
      <section className="hero">
        <h1>Lost something on campus? Found something? Put it on the board.</h1>
        <p className="hero-sub">
          Post what you lost or found, or search every listing to see if your item has turned up.
        </p>
      </section>

      <section className="filters" aria-label="Search and filters">
        <div className="field search-field">
          <label htmlFor="search">Search all listings</label>
          <input
            id="search"
            type="search"
            placeholder="Try &ldquo;charger&rdquo;, &ldquo;library&rdquo; or &ldquo;blue bottle&rdquo;"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <div className="field">
          <span className="label" id="type-label">
            Type
          </span>
          <div className="segmented" role="group" aria-labelledby="type-label">
            {[
              ['', 'All'],
              ['lost', 'Lost'],
              ['found', 'Found'],
            ].map(([value, label]) => (
              <button
                key={value || 'all'}
                type="button"
                className={type === value ? 'active' : ''}
                aria-pressed={type === value}
                onClick={() => updateParam('type', value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="category">Category</label>
          <select id="category" value={category} onChange={(e) => updateParam('category', e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" value={status} onChange={(e) => updateParam('status', e.target.value)}>
            <option value="">Open and closed</option>
            <option value="open">Open only</option>
            <option value="closed">Closed only</option>
          </select>
        </div>
      </section>

      <section aria-live="polite">
        <div className="list-head">
          <h2>{hasFilters ? 'Search results' : 'Recent posts'}</h2>
          {!loading && !error && (
            <span className="muted">
              {total} {total === 1 ? 'listing' : 'listings'}
            </span>
          )}
          {hasFilters && (
            <button type="button" className="link-btn" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>

        {error && (
          <div className="notice notice-error" role="alert">
            {error}
          </div>
        )}

        {loading && <p className="muted">Loading listings&hellip;</p>}

        {!loading && !error && items.length === 0 && (
          <div className="empty">
            <h3>{hasFilters ? 'Nothing matches those filters' : 'No listings yet'}</h3>
            <p className="muted">
              {hasFilters
                ? 'Try a shorter search or clear the filters. You can also post your own listing.'
                : 'Be the first to post a lost or found item.'}
            </p>
            <Link className="btn btn-primary" to="/new">
              Post an item
            </Link>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="grid">
            {items.map((item) => (
              <ListingCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {!loading && hasMore && (
          <div className="load-more">
            <button type="button" className="btn btn-ghost" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? 'Loading\u2026' : 'Show older posts'}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
