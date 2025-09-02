# TimeBubble Feedback System

## Overview

The TimeBubble feedback system allows users to provide feedback about the application through multiple channels:
1. General feedback via the header button
2. Tip-specific feedback via the tip feedback modal
3. In-app feedback section

## Components

### 1. General Feedback Modal (`general-feedback-modal.tsx`)

A reusable modal component that allows users to submit general feedback about the application.

Features:
- Multiple feedback types (Feature Request, Bug Report, Love It!, General Feedback, Improvement Idea)
- Validation for required fields
- Authentication check
- Integration with the existing feedback API

### 2. Header Integration (`header.tsx`)

The header now includes a feedback button that opens the general feedback modal.

### 3. Feedback API Route (`/api/submit-feedback`)

Handles feedback submission and stores it in Firebase Firestore.

## Data Structure

Feedback is stored in the `feedback` collection in Firestore with the following structure:

```typescript
interface Feedback {
  userId: string;
  feedbackType: 'feature' | 'bug' | 'praise' | 'general' | 'improvement';
  message: string;
  createdAt: FirebaseFirestore.FieldValue;
  status: 'new' | 'reviewed' | 'archived';
}
```

## Usage

### For Users
1. Click the feedback icon in the header
2. Select a feedback type
3. Enter your message
4. Submit the feedback

### For Developers
To use the feedback modal in other parts of the application:

```tsx
import { GeneralFeedbackModal } from '@/components/general-feedback-modal';

// In your component
const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

// Render
<GeneralFeedbackModal 
  isOpen={isFeedbackModalOpen} 
  onClose={() => setIsFeedbackModalOpen(false)} 
/>
```

## Testing

Tests are located in `src/__tests__/general-feedback.test.ts` and cover:
- Component rendering
- Form validation
- Submission flow
- Error handling

## Future Improvements

1. Add feedback categorization tags
2. Implement feedback response mechanism
3. Add screenshots capability
4. Create admin dashboard for feedback management