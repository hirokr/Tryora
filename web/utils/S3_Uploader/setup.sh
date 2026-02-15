#!/bin/bash
# Quick Setup Script for Supabase File Uploader
# Run this script to verify your setup or get started quickly

echo "🚀 Supabase File Uploader Setup Verification"
echo "=============================================="
echo ""

# Check Node version
echo "✓ Checking Node.js..."
node_version=$(node -v)
echo "  Node version: $node_version"

# Check if package.json exists
echo ""
echo "✓ Checking project structure..."
if [ -f "web/package.json" ]; then
    echo "  ✅ Web package.json found"
else
    echo "  ❌ web/package.json not found"
    exit 1
fi

if [ -d "web/utils/S3_Uploader" ]; then
    echo "  ✅ S3_Uploader directory found"
else
    echo "  ❌ S3_Uploader directory not found"
    exit 1
fi

# Check for Supabase dependency
echo ""
echo "✓ Checking dependencies..."
if grep -q "@supabase/supabase-js" web/package.json; then
    echo "  ✅ @supabase/supabase-js is in package.json"
else
    echo "  ⚠️  @supabase/supabase-js not found in package.json"
fi

# Check for S3 dependencies
if grep -q "@aws-sdk/client-s3" web/package.json; then
    echo "  ⚠️  AWS S3 SDK still in package.json (can be removed)"
else
    echo "  ✅ AWS S3 SDK removed"
fi

# Check for required files
echo ""
echo "✓ Checking S3_Uploader files..."
files=("blob.server.ts" "uploader.client.tsx" "supabase.client.ts" "index.tsx" "types.ts" "README.md" ".env.example")
for file in "${files[@]}"; do
    if [ -f "web/utils/S3_Uploader/$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (missing)"
    fi
done

# Check .env.local
echo ""
echo "✓ Checking environment setup..."
if [ -f "web/.env.local" ]; then
    echo "  ✅ web/.env.local found"
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" web/.env.local; then
        echo "  ✅ NEXT_PUBLIC_SUPABASE_URL configured"
    else
        echo "  ⚠️  NEXT_PUBLIC_SUPABASE_URL not set"
    fi
    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" web/.env.local; then
        echo "  ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY configured"
    else
        echo "  ⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY not set"
    fi
else
    echo "  ⚠️  web/.env.local not found (create from .env.example)"
    cp web/utils/S3_Uploader/.env.example web/.env.local 2>/dev/null && echo "  ✅ Created web/.env.local from template"
fi

echo ""
echo "=============================================="
echo "✅ Verification complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Fill in .env.local with Supabase credentials"
echo "  2. Run: npm install (in web folder)"
echo "  3. Run: npm run dev"
echo "  4. Visit: http://localhost:3000"
echo ""
echo "📚 Documentation:"
echo "  - Setup: web/SUPABASE_INTEGRATION.md"
echo "  - Component: web/utils/S3_Uploader/README.md"
echo "  - Help: web/utils/S3_Uploader/example.tsx"
echo ""
