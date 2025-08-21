
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTimeBubbles } from '@/context/time-bubbles-context';
import { BUBBLE_COLORS, FREE_COLOR_NAMES, PRO_COLOR_NAMES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { BubbleCategory, BubbleTemplate, BubbleColor } from '@/types';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { ProModal } from './pro-modal';
import { Lock } from 'lucide-react';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template?: BubbleTemplate;
}

const templateSchema = z.object({
  title: z.string().min(2, { message: 'Title must be at least 2 characters.' }).max(50),
  description: z.string().max(200).optional(),
  duration: z.coerce.number().min(15, { message: 'Duration must be at least 15 minutes.' }).max(720),
  category: z.enum(['work', 'study', 'break', 'personal', 'health']),
  color: z.string(),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

const categories: BubbleCategory[] = ['work', 'study', 'break', 'personal', 'health'];
const colorNames = Object.keys(BUBBLE_COLORS) as (keyof typeof BUBBLE_COLORS)[];

export function TemplateModal({ isOpen, onClose, template }: TemplateModalProps) {
  const { addTemplate, updateTemplate } = useTimeBubbles();
  const { isPro } = useAuth();
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const isEditMode = !!template;
  
  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      title: '',
      description: '',
      duration: 30,
      category: 'personal',
      color: 'lavender',
    },
  });

  useEffect(() => {
    if (isOpen) {
        if (isEditMode && template) {
            form.reset({
                title: template.title,
                description: template.description ?? '',
                duration: template.duration,
                category: template.category,
                color: template.color,
            });
        } else {
            form.reset({
                title: '',
                description: '',
                duration: 30,
                category: 'personal',
                color: 'lavender',
            });
        }
    }
  }, [isOpen, isEditMode, template, form]);

  const onSubmit = (data: TemplateFormValues) => {
    if (isEditMode && template) {
      updateTemplate(template.id, data as Omit<TemplateFormValues, 'id'> & { color: BubbleColor });
    } else {
      addTemplate(data as Omit<TemplateFormValues, 'id'> & { color: BubbleColor });
    }
    onClose();
  };

  const handleClose = () => {
    onClose();
  }

  const handleColorSelect = (colorName: string, fieldOnChange: (value: string) => void) => {
    if (PRO_COLOR_NAMES.includes(colorName as any) && !isPro) {
      setIsProModalOpen(true);
    } else {
      fieldOnChange(colorName);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Template' : 'Create New Template'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Modify your existing time bubble template.' : 'Design a new time bubble template for quick access.'}
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add a short description..." {...field} />
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
                      <div className="p-2 rounded-lg border">
                        <div className="text-xs text-muted-foreground mb-2">Free Colors</div>
                        <div className="flex flex-wrap gap-2">
                          {FREE_COLOR_NAMES.map((name) => (
                            <button
                              type="button"
                              key={name}
                              className={cn("w-8 h-8 rounded-full border-2", field.value === name ? "border-ring ring-2 ring-ring" : "border-transparent")}
                              style={{ backgroundColor: `hsl(var(--bubble-${name}))` }}
                              onClick={() => handleColorSelect(name, field.onChange)}
                            />
                          ))}
                        </div>
                        <div className="text-xs text-muted-foreground mt-3 mb-2">Pro Colors</div>
                         <div className="flex flex-wrap gap-2">
                          {PRO_COLOR_NAMES.map((name) => (
                            <button
                              type="button"
                              key={name}
                              className={cn(
                                "w-8 h-8 rounded-full border-2 relative group", 
                                field.value === name ? "border-ring ring-2 ring-ring" : "border-transparent",
                                !isPro && "opacity-60"
                              )}
                              style={{ backgroundColor: `hsl(var(--bubble-${name}))` }}
                              onClick={() => handleColorSelect(name, field.onChange)}
                            >
                              {!isPro && <Lock className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-white opacity-70" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
                <Button type="submit">{isEditMode ? 'Save Changes' : 'Create Template'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <ProModal isOpen={isProModalOpen} onClose={() => setIsProModalOpen(false)} />
    </>
  );
}
