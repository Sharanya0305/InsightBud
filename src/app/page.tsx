'use client';

import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ArrowRight, DollarSign, Target, Wallet } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const FeatureCard = ({ icon, title, description, className }: { icon: React.ReactNode, title: string, description: string, className?: string }) => (
  <div className={cn("bg-card/60 backdrop-blur-lg border border-primary/20 rounded-xl p-6 shadow-xl shadow-primary/5 hover:border-primary/40 transition-all duration-300", className)}>
    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm">{description}</p>
  </div>
);

const FloatingParticle = ({ style }: { style: React.CSSProperties }) => (
    <div className="absolute rounded-full bg-primary/20" style={style}></div>
);

export default function WelcomePage() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const bgImage = PlaceHolderImages.find((img) => img.id === 'welcome-background');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const { clientX, clientY, currentTarget } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = (clientX - left) / width;
    const y = (clientY - top) / height;

    const rotateX = (y - 0.5) * -20; // Max rotation of 10 degrees
    const rotateY = (x - 0.5) * 20; // Max rotation of 10 degrees

    containerRef.current.style.setProperty('--rotate-x', `${rotateX}deg`);
    containerRef.current.style.setProperty('--rotate-y', `${rotateY}deg`);
  };

  const particles = React.useMemo(() => [
        { style: { width: '80px', height: '80px', top: '10%', left: '5%', animation: 'float 15s ease-in-out infinite' } },
        { style: { width: '30px', height: '30px', top: '20%', left: '90%', animation: 'float 12s ease-in-out infinite 3s' } },
        { style: { width: '50px', height: '50px', top: '70%', left: '10%', animation: 'float 18s ease-in-out infinite 1s' } },
        { style: { width: '20px', height: '20px', top: '85%', left: '50%', animation: 'float 10s ease-in-out infinite' } },
        { style: { width: '100px', height: '100px', top: '50%', left: '80%', animation: 'float 16s ease-in-out infinite 2s' } },
  ], []);

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative flex flex-col min-h-screen bg-background text-foreground overflow-hidden"
    >
        {bgImage && (
            <Image
                src={bgImage.imageUrl}
                alt={bgImage.description}
                fill
                objectFit="cover"
                className="opacity-10 pointer-events-none"
                priority
            />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

        {particles.map((p, i) => <FloatingParticle key={i} style={p.style} />)}

      <header className="absolute top-0 left-0 right-0 p-4 sm:p-6 z-20">
        <Logo />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 z-10 text-center">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/60 !leading-tight">
            Master Your Money, Effortlessly with <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">InsightBud</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your intelligent assistant for tracking expenses, managing budgets, and achieving your financial goals.
          </p>
          <Button asChild size="lg" className="group/button shadow-lg shadow-primary/20">
            <Link href="/login">
              Get Started
              <ArrowRight className="ml-2 transition-transform duration-300 group-hover/button:translate-x-1" />
            </Link>
          </Button>
        </div>

        <div 
            ref={containerRef}
            className="relative mt-20 w-full max-w-4xl"
            style={{ perspective: '1500px' }}
        >
            <div 
                className="grid grid-cols-1 md:grid-cols-3 gap-6 transition-transform duration-300 ease-out"
                style={{ transform: 'rotateX(var(--rotate-x, 0)) rotateY(var(--rotate-y, 0))', transformStyle: 'preserve-3d' }}
            >
                <FeatureCard 
                    icon={<DollarSign className="w-6 h-6 text-primary"/>}
                    title="Expense Tracking"
                    description="Log every transaction with smart category suggestions."
                    className="md:transform md:translateZ(40px)"
                />
                <FeatureCard 
                    icon={<Wallet className="w-6 h-6 text-primary"/>}
                    title="Smart Budgets"
                    description="Set monthly budgets and get alerts before you overspend."
                     className="md:transform md:translateZ(80px)"
                />
                <FeatureCard 
                    icon={<Target className="w-6 h-6 text-primary"/>}
                    title="Savings Goals"
                    description="Create and track goals, from a new laptop to a vacation."
                    className="md:transform md:translateZ(40px)"
                />
            </div>
        </div>
      </main>

      <style jsx>{`
        @keyframes float {
            0% { transform: translateY(0px) translateX(0px) scale(1); opacity: 0.1; }
            50% { transform: translateY(-30px) translateX(20px) scale(1.1); opacity: 0.2; }
            100% { transform: translateY(0px) translateX(0px) scale(1); opacity: 0.1; }
        }
      `}</style>
    </div>
  );
}
