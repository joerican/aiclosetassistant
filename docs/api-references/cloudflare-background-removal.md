# Cloudflare Background Removal API Reference

**Last Updated**: 2025-11-19 03:56 EST
**Status**: ✅ IMPLEMENTED AND WORKING

## Important Discovery

**The `@cf/cloudflare/rembg` model does NOT exist in Workers AI.**

Background removal on Cloudflare is provided through the **Cloudflare Images API**, not Workers AI.

## ✅ Current Implementation (FIXED)

### Model Used
- **BiRefNet** (Bilateral Reference Network)
- Purpose: Segment complex and high-resolution images
- Performance: IoU 0.87, Dice coefficient 0.92

### How to Use

#### Option 1: Images API with URL Parameter
```
https://example.com/cdn-cgi/image/segment=foreground/image.png
```

#### Option 2: Workers with Images Binding
```javascript
export default {
  async fetch(request, env) {
    const imageURL = "{image-url}";
    const response = await fetch(imageURL);

    return (
      await env.IMAGES
        .input(response.body)
        .transform({segment: "foreground"})
        .output({format: "image/png"})
    ).response();
  }
};
```

### Required Binding
```toml
# wrangler.toml
[[images]]
binding = "IMAGES"
```

## What We Changed

**Old (WRONG) Code:**
```javascript
AI.run('@cf/cloudflare/rembg', { image: ... })  // This model doesn't exist!
```

**New (CORRECT) Code:**
```javascript
// Use Images API binding instead
const result = await IMAGES
  .input(imageBuffer)
  .transform({ segment: 'foreground' })
  .output({ format: 'png' });

return result.response();
```

**Files Modified:**
- `app/api/remove-background/route.ts` - Switched from AI binding to IMAGES binding
- `wrangler.jsonc` - Added Images binding configuration
- `cloudflare-env.d.ts` - Added IMAGES type to CloudflareEnv interface

## References
- Blog: https://blog.cloudflare.com/background-removal/
- Images API: https://developers.cloudflare.com/images/transform-images/
