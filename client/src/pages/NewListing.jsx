import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createListing, getMeta } from '../api.js';
import { todayISO } from '../utils.js';

const MAX_PHOTO_MB = 5;

export default function NewListing() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialType = params.get('type') === 'found' ? 'found' : params.get('type') === 'lost' ? 'lost' : '';

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    type: initialType,
    item_name: '',
    description: '',
    category: '',
    location: '',
    date: todayISO(),
  });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getMeta()
      .then((m) => setCategories(m.categories))
      .catch(() => setFormError('Could not load categories. Refresh the page and try again.'));
  }, []);

  useEffect(() => {
    if (!photo) {
      setPreview('');
      return undefined;
    }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function onPhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) {
      setPhoto(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setErrors((er) => ({ ...er, photo: 'Choose an image file (JPG, PNG, WebP or GIF).' }));
      e.target.value = '';
      return;
    }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      setErrors((er) => ({ ...er, photo: `Photo is too large. The limit is ${MAX_PHOTO_MB} MB.` }));
      e.target.value = '';
      return;
    }
    setErrors((er) => ({ ...er, photo: undefined }));
    setPhoto(file);
  }

  function validate() {
    const er = {};
    if (!form.type) er.type = 'Choose Lost or Found.';
    if (!form.item_name.trim()) er.item_name = 'Enter the item name.';
    if (!form.description.trim()) er.description = 'Add a short description.';
    if (!form.category) er.category = 'Choose a category.';
    if (!form.location.trim()) er.location = 'Enter where it was lost or found.';
    if (!form.date) er.date = 'Enter a date.';
    else if (form.date > todayISO()) er.date = 'The date cannot be in the future.';
    return er;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setFormError('');
    const er = validate();
    setErrors(er);
    if (Object.keys(er).length) return;

    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => body.append(k, typeof v === 'string' ? v.trim() : v));
    if (photo) body.append('photo', photo);

    setSubmitting(true);
    try {
      const created = await createListing(body);
      navigate(`/item/${created.id}`);
    } catch (err) {
      if (err.fields) setErrors(err.fields);
      setFormError(err.message);
      setSubmitting(false);
    }
  }

  const isFound = form.type === 'found';

  return (
    <div className="page narrow">
      <h1>Post an item</h1>
      <p className="muted">
        Share enough detail for the owner to recognise the item, but leave out anything private such as ID numbers.
      </p>

      <form onSubmit={onSubmit} noValidate className="form">
        {formError && (
          <div className="notice notice-error" role="alert">
            {formError}
          </div>
        )}

        <fieldset className="field">
          <legend className="label">What are you posting?</legend>
          <div className="type-choice">
            <label className={`type-option type-lost ${form.type === 'lost' ? 'selected' : ''}`}>
              <input type="radio" name="type" value="lost" checked={form.type === 'lost'} onChange={set('type')} />
              <strong>I lost something</strong>
              <span>Help others spot it</span>
            </label>
            <label className={`type-option type-found ${form.type === 'found' ? 'selected' : ''}`}>
              <input type="radio" name="type" value="found" checked={form.type === 'found'} onChange={set('type')} />
              <strong>I found something</strong>
              <span>Help it reach its owner</span>
            </label>
          </div>
          {errors.type && <p className="error">{errors.type}</p>}
        </fieldset>

        <div className="field">
          <label htmlFor="item_name">Item name</label>
          <input
            id="item_name"
            type="text"
            maxLength={100}
            placeholder="e.g. Blue steel water bottle"
            value={form.item_name}
            onChange={set('item_name')}
            aria-invalid={Boolean(errors.item_name)}
          />
          {errors.item_name && <p className="error">{errors.item_name}</p>}
        </div>

        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            rows={4}
            maxLength={1000}
            placeholder="Colour, brand, marks, what is inside, where it is being kept..."
            value={form.description}
            onChange={set('description')}
            aria-invalid={Boolean(errors.description)}
          />
          {errors.description && <p className="error">{errors.description}</p>}
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="category">Category</label>
            <select id="category" value={form.category} onChange={set('category')} aria-invalid={Boolean(errors.category)}>
              <option value="">Choose a category</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.category && <p className="error">{errors.category}</p>}
          </div>

          <div className="field">
            <label htmlFor="date">{isFound ? 'Date found' : 'Date lost'}</label>
            <input
              id="date"
              type="date"
              max={todayISO()}
              value={form.date}
              onChange={set('date')}
              aria-invalid={Boolean(errors.date)}
            />
            {errors.date && <p className="error">{errors.date}</p>}
          </div>
        </div>

        <div className="field">
          <label htmlFor="location">{isFound ? 'Where you found it' : 'Where you lost it'}</label>
          <input
            id="location"
            type="text"
            maxLength={150}
            placeholder="e.g. Library, 2nd floor"
            value={form.location}
            onChange={set('location')}
            aria-invalid={Boolean(errors.location)}
          />
          {errors.location && <p className="error">{errors.location}</p>}
        </div>

        <div className="field">
          <label htmlFor="photo">Photo (optional)</label>
          <input id="photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onPhotoChange} />
          <p className="hint">JPG, PNG, WebP or GIF, up to {MAX_PHOTO_MB} MB.</p>
          {errors.photo && <p className="error">{errors.photo}</p>}
          {preview && (
            <div className="preview">
              <img src={preview} alt="Selected item preview" />
              <button type="button" className="link-btn" onClick={() => { setPhoto(null); document.getElementById('photo').value = ''; }}>
                Remove photo
              </button>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Publishing\u2026' : 'Publish listing'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/')} disabled={submitting}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
