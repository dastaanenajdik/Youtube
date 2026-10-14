import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function SectionHeading({ title, eyebrow, action, href }: { title: string; eyebrow?: string; action?: string; href?: string }) {
  return <div className="section-heading">
    <div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2></div>
    {action && href && <Link href={href} className="section-action">{action}<ArrowRight size={15} /></Link>}
  </div>;
}
