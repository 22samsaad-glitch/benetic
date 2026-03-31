# Workflow: Configure Lead Ingestion Sources

## Objective
Set up lead capture from website forms, Meta Lead Ads, and Google Ads for a new tenant.

## Inputs
- Tenant slug and webhook API key (from /api/v1/auth/register response)
- API base URL (e.g., https://api.jetleads.io)
- Meta Business Manager access (for Meta Lead Ads)
- Google Ads account (for Google Ads lead forms)

## Steps

### 1. Website Form (Embeddable Widget)
1. **Add the JavaScript snippet to the client's website**
   ```html
   <script src="https://your-domain.com/embed/lead-form.js"
           data-tenant="TENANT_SLUG"
           data-api-key="WEBHOOK_KEY"
           data-api-url="https://api.jetleads.io">
   </script>
   <div id="jetleads-lead-form"></div>
   ```
2. **Test** — Submit the form and verify the lead appears via GET /api/v1/leads/
3. **UTM tracking** — The widget automatically captures UTM params from the page URL

### 2. Meta Lead Ads
1. **Create a Meta App** at developers.facebook.com
2. **Set webhook URL** to: `https://api.jetleads.io/api/v1/webhooks/meta/TENANT_SLUG`
3. **Set verify token** to match META_APP_SECRET in .env
4. **Subscribe to leadgen events** on the Facebook Page
5. **Test** — Create a test lead in Meta Ads Manager and verify it arrives
6. **Important**: Meta sends leads as a nested structure with field_data arrays. The webhook handler normalizes this automatically.

### 3. Google Ads
1. **Create a webhook integration** in Google Ads for lead form extensions
2. **Set webhook URL** to: `https://api.jetleads.io/api/v1/webhooks/google-ads/TENANT_SLUG`
3. **Set X-API-Key header** to the tenant's webhook key
4. **Test** — Submit a test lead form and verify

### 4. Custom / Zapier
1. **Any system** can POST to the universal endpoint:
   ```
   POST https://api.jetleads.io/api/v1/webhooks/ingest/TENANT_SLUG
   Headers: X-API-Key: WEBHOOK_KEY, Content-Type: application/json
   Body: {"email": "...", "first_name": "...", "source": "zapier"}
   ```
2. **Zapier/Make.com**: Use a Webhook action to POST to this endpoint

## Outputs
- Leads flowing into the system from all configured sources
- Each lead auto-scored and assigned to the default pipeline

## Edge Cases
- **Meta signature verification**: If META_APP_SECRET is empty, signature verification is skipped. Always set it in production.
- **Deduplication**: If the same email arrives from two sources, the second is flagged as a duplicate but still recorded.
- **Missing fields**: Only email OR phone is required. All other fields are optional.
- **Rate limits**: Webhook endpoints allow 200 requests/minute per tenant.

## Last Updated
2026-02-15 — Initial lead ingestion SOP
