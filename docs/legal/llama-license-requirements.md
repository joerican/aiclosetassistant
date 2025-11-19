# Meta Llama 3.2 Vision License Requirements

**Last Updated**: 2025-11-19 04:39 EST
**Status**: ⚠️ LEGAL REQUIREMENT - Must implement user agreement before public launch

## Overview

Our AI-powered clothing analysis feature uses Meta's Llama 3.2 11B Vision Instruct model via Cloudflare Workers AI. **Meta requires users to agree to their license terms before using the model.**

## Required Agreements

Users must agree to:

1. **Llama 3.2 Community License**
   - URL: https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/LICENSE
   - Summary: Standard open-source license with attribution requirements

2. **Acceptable Use Policy**
   - URL: https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/USE_POLICY.md
   - Summary: Prohibits harmful, illegal, or unethical uses

## Geographic Restriction

⚠️ **IMPORTANT**: The license explicitly states:

> "You represent that you are not an individual domiciled in, or a company with a principal place of business in, the European Union."

**Action Required**: Block or exclude EU users from AI features, or consult legal counsel about EU compliance.

## Current Implementation

### Backend (Automatic Agreement)
**File**: `/app/api/analyze-image/route.ts`

```typescript
// First, agree to the Llama license (required before first use)
try {
  await AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
    messages: [{ role: 'user', content: 'agree' }]
  });
} catch (e) {
  // Ignore errors from agreement - it may already be agreed
  console.log('License agreement:', e);
}
```

**Status**: ✅ Working - Backend automatically agrees on behalf of the service
**Issue**: ⚠️ Users have not explicitly consented

## TODO: User-Facing Implementation

### Phase 1: Before Public Launch (REQUIRED)

1. **Create Terms of Service Page**
   - Include Llama license link
   - Include Acceptable Use Policy link
   - Plain language summary of restrictions
   - EU restriction notice

2. **Add Signup Agreement**
   - Checkbox: "I agree to the [Llama 3.2 License] and [Acceptable Use Policy]"
   - Required before account creation
   - Store agreement timestamp in database

3. **Database Schema Update**
   ```sql
   ALTER TABLE users ADD COLUMN llama_license_agreed_at INTEGER;
   ALTER TABLE users ADD COLUMN llama_license_version TEXT DEFAULT '3.2';
   ```

4. **Add EU Geolocation Check**
   - Use Cloudflare's geolocation headers
   - Block EU users from AI features
   - Or consult legal team about compliance path

### Phase 2: In-App Notice

1. **First AI Analysis Modal**
   - Show before first AI analysis
   - "This feature uses Meta's Llama AI"
   - Links to license terms
   - Checkbox to agree
   - Only show once per user

2. **Settings Page**
   - Show AI license status
   - Link to review terms
   - Option to opt-out (disables AI features)

### Phase 3: Compliance Logging

1. **Audit Trail**
   - Log when users agree to terms
   - Log AI usage per user
   - Store license version agreed to
   - Required for potential audits

## Code Examples

### Signup Form (Future)

```typescript
// components/SignupForm.tsx
const [agreedToLlama, setAgreedToLlama] = useState(false);

<label>
  <input
    type="checkbox"
    checked={agreedToLlama}
    onChange={(e) => setAgreedToLlama(e.target.checked)}
    required
  />
  I agree to the{' '}
  <a href="https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/LICENSE" target="_blank">
    Meta Llama 3.2 License
  </a>{' '}
  and{' '}
  <a href="https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/USE_POLICY.md" target="_blank">
    Acceptable Use Policy
  </a>
</label>
```

### EU Check (Future)

```typescript
// middleware.ts or app/api/analyze-image/route.ts
const country = request.headers.get('CF-IPCountry');
const euCountries = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'];

if (euCountries.includes(country || '')) {
  return new Response(JSON.stringify({
    error: 'AI features not available in EU due to licensing restrictions'
  }), { status: 403 });
}
```

### User Agreement Check (Future)

```typescript
// app/api/analyze-image/route.ts
const userId = formData.get('userId');
const user = await DB.prepare('SELECT llama_license_agreed_at FROM users WHERE id = ?')
  .bind(userId)
  .first();

if (!user?.llama_license_agreed_at) {
  return new Response(JSON.stringify({
    error: 'Must agree to Llama license before using AI features',
    requiresAgreement: true
  }), { status: 403 });
}
```

## Risk Assessment

**Current Status**: ⚠️ MEDIUM RISK
- Backend automatically agrees (legal gray area)
- No user-facing agreement
- No EU blocking
- No audit trail

**After Implementation**: ✅ LOW RISK
- Users explicitly agree
- EU users blocked or compliant
- Full audit trail
- Terms clearly displayed

## Timeline Recommendation

- **Before Beta Testing**: Implement Phase 1 (signup agreement)
- **Before Public Launch**: Implement all phases
- **Current (Dev/Testing)**: Acceptable to use automatic backend agreement

## References

- Llama 3.2 License: https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/LICENSE
- Acceptable Use Policy: https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/USE_POLICY.md
- Cloudflare Workers AI Docs: https://developers.cloudflare.com/workers-ai/models/llama-3.2-11b-vision-instruct/
- EU GDPR Compliance: https://gdpr.eu/

## Action Items

- [ ] Consult with legal counsel about EU restriction
- [ ] Add license agreement to signup flow
- [ ] Implement geolocation check
- [ ] Create terms of service page
- [ ] Add database fields for agreement tracking
- [ ] Implement first-use modal
- [ ] Create opt-out mechanism
- [ ] Add compliance logging
