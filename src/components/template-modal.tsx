
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTimeBubbles } from '@/context/time-bubbles-context';
import { BUBBLE_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { BubbleCategory } from '@/types';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const templateSchema = z.object({
  title: z.string().min(2, { message: 'Title must be at least 2 characters.' }).max(50),
  duration: z.coerce.number().min(15, { message: 'Duration must be at least 15 minutes.' }).max(720),
  category: z.enum(['work', 'study', 'break', 'personal', 'health']),
  color: z.string(),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

const categories: BubbleCategory[] = ['work', 'study', 'break', 'personal', 'health'];

export function TemplateModal({ isOpen, onClose }: TemplateModalProps) {
  const { addTemplate } = useTimeBubbles();
  
  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      title: '',
      duration: 30,
      category: 'personal',
      color: BUBBLE_COLORS.lavender,
    },
  });

  const onSubmit = (data: TemplateFormValues) => {
    addTemplate(data);
    onClose();
    form.reset();
  };

  const handleClose = () => {
    onClose();
    form.reset();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Template</DialogTitle>
          <DialogDescription>
            Design a new time bubble template for quick access.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Morning Walk" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (in minutes)</FormLabel>
                  <FormControl>
                    <Input type="number" step={15} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="flex gap-2 p-2 rounded-lg border">
                      {Object.entries(BUBBLE_COLORS).map(([name, color]) => (
                        <button
                          type="button"
                          key={name}
                          className={cn("w-8 h-8 rounded-full border-2", field.value === color ? "border-ring ring-2 ring-ring" : "border-transparent")}
                          style={{ backgroundColor: color }}
                          onClick={() => field.onChange(color)}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit">Create Template</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
