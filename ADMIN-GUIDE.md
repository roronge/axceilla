# HSN Admin Dashboard

## Access
- Open `/admin` on the HSN website.
- Demo PIN: `HSN2026`.
- The login is a client-side demo gate, not production authentication. Anyone who can inspect the frontend bundle can discover/bypass it. Replace it with server-side authentication before public deployment.

## What can be managed
- Create, edit, hide/show, and delete products.
- Product name, category (Atasan/Celana), IDR price, description, size list, and rack width.
- Add/remove color variants, variant name, swatch color, and front/back garment images.
- Images are resized to a maximum 1400px edge and encoded as WebP before being stored.
- Export and import a JSON backup of the entire catalog, including uploaded images.
- Restore the original built-in catalog.

## Persistence
Catalog changes are stored in the current browser's `localStorage` under `hsn_catalog_v1`. They automatically appear on the storefront in that same browser. This is suitable for a single-browser prototype, not a multi-admin production store. Data does not automatically sync between devices, browsers, or visitors. Export regular JSON backups.

## Production requirements
For a real public store, use a backend/database and object storage for images, plus server-side admin authentication and authorization. Do not rely on the demo PIN or localStorage for production access control or shared catalog data.
