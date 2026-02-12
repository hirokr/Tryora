# Quick Start - Server Testing

## ⚡ Run Tests (Quick Commands)

```bash
# Navigate to server directory
cd server

# Install dependencies (first time only)
npm install

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode (re-runs on file changes)
npm test -- --watch

# Using the test script
./test.sh all         # Run all tests
./test.sh coverage    # With coverage
./test.sh watch       # Watch mode
```

## 📊 Test Results

**✅ 25 tests passing**

- POST /auth/signup: 9 tests
- POST /auth/signin: 6 tests
- GET /auth/refresh: 5 tests
- GET /auth/signout: 5 tests

**📈 Code Coverage: 86.61%**

- Statements: 86.61%
- Branches: 80%
- Functions: 77.77%

## 🧪 What's Tested

### Authentication Flow

✅ User signup with validation  
✅ User signin with credentials  
✅ Token refresh rotation  
✅ Secure signout with cleanup

### Security

✅ Password hashing (Argon2)  
✅ Password complexity validation  
✅ JWT token generation  
✅ Refresh token rotation  
✅ Session management  
✅ No password leaks

### Input Validation

✅ Email format validation  
✅ Password strength requirements  
✅ Name length validation  
✅ Duplicate user prevention

## 📁 Test Files

- `tests/auth.test.ts` - Auth routes (25 tests)
- `tests/app.test.ts` - Health endpoints
- `tests/README.md` - Detailed documentation
- `TESTING.md` - Complete implementation guide

## 🔍 View Coverage Report

```bash
# Generate coverage
npm test -- --coverage

# Open HTML report
./test.sh open-coverage
# OR manually:
open coverage/lcov-report/index.html
```

## 🛠️ Common Issues

**TypeScript errors?**

```bash
# tsconfig.json has isolatedModules: true
# jest.config.mjs has proper transform config
```

**Tests failing?**

```bash
# Make sure you use valid test data:
email: 'test@example.com'
password: 'Password1!'  # 8+ chars, letter, number, special
name: 'John Doe'        # 2+ chars
```

**Import errors?**

```bash
# Path aliases are configured in:
# - jest.config.mjs (moduleNameMapper)
# - tsconfig.json (paths are implicit via package.json imports)
```

## 📚 Next Steps

1. ✅ Tests are ready to use
2. Run `npm test` to verify
3. Review coverage with `npm test -- --coverage`
4. Read `tests/README.md` for details
5. Add OAuth tests when ready

## 🎯 Quick Reference

| Command                  | Description         |
| ------------------------ | ------------------- |
| `npm test`               | Run all tests       |
| `npm test -- --coverage` | With coverage       |
| `npm test -- --watch`    | Watch mode          |
| `npm test auth.test.ts`  | Specific file       |
| `./test.sh coverage`     | Coverage via script |

---

**Status**: ✅ All systems go! 25/25 tests passing with 86.61% coverage.
