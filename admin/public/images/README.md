# Images Directory

## Logo Files

### logo.png
- **Location**: `public/images/logo.png`
- **Format**: PNG
- **Usage**: Main application logo
- **Recommended size**: 200x60px or similar aspect ratio
- **Background**: Transparent or white

### Previous logo files (deprecated)
- `logo-GC.png` - Old logo file, replaced by `logo.png`
- `GC.png` - Old logo file, replaced by `logo.png`

## Usage in Code

The logo is referenced in the following files:
- `src/pages/login/index.jsx` - Login page logo
- `src/layouts/MainLayout.jsx` - Main layout sidebar logo
- `src/pages/media/index.jsx` - Media gallery placeholder
- `src/pages/accounts/index.jsx` - User avatar fallback
- `src/pages/accounts/detail.jsx` - User detail avatar fallback

## Image Path Helper

All image paths use the `getPath()` helper function:
```javascript
import { getPath } from '../utils/index.js';

// Usage
<img src={getPath("/images/logo.png")} alt="Logo" />
```

## Notes

- All image paths have been updated to use `logo.png`
- The old `logo-GC.png` and `GC.png` files are no longer used
- Make sure to place your actual logo file at `public/images/logo.png`
