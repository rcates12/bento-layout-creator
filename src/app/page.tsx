import { BentoEditor } from "@/components/bento/BentoEditor";
import { MobileGate } from "@/components/bento/MobileGate";

export default function Home() {
  return (
    <div className="h-screen">
      <MobileGate />
      <BentoEditor />
    </div>
  );
}
