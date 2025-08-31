# TimeBubble - Bubble Realignment System

## 1. Core Goal & Philosophy

The primary goal of the TimeBubble realignment system is to maintain a clean, readable, and conflict-free timeline for the user. It operates on the principle that **no two bubbles can occupy the same time slot**.

This system automatically resolves overlaps, freeing the user from the tedious task of manually shifting multiple items. The logic is designed to be intelligent and context-aware, placing the moved bubble in the most logical and proximate available slot.

## 2. Triggering the Realignment

The realignment logic is **not** active during the drag or resize action itself. This allows for a fluid user experience where the user can freely move a bubble over others.

The system is triggered only **at the moment the user releases the mouse button** (i.e., on "drop" or at the end of a resize). This finalizes the action and initiates the collision check.

## 3. The `findAvailableSlot` Algorithm

This function is the heart of the realignment system. It is called by the `updateBlock` function whenever a bubble's `startTime` or `duration` is modified.

### Step 1: Identify All Collisions

When a bubble is moved to a new `requestedStartTime`, the function first identifies all *other* blocks on the timeline that it now collides with.

- A collision is defined as any situation where the time range of the moved bubble overlaps with the time range of another bubble.
- The formula is: `(movedStart < otherEnd) && (movedEnd > otherStart)`.

If there are no collisions, the `requestedStartTime` is valid, and the function returns it immediately.

### Step 2: Define the "Collision Zone"

If one or more collisions are detected, the system defines a "collision zone." This is a continuous block of time that encompasses all the colliding bubbles.

- **`collisionZoneStart`**: The earliest `startTime` among all colliding bubbles.
- **`collisionZoneEnd`**: The latest `endTime` among all colliding bubbles.

### Step 3: Check for Ideal Placement (Above or Below the Zone)

The system now looks for the two most logical places to put the moved bubble: directly **above** or directly **below** the entire collision zone.

- **Slot Above**: The potential `startTime` is calculated as `collisionZoneStart` minus the moved bubble's `duration`.
- **Slot Below**: The potential `startTime` is `collisionZoneEnd`.

The system then checks if these two potential slots are themselves free of any other collisions.

### Step 4: Intelligent Placement Decision

Based on the availability of the slots above and below, the system decides:

1.  **If Both Slots Are Free**: It calculates which slot (`above` or `below`) is closer to the user's original `requestedStartTime`. It chooses the closest one to respect the user's intent as much as possible.
2.  **If Only Slot Below is Free**: It places the bubble at `collisionZoneEnd`.
3.  **If Only Slot Above is Free**: It places the bubble at `collisionZoneStart` minus its `duration`.

### Step 5: Fallback Logic

In the rare case that both the slot directly above and the slot directly below the collision zone are *also* occupied, the system initiates a fallback search.

- It sorts all bubbles on the timeline by their start time.
- It iterates through the sorted list, looking for the very first gap between two bubbles that is large enough to accommodate the moved bubble.
- If it finds such a gap, it places the bubble there.
- If no gap is found, it places the bubble at the very end of the last bubble on the timeline.

This comprehensive logic ensures that the bubble is always placed in a valid, non-overlapping position in a predictable and user-friendly manner.
