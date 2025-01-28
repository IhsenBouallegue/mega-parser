import { cn } from "@/lib/utils";
import Image from "next/image";

export function GlassmorphicContainer({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col min-h-0 bg-white/[0.82] rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-[12px] border-2 border-white",
        className,
      )}
      {...props}
    />
  );
}

export function GlassmorphicButton({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "bg-white/20 backdrop-blur-md border border-white/60 hover:bg-white/30 transition-colors",
        className,
      )}
      {...props}
    />
  );
}

export function BackgroundGradient({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;

  return (
    <>
      <Image
        src="/hhholographic (1).webp"
        alt="background"
        width={1920}
        height={1080}
        className="fixed -z-20 w-full h-full opacity-90 object-cover "
      />
    </>
  );
}

export function AnalysisCard({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <div className="group w-64 h-64">
      <GlassmorphicContainer className="h-full border-2 border-dashed hover:border-primary transition-all duration-200 hover:bg-white/70">
        <button
          type="button"
          onClick={onClick}
          className="w-full h-full flex flex-col items-center justify-center gap-6 p-4 transition-colors group-hover:bg-primary/5"
        >
          <Icon className="h-16 w-16 text-primary/80 transition-transform group-hover:scale-110" />
          <div className="space-y-2 text-center">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </button>
      </GlassmorphicContainer>
    </div>
  );
}
