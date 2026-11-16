// Thin wrapper around the backend API.
async function request(url, options) {
  let res;
  try {
    res = await fetch(url, options);
  } catch {
    if (err.name === 'AbortError') throw err;
    throw new Error('Cannot reach the server. Check your connection and try again.');
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* no JSON body */
  }
  if (!res.ok) {
    const err = new Error(data?.error || 'Something went wrong. Please try again.');
    err.fields = data?.fields;
    err.status = res.status;
    throw err;
  }
  return data;
}

export function getListings(params, signal) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, v);
  });
  return request(`/api/listings?${qs.toString()}`, { signal });
}

export const getListing = (id) => request(`/api/listings/${id}`);

export const getMeta = () => request('/api/meta');

export function createListing(formData) {
  return request('/api/listings', { method: 'POST', body: formData });
}

export function setListingStatus(id, status) {
  return request(`/api/listings/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}
