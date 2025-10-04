# Candidate API Payload Examples

## Update Profile Endpoint

**PUT** `/api/candidates/me`

### ✅ **Correct Payload Structure**

```json
{
  "personalInfo": {
    "fullName": "Nguyen Van A",
    "phone": "0123456789",
    "dateOfBirth": "1998-05-15",
    "gender": "male",
    "address": {
      "street": "123 Nguyen Hue",
      "ward": "Ben Nghe",
      "district": "District 1",
      "city": "Ho Chi Minh City",
      "country": "Vietnam"
    },
    "bio": "Passionate software engineering student with focus on web development"
  },
  "education": {
    "university": {
      "name": "Ho Chi Minh University of Technology",
      "major": "Computer Science",
      "degree": "Bachelor",
      "graduationYear": 2024,
      "gpa": 8.5
    }
  },
  "preferences": {
    "locations": ["Ho Chi Minh City", "Ha Noi"],
    "internshipTypes": ["full-time", "remote"],
    "industries": ["Technology", "Fintech"],
    "minSalary": 5000000,
    "availableFrom": "2024-01-15",
    "duration": {
      "min": 3,
      "max": 6,
      "unit": "months"
    }
  }
}
```

### 📝 **Field Specifications**

#### **personalInfo** (optional)

- `fullName`: string (2-100 chars)
- `phone`: valid mobile phone format
- `dateOfBirth`: ISO 8601 date format
- `gender`: "male" | "female" | "other" | "prefer_not_to_say"
- `bio`: string (max 500 chars)
- `address`: object with street, ward, district, city, country

#### **education** (optional)

- `university.name`: string (2-200 chars)
- `university.major`: string (2-100 chars)
- `university.degree`: string
- `university.graduationYear`: number
- `university.gpa`: number (0-10)

#### **preferences** (optional)

- `locations`: array of strings
- `internshipTypes`: array of strings
- `industries`: array of strings
- `minSalary`: positive number
- `availableFrom`: ISO 8601 date
- `duration`: object with min, max, unit
  - `min`: positive number
  - `max`: positive number
  - `unit`: "days" | "weeks" | "months" | "years"

### ❌ **Common Mistakes**

1. **Missing duration structure:**

```json
// ❌ WRONG - will cause "Cast to Object failed" error
{
  "preferences": {
    "locations": ["Ho Chi Minh City"],
    "duration": undefined // or missing completely
  }
}
```

2. **Invalid duration unit:**

```json
// ❌ WRONG
{
  "preferences": {
    "duration": {
      "min": 3,
      "max": 6,
      "unit": "month" // should be "months"
    }
  }
}
```

3. **Invalid date format:**

```json
// ❌ WRONG
{
  "personalInfo": {
    "dateOfBirth": "15/05/1998" // should be "1998-05-15"
  }
}
```

### ✅ **Minimal Valid Examples**

#### Update only personal info:

```json
{
  "personalInfo": {
    "fullName": "Nguyen Van A",
    "phone": "0123456789"
  }
}
```

#### Update only preferences:

```json
{
  "preferences": {
    "locations": ["Ho Chi Minh City"],
    "minSalary": 5000000
  }
}
```

#### Update only education:

```json
{
  "education": {
    "university": {
      "name": "HCMUT",
      "major": "Computer Science"
    }
  }
}
```

### 🔍 **Validation Rules Summary**

| Field                     | Required | Type   | Constraints                         |
| ------------------------- | -------- | ------ | ----------------------------------- |
| personalInfo.fullName     | No       | String | 2-100 characters                    |
| personalInfo.phone        | No       | String | Valid mobile format                 |
| personalInfo.gender       | No       | String | male/female/other/prefer_not_to_say |
| education.university.gpa  | No       | Number | 0-10                                |
| preferences.locations     | No       | Array  | -                                   |
| preferences.minSalary     | No       | Number | Positive                            |
| preferences.duration.min  | No       | Number | Positive                            |
| preferences.duration.max  | No       | Number | Positive                            |
| preferences.duration.unit | No       | String | days/weeks/months/years             |

### 🚨 **Error Response Examples**

#### Validation Error:

```json
{
  "success": false,
  "message": "Dữ liệu không hợp lệ",
  "errors": [
    {
      "field": "personalInfo.fullName",
      "message": "Full name must be between 2 and 100 characters",
      "value": "A"
    }
  ]
}
```

#### Cast Error (Fixed):

```json
{
  "success": false,
  "error": "Cast to Object failed for value \"undefined\" (type undefined) at path \"preferences.duration\""
}
```

**Solution**: Include proper duration object or omit it completely.

### 📊 **Expected Success Response**

```json
{
  "success": true,
  "data": {
    "_id": "profile_id",
    "personalInfo": {
      /* updated data */
    },
    "education": {
      /* updated data */
    },
    "preferences": {
      /* updated data */
    },
    "progress": {
      "profileCompletion": 75
    },
    "updatedAt": "2025-10-02T11:30:00.000Z"
  },
  "message": "Profile updated successfully"
}
```
