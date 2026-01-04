/**
 * Tests for scheduled priority changes logic
 * Tests the logic for processing scheduled priority changes that should be applied
 * when their scheduled time has passed
 */

/**
 * Process scheduled priority changes for a todo item
 * This mirrors the logic in startTodosListener in app.js
 *
 * @param {Object} data - The todo data object
 * @param {number} now - Current timestamp in milliseconds
 * @returns {Object|null} - Returns {latestPriority, pendingChanges} or null if no changes needed
 */
function processScheduledChanges(data, now) {
  // Check for scheduled priority changes (supports both array and single object for backwards compat)
  let scheduledChanges = data.scheduledPriorityChanges || [];
  // Handle legacy single scheduledPriorityChange
  if (data.scheduledPriorityChange && data.scheduledPriorityChange.time) {
    scheduledChanges = [data.scheduledPriorityChange];
  }

  if (scheduledChanges.length === 0) {
    return null;
  }

  const pendingChanges = [];
  let latestPriority = null;

  scheduledChanges.forEach(change => {
    if (change && change.time && change.time <= now) {
      // This change should be applied
      latestPriority = change.newPriority;
    } else if (change && change.time) {
      // Keep this change for later
      pendingChanges.push(change);
    }
  });

  // If no changes were triggered, return null
  if (latestPriority === null) {
    return null;
  }

  return { latestPriority, pendingChanges };
}

/**
 * Format due time for display (helper for testing renderScheduledChangesList)
 */
function formatDueTime(dueTime, selectedTimezone = 'America/New_York') {
  if (!dueTime) return '';
  const date = new Date(dueTime);
  const now = new Date();

  const dateOptions = { timeZone: selectedTimezone, year: 'numeric', month: 'numeric', day: 'numeric' };
  const timeOptions = { timeZone: selectedTimezone, hour: '2-digit', minute: '2-digit' };

  const dateInTz = date.toLocaleDateString('en-US', dateOptions);
  const nowInTz = now.toLocaleDateString('en-US', dateOptions);

  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowInTz = tomorrowDate.toLocaleDateString('en-US', dateOptions);

  const timeStr = date.toLocaleTimeString([], timeOptions);

  if (dateInTz === nowInTz) return `Today ${timeStr}`;
  if (dateInTz === tomorrowInTz) return `Tomorrow ${timeStr}`;
  return date.toLocaleDateString([], { timeZone: selectedTimezone, month: 'short', day: 'numeric' }) + ` ${timeStr}`;
}

/**
 * Render scheduled changes list (logic test)
 * This mirrors the renderScheduledChangesList function in app.js
 */
function renderScheduledChangesList(changes) {
  if (!changes || changes.length === 0) {
    return [];
  }

  // Sort by time
  const sorted = [...changes].sort((a, b) => a.time - b.time);
  return sorted;
}

describe('processScheduledChanges', () => {
  describe('with no scheduled changes', () => {
    test('returns null for todo without scheduledPriorityChanges', () => {
      const data = { text: 'Test todo', priority: 5 };
      const result = processScheduledChanges(data, Date.now());
      expect(result).toBeNull();
    });

    test('returns null for empty scheduledPriorityChanges array', () => {
      const data = { text: 'Test todo', priority: 5, scheduledPriorityChanges: [] };
      const result = processScheduledChanges(data, Date.now());
      expect(result).toBeNull();
    });

    test('returns null for null scheduledPriorityChanges', () => {
      const data = { text: 'Test todo', priority: 5, scheduledPriorityChanges: null };
      const result = processScheduledChanges(data, Date.now());
      expect(result).toBeNull();
    });
  });

  describe('with future scheduled changes', () => {
    test('returns null when all changes are in the future', () => {
      const now = 1000000;
      const data = {
        text: 'Test todo',
        priority: 5,
        scheduledPriorityChanges: [
          { time: now + 1000, newPriority: 8 },
          { time: now + 2000, newPriority: 10 }
        ]
      };
      const result = processScheduledChanges(data, now);
      expect(result).toBeNull();
    });
  });

  describe('with past scheduled changes', () => {
    test('applies single past change', () => {
      const now = 1000000;
      const data = {
        text: 'Test todo',
        priority: 5,
        scheduledPriorityChanges: [
          { time: now - 1000, newPriority: 8 }
        ]
      };
      const result = processScheduledChanges(data, now);
      expect(result.latestPriority).toBe(8);
      expect(result.pendingChanges).toEqual([]);
    });

    test('applies the latest past change when multiple have passed', () => {
      const now = 1000000;
      const data = {
        text: 'Test todo',
        priority: 5,
        scheduledPriorityChanges: [
          { time: now - 2000, newPriority: 6 },
          { time: now - 1000, newPriority: 8 }
        ]
      };
      const result = processScheduledChanges(data, now);
      // The latest priority should be from the last processed change (8)
      // Note: forEach processes in order, so the last one to be <= now wins
      expect(result.latestPriority).toBe(8);
      expect(result.pendingChanges).toEqual([]);
    });

    test('keeps future changes as pending', () => {
      const now = 1000000;
      const data = {
        text: 'Test todo',
        priority: 5,
        scheduledPriorityChanges: [
          { time: now - 1000, newPriority: 6 },
          { time: now + 1000, newPriority: 8 },
          { time: now + 2000, newPriority: 10 }
        ]
      };
      const result = processScheduledChanges(data, now);
      expect(result.latestPriority).toBe(6);
      expect(result.pendingChanges).toEqual([
        { time: now + 1000, newPriority: 8 },
        { time: now + 2000, newPriority: 10 }
      ]);
    });
  });

  describe('with change exactly at current time', () => {
    test('applies change when time equals now', () => {
      const now = 1000000;
      const data = {
        text: 'Test todo',
        priority: 5,
        scheduledPriorityChanges: [
          { time: now, newPriority: 8 }
        ]
      };
      const result = processScheduledChanges(data, now);
      expect(result.latestPriority).toBe(8);
    });
  });

  describe('legacy single scheduledPriorityChange support', () => {
    test('handles legacy single scheduledPriorityChange object', () => {
      const now = 1000000;
      const data = {
        text: 'Test todo',
        priority: 5,
        scheduledPriorityChange: { time: now - 1000, newPriority: 9 }
      };
      const result = processScheduledChanges(data, now);
      expect(result.latestPriority).toBe(9);
    });

    test('legacy field overrides array when both exist (backwards compat behavior)', () => {
      const now = 1000000;
      const data = {
        text: 'Test todo',
        priority: 5,
        scheduledPriorityChanges: [
          { time: now - 1000, newPriority: 7 }
        ],
        // Note: In app.js, the legacy scheduledPriorityChange field OVERRIDES
        // the array when both exist. This is the backwards compatibility behavior
        // that will eventually be deprecated.
        scheduledPriorityChange: { time: now - 500, newPriority: 9 }
      };
      const result = processScheduledChanges(data, now);
      // Legacy field takes precedence for backwards compatibility
      expect(result.latestPriority).toBe(9);
    });

    test('returns null for legacy change in future', () => {
      const now = 1000000;
      const data = {
        text: 'Test todo',
        priority: 5,
        scheduledPriorityChange: { time: now + 1000, newPriority: 9 }
      };
      const result = processScheduledChanges(data, now);
      expect(result).toBeNull();
    });

    test('handles legacy field with missing time', () => {
      const data = {
        text: 'Test todo',
        priority: 5,
        scheduledPriorityChange: { newPriority: 9 } // missing time
      };
      const result = processScheduledChanges(data, Date.now());
      expect(result).toBeNull();
    });
  });

  describe('edge cases with invalid changes', () => {
    test('handles null change in array', () => {
      const now = 1000000;
      const data = {
        text: 'Test todo',
        priority: 5,
        scheduledPriorityChanges: [
          null,
          { time: now - 1000, newPriority: 8 }
        ]
      };
      const result = processScheduledChanges(data, now);
      expect(result.latestPriority).toBe(8);
    });

    test('handles change with missing time', () => {
      const now = 1000000;
      const data = {
        text: 'Test todo',
        priority: 5,
        scheduledPriorityChanges: [
          { newPriority: 6 }, // missing time
          { time: now - 1000, newPriority: 8 }
        ]
      };
      const result = processScheduledChanges(data, now);
      expect(result.latestPriority).toBe(8);
    });

    test('handles undefined values in array', () => {
      const now = 1000000;
      const data = {
        text: 'Test todo',
        priority: 5,
        scheduledPriorityChanges: [
          undefined,
          { time: now - 1000, newPriority: 8 }
        ]
      };
      const result = processScheduledChanges(data, now);
      expect(result.latestPriority).toBe(8);
    });
  });

  describe('priority value edge cases', () => {
    test('handles priority 0', () => {
      const now = 1000000;
      const data = {
        text: 'Test todo',
        scheduledPriorityChanges: [
          { time: now - 1000, newPriority: 0 }
        ]
      };
      const result = processScheduledChanges(data, now);
      expect(result.latestPriority).toBe(0);
    });

    test('handles priority 10', () => {
      const now = 1000000;
      const data = {
        text: 'Test todo',
        scheduledPriorityChanges: [
          { time: now - 1000, newPriority: 10 }
        ]
      };
      const result = processScheduledChanges(data, now);
      expect(result.latestPriority).toBe(10);
    });

    test('handles decimal priority', () => {
      const now = 1000000;
      const data = {
        text: 'Test todo',
        scheduledPriorityChanges: [
          { time: now - 1000, newPriority: 7.5 }
        ]
      };
      const result = processScheduledChanges(data, now);
      expect(result.latestPriority).toBe(7.5);
    });
  });
});

describe('renderScheduledChangesList', () => {
  test('returns empty array for null input', () => {
    const result = renderScheduledChangesList(null);
    expect(result).toEqual([]);
  });

  test('returns empty array for empty array input', () => {
    const result = renderScheduledChangesList([]);
    expect(result).toEqual([]);
  });

  test('returns sorted array by time ascending', () => {
    const changes = [
      { time: 3000, newPriority: 5 },
      { time: 1000, newPriority: 8 },
      { time: 2000, newPriority: 3 }
    ];
    const result = renderScheduledChangesList(changes);
    expect(result[0].time).toBe(1000);
    expect(result[1].time).toBe(2000);
    expect(result[2].time).toBe(3000);
  });

  test('does not mutate original array', () => {
    const changes = [
      { time: 3000, newPriority: 5 },
      { time: 1000, newPriority: 8 }
    ];
    const originalFirst = changes[0];
    renderScheduledChangesList(changes);
    expect(changes[0]).toBe(originalFirst);
  });

  test('handles single change', () => {
    const changes = [{ time: 1000, newPriority: 8 }];
    const result = renderScheduledChangesList(changes);
    expect(result.length).toBe(1);
    expect(result[0]).toEqual({ time: 1000, newPriority: 8 });
  });
});

describe('formatDueTime for scheduled changes', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-06-15T10:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('returns empty string for null/undefined', () => {
    expect(formatDueTime(null)).toBe('');
    expect(formatDueTime(undefined)).toBe('');
  });

  test('formats time as "Today" for same day', () => {
    const todayTime = new Date('2025-06-15T15:00:00.000Z').getTime();
    const result = formatDueTime(todayTime);
    expect(result).toContain('Today');
  });

  test('formats time as "Tomorrow" for next day', () => {
    const tomorrowTime = new Date('2025-06-16T15:00:00.000Z').getTime();
    const result = formatDueTime(tomorrowTime);
    expect(result).toContain('Tomorrow');
  });

  test('formats other dates with month and day', () => {
    const futureTime = new Date('2025-06-20T15:00:00.000Z').getTime();
    const result = formatDueTime(futureTime);
    expect(result).toContain('Jun');
    expect(result).toContain('20');
  });
});

describe('scheduled changes integration scenarios', () => {
  test('scenario: gradual priority escalation', () => {
    // A todo scheduled to increase priority over time
    const startTime = 1000000;
    const data = {
      text: 'Important deadline',
      priority: 3,
      scheduledPriorityChanges: [
        { time: startTime + 1000, newPriority: 5 },    // First escalation
        { time: startTime + 2000, newPriority: 7 },    // Second escalation
        { time: startTime + 3000, newPriority: 10 }    // Final - urgent
      ]
    };

    // At start - nothing should trigger
    let result = processScheduledChanges(data, startTime);
    expect(result).toBeNull();

    // After first threshold
    result = processScheduledChanges(data, startTime + 1500);
    expect(result.latestPriority).toBe(5);
    expect(result.pendingChanges.length).toBe(2);

    // After second threshold
    result = processScheduledChanges(data, startTime + 2500);
    expect(result.latestPriority).toBe(7);
    expect(result.pendingChanges.length).toBe(1);

    // After all thresholds
    result = processScheduledChanges(data, startTime + 3500);
    expect(result.latestPriority).toBe(10);
    expect(result.pendingChanges.length).toBe(0);
  });

  test('scenario: weekend priority reduction', () => {
    // Todo that gets lower priority on weekend
    const weekdayTime = 1000000;
    const data = {
      text: 'Work task',
      priority: 8,
      scheduledPriorityChanges: [
        { time: weekdayTime + 1000, newPriority: 3 }  // Lower priority for weekend
      ]
    };

    // Before weekend
    let result = processScheduledChanges(data, weekdayTime);
    expect(result).toBeNull();

    // After weekend starts
    result = processScheduledChanges(data, weekdayTime + 1500);
    expect(result.latestPriority).toBe(3);
  });

  test('scenario: multiple same-time changes (last one wins)', () => {
    const now = 1000000;
    const data = {
      text: 'Test',
      priority: 5,
      scheduledPriorityChanges: [
        { time: now - 100, newPriority: 6 },
        { time: now - 100, newPriority: 8 }, // Same time, processed later
        { time: now - 100, newPriority: 7 }  // Same time, processed last
      ]
    };

    const result = processScheduledChanges(data, now);
    // forEach processes in array order, last one with time <= now wins
    expect(result.latestPriority).toBe(7);
  });
});
