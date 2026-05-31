import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
	rating: number;
	size?: number;
}

export function StarRating({ rating, size = 14 }: StarRatingProps) {
	return (
		<div className="flex items-center gap-0.5">
			{[1, 2, 3, 4, 5].map((i) => (
				<Star
					key={i}
					size={size}
					className={cn(
						i <= Math.round(rating)
							? "fill-amber-400 text-amber-400"
							: "text-muted-foreground/30",
					)}
				/>
			))}
		</div>
	);
}
