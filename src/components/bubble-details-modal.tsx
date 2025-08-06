
'use client';

import { useTimeBubbles } from '@/context/time-bubbles-context';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from './ui/form';
import { useState } from 'react';
import { Input } from './ui/input';

const detailsSchema = z.object({
  title: z.string().min(2).max(50),
  description: z.string().max(200).optional(),
});
type DetailsFormValues = z.infer<typeof detailsSchema>;

export function BubbleDetailsModal() {
  const { selectedBlock, setSelectedBlock, updateBlock } = useTimeBubbles();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<DetailsFormValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      title: selectedBlock?.title ?? '',
      description: selectedBlock?.description ?? '',
    },
  });
  
  if (!selectedBlock) return null;

  const handleClose = () => {
    setSelectedBlock(null);
    setIsEditing(false);
    form.reset();
  };
  
  const handleEdit = () => {
    form.reset({ title: selectedBlock.title, description: selectedBlock.description });
    setIsEditing(true);
  };

  const onSubmit = (data: DetailsFormValues) => {
    updateBlock(selectedBlock.id, { title: data.title, description: data.description });
    setIsEditing(false);
    // The block is updated, so we need to refresh the selectedBlock
    setSelectedBlock({ ...selectedBlock, ...data });
  };
  
  const startTime = format(selectedBlock.startTime, 'p');
  const endTime = format(new Date(selectedBlock.startTime.getTime() + selectedBlock.duration * 60000), 'p');

  return (
    <Dialog open={!!selectedBlock} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          {isEditing ? (
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                  <FormControl>
                    <Input {...field} className="text-lg font-semibold" />
                  </FormControl>
              )}
            />
          ) : (
            <DialogTitle>{selectedBlock.title}</DialogTitle>
          )}
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
                {isEditing ? (
                   <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                            <Textarea placeholder="Add a short description..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                    <p className='text-sm text-muted-foreground'>
                        {selectedBlock.description || 'No description provided.'}
                    </p>
                )}
             </div>
        </div>

        <DialogFooter>
          {isEditing ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex justify-end gap-2 w-full">
                 <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                 <Button type="submit">Save Changes</Button>
              </form>
            </Form>
          ) : (
            <Button onClick={handleEdit}>Edit</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
