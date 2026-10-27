// The backend is moving from Laravel to Java. While this is false the old
// settings API (get-all-settings) isn't called and the static siteSettings
// are used instead. Set NEXT_PUBLIC_LEGACY_API_ENABLED=true to turn it back on.
export const BACKEND_ENABLED = process.env.NEXT_PUBLIC_LEGACY_API_ENABLED === "true";

// Old admin features with no Java endpoint yet (company, worker, reports,
// notifications, site settings, change username/email, ...). The code is kept;
// their pages return 404 and their menu items are hidden until this is on.
// Set NEXT_PUBLIC_LEGACY_ADMIN_FEATURES=true to bring them all back.
export const LEGACY_ADMIN_FEATURES = process.env.NEXT_PUBLIC_LEGACY_ADMIN_FEATURES === "true";
