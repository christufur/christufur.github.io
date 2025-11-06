#!/bin/bash

# Setup script for personal website
# Run this from your personalwebsite directory

echo "🚀 Setting up your personal website with TypeScript..."
echo ""

# Create package.json
cat > package.json << 'EOF'
{
  "name": "christufur-portfolio",
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  },
  "dependencies": {
    "lucide": "^0.294.0"
  }
}
EOF
echo "✅ Created package.json"

# Create tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"]
}
EOF
echo "✅ Created tsconfig.json"

# Create vite.config.ts
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        projects: resolve(__dirname, 'projects.html'),
        reading: resolve(__dirname, 'reading.html'),
        music: resolve(__dirname, 'music.html'),
        contact: resolve(__dirname, 'contact.html'),
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
EOF
echo "✅ Created vite.config.ts"

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
package-lock.json
yarn.lock
pnpm-lock.yaml

# Build outputs
dist/
build/
.vite/

# Environment variables
.env
.env.local
.env.production

# Editor
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Logs
logs
*.log
npm-debug.log*

# TypeScript
*.tsbuildinfo

# Testing
coverage/
.nyc_output/

# Temporary
*.tmp
.cache/
EOF
echo "✅ Created .gitignore"

# Move HTML files from pages/ to root
echo ""
echo "📁 Moving HTML files to root..."
if [ -d "pages" ]; then
    mv pages/*.html . 2>/dev/null
    echo "✅ Moved HTML files from pages/ to root"
else
    echo "⚠️  No pages/ directory found"
fi

# Update HTML file paths
echo ""
echo "🔧 Fixing file paths in HTML..."
for file in *.html; do
    if [ -f "$file" ]; then
        # Fix CSS path
        sed -i '' 's|href="/css/style.css"|href="/src/styles/main.css"|g' "$file" 2>/dev/null
        sed -i '' 's|rel="stylesheet" href="css/style.css"|href="/src/styles/main.css"|g' "$file" 2>/dev/null
        
        # Fix JS path - change to main.ts
        sed -i '' 's|<script>|<script type="module" src="/src/main.ts"></script>\n<script>|g' "$file" 2>/dev/null
        
        # Fix navigation links
        sed -i '' 's|href="/pages/|href="/|g' "$file" 2>/dev/null
        sed -i '' 's|href="pages/|href="|g' "$file" 2>/dev/null
        
        echo "  ✅ Fixed $file"
    fi
done

# Rename files to match expected names
echo ""
echo "📝 Renaming files..."
[ -f "src/Main.ts" ] && mv src/Main.ts src/main.ts && echo "✅ Renamed Main.ts to main.ts"
[ -f "src/styles/Main.css" ] && mv src/styles/Main.css src/styles/main.css && echo "✅ Renamed Main.css to main.css"
[ -f "src/utils/Theme.ts" ] && mv src/utils/Theme.ts src/utils/theme.ts && echo "✅ Renamed Theme.ts to theme.ts"
[ -f "src/utils/Navigation.ts" ] && mv src/utils/Navigation.ts src/utils/navigation.ts && echo "✅ Renamed Navigation.ts to navigation.ts"
[ -f "src/utils/LazyLoad.ts" ] && mv src/utils/LazyLoad.ts src/utils/lazyload.ts && echo "✅ Renamed LazyLoad.ts to lazyload.ts"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Run: npm install"
echo "2. Run: npm run dev"
echo "3. Your site will open at http://localhost:3000"
echo ""
