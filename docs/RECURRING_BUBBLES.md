# Recurring Bubbles Feature

## Overview

The recurring bubbles feature allows users to create time bubbles that repeat on selected days of the week, making it easy to set up regular routines and recurring tasks.

## Features

### 🔄 Recurring Options
- **Toggle Switch**: Enable/disable recurring functionality with a simple switch
- **Day Selection**: Choose which days of the week the bubble should repeat on
- **End Date**: Optionally set when the recurring pattern should stop
- **Smart Defaults**: Automatically creates bubbles for the next 90 days if no end date is specified

### 📅 Day Selection Interface
- **Visual Day Picker**: Interactive circular buttons for each day of the week
- **Multiple Selection**: Select any combination of days (Mon, Tue, Wed, etc.)
- **Intuitive Design**: Selected days are highlighted with primary color
- **Validation**: Requires at least one day to be selected when recurring is enabled

### ⚙️ Advanced Options
- **Custom End Date**: Set a specific date when the recurring pattern should stop
- **Safety Limits**: Maximum of 365 recurring instances to prevent excessive creation
- **Collision Detection**: Uses existing bubble placement logic to avoid overlaps

## How to Use

### Creating a Recurring Bubble

1. **Open Bubble Creation Modal**: Click the "+" button or use any trigger to create a new bubble
2. **Fill Basic Information**: 
   - Title (required)
   - Description (optional)
   - Start date
   - Time (start and end)
   - Category
   - Color

3. **Enable Recurring**: Toggle the "Make this a recurring bubble" switch

4. **Select Days**: Click on the day buttons to select which days you want the bubble to repeat:
   - **Sun** - Sunday
   - **Mon** - Monday  
   - **Tue** - Tuesday
   - **Wed** - Wednesday
   - **Thu** - Thursday
   - **Fri** - Friday
   - **Sat** - Saturday

5. **Set End Date (Optional)**: Choose when the recurring pattern should stop
   - Leave empty for 90-day default
   - Select a specific end date using the calendar

6. **Create**: Click "Create Recurring Bubbles" to generate all instances

### Examples

#### Daily Morning Routine
- **Title**: "Morning Workout"
- **Time**: 7:00 AM - 8:00 AM
- **Days**: Mon, Tue, Wed, Thu, Fri, Sat, Sun (all days)
- **End Date**: 3 months from now

#### Workday Meetings
- **Title**: "Team Standup"  
- **Time**: 9:00 AM - 9:30 AM
- **Days**: Mon, Tue, Wed, Thu, Fri (weekdays only)
- **End Date**: End of quarter

#### Weekend Activities
- **Title**: "Family Time"
- **Time**: 10:00 AM - 12:00 PM  
- **Days**: Sat, Sun (weekends only)
- **End Date**: No end date (90-day default)

## Technical Implementation

### Form Schema
```typescript
{
  // ... existing fields ...
  isRecurring: boolean,
  selectedDays: number[], // Array of day indices (0=Sunday, 1=Monday, etc.)
  endDate: Date | undefined
}
```

### Creation Logic
- Creates individual bubbles for each selected day within the date range
- Uses the same time slots for each occurrence
- Applies collision detection and available slot finding
- Respects the existing bubble placement system

### Validation
- Ensures at least one day is selected when recurring is enabled
- Validates that end date is after start date
- Maintains all existing validations for individual bubbles

## Benefits

### For Users
- **Time Saving**: Set up recurring routines once instead of creating individual bubbles
- **Consistency**: Maintain regular schedules and habits
- **Flexibility**: Choose specific days and duration for recurring patterns
- **Visual Feedback**: Clear indication when creating multiple bubbles

### For Productivity
- **Habit Formation**: Regular recurring bubbles help establish routines
- **Schedule Management**: Easy to visualize and plan recurring commitments  
- **Time Blocking**: Effective for consistent time allocation to important activities

## Future Enhancements

### Potential Improvements
- **Recurring Patterns**: Monthly, yearly, or custom interval patterns
- **Exception Handling**: Skip specific dates (holidays, vacations)
- **Bulk Editing**: Modify all future instances of a recurring series
- **Template Creation**: Save recurring patterns as reusable templates
- **Smart Suggestions**: AI-powered recommendations for optimal recurring schedules

### Advanced Features
- **Series Management**: View and manage all bubbles in a recurring series
- **Pattern Analytics**: Track completion rates and patterns for recurring bubbles
- **Dependency Chains**: Link recurring bubbles with prerequisites
- **Dynamic Scheduling**: Adjust timing based on previous completion patterns

## Best Practices

### Recommended Usage
- **Start Small**: Begin with 1-2 recurring bubbles to establish habits
- **Be Realistic**: Choose achievable time slots and frequencies
- **Regular Review**: Periodically assess and adjust recurring patterns
- **Category Organization**: Use consistent categories for related recurring activities

### Common Patterns
- **Morning Routines**: Exercise, meditation, planning
- **Work Blocks**: Deep work, meetings, review sessions  
- **Evening Wind-down**: Reading, reflection, preparation for next day
- **Weekly Reviews**: Planning, goal assessment, schedule optimization

The recurring bubbles feature transforms TimeBubble from a daily planning tool into a comprehensive routine and habit management system, supporting long-term productivity and personal development goals.