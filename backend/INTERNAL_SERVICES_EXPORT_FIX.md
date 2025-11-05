# Internal Services Export Fix

## 🐛 Problem

**Error**: `AwilixTypeError: asClass: expected Type to be class, but got [object Object]`

## 🔍 Root Cause

Tất cả các **internal services** đang export **instance** (`new ServiceName()`) thay vì export **class** (`ServiceName`).

Điều này xung đột với cách container register services bằng `asClass()`:

```javascript
// ❌ Trong file service
module.exports = new AuthService(); // Export instance

// ❌ Trong container.js
authService: asClass(AuthService); // Expect class, nhưng nhận được instance!
```

## 💡 Why This Happened

Khi refactor từ direct instantiation sang constructor injection:

1. ✅ **Đã sửa**: Constructor nhận dependencies qua parameters
2. ❌ **Quên sửa**: Export vẫn là instance thay vì class

## ✅ Solution

Thay đổi tất cả internal services từ export **instance** sang export **class**:

```javascript
// ❌ Before (Anti-pattern)
class AuthService {
  constructor(userRepository, refreshTokenRepository) {
    this.userRepository = userRepository;
    this.refreshTokenRepository = refreshTokenRepository;
  }
  // ... methods
}
module.exports = new AuthService(); // ❌ Export instance

// ✅ After (Correct DI pattern)
class AuthService {
  constructor(userRepository, refreshTokenRepository) {
    this.userRepository = userRepository;
    this.refreshTokenRepository = refreshTokenRepository;
  }
  // ... methods
}
module.exports = AuthService; // ✅ Export class
```

## 📝 Files Fixed (14 files)

### Internal Services:

1. `AuthService.js`
2. `NotificationService.js`
3. `CVAnalysisService.js`
4. `ChatService.js`
5. `SkillService.js`
6. `AdminService.js`
7. `ConversationService.js`
8. `MessageService.js`
9. `SavedJobService.js`
10. `IndustryService.js`
11. `LearningRoadmapService.js`
12. `RoadmapService.js`
13. `PlanService.js`
14. `SubscriptionService.js`

## 🎓 Key Differences

### External Services (Singleton Pattern)

```javascript
// External services ARE instances (already instantiated)
// Located in: infrastructure/services/external/
class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({...});
  }
}
module.exports = new EmailService(); // ✅ Correct - singleton instance

// In container.js
emailService: asValue(EmailService) // ✅ Use asValue() for instances
```

### Internal Services (DI Pattern)

```javascript
// Internal services are CLASSES (container will instantiate)
// Located in: infrastructure/services/internal/
class AuthService {
  constructor(userRepository, refreshTokenRepository) {
    this.userRepository = userRepository;
    this.refreshTokenRepository = refreshTokenRepository;
  }
}
module.exports = AuthService; // ✅ Correct - export class

// In container.js
authService: asClass(AuthService, {
  lifetime: Lifetime.SINGLETON,
}); // ✅ Use asClass() for classes
```

## 📊 Comparison Table

| Aspect           | External Services                   | Internal Services                   |
| ---------------- | ----------------------------------- | ----------------------------------- |
| **Location**     | `infrastructure/services/external/` | `infrastructure/services/internal/` |
| **Export Type**  | **Instance** (`new Service()`)      | **Class** (`Service`)               |
| **Registration** | `asValue()`                         | `asClass()`                         |
| **Dependencies** | Hard-coded or self-managed          | Injected via constructor            |
| **Lifetime**     | Always singleton (pre-instantiated) | Configurable (typically singleton)  |
| **Example**      | EmailService, JWTService            | AuthService, ValidationService      |

## ✅ Verification

```bash
# No matches should be found
grep -r "module.exports = new" src/infrastructure/services/internal/
```

## 🎯 Awilix Rules

### Use `asValue()` when:

- ✅ Already have an instance
- ✅ External services (singletons)
- ✅ Configuration objects
- ✅ Database connections

### Use `asClass()` when:

- ✅ Exporting a class
- ✅ Need dependency injection
- ✅ Internal services
- ✅ Repositories

### Use `asFunction()` when:

- ✅ Factory functions
- ✅ Lazy initialization
- ✅ Dynamic dependencies

## ✅ Status

**All 14 internal services now correctly export classes instead of instances.**

Server should start successfully with proper dependency injection! 🎉
