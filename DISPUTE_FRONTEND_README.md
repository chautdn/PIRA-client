# Dispute System Frontend Components

## Overview
Frontend implementation cho hệ thống dispute resolution với modular component architecture.

## Architecture

### Structure
```
src/
├── services/
│   └── dispute.Api.js          # API service layer
├── context/
│   └── DisputeContext.jsx      # State management
├── components/dispute/
│   ├── DisputeList.jsx         # List view với filters
│   ├── DisputeDetail.jsx       # Main detail view
│   ├── DisputeHeader.jsx       # Header info & status
│   ├── DisputeParties.jsx      # Complainant & Respondent
│   ├── DisputeEvidence.jsx     # Image & description display
│   ├── DisputeTimeline.jsx     # Event timeline
│   ├── DisputeActions.jsx      # Action buttons
│   ├── RespondDisputeModal.jsx # Response modal
│   └── CreateDisputeModal.jsx  # Creation modal
├── pages/
│   └── DisputesPage.jsx        # Main page
└── utils/
    └── disputeHelpers.js       # Helper functions

```

## Components

### DisputeList
**Purpose**: Display all user disputes with filters
**Features**:
- Status, type, priority filters
- Clickable rows navigate to detail
- Loading state
- Empty state

**Usage**:
```jsx
import DisputeList from '@/components/dispute/DisputeList';

<DisputeList />
```

### DisputeDetail
**Purpose**: Main dispute detail view
**Features**:
- Header with status badges
- Evidence display (both parties)
- Admin decision display
- Negotiation room info
- Third party resolution
- Timeline of events
- Sidebar with parties & actions

**Usage**:
```jsx
import DisputeDetail from '@/components/dispute/DisputeDetail';

<Route path="/disputes/:disputeId" element={<DisputeDetail />} />
```

### DisputeHeader
**Purpose**: Display basic dispute info
**Props**:
- `dispute` (object): Dispute data

**Features**:
- Dispute ID & creation date
- Status & priority badges
- Type & shipment type
- Description
- Order ID

### DisputeParties
**Purpose**: Show complainant & respondent info
**Props**:
- `dispute` (object): Dispute data

**Features**:
- Complainant info with role
- Respondent info with role
- Admin reviewer (if exists)

### DisputeEvidence
**Purpose**: Display evidence images & description
**Props**:
- `evidence` (object): Evidence data
- `title` (string): Section title

**Features**:
- Description text
- Image grid (2x4)
- Click to view full image
- Null-safe rendering

### DisputeTimeline
**Purpose**: Show chronological event history
**Props**:
- `dispute` (object): Dispute data

**Features**:
- Auto-generate events from dispute data
- Color-coded by event type
- Formatted timestamps
- Vertical timeline layout

### DisputeActions
**Purpose**: Display available actions for user
**Props**:
- `dispute` (object): Dispute data

**Features**:
- Context-aware buttons (only show when allowed)
- Integrated modals
- Permission checking via helpers

**Actions**:
- Respond to dispute
- Respond to admin decision
- Propose agreement
- Respond to agreement
- Upload third party evidence

### CreateDisputeModal
**Purpose**: Create new dispute
**Props**:
- `isOpen` (bool): Modal visibility
- `onClose` (function): Close handler
- `onSubmit` (function): Submit handler
- `rentalOrder` (object): Related order

**Form Fields**:
- Shipment type (DELIVERY/RETURN)
- Dispute type (dynamic based on shipment)
- Priority level
- Description
- Evidence images

### RespondDisputeModal
**Purpose**: Respond to dispute (accept/reject)
**Props**:
- `isOpen` (bool): Modal visibility
- `onClose` (function): Close handler
- `onSubmit` (function): Submit handler

**Form Fields**:
- Accept/Reject radio
- Comments
- Evidence images

## Context API

### DisputeProvider
**Purpose**: Global dispute state management

**State**:
- `disputes` (array): All user disputes
- `currentDispute` (object): Current viewing dispute
- `isLoading` (bool): Loading state
- `statistics` (object): Admin statistics

**Methods**:
```javascript
// User actions
fetchUserDisputes(filters)
fetchDisputeDetail(disputeId)
createDispute(data)
respondToDispute(disputeId, data)
respondToAdminDecision(disputeId, data)

// Negotiation
proposeAgreement(disputeId, data)
respondToAgreement(disputeId, data)
sendMessage(disputeId, message)

// Third Party
uploadThirdPartyEvidence(disputeId, data)

// Admin (if role === ADMIN)
fetchAllDisputes(filters)
reviewDispute(disputeId, data)
escalateToThirdParty(disputeId)
resolveDispute(disputeId, data)
```

**Usage**:
```jsx
import { useDispute } from '@/context/DisputeContext';

function MyComponent() {
  const { disputes, createDispute, isLoading } = useDispute();
  
  // Use methods
  await createDispute({ ... });
}
```

## Utility Helpers

### disputeHelpers.js

**Color Helpers**:
- `getDisputeStatusColor(status)` - Tailwind classes
- `getDisputeTypeColor(type)`
- `getPriorityColor(priority)`
- `getShipmentTypeColor(type)`

**Text Helpers**:
- `getDisputeStatusText(status)` - Vietnamese labels
- `getDisputeTypeText(type)`
- `getPriorityText(priority)`
- `getShipmentTypeText(type)`

**Format Helpers**:
- `formatDate(dateString)` - Vietnamese format
- `formatCurrency(amount)` - VNĐ format
- `getTimeRemaining(deadline)` - Human readable time

**Permission Helpers**:
- `canRespond(dispute, userId)` - Check if can respond
- `canRespondToAdminDecision(dispute, userId)`
- `canProposeAgreement(dispute, userId)`
- `canRespondToAgreement(dispute, userId)`
- `canUploadThirdPartyEvidence(dispute, userId)`

**Data Helpers**:
- `getDisputeTypesForShipment(shipmentType)` - Get valid types

## Integration

### 1. Add to AppProviders
```jsx
// src/providers/AppProviders.jsx
import { DisputeProvider } from '@/context/DisputeContext';

<DisputeProvider>
  {children}
</DisputeProvider>
```

### 2. Add Routes
```jsx
// src/App.jsx or router config
import DisputesPage from '@/pages/DisputesPage';
import DisputeDetail from '@/components/dispute/DisputeDetail';

<Route path="/disputes" element={<DisputesPage />} />
<Route path="/disputes/:disputeId" element={<DisputeDetail />} />
```

### 3. Add Navigation Link
```jsx
// Navigation component
<Link to="/disputes">Tranh chấp</Link>
```

### 4. Integrate with Rental Orders
```jsx
// In RentalOrderDetail.jsx
import { useState } from 'react';
import CreateDisputeModal from '@/components/dispute/CreateDisputeModal';
import { useDispute } from '@/context/DisputeContext';

function RentalOrderDetail() {
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const { createDispute } = useDispute();
  
  return (
    <>
      <button onClick={() => setShowDisputeModal(true)}>
        Tạo tranh chấp
      </button>
      
      <CreateDisputeModal
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        onSubmit={createDispute}
        rentalOrder={order}
      />
    </>
  );
}
```

## API Requirements

### Backend Endpoints
Tất cả đã có trong `PIRA-server/src/routes/dispute.routes.js`:

**User Routes**:
- `POST /api/disputes` - Create dispute
- `GET /api/disputes` - Get user disputes
- `GET /api/disputes/:id` - Get detail
- `POST /api/disputes/:id/respond` - Respond
- `POST /api/disputes/:id/admin-response` - Respond to admin
- `POST /api/disputes/:id/propose` - Propose agreement
- `POST /api/disputes/:id/respond-agreement` - Respond to agreement
- `POST /api/disputes/:id/message` - Send message
- `POST /api/disputes/:id/third-party-evidence` - Upload evidence

**Admin Routes**:
- `GET /api/disputes/admin/all` - All disputes
- `GET /api/disputes/admin/statistics` - Statistics
- `POST /api/disputes/:id/admin/review` - Review
- `POST /api/disputes/:id/admin/escalate` - Escalate
- `POST /api/disputes/:id/admin/resolve` - Resolve

## Testing

### Manual Testing Flow

1. **Create Dispute**:
   - Go to rental order detail
   - Click "Tạo tranh chấp"
   - Fill form & submit
   - Should redirect to dispute detail

2. **Respond (as respondent)**:
   - Login as respondent user
   - View dispute detail
   - Click "Phản hồi tranh chấp"
   - Accept or reject with evidence

3. **Admin Review**:
   - Login as admin
   - View all disputes
   - Review and make decision

4. **Negotiation**:
   - Both parties propose agreements
   - Send messages
   - Finalize agreement

5. **Third Party**:
   - If negotiation fails
   - Admin escalates
   - Parties upload evidence
   - Admin makes final decision

## Styling

Uses **Tailwind CSS** with:
- Responsive grid layouts
- Color-coded status badges
- Hover effects
- Loading spinners
- Modal overlays
- Smooth transitions

## Future Enhancements

### Phase 2
- [ ] Real-time updates via WebSocket
- [ ] Image upload to cloud storage
- [ ] PDF export of dispute
- [ ] Email notifications
- [ ] Push notifications

### Phase 3
- [ ] Dispute templates
- [ ] Bulk actions (admin)
- [ ] Analytics dashboard
- [ ] Chat in negotiation room
- [ ] Video evidence support

## Troubleshooting

### Common Issues

**1. Context not found**
```
Error: useDispute must be used within DisputeProvider
```
Solution: Wrap app with DisputeProvider in AppProviders.jsx

**2. API 401 Unauthorized**
Check authentication token in API service

**3. Images not displaying**
Implement proper image upload to cloud storage (currently using Object URLs)

**4. Filters not working**
Check if backend pagination/filtering is implemented

## Support
Contact: Backend team for API issues
Frontend team for UI/UX issues
