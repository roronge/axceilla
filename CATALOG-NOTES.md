# HSN Catalog Notes

Product information is currently configured in `src/routes/index.tsx` in the `ITEMS` and `TROUSERS` arrays.

Each item now has:
- `price`: sample price in Indonesian Rupiah (edit to the real selling price before launch)
- `description`: product description shown in the glass HUD
- `sizes`: selectable size options
- `variants`: available colors and front/back image assets

The Add to Cart control currently updates an in-page cart counter and confirmation message only. It is a front-end interaction; it is not connected to a database, inventory, checkout, or payment provider yet.
