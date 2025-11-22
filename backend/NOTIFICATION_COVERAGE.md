# Notification Coverage Analysis

## ✅ Đã có Notification Types
1. **NEW_APPLICATION** - ✅ Có method `notifyNewApplication()`
2. **INTERVIEW_SCHEDULED** - ✅ Có method `notifyInterviewScheduled()`
3. **APPLICATION_STATUS** - ✅ Có method `notifyApplicationStatusChange()`
4. **NEW_MESSAGE** - ✅ Có method `notifyNewMessage()` (vừa thêm)
5. **SKILL_RECOMMENDATION** - ✅ Có method `notifySkillRecommendation()` (vừa thêm)
6. **JOB_MATCH** - ✅ Có method `notifyJobMatch()` và `notifyNewJobMatch()`
7. **SYSTEM** - ✅ Có method `notifySystem()`

## 📋 Các Events Cần Notification

### 1. Application Events
- [x] **applyForJob** - Candidate apply job → Notify employer
  - **Status**: ❌ Chưa tích hợp
  - **Location**: `backend/src/controllers/candidate/ApplicationController.js:84`
  - **Action**: Cần gọi `NotificationService.notifyNewApplication()`

- [x] **updateApplication** - Employer update application status → Notify candidate
  - **Status**: ❌ Chưa tích hợp
  - **Location**: Cần tìm controller xử lý update application
  - **Action**: Cần gọi `NotificationService.notifyApplicationStatusChange()`

- [x] **withdrawApplication** - Candidate withdraw application → Notify employer
  - **Status**: ✅ Có method `notifyApplicationWithdrawn()` (vừa thêm)
  - **Location**: Cần tìm controller xử lý withdraw
  - **Action**: Cần tích hợp

### 2. Interview Events
- [x] **scheduleInterview** - Schedule interview → Notify both candidate và employer
  - **Status**: ✅ Có method `notifyInterviewScheduled()`
  - **Location**: Cần tìm controller xử lý schedule interview
  - **Action**: Cần tích hợp

### 3. Job Events
- [x] **createJob** - Employer tạo job mới → Notify matching candidates
  - **Status**: ✅ Có method `notifyNewJobMatch()`
  - **Location**: `backend/src/controllers/jobController.js`
  - **Action**: Cần tích hợp (có thể chạy background job để match và notify)

- [x] **updateJob** - Job được update → Notify interested candidates
  - **Status**: ❌ Chưa có method
  - **Action**: Có thể dùng `notifyNewJobMatch()` hoặc tạo method mới

- [x] **jobStatusChange** - Job status thay đổi (active → closed, etc.)
  - **Status**: ❌ Chưa có method
  - **Action**: Cần tạo method mới

### 4. Verification Events
- [x] **verificationApproved** - Employer verification approved → Notify employer
  - **Status**: ✅ Có method `notifyVerificationApproved()` (vừa thêm)
  - **Location**: `backend/src/controllers/admin/verificationController.js`
  - **Action**: Cần tích hợp

- [x] **verificationRejected** - Employer verification rejected → Notify employer
  - **Status**: ✅ Có method `notifyVerificationRejected()` (vừa thêm)
  - **Location**: `backend/src/controllers/admin/verificationController.js`
  - **Action**: Cần tích hợp

### 5. Message Events
- [x] **newMessage** - New message trong chat → Notify recipient
  - **Status**: ✅ Có method `notifyNewMessage()` (vừa thêm)
  - **Location**: Socket handler hoặc message controller
  - **Action**: Cần tích hợp

### 6. Skill Recommendation Events
- [x] **skillRecommendation** - AI recommend skills → Notify candidate
  - **Status**: ✅ Có method `notifySkillRecommendation()` (vừa thêm)
  - **Location**: AI service hoặc skill recommendation service
  - **Action**: Cần tích hợp

## 📊 Tổng Kết

### Methods đã có: 11/11 ✅
1. ✅ `createAndSend()` - Base method
2. ✅ `notifyNewApplication()`
3. ✅ `notifyApplicationStatusChange()`
4. ✅ `notifyInterviewScheduled()`
5. ✅ `notifyJobMatch()`
6. ✅ `notifyNewJobMatch()` (vừa thêm)
7. ✅ `notifySystem()`
8. ✅ `notifyNewMessage()` (vừa thêm)
9. ✅ `notifySkillRecommendation()` (vừa thêm)
10. ✅ `notifyVerificationApproved()` (vừa thêm)
11. ✅ `notifyVerificationRejected()` (vừa thêm)
12. ✅ `notifyApplicationWithdrawn()` (vừa thêm)
13. ✅ `markAsRead()`

### Tích hợp vào Controllers: 4/8 ✅
1. ✅ `applyForJob` - Đã tích hợp `notifyNewApplication()` 
   - **Location**: `backend/src/controllers/candidate/ApplicationController.js:149-171`
   - **Status**: Hoàn thành

2. ✅ `updateApplicationStatus` - Đã tích hợp `notifyApplicationStatusChange()`
   - **Location**: `backend/src/controllers/applicationController.js:261-280`
   - **Status**: Hoàn thành

3. ✅ `withdrawApplication` - Đã tích hợp `notifyApplicationWithdrawn()`
   - **Location**: `backend/src/controllers/candidate/ApplicationController.js:212-230`
   - **Status**: Hoàn thành

4. ❌ `scheduleInterview` - Chưa tích hợp
   - **Action**: Cần tìm controller xử lý schedule interview

5. ❌ `createJob` - Chưa tích hợp (có thể làm background job)
   - **Action**: Có thể chạy background job để match và notify candidates

6. ✅ `verificationApproved` - Đã tích hợp `notifyVerificationApproved()`
   - **Location**: `backend/src/controllers/admin/verificationController.js:363-375`
   - **Status**: Hoàn thành

7. ✅ `verificationRejected` - Đã tích hợp `notifyVerificationRejected()`
   - **Location**: `backend/src/controllers/admin/verificationController.js:383-395`
   - **Status**: Hoàn thành

8. ❌ `newMessage` - Chưa tích hợp
   - **Action**: Cần tích hợp vào message/chat handler

## 🎯 Next Steps

1. ✅ **Tích hợp vào các controllers** - Đã tích hợp 4/8 events chính
2. ⏳ **Test realtime** - Cần test Socket.io emit
3. ⏳ **Background jobs** - Job matching và notification (optional - có thể làm sau)
4. ⏳ **Email notifications** - Mở rộng sang email channel (optional)

## 📝 Notes

### Job Matching Notification
- **createJob** tạo job ở status `DRAFT`, không phải `ACTIVE`
- Có thể notify candidates khi job được publish (status = `ACTIVE`)
- Có thể chạy background job để match và notify (optional)

### Interview Scheduling
- Chưa có controller riêng cho schedule interview
- Có thể tích hợp vào Application model method `scheduleInterview()` hoặc tạo controller mới

### Message Notifications
- Cần tích hợp vào message/chat handler khi có
- Socket event `new-message` đã có trong `socket.js`, chỉ cần gọi `notifyNewMessage()`

