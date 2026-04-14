import { RESULT_METRICS } from "@/constants/ai";

export const ResultMetricsCard = () => {
	return (
		<div
			className="mb-10 w-full max-w-2xl rounded-2xl p-6 md:p-8"
			style={{
				background: "rgba(140,43,238,0.05)",
				backdropFilter: "blur(12px)",
				border: "1px solid rgba(140,43,238,0.2)",
			}}
		>
			<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
				{RESULT_METRICS.map((metric, index) => {
					const isLast = index === RESULT_METRICS.length - 1;
					return (
						<div
							key={metric.label}
							className={`flex flex-col items-center pb-4 md:items-start md:pb-0 ${
								isLast
									? "md:pl-6"
									: "border-b border-primary/20 md:border-r md:border-b-0 md:px-6"
							}`}
						>
							<span className="mb-1 text-xs font-bold uppercase tracking-widest text-primary/60">
								{metric.label}
							</span>
							<span className="text-2xl font-bold">{metric.value}</span>
						</div>
					);
				})}
			</div>
		</div>
	);
};
