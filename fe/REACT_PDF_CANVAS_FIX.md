# React-PDF Canvas Module Fix

## Vấn đề
`react-pdf` sử dụng `pdfjs-dist` và `pdfjs-dist` cố gắng require `canvas` module (Node.js only) ở client-side, gây ra lỗi:
```
Module not found: Can't resolve 'canvas'
```

## Giải pháp

### 1. Webpack Config (`next.config.mjs`)
```javascript
webpack: (config, { isServer }) => {
  if (!isServer) {
    // Set fallbacks
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
      fs: false,
      path: false,
      crypto: false,
      stream: false,
      util: false,
      buffer: false,
      process: false,
    };
    
    // Alias canvas to false
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
  }
  return config;
}
```

### 2. Dynamic Import với SSR Disabled
```typescript
const Document = dynamic(
  () => {
    if (typeof window === "undefined") {
      return Promise.resolve(() => null);
    }
    return import("react-pdf").then((mod) => mod.Document);
  },
  { ssr: false }
);
```

### 3. Xóa cache và rebuild
```bash
# PowerShell
Remove-Item -Recurse -Force .next

# Linux/Mac
rm -rf .next

# Sau đó restart
npm run dev
```

## Lưu ý
- `canvas` chỉ cần ở server-side (nếu dùng pdfjs-dist ở server)
- Client-side không cần `canvas` vì browser có native canvas API
- Webpack alias `canvas: false` sẽ ngăn webpack bundle canvas vào client bundle

