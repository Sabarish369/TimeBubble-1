'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TaskCompletionModal } from './task-completion-modal';

export function ModalDemo() {
  const [showTaskCompletion, setShowTaskCompletion] = useState(false);

  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Modal Demos</h2>
      
      <div className="space-x-4">
        <Button 
          onClick={() => setShowTaskCompletion(true)}
          className="bg-green-500 hover:bg-green-600"
        >
          Test Task Completion Modal
        </Button>
      </div>

      <TaskCompletionModal
        isOpen={showTaskCompletion}
        onClose={() => setShowTaskCompletion(false)}
        taskTitle="Complete project documentation"
        productivity={4}
        mood="focused"
        completionTime="45 minutes"
      />
    </div>
  );
}
