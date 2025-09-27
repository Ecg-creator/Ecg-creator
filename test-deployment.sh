#!/bin/bash

# Basic deployment test for Genesis Stack
# This script validates the Docker setup without full deployment

set -e

echo "🧪 Testing Genesis Stack Docker Configuration"
echo "============================================"

# Test 1: Validate Dockerfile syntax
echo "1. Validating Dockerfile syntax..."
if timeout 10 docker build . > /dev/null 2>&1; then
    echo "   ✅ Dockerfile syntax is valid"
else
    echo "   ❌ Dockerfile syntax error"
    exit 1
fi

# Test 2: Validate docker-compose configuration
echo "2. Validating Docker Compose configuration..."
if docker-compose config > /dev/null 2>&1; then
    echo "   ✅ Docker Compose configuration is valid"
else
    echo "   ❌ Docker Compose configuration error"
    exit 1
fi

# Test 3: Check required directories and files
echo "3. Checking required files and directories..."
required_files=(
    "Dockerfile"
    "docker-compose.yml"
    "src/genesis-stack.js"
    "database/init-genesis-ledger.sql"
    "nginx/nginx.conf"
    "monitoring/prometheus.yml"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file exists"
    else
        echo "   ❌ $file missing"
        exit 1
    fi
done

required_dirs=(
    "genesis"
    "mahdi"
    "src/routes"
    "k8s-manifests"
    "secrets"
)

for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "   ✅ $dir/ directory exists"
    else
        echo "   ❌ $dir/ directory missing"
        exit 1
    fi
done

# Test 4: Validate Node.js package configuration
echo "4. Validating Node.js configuration..."
if [ -f "genesis/package.json" ]; then
    echo "   ✅ Genesis package.json exists"
    if node -e "JSON.parse(require('fs').readFileSync('genesis/package.json'))" 2>/dev/null; then
        echo "   ✅ Genesis package.json is valid JSON"
    else
        echo "   ❌ Genesis package.json is invalid JSON"
        exit 1
    fi
else
    echo "   ❌ Genesis package.json missing"
    exit 1
fi

# Test 5: Validate Ruby Gemfile
echo "5. Validating Ruby configuration..."
if [ -f "mahdi/Gemfile" ]; then
    echo "   ✅ MAHDI Gemfile exists"
else
    echo "   ❌ MAHDI Gemfile missing"
    exit 1
fi

# Test 6: Validate SQL schema files
echo "6. Validating database schema files..."
sql_files=(
    "database/init-genesis-ledger.sql"
    "database/reit-dao-schema.sql"
    "database/membership-sbt.sql"
)

for sql_file in "${sql_files[@]}"; do
    if [ -f "$sql_file" ]; then
        echo "   ✅ $sql_file exists"
        # Basic syntax check - look for basic SQL keywords
        if grep -q "CREATE TABLE\|INSERT INTO\|CREATE SCHEMA" "$sql_file"; then
            echo "   ✅ $sql_file contains valid SQL structures"
        else
            echo "   ⚠️  $sql_file may not contain expected SQL structures"
        fi
    else
        echo "   ❌ $sql_file missing"
        exit 1
    fi
done

# Test 7: Check secrets template files
echo "7. Checking secrets configuration..."
if [ -f "secrets/db_password.txt" ]; then
    echo "   ✅ Database password template exists"
else
    echo "   ⚠️  Database password template missing (will be created)"
fi

# Test 8: Validate Kubernetes manifests
echo "8. Validating Kubernetes manifests..."
k8s_files=(
    "k8s-manifests/namespace.yaml"
    "k8s-manifests/genesis-stack-deployment.yaml"
)

for k8s_file in "${k8s_files[@]}"; do
    if [ -f "$k8s_file" ]; then
        echo "   ✅ $k8s_file exists"
        # Basic YAML validation
        if python3 -c "import yaml; yaml.safe_load(open('$k8s_file'))" 2>/dev/null; then
            echo "   ✅ $k8s_file is valid YAML"
        else
            echo "   ❌ $k8s_file is invalid YAML"
            exit 1
        fi
    else
        echo "   ❌ $k8s_file missing"
        exit 1
    fi
done

# Test 9: Check deployment script
echo "9. Checking deployment script..."
if [ -f "deploy.sh" ] && [ -x "deploy.sh" ]; then
    echo "   ✅ Deployment script exists and is executable"
else
    echo "   ❌ Deployment script missing or not executable"
    exit 1
fi

echo ""
echo "🎉 All tests passed! Genesis Stack is ready for deployment."
echo ""
echo "Next steps:"
echo "1. Update secrets in secrets/ directory"
echo "2. Run './deploy.sh' for full deployment"
echo "3. Or run 'docker-compose up -d' for Docker deployment"
echo "4. Or run 'kubectl apply -f k8s-manifests/' for Kubernetes deployment"
echo ""
echo "Revenue Target: ₹3.7Cr Annual Consolidation"
echo "Components: EmpireOS + RiverOS + SynergizeOS"
echo "First Warden Faiz Ahmed - BelieversCommons Genesis Stack"