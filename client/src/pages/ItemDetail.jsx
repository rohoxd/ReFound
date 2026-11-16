import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getListing, setListingStatus } from '../api.js';
import { formatDate, timeAgo } from '../utils.js';

export default function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setItem(null);
    getListing(id)
      .then((data) => !cancelled && setItem(data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function toggleStatus() {
    const next = item.status === 'open' ? 'closed' : 'open';
    setUpdating(true);
    setActionError('');
    try {
      setItem(await setListingStatus(item.id, next));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="page narrow">
        <p className="muted">Loading listing&hellip;</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="page narrow">
        <h1>Listing not found</h1>
        <p className="muted">{error || 'This listing does not exist.'}</p>
        <Link className="btn btn-primary" to="/">
          Back to listings
        </Link>
      </div>
    );
  }

  const isLost = item.type === 'lost';
  const closed = item.status === 'closed';

  return (
    <div className="page detail">
      <Link to="/" className="back-link">
        &larr; All listings
      </Link>

      <article className={`detail-card ${isLost ? 'card-lost' : 'card-found'}`}>
        <div className="card-band detail-band">
          <span className="card-hole" aria-hidden="true" />
          <span className="card-type">{isLost ? 'Lost item' : 'Found item'}</span>
          <span className={`pill ${closed ? 'pill-closed' : 'pill-open'}`}>{closed ? 'Closed' : 'Open'}</span>
        </div>

        <div className="detail-grid">
          <div className="detail-photo">
            {item.photo_path ? (
              <img src={item.photo_path} alt={item.item_name} />
            ) : (
              <div className="card-photo-empty big" aria-hidden="true">
                {item.category.charAt(0)}
              </div>
            )}
          </div>

          <div className="detail-info">
            <h1>{item.item_name}</h1>
            <p className="detail-desc">{item.description}</p>

            <dl className="facts">
              <div>
                <dt>Category</dt>
                <dd>{item.category}</dd>
              </div>
              <div>
                <dt>{isLost ? 'Lost at' : 'Found at'}</dt>
                <dd>{item.location}</dd>
              </div>
              <div>
                <dt>{isLost ? 'Date lost' : 'Date found'}</dt>
                <dd>{formatDate(item.date)}</dd>
              </div>
              <div>
                <dt>Posted</dt>
                <dd>{timeAgo(item.created_at)}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{closed ? 'Closed' : 'Open'}</dd>
              </div>
            </dl>

            <div className="status-box">
              <p>
                {closed
                  ? 'This listing is closed. Reopen it if the item is still missing or still unclaimed.'
                  : isLost
                  ? 'Close this listing once the item is back with its owner.'
                  : 'Close this listing once the item has been handed back to its owner.'}
              </p>
              {actionError && (
                <div className="notice notice-error" role="alert">
                  {actionError}
                </div>
              )}
              <button type="button" className={`btn ${closed ? 'btn-ghost' : 'btn-primary'}`} onClick={toggleStatus} disabled={updating}>
                {updating ? 'Saving\u2026' : closed ? 'Reopen listing' : 'Close listing'}
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
