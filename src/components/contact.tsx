import { Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Contact() {
  return (
    <section id="contact" className="w-full py-12 md:py-24 lg:py-32 bg-background">
      <div className="container px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">Contact Us</h2>
            <p className="mt-4 text-muted-foreground md:text-xl/relaxed">
                Ready to get started? Reach out to us today.
            </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-sm gap-8 lg:max-w-4xl lg:grid-cols-2 lg:gap-12">
            <a href="tel:208-831-6824" className="group">
                <Card className="h-full transition-all group-hover:shadow-lg group-hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                        <div className="bg-primary/20 p-3 rounded-full">
                            <Phone className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle>Phone</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Give us a call for a free estimate.</p>
                        <p className="mt-2 text-lg font-semibold">(208) 831-6824</p>
                    </CardContent>
                </Card>
            </a>
            <a href="mailto:RnWpropertyrepair@gmail.com" className="group">
                <Card className="h-full transition-all group-hover:shadow-lg group-hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                         <div className="bg-primary/20 p-3 rounded-full">
                            <Mail className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle>Email</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Send us an email with your project details.</p>
                        <p className="mt-2 text-lg font-semibold">RnWpropertyrepair@gmail.com</p>
                    </CardContent>
                </Card>
            </a>
        </div>
      </div>
    </section>
  );
}
