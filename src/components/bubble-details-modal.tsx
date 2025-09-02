
'use client';

import { useTimeBubbles } from '@/context/time-bubbles-context';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { Badge } from './ui/badge';

export function BubbleDetailsModal() {
  const { selectedBlock, setSelectedBlock, setEditingBlock } = useTimeBubbles();
  
  if (!selectedBlock) return null;

  const handleClose = () => {
    setSelectedBlock(null);
  };
  
  const handleEdit = () => {
    setEditingBlock(selectedBlock);
    setSelectedBlock(null); // Close details modal when opening edit modal
  };
  const startTime = format(selectedBlock.startTime, 'p');
  const endTime = format(new Date(selectedBlock.startTime.getTime() + selectedBlock.duration * 60000), 'p');

  return (
    <Dialog open={!!selectedBlock} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{selectedBlock.title}</DialogTitle>
          <DialogDescription>
            {startTime} - {endTime} ({selectedBlock.duration} minutes)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className='space-y-2'>
            <h4 className='font-medium'>Category</h4>
            <Badge variant="secondary" className='capitalize'>{selectedBlock.category}</Badge>
          </div>
          <div className='space-y-2'>
            <h4 className='font-medium'>Description</h4>
            <p className='text-sm text-muted-foreground'>
              {selectedBlock.description || 'No description provided.'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={handleEdit}>Edit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
