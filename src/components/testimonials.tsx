'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { submitReview, type Review } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Rating } from './ui/rating';

const initialReviews: Review[] = [
  { name: 'John D.', rating: 5, comment: 'Incredible service! The team was fast, reliable, and professional. They handled our debris removal with ease.' },
  { name: 'Jane S.', rating: 5, comment: 'R & W Property Solutions cleaned up my property after a major storm, and it honestly looks better than it did before. Highly recommend!' },
  { name: 'Mike R.', rating: 4, comment: 'Good work at a fair price. The restoration project was completed on time. Would use their services again.' },
  { name: 'Sarah L.', rating: 5, comment: 'Absolutely fantastic. They repaired our water damage and were so thorough. Communication was excellent throughout the process.' },
];

const reviewSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  rating: z.coerce.number().min(1, "Rating is required.").max(5),
  comment: z.string().min(10, 'Comment must be at least 10 characters.'),
});

const ReviewCard = ({ review }: { review: Review }) => (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle className="text-lg">{review.name}</CardTitle>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={cn(
                'h-5 w-5',
                i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'
              )}
            />
          ))}
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">{review.comment}</p>
    </CardContent>
  </Card>
);

export default function Testimonials() {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { name: '', rating: 0, comment: '' },
  });

  const onSubmit = async (data: z.infer<typeof reviewSchema>) => {
    const result = await submitReview(data);
    if (result.success && result.data) {
      setReviews([result.data, ...reviews]);
      toast({ title: 'Success', description: 'Your review has been submitted!' });
      form.reset();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not submit review. Please try again.' });
    }
  };

  return (
    <div className="w-full py-12 md:py-24 lg:py-32 bg-secondary/50">
      <div className="container mx-auto grid gap-12 px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">
            Don't take our word for it...
          </h2>
          <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            ...take our customers' word for it. See what people are saying about our services.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews.slice(0, 3).map((review, i) => (
            <ReviewCard key={`recent-${i}`} review={review} />
          ))}
        </div>
        {reviews.length > 3 && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>View All Reviews</AccordionTrigger>
              <AccordionContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {reviews.slice(3).map((review, i) => (
                  <ReviewCard key={`all-${i}`} review={review} />
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
        <div className="mx-auto w-full max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Leave a Review</CardTitle>
              <CardDescription>Share your experience with us.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                       <FormItem>
                        <FormLabel>Rating</FormLabel>
                        <FormControl>
                          <Rating rating={field.value} onRatingChange={field.onChange} />
                        </FormControl>
                         <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="comment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comment</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Tell us about your experience..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Submitting...' : 'Submit Review'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
