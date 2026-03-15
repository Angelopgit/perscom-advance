# PERSCOM Advance — Licensing

## What Your License Covers

Each PERSCOM Advance license covers **one deployment** — a single running instance of PERSCOM Advance on one server. One license = one unit.

If you run multiple units or multiple servers, you need a separate license for each.

---

## How License Validation Works

When PERSCOM Advance starts, it contacts the PERSCOM Advance license server to validate your `PERSCOM_LICENSE_KEY`. This check:

1. Confirms your subscription is active
2. Returns your licensed unit name and plan details
3. Re-validates automatically every 24 hours

**Your unit's data never leaves your server.** Only your license key and deployment domain are sent to the license server.

### Grace Period

If the license server is temporarily unreachable (e.g., network outage), PERSCOM Advance will continue running normally for up to **72 hours** using the last successful validation result. After 72 hours without a successful check, the license will be considered invalid.

---

## What Happens When Your Subscription Expires

- Your PERSCOM instance will display a license error to all users
- API requests will return a 403 error
- No data is deleted — your data remains on your server
- Renewing your subscription immediately restores access

---

## Renewing Your License

1. Go to [perscomadvance.com](https://perscomadvance.com)
2. Log in to your account
3. Click **Renew Subscription** or update your payment method
4. Your existing license key remains valid — no changes needed on your server

---

## Transferring a License

License keys are tied to one domain. To move your deployment to a new domain:

1. Go to your account at [perscomadvance.com](https://perscomadvance.com)
2. Update your registered domain
3. Restart your PERSCOM instance for the change to take effect

---

## Questions & Support

- Email: support@perscomadvance.com
- Discord: [perscomadvance.com/discord](https://perscomadvance.com/discord)
